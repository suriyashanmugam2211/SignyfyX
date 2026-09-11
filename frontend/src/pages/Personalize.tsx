import React, { useState, useEffect, useRef } from 'react';
import { Sparkles, Camera, CheckCircle, Circle, Save, Trash2, AlertCircle, Award } from 'lucide-react';
import type { PersonalizationProfile } from '../types';
import { captureSample, saveProfile, getProfile, deleteProfile } from '../services/api';

const CLASS_LABELS = [
  "0", "1", "2", "3", "4", "5", "6", "7", "8", "9",
  "A", "B", "C", "D", "E", "F", "G", "H", "I", "J",
  "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T",
  "U", "V", "W", "X", "Y", "Z"
];

export const Personalize: React.FC = () => {
  const [selectedSign, setSelectedSign] = useState<string>('A');
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [profileStatus, setProfileStatus] = useState<PersonalizationProfile | null>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const videoRef = useRef<HTMLVideoElement | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    fetchProfileStatus();
  }, []);

  const fetchProfileStatus = async () => {
    try {
      const data = await getProfile();
      setProfileStatus(data);
    } catch (e) {
      console.warn('Failed to fetch profile status:', e);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 640, height: 480, facingMode: 'user' }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setIsCameraActive(true);
    } catch (err) {
      setMessage({ type: 'error', text: 'Camera access denied. Please allow camera permission.' });
    }
  };

  const stopCamera = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsCameraActive(false);
  };

  useEffect(() => {
    return () => {
      stopCamera();
    };
  }, []);

  const handleCaptureSample = async () => {
    if (!isCameraActive || !videoRef.current || !canvasRef.current) {
      setMessage({ type: 'error', text: 'Please start the camera first.' });
      return;
    }

    setIsCapturing(true);
    setMessage(null);

    const canvas = canvasRef.current;
    canvas.width = 640;
    canvas.height = 480;
    const ctx = canvas.getContext('2d');
    if (ctx && videoRef.current) {
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);
      const b64 = canvas.toDataURL('image/jpeg', 0.85);

      try {
        const res = await captureSample(b64, selectedSign);
        if (res.status === 'success') {
          setMessage({ type: 'success', text: res.message });
          await fetchProfileStatus();
        } else {
          setMessage({ type: 'error', text: res.message || 'Sample capture failed.' });
        }
      } catch (err: any) {
        setMessage({ type: 'error', text: err.message || 'Error capturing sample.' });
      }
    }
    setIsCapturing(false);
  };

  const handleSaveProfile = async () => {
    try {
      const res = await saveProfile();
      setProfileStatus(res.profile);
      setMessage({ type: 'success', text: 'Personalization profile saved successfully!' });
    } catch (err: any) {
      setMessage({ type: 'error', text: err.message || 'Failed to save profile.' });
    }
  };

  const handleDeleteProfile = async () => {
    if (!window.confirm('Are you sure you want to delete the personalized signer profile?')) return;
    try {
      const res = await deleteProfile();
      setProfileStatus(res.profile);
      setMessage({ type: 'success', text: 'Personalized profile deleted.' });
    } catch (err: any) {
      setMessage({ type: 'error', text: 'Failed to delete profile.' });
    }
  };

  const currentSamplesCount = profileStatus?.draft_sample_counts?.[selectedSign] || 0;
  const isSelectedReady = currentSamplesCount >= 3;

  return (
    <div className="space-y-6 max-w-6xl mx-auto py-2">
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-2">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-violet-500/20 border border-violet-500/40 flex items-center justify-center text-violet-400">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">
              Personalized Signer Calibration Engine
            </h1>
            <p className="text-xs text-slate-400">
              Phase 3 Innovation — Calibrate the CNN feature representations for your unique signing style
            </p>
          </div>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl border flex items-center gap-3 text-xs font-semibold ${
          message.type === 'success'
            ? 'bg-emerald-950/40 border-emerald-500/40 text-emerald-300'
            : 'bg-rose-950/40 border-rose-500/40 text-rose-300'
        }`}>
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{message.text}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-7 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                1. Select Sign Class to Calibrate
              </label>
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-2 bg-slate-950 rounded-xl border border-slate-800">
                {CLASS_LABELS.map((lbl) => (
                  <button
                    key={lbl}
                    onClick={() => setSelectedSign(lbl)}
                    className={`w-9 h-9 rounded-lg font-mono font-bold text-xs transition-all ${
                      selectedSign === lbl
                        ? 'bg-cyan-500 text-slate-950 shadow-neon-cyan'
                        : 'bg-slate-900 text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    {lbl}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800/80 text-xs text-slate-300">
              <span className="text-cyan-400 font-semibold">Instruction:</span> Perform sign{' '}
              <span className="font-mono font-bold text-cyan-300 text-sm">"{selectedSign}"</span> naturally in front of the camera and capture 3–5 samples.
            </div>

            <div className="relative aspect-video rounded-xl overflow-hidden bg-slate-950 border border-slate-800 flex items-center justify-center">
              <video
                ref={videoRef}
                className="w-full h-full object-cover transform -scale-x-100"
                playsInline
                muted
              />
              <canvas ref={canvasRef} className="hidden" />

              {!isCameraActive && (
                <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center space-y-3 bg-slate-950/90">
                  <Camera className="w-8 h-8 text-slate-600" />
                  <p className="text-xs text-slate-400">Camera stream offline</p>
                  <button
                    onClick={startCamera}
                    className="px-4 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs shadow-neon-cyan"
                  >
                    START CAMERA
                  </button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3">
              {isCameraActive && (
                <>
                  <button
                    onClick={handleCaptureSample}
                    disabled={isCapturing}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 text-slate-950 font-bold text-xs shadow-neon-cyan flex items-center justify-center gap-2"
                  >
                    <Camera className="w-4 h-4" />
                    <span>{isCapturing ? 'CAPTURING...' : 'CAPTURE SAMPLE'}</span>
                  </button>

                  <button
                    onClick={stopCamera}
                    className="px-4 py-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                  >
                    STOP CAMERA
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-5 space-y-4">
          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Sample Progress: Sign "{selectedSign}"
              </span>
              <span className="font-mono text-xs font-bold text-cyan-300">
                {currentSamplesCount} / 5 Samples
              </span>
            </div>

            <div className="space-y-2">
              {[1, 2, 3, 4, 5].map((idx) => {
                const isCaptured = idx <= currentSamplesCount;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-xl border flex items-center justify-between text-xs transition-all ${
                      isCaptured
                        ? 'bg-cyan-950/40 border-cyan-500/40 text-cyan-300'
                        : 'bg-slate-950/40 border-slate-800 text-slate-500'
                    }`}
                  >
                    <span className="font-medium">Sample {idx}</span>
                    {isCaptured ? (
                      <span className="flex items-center gap-1 font-semibold text-emerald-400">
                        <CheckCircle className="w-4 h-4" /> Captured ✓
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 text-slate-600">
                        <Circle className="w-4 h-4" /> Pending ○
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {isSelectedReady ? (
              <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/40 flex items-center justify-between text-emerald-300 text-xs font-bold">
                <span className="flex items-center gap-2">
                  <Award className="w-4 h-4 text-emerald-400" />
                  CALIBRATION READY FOR "{selectedSign}"
                </span>
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic text-center">
                Capture at least 3 samples to enable calibration.
              </p>
            )}

            <div className="pt-2 space-y-2">
              <button
                onClick={handleSaveProfile}
                disabled={!profileStatus?.calibration_ready && !isSelectedReady}
                className="w-full py-3 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 disabled:opacity-40 text-white font-bold text-xs shadow-neon-purple flex items-center justify-center gap-2"
              >
                <Save className="w-4 h-4" />
                <span>SAVE / UPDATE PERSONALIZATION PROFILE</span>
              </button>

              {profileStatus?.is_active && (
                <button
                  onClick={handleDeleteProfile}
                  className="w-full py-2.5 rounded-xl bg-rose-950/40 hover:bg-rose-900/60 text-rose-300 border border-rose-800/40 font-semibold text-xs flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>DELETE PROFILE</span>
                </button>
              )}
            </div>
          </div>

          <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-3">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Generic CNN vs Personalized Model Comparison
            </h3>

            {profileStatus?.is_active ? (
              <div className="grid grid-cols-2 gap-3 text-center">
                <div className="p-3 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-[10px] uppercase text-slate-500 font-semibold">Generic CNN</span>
                  <p className="text-sm font-bold text-slate-300 mt-1">Standard Softmax</p>
                </div>
                <div className="p-3 rounded-xl bg-cyan-950/50 border border-cyan-500/40">
                  <span className="text-[10px] uppercase text-cyan-400 font-semibold">Personalized</span>
                  <p className="text-sm font-bold text-cyan-300 mt-1">
                    {profileStatus.calibrated_signs_count} Signs Blended
                  </p>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-500 italic p-3 bg-slate-950 rounded-xl border border-slate-800">
                Not enough evaluation data for comparison. Calibrate and save a profile to activate.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
