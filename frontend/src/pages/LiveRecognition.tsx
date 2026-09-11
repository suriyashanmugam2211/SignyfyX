import React, { useState, useEffect, useRef } from 'react';
import { 
  Camera, CameraOff, Volume2, VolumeX, AlertTriangle, 
  RotateCcw, Trash2, Space, Plus, History, CheckCircle2, AlertCircle 
} from 'lucide-react';
import type { PredictionResult, SettingsState, HistoryItem } from '../types';
import { predictFrame, logRecognition, clearHistory } from '../services/api';
import { ConfidenceRing } from '../components/ConfidenceRing';
import { TopPredictionsCard } from '../components/TopPredictionsCard';
import { Waveform } from '../components/Waveform';

interface LiveRecognitionProps {
  settings: SettingsState;
}

export const LiveRecognition: React.FC<LiveRecognitionProps> = ({ settings }) => {
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [predictionResult, setPredictionResult] = useState<PredictionResult | null>(null);
  const [recognizedText, setRecognizedText] = useState<string>('');
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [isSpeaking, setIsSpeaking] = useState(false);

  // Debouncing & stability state
  const lastAcceptedSignRef = useRef<string | null>(null);
  const consecutiveCountRef = useRef<number>(0);
  const lastAcceptTimeRef = useRef<number>(0);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);

  // Start Camera
  const startCamera = async () => {
    setCameraError(null);
    try {
      const constraints: MediaStreamConstraints = {
        video: settings.selectedCameraId 
          ? { deviceId: { exact: settings.selectedCameraId }, width: 640, height: 480 }
          : { width: 640, height: 480, facingMode: 'user' }
      };

      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err: any) {
      console.error('Camera access error:', err);
      setCameraError('Camera permission denied or camera unavailable. Please allow camera access.');
      setIsCameraActive(false);
    }
  };

  // Stop Camera
  const stopCamera = () => {
    if (animationFrameIdRef.current) {
      cancelAnimationFrame(animationFrameIdRef.current);
      animationFrameIdRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
    setPredictionResult(null);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  // Inference Loop
  useEffect(() => {
    if (!isCameraActive) return;

    let isProcessing = false;

    const processFrame = async () => {
      if (!isCameraActive || isProcessing || !videoRef.current || !canvasRef.current) {
        if (isCameraActive) {
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
        }
        return;
      }

      const video = videoRef.current;
      if (video.readyState < 2) {
        animationFrameIdRef.current = requestAnimationFrame(processFrame);
        return;
      }

      isProcessing = true;
      const canvas = canvasRef.current;
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, 640, 480);
        const base64Image = canvas.toDataURL('image/jpeg', 0.85);

        try {
          const res = await predictFrame(
            base64Image,
            settings.confidenceThreshold / 100.0,
            settings.enablePersonalization
          );

          setPredictionResult(res);
          drawOverlay(res);
          handleAutoBuffer(res);
        } catch (err) {
          console.warn('Frame prediction error:', err);
        }
      }

      isProcessing = false;
      if (isCameraActive) {
        setTimeout(() => {
          animationFrameIdRef.current = requestAnimationFrame(processFrame);
        }, 60);
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(processFrame);

    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, [isCameraActive, settings]);

  const drawOverlay = (res: PredictionResult) => {
    const overlay = overlayCanvasRef.current;
    if (!overlay) return;
    overlay.width = 640;
    overlay.height = 480;
    const ctx = overlay.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, 640, 480);

    if (!res.hand_detected) return;

    if (settings.showBbox && res.bbox) {
      const [x, y, w, h] = res.bbox;
      ctx.strokeStyle = res.is_confident ? '#00F0FF' : '#F59E0B';
      ctx.lineWidth = 3;
      ctx.shadowColor = res.is_confident ? 'rgba(0, 240, 255, 0.6)' : 'rgba(245, 158, 11, 0.6)';
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, y, w, h);

      ctx.fillStyle = res.is_confident ? '#00F0FF' : '#F59E0B';
      ctx.fillRect(x, Math.max(0, y - 24), Math.max(80, res.prediction ? 120 : 80), 24);
      ctx.fillStyle = '#0A0E17';
      ctx.font = 'bold 12px monospace';
      const labelText = res.prediction ? `${res.prediction} (${(res.confidence * 100).toFixed(0)}%)` : 'HAND';
      ctx.fillText(labelText, x + 6, Math.max(16, y - 7));
    }

    if (settings.showLandmarks && res.landmarks && res.landmarks.length > 0) {
      ctx.fillStyle = '#10B981';
      ctx.shadowColor = 'rgba(16, 185, 129, 0.8)';
      ctx.shadowBlur = 8;
      for (const lm of res.landmarks) {
        const lx = lm.x * 640;
        const ly = lm.y * 480;
        ctx.beginPath();
        ctx.arc(lx, ly, 4, 0, 2 * Math.PI);
        ctx.fill();
      }
    }
  };

  const handleAutoBuffer = (res: PredictionResult) => {
    if (!res.hand_detected || !res.is_confident || !res.prediction) {
      consecutiveCountRef.current = 0;
      lastAcceptedSignRef.current = null;
      return;
    }

    const currentSign = res.prediction;
    const now = Date.now();

    if (currentSign === lastAcceptedSignRef.current) {
      consecutiveCountRef.current += 1;
    } else {
      lastAcceptedSignRef.current = currentSign;
      consecutiveCountRef.current = 1;
    }

    if (consecutiveCountRef.current >= 3 && (now - lastAcceptTimeRef.current > 1200)) {
      appendSignToText(currentSign, res.confidence);
      lastAcceptTimeRef.current = now;
      consecutiveCountRef.current = 0;
    }
  };

  const appendSignToText = async (sign: string, confidence: number) => {
    setRecognizedText((prev) => prev + sign);
    try {
      const res = await logRecognition(sign, confidence);
      if (res && res.item) {
        setHistory((prev) => [res.item, ...prev]);
      }
    } catch (e) {
      console.warn('Logging error:', e);
    }
  };

  const handleAddSign = () => {
    if (predictionResult && predictionResult.prediction && predictionResult.is_confident) {
      appendSignToText(predictionResult.prediction, predictionResult.confidence);
    }
  };

  const handleAddSpace = () => {
    setRecognizedText((prev) => prev + ' ');
  };

  const handleUndo = () => {
    setRecognizedText((prev) => prev.slice(0, -1));
  };

  const handleClearText = () => {
    setRecognizedText('');
  };

  const handleClearHistory = async () => {
    try {
      await clearHistory();
      setHistory([]);
    } catch (e) {
      setHistory([]);
    }
  };

  const speakText = () => {
    if (!recognizedText.trim()) {
      alert('Nothing to speak. Recognized text is empty.');
      return;
    }

    if (!('speechSynthesis' in window)) {
      alert('Browser Speech Synthesis is not supported in this browser.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(recognizedText);
    utterance.lang = settings.speechLanguage || 'en-US';
    utterance.rate = settings.speechRate || 1.0;

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeaking = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto py-2">
      {cameraError && (
        <div className="p-4 rounded-xl glass-card bg-rose-950/40 border border-rose-500/50 flex items-center gap-3 text-rose-200 text-sm">
          <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          <span>{cameraError}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-4 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${isCameraActive ? 'bg-cyan-400 shadow-[0_0_8px_#00F0FF] animate-pulse' : 'bg-slate-600'}`} />
                <h2 className="font-bold text-white text-base">Camera Viewport</h2>
                <span className="text-xs text-slate-400 font-mono">
                  {isCameraActive ? 'LIVE STREAM' : 'OFFLINE'}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {!isCameraActive ? (
                  <button
                    onClick={startCamera}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs shadow-neon-cyan transition-all"
                  >
                    <Camera className="w-4 h-4" />
                    <span>START CAMERA</span>
                  </button>
                ) : (
                  <button
                    onClick={stopCamera}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl bg-rose-600/30 hover:bg-rose-600/50 text-rose-300 border border-rose-500/50 font-semibold text-xs transition-all"
                  >
                    <CameraOff className="w-4 h-4" />
                    <span>STOP CAMERA</span>
                  </button>
                )}
              </div>
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800/80 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover transform -scale-x-100"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 w-full h-full object-cover pointer-events-none transform -scale-x-100"
              />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90">
                  <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center text-slate-500">
                    <Camera className="w-8 h-8" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-white text-sm">Camera Stream Paused</h3>
                    <p className="text-xs text-slate-400">Click START CAMERA to begin real-time sign recognition</p>
                  </div>
                </div>
              )}

              {isCameraActive && predictionResult && (
                <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-[11px] font-mono font-semibold">
                  <span className={`px-2.5 py-1 rounded-md border backdrop-blur-md ${
                    predictionResult.hand_detected
                      ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/50'
                      : 'bg-slate-900/80 text-slate-400 border-slate-700'
                  }`}>
                    {predictionResult.hand_detected ? '✓ HAND DETECTED' : '○ NO HAND DETECTED'}
                  </span>

                  {settings.showFps && (
                    <span className="px-2.5 py-1 rounded-md bg-slate-900/80 text-cyan-300 border border-slate-700 backdrop-blur-md">
                      Latency: {predictionResult.latency_ms} ms
                    </span>
                  )}
                </div>
              )}
            </div>

          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Live Prediction Output
              </span>
              {predictionResult && (
                <span className={`text-xs px-2.5 py-0.5 rounded-full font-semibold border ${
                  predictionResult.is_confident
                    ? 'bg-cyan-950 text-cyan-300 border-cyan-500/40'
                    : 'bg-amber-950 text-amber-300 border-amber-500/40'
                }`}>
                  {predictionResult.is_confident ? 'HIGH CONFIDENCE' : 'UNCERTAIN'}
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 items-center bg-slate-950/50 p-4 rounded-xl border border-slate-800/80">
              <div className="flex flex-col items-center justify-center border-r border-slate-800 pr-2">
                <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1">
                  Detected Sign
                </span>
                <span className={`font-mono font-black text-6xl tracking-tight ${
                  predictionResult?.is_confident ? 'neon-text-cyan' : 'text-slate-400'
                }`}>
                  {predictionResult?.hand_detected && predictionResult?.prediction
                    ? predictionResult.prediction
                    : '—'}
                </span>
              </div>

              <div className="flex items-center justify-center">
                <ConfidenceRing
                  confidence={predictionResult?.confidence || 0}
                  isConfident={predictionResult?.is_confident || false}
                  size={120}
                />
              </div>
            </div>

            {predictionResult && predictionResult.hand_detected && !predictionResult.is_confident && (
              <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-500/40 flex items-center gap-2.5 text-amber-300 text-xs">
                <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                <span>UNCERTAIN PREDICTION — Please repeat the gesture cleanly.</span>
              </div>
            )}

            <TopPredictionsCard candidates={predictionResult?.top_predictions || []} />
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Recognized Text Buffer
              </span>
              <Waveform isSpeaking={isSpeaking} />
            </div>

            <div className="w-full min-h-[70px] p-4 rounded-xl bg-slate-950 border border-slate-800 text-xl font-mono font-bold text-white tracking-widest break-all flex items-center">
              {recognizedText ? (
                <span>{recognizedText}</span>
              ) : (
                <span className="text-slate-600 text-sm font-sans font-normal italic">
                  Recognized text will appear here as signs are accepted...
                </span>
              )}
            </div>

            <div className="grid grid-cols-4 gap-2">
              <button
                onClick={handleAddSign}
                disabled={!predictionResult?.is_confident}
                className="py-2.5 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/40 disabled:opacity-40 text-cyan-300 border border-cyan-500/30 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>ADD SIGN</span>
              </button>

              <button
                onClick={handleAddSpace}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Space className="w-3.5 h-3.5" />
                <span>SPACE</span>
              </button>

              <button
                onClick={handleUndo}
                className="py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>UNDO</span>
              </button>

              <button
                onClick={handleClearText}
                className="py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold text-xs flex items-center justify-center gap-1 transition-all"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>CLEAR</span>
              </button>
            </div>

            <div className="pt-1">
              {!isSpeaking ? (
                <button
                  onClick={speakText}
                  className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 via-purple-600 to-blue-600 hover:from-violet-500 hover:to-blue-500 text-white font-bold text-sm shadow-neon-purple flex items-center justify-center gap-2 transition-all"
                >
                  <Volume2 className="w-5 h-5" />
                  <span>SPEAK RECOGNIZED TEXT</span>
                </button>
              ) : (
                <button
                  onClick={stopSpeaking}
                  className="w-full py-3 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-sm shadow-lg flex items-center justify-center gap-2 transition-all"
                >
                  <VolumeX className="w-5 h-5" />
                  <span>STOP SPEAKING</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Recognition Session History</h3>
          </div>
          {history.length > 0 && (
            <button
              onClick={handleClearHistory}
              className="text-xs text-rose-400 hover:text-rose-300 font-medium transition-colors"
            >
              Clear History
            </button>
          )}
        </div>

        {history.length === 0 ? (
          <p className="text-xs text-slate-500 italic py-2">
            No accepted recognition items recorded in this session yet.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left text-slate-300">
              <thead className="text-[11px] uppercase bg-slate-900/60 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="px-4 py-2.5">Time</th>
                  <th className="px-4 py-2.5">Accepted Sign</th>
                  <th className="px-4 py-2.5">Confidence</th>
                  <th className="px-4 py-2.5">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-900/40">
                    <td className="px-4 py-2.5 font-mono text-slate-400">{item.timestamp}</td>
                    <td className="px-4 py-2.5 font-mono font-bold text-cyan-300 text-sm">{item.sign}</td>
                    <td className="px-4 py-2.5 font-mono">{(item.confidence * 100).toFixed(1)}%</td>
                    <td className="px-4 py-2.5">
                      <span className="inline-flex items-center gap-1 text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {item.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
