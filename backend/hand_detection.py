import os
import urllib.request
import logging
import cv2
import numpy as np
import mediapipe as mp
from mediapipe.tasks import python as mp_tasks
from mediapipe.tasks.python import vision

logger = logging.getLogger("signyfyx.hand_detection")

MODEL_URL = "https://storage.googleapis.com/mediapipe-models/hand_landmarker/hand_landmarker/float16/1/hand_landmarker.task"

class HandDetector:
    def __init__(self, task_path: str = None):
        if task_path is None:
            task_path = os.path.join(os.path.dirname(__file__), "hand_landmarker.task")
        
        self.task_path = task_path
        self._ensure_task_file()
        self.detector = None
        self._init_detector()

    def _ensure_task_file(self):
        if not os.path.exists(self.task_path):
            logger.info(f"Downloading hand_landmarker.task to {self.task_path}...")
            try:
                urllib.request.urlretrieve(MODEL_URL, self.task_path)
                logger.info("Downloaded hand_landmarker.task successfully.")
            except Exception as e:
                logger.error(f"Failed to download hand_landmarker.task: {e}")
                raise e

    def _init_detector(self):
        try:
            base_options = mp_tasks.BaseOptions(model_asset_path=self.task_path)
            options = vision.HandLandmarkerOptions(
                base_options=base_options,
                num_hands=1,
                min_hand_detection_confidence=0.4,
                min_hand_presence_confidence=0.4,
                min_tracking_confidence=0.4
            )
            self.detector = vision.HandLandmarker.create_from_options(options)
            logger.info("MediaPipe HandLandmarker initialized.")
        except Exception as e:
            logger.error(f"MediaPipe initialization failed: {e}")
            self.detector = None

    @property
    def is_ready(self) -> bool:
        return self.detector is not None

    def process_frame(self, bgr_image: np.ndarray, draw_landmarks: bool = True):
        """
        Processes a BGR numpy image frame from webcam.
        
        Returns:
            dict containing:
                hand_detected (bool): Whether hand was detected
                crop_128 (np.ndarray or None): Preprocessed (1, 128, 128, 3) float32 array / 255.0
                bbox (list or None): [x, y, w, h] in image pixel coordinates
                landmarks (list or None): list of 21 {'x': float, 'y': float} normalized coordinates
        """
        h, w, _ = bgr_image.shape
        rgb_image = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2RGB)
        
        hand_detected = False
        landmarks_data = None
        bbox = None
        crop_tensor = None

        if self.detector is not None:
            try:
                mp_image = mp.Image(image_format=mp.ImageFormat.SRGB, data=rgb_image)
                detection_result = self.detector.detect(mp_image)

                if detection_result.hand_landmarks and len(detection_result.hand_landmarks) > 0:
                    hand_detected = True
                    hand_lm = detection_result.hand_landmarks[0]
                    
                    # Format landmarks
                    landmarks_data = [{"x": lm.x, "y": lm.y, "z": lm.z} for lm in hand_lm]

                    # Compute bounding box with padding
                    xs = [int(lm.x * w) for lm in hand_lm]
                    ys = [int(lm.y * h) for lm in hand_lm]
                    
                    min_x, max_x = max(0, min(xs)), min(w, max(xs))
                    min_y, max_y = max(0, min(ys)), min(h, max(ys))
                    
                    bw = max_x - min_x
                    bh = max_y - min_y
                    
                    # Add 25% padding
                    pad_x = int(bw * 0.25)
                    pad_y = int(bh * 0.25)
                    
                    crop_x1 = max(0, min_x - pad_x)
                    crop_y1 = max(0, min_y - pad_y)
                    crop_x2 = min(w, max_x + pad_x)
                    crop_y2 = min(h, max_y + pad_y)
                    
                    bbox = [crop_x1, crop_y1, crop_x2 - crop_x1, crop_y2 - crop_y1]
                    
                    # Crop hand region
                    hand_crop = rgb_image[crop_y1:crop_y2, crop_x1:crop_x2]
                    
                    if hand_crop.size > 0:
                        # Resize to 128x128
                        resized = cv2.resize(hand_crop, (128, 128), interpolation=cv2.INTER_AREA)
                        # Convert float32 and normalize / 255.0
                        normalized = resized.astype(np.float32) / 255.0
                        # Add batch dimension
                        crop_tensor = np.expand_dims(normalized, axis=0)
            except Exception as e:
                logger.warning(f"Error during MediaPipe detection: {e}")
                hand_detected = False

        # Fallback skin-color region detection if MediaPipe misses a visible hand
        if not hand_detected:
            hsv = cv2.cvtColor(bgr_image, cv2.COLOR_BGR2HSV)
            # Define skin color HSV range
            lower_skin = np.array([0, 20, 70], dtype=np.uint8)
            upper_skin = np.array([20, 255, 255], dtype=np.uint8)
            mask = cv2.inRange(hsv, lower_skin, upper_skin)
            
            contours, _ = cv2.findContours(mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            if contours:
                c = max(contours, key=cv2.contourArea)
                if cv2.contourArea(c) > (w * h * 0.04): # Hand must cover at least 4% of screen
                    x, y, bw, bh = cv2.boundingRect(c)
                    pad = int(max(bw, bh) * 0.15)
                    x1, y1 = max(0, x - pad), max(0, y - pad)
                    x2, y2 = min(w, x + bw + pad), min(h, y + bh + pad)
                    
                    hand_crop = rgb_image[y1:y2, x1:x2]
                    if hand_crop.size > 0:
                        hand_detected = True
                        bbox = [x1, y1, x2 - x1, y2 - y1]
                        resized = cv2.resize(hand_crop, (128, 128), interpolation=cv2.INTER_AREA)
                        normalized = resized.astype(np.float32) / 255.0
                        crop_tensor = np.expand_dims(normalized, axis=0)

        return {
            "hand_detected": hand_detected,
            "crop_tensor": crop_tensor,
            "bbox": bbox,
            "landmarks": landmarks_data
        }

hand_detector = HandDetector()
