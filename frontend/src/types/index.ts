export interface PredictionCandidate {
  label: string;
  confidence: number;
}

export interface HandLandmark {
  x: number;
  y: number;
  z?: number;
}

export interface PredictionResult {
  hand_detected: boolean;
  prediction: string | null;
  confidence: number;
  top_predictions: PredictionCandidate[];
  is_confident: boolean;
  bbox: [number, number, number, number] | null;
  landmarks: HandLandmark[] | null;
  latency_ms: number;
}

export interface SystemHealth {
  status: string;
  cnn_model_loaded: boolean;
  backend_connected: boolean;
  mediapipe_ready: boolean;
  inference_ready: boolean;
  classes_count: number;
  personalization_active: boolean;
}

export interface PersonalizationProfile {
  is_active: boolean;
  calibrated_signs_count: number;
  calibrated_signs: string[];
  draft_sample_counts: Record<string, number>;
  calibration_ready: boolean;
}

export interface HistoryItem {
  id: string;
  timestamp: string;
  sign: string;
  confidence: number;
  status: string;
}

export interface SettingsState {
  confidenceThreshold: number;
  selectedCameraId: string;
  speechLanguage: string;
  speechRate: number;
  enablePersonalization: boolean;
  showLandmarks: boolean;
  showBbox: boolean;
  showFps: boolean;
}

export interface MetricsResponse {
  live: {
    recognition_count: number;
    avg_latency_ms: number;
    current_fps: number;
    history_len: number;
  };
  evaluation: {
    overall: {
      test_accuracy: number;
      precision: number;
      recall: number;
      f1_score: number;
      test_samples: number;
    };
    per_class: Record<string, number>;
  };
  history: HistoryItem[];
}

export interface ConfusionMatrixResponse {
  labels: string[];
  matrix: number[][];
}
