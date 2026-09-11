import os
import logging
import numpy as np

# Force PyTorch backend for Keras 3
os.environ["KERAS_BACKEND"] = "torch"
import keras
import torch

logger = logging.getLogger("signyfyx.model_loader")

CLASS_LABELS = [
    "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
    "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
    "U", "V", "W", "X", "Y", "Z"
]

class ModelLoader:
    _instance = None

    def __new__(cls):
        if cls._instance is None:
            cls._instance = super(ModelLoader, cls).__new__(cls)
            cls._instance._model = None
            cls._instance._feature_extractor = None
            cls._instance._is_loaded = False
        return cls._instance

    def load_model(self, model_path: str = "backend/model/best_signyfyx_model.keras"):
        if self._is_loaded and self._model is not None:
            return self._model

        logger.info(f"Loading SignyfyX CNN Model from {model_path}...")
        if not os.path.exists(model_path):
            # Fallback path check if executed from backend folder
            model_path_alt = os.path.join(os.path.dirname(__file__), "model", "best_signyfyx_model.keras")
            if os.path.exists(model_path_alt):
                model_path = model_path_alt
            else:
                raise FileNotFoundError(f"CNN Model file not found at {model_path}")

        try:
            self._model = keras.models.load_model(model_path)
            logger.info("CNN Model loaded successfully.")
            
            # Construct feature extractor from the bottleneck 'dense' layer (256-dim embedding)
            try:
                dense_layer = self._model.get_layer("dense")
                self._feature_extractor = keras.Model(
                    inputs=self._model.inputs,
                    outputs=dense_layer.output
                )
                logger.info("Feature extractor layer ('dense') initialized successfully.")
            except Exception as fe_err:
                logger.warning(f"Could not build feature extractor: {fe_err}")
                self._feature_extractor = None

            self._is_loaded = True
        except Exception as e:
            logger.error(f"Failed to load model: {e}")
            raise e

        return self._model

    @property
    def model(self):
        if not self._is_loaded or self._model is None:
            self.load_model()
        return self._model

    @property
    def feature_extractor(self):
        if not self._is_loaded or self._feature_extractor is None:
            self.load_model()
        return self._feature_extractor

    @property
    def is_loaded(self) -> bool:
        return self._is_loaded

    def predict_softmax(self, input_tensor_np: np.ndarray) -> np.ndarray:
        """
        Runs direct forward pass on (1, 128, 128, 3) float32 numpy array.
        Returns (36,) numpy float32 softmax probabilities.
        """
        if self.model is None:
            raise RuntimeError("Model is not loaded.")
        
        # Convert numpy array to torch tensor for fast execution
        torch_input = torch.from_numpy(input_tensor_np).float()
        with torch.no_grad():
            output_tensor = self._model(torch_input)
            
        probs = output_tensor.cpu().numpy().squeeze(0)
        return probs

    def extract_features(self, input_tensor_np: np.ndarray) -> np.ndarray:
        """
        Runs feature extractor forward pass.
        Returns (256,) numpy float32 feature embedding.
        """
        if self.feature_extractor is None:
            # Fallback if layer name dense isn't present
            return self.predict_softmax(input_tensor_np)
            
        torch_input = torch.from_numpy(input_tensor_np).float()
        with torch.no_grad():
            feats_tensor = self._feature_extractor(torch_input)
            
        feats = feats_tensor.cpu().numpy().squeeze(0)
        return feats

model_loader = ModelLoader()
