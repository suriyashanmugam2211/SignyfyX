import time
import base64
import logging
import cv2
import numpy as np

from model_loader import model_loader, CLASS_LABELS
from hand_detection import hand_detector
from personalization import personalization_engine
from metrics import metrics_manager

logger = logging.getLogger("signyfyx.inference")

def decode_base64_image(base64_str: str) -> np.ndarray:
    """
    Decodes data:image/jpeg;base64,... or raw base64 string into BGR opencv image.
    """
    if "," in base64_str:
        base64_str = base64_str.split(",")[1]
    image_bytes = base64.b64decode(base64_str)
    nparr = np.frombuffer(image_bytes, np.uint8)
    img_bgr = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    if img_bgr is None:
        raise ValueError("Invalid image format or corrupted base64 data.")
    return img_bgr

def run_pipeline(
    base64_image: str,
    confidence_threshold: float = 0.80,
    enable_personalization: bool = True
) -> dict:
    t0 = time.time()
    
    try:
        bgr_image = decode_base64_image(base64_image)
    except Exception as e:
        logger.error(f"Image decode error: {e}")
        return {
            "error": f"Failed to decode image frame: {str(e)}",
            "hand_detected": False
        }

    # Step 1: Hand Detection & Preprocessing (Crop, Pad, 128x128, float32, /255)
    det_res = hand_detector.process_frame(bgr_image)
    
    if not det_res["hand_detected"] or det_res["crop_tensor"] is None:
        t_lat = (time.time() - t0) * 1000.0
        metrics_manager.record_inference(t_lat)
        return {
            "hand_detected": False,
            "prediction": None,
            "confidence": 0.0,
            "top_predictions": [],
            "is_confident": False,
            "bbox": None,
            "landmarks": None,
            "latency_ms": round(t_lat, 2)
        }

    crop_tensor = det_res["crop_tensor"] # (1, 128, 128, 3)

    # Step 2: CNN Softmax Inference
    try:
        softmax_probs = model_loader.predict_softmax(crop_tensor)
    except Exception as e:
        logger.error(f"Inference error: {e}")
        return {"error": f"Model inference error: {str(e)}", "hand_detected": False}

    # Step 3: Optional Personalization Blending
    if enable_personalization and personalization_engine.is_active:
        try:
            feats = model_loader.extract_features(crop_tensor)
            softmax_probs = personalization_engine.blend_predictions(
                generic_probs=softmax_probs,
                class_labels=CLASS_LABELS,
                feature_vector=feats
            )
        except Exception as p_err:
            logger.warning(f"Personalization blending failed: {p_err}")

    # Step 4: Sort Top 3 Predictions
    top_indices = np.argsort(softmax_probs)[::-1][:3]
    top_predictions = []
    for idx in top_indices:
        top_predictions.append({
            "label": CLASS_LABELS[idx],
            "confidence": round(float(softmax_probs[idx]), 4)
        })

    top_1 = top_predictions[0]
    is_confident = top_1["confidence"] >= confidence_threshold
    
    t_lat = (time.time() - t0) * 1000.0
    metrics_manager.record_inference(t_lat)

    return {
        "hand_detected": True,
        "prediction": top_1["label"],
        "confidence": top_1["confidence"],
        "top_predictions": top_predictions,
        "is_confident": is_confident,
        "bbox": det_res["bbox"],
        "landmarks": det_res["landmarks"],
        "latency_ms": round(t_lat, 2)
    }
