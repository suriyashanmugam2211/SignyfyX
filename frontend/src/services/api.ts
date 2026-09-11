import type { 
  SystemHealth, 
  PredictionResult, 
  PersonalizationProfile, 
  MetricsResponse, 
  ConfusionMatrixResponse 
} from '../types';

const API_BASE = 'http://localhost:8000';

export async function fetchHealth(): Promise<SystemHealth> {
  try {
    const res = await fetch(`${API_BASE}/health`);
    if (!res.ok) throw new Error('Backend health check failed');
    return await res.json();
  } catch (err) {
    return {
      status: 'offline',
      cnn_model_loaded: false,
      backend_connected: false,
      mediapipe_ready: false,
      inference_ready: false,
      classes_count: 36,
      personalization_active: false
    };
  }
}

export async function predictFrame(
  imageB64: string, 
  confidenceThreshold: number = 0.80, 
  enablePersonalization: boolean = true
): Promise<PredictionResult> {
  const res = await fetch(`${API_BASE}/predict`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      image: imageB64,
      confidence_threshold: confidenceThreshold,
      enable_personalization: enablePersonalization
    })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Prediction request failed');
  }
  return await res.json();
}

export async function captureSample(imageB64: string, label: string): Promise<any> {
  const res = await fetch(`${API_BASE}/personalization/sample`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image: imageB64, label })
  });
  if (!res.ok) {
    const errData = await res.json().catch(() => ({}));
    throw new Error(errData.detail || 'Sample capture failed');
  }
  return await res.json();
}

export async function saveProfile(): Promise<any> {
  const res = await fetch(`${API_BASE}/personalization/profile`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to save personalization profile');
  return await res.json();
}

export async function getProfile(): Promise<PersonalizationProfile> {
  const res = await fetch(`${API_BASE}/personalization/profile`);
  if (!res.ok) throw new Error('Failed to fetch profile status');
  return await res.json();
}

export async function deleteProfile(): Promise<any> {
  const res = await fetch(`${API_BASE}/personalization/profile`, { method: 'DELETE' });
  if (!res.ok) throw new Error('Failed to delete profile');
  return await res.json();
}

export async function fetchMetrics(): Promise<MetricsResponse> {
  const res = await fetch(`${API_BASE}/metrics`);
  if (!res.ok) throw new Error('Failed to fetch system metrics');
  return await res.json();
}

export async function fetchConfusionMatrix(): Promise<ConfusionMatrixResponse> {
  const res = await fetch(`${API_BASE}/confusion-matrix`);
  if (!res.ok) throw new Error('Failed to fetch confusion matrix');
  return await res.json();
}

export async function logRecognition(sign: string, confidence: number): Promise<any> {
  const res = await fetch(`${API_BASE}/recognition/log`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sign, confidence })
  });
  if (!res.ok) throw new Error('Failed to log recognition');
  return await res.json();
}

export async function clearHistory(): Promise<any> {
  const res = await fetch(`${API_BASE}/recognition/clear-history`, { method: 'POST' });
  if (!res.ok) throw new Error('Failed to clear recognition history');
  return await res.json();
}
