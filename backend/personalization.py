import os
import json
import logging
import numpy as np

logger = logging.getLogger("signyfyx.personalization")

PROFILE_FILE = os.path.join(os.path.dirname(__file__), "personalization_profile.json")

class PersonalizationEngine:
    def __init__(self, profile_path: str = PROFILE_FILE):
        self.profile_path = profile_path
        self.draft_samples = {}  # label -> list of np.ndarray 256-dim feature vectors
        self.prototypes = {}     # label -> np.ndarray 256-dim mean prototype vector
        self.is_active = False
        self.load_profile()

    def add_sample(self, label: str, feature_vector: np.ndarray) -> dict:
        """
        Adds a single 256-dim feature sample for the given sign label.
        Returns draft status for that label.
        """
        if label not in self.draft_samples:
            self.draft_samples[label] = []
        
        if len(self.draft_samples[label]) >= 5:
            # Keep latest 5 samples
            self.draft_samples[label].pop(0)

        vec = np.array(feature_vector, dtype=np.float32)
        # Normalize sample vector
        norm = np.linalg.norm(vec)
        if norm > 1e-6:
            vec = vec / norm
            
        self.draft_samples[label].append(vec)
        sample_count = len(self.draft_samples[label])
        
        logger.info(f"Added sample #{sample_count} for label '{label}'")
        return {
            "label": label,
            "sample_count": sample_count,
            "max_samples": 5,
            "is_ready": sample_count >= 3
        }

    def save_profile(self) -> dict:
        """
        Computes mean prototypes from draft samples and persists profile to JSON.
        """
        profile_data = {}
        for label, samples in self.draft_samples.items():
            if len(samples) >= 3: # Require at least 3 samples per sign
                mean_vec = np.mean(samples, axis=0)
                norm = np.linalg.norm(mean_vec)
                if norm > 1e-6:
                    mean_vec = mean_vec / norm
                profile_data[label] = {
                    "prototype": mean_vec.tolist(),
                    "sample_count": len(samples)
                }
                self.prototypes[label] = mean_vec

        with open(self.profile_path, "w") as f:
            json.dump({
                "prototypes": profile_data,
                "version": "1.0"
            }, f, indent=2)

        self.is_active = len(self.prototypes) > 0
        logger.info(f"Saved personalization profile with {len(self.prototypes)} calibrated signs.")
        return self.get_profile_status()

    def load_profile(self):
        self.prototypes = {}
        self.draft_samples = {}
        if os.path.exists(self.profile_path):
            try:
                with open(self.profile_path, "r") as f:
                    data = json.load(f)
                    proto_dict = data.get("prototypes", {})
                    for label, info in proto_dict.items():
                        vec = np.array(info["prototype"], dtype=np.float32)
                        self.prototypes[label] = vec
                        # Populate draft samples count representation
                        count = info.get("sample_count", 3)
                        self.draft_samples[label] = [vec] * count
                self.is_active = len(self.prototypes) > 0
                logger.info(f"Loaded personalization profile ({len(self.prototypes)} calibrated signs).")
            except Exception as e:
                logger.warning(f"Could not load personalization profile: {e}")
                self.is_active = False

    def delete_profile(self) -> dict:
        self.prototypes = {}
        self.draft_samples = {}
        self.is_active = False
        if os.path.exists(self.profile_path):
            try:
                os.remove(self.profile_path)
                logger.info("Personalization profile deleted.")
            except Exception as e:
                logger.error(f"Failed to delete profile file: {e}")
        return self.get_profile_status()

    def get_profile_status(self) -> dict:
        sample_counts = {label: len(samples) for label, samples in self.draft_samples.items()}
        calibrated_count = len(self.prototypes)
        return {
            "is_active": self.is_active,
            "calibrated_signs_count": calibrated_count,
            "calibrated_signs": list(self.prototypes.keys()),
            "draft_sample_counts": sample_counts,
            "calibration_ready": calibrated_count > 0
        }

    def blend_predictions(self, generic_probs: np.ndarray, class_labels: list, feature_vector: np.ndarray, weight: float = 0.35) -> np.ndarray:
        """
        Blends generic CNN softmax with cosine similarity to personalized prototypes.
        """
        if not self.is_active or len(self.prototypes) == 0 or feature_vector is None:
            return generic_probs

        norm = np.linalg.norm(feature_vector)
        if norm < 1e-6:
            return generic_probs
        feature_norm = feature_vector / norm

        # Compute cosine similarity for each class
        proto_logits = np.zeros(len(class_labels), dtype=np.float32)
        has_match = False
        for idx, label in enumerate(class_labels):
            if label in self.prototypes:
                proto_vec = self.prototypes[label]
                cos_sim = float(np.dot(feature_norm, proto_vec))
                proto_logits[idx] = max(0.0, cos_sim)
                has_match = True
            else:
                proto_logits[idx] = 0.0

        if not has_match:
            return generic_probs

        # Softmax over prototype similarities
        exp_logits = np.exp(proto_logits * 5.0)  # Temperature scaling factor = 5.0
        proto_probs = exp_logits / (np.sum(exp_logits) + 1e-8)

        # Blend
        blended = (1.0 - weight) * generic_probs + weight * proto_probs
        # Re-normalize
        blended = blended / np.sum(blended)
        return blended

personalization_engine = PersonalizationEngine()
