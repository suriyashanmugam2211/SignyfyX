import React, { useState, useEffect } from 'react';
import { Settings as SettingsIcon, Sliders, Camera, Volume2, Eye, Check } from 'lucide-react';
import type { SettingsState } from '../types';

interface SettingsProps {
  settings: SettingsState;
  setSettings: React.Dispatch<React.SetStateAction<SettingsState>>;
}

export const Settings: React.FC<SettingsProps> = ({ settings, setSettings }) => {
  const [cameras, setCameras] = useState<MediaDeviceInfo[]>([]);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    async function loadCameras() {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const videoDevices = devices.filter((d) => d.kind === 'videoinput');
        setCameras(videoDevices);
      } catch (e) {
        console.warn('Could not enumerate camera devices:', e);
      }
    }
    loadCameras();
  }, []);

  const handleChange = <K extends keyof SettingsState>(key: K, value: SettingsState[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      <div className="glass-card p-6 rounded-2xl border border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <SettingsIcon className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white tracking-wide">System Settings</h1>
            <p className="text-xs text-slate-400">Configure real-time inference, camera, speech synthesis, and UI preferences</p>
          </div>
        </div>

        {savedSuccess && (
          <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-semibold bg-emerald-950/60 border border-emerald-500/40 px-3 py-1.5 rounded-lg animate-pulse">
            <Check className="w-4 h-4" /> Saved in Real-Time
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Sliders className="w-5 h-5 text-cyan-400" />
            <h3 className="font-semibold text-white text-sm">Confidence & Inference</h3>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Confidence Acceptance Threshold</label>
              <span className="font-mono font-bold text-cyan-300">{settings.confidenceThreshold}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="95"
              step="1"
              value={settings.confidenceThreshold}
              onChange={(e) => handleChange('confidenceThreshold', parseInt(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
            <p className="text-[11px] text-slate-500">
              Predictions below this threshold trigger the "UNCERTAIN PREDICTION" state and require repeat gesture.
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <span className="text-xs font-medium text-slate-300 block">Enable Signer Personalization</span>
              <span className="text-[11px] text-slate-500 block">Blend generic CNN softmax with prototype vectors</span>
            </div>
            <button
              onClick={() => handleChange('enablePersonalization', !settings.enablePersonalization)}
              className={`w-12 h-6 rounded-full p-1 transition-colors ${
                settings.enablePersonalization ? 'bg-cyan-500' : 'bg-slate-800'
              }`}
            >
              <div
                className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  settings.enablePersonalization ? 'translate-x-6' : 'translate-x-0'
                }`}
              />
            </button>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Camera className="w-5 h-5 text-violet-400" />
            <h3 className="font-semibold text-white text-sm">Camera Hardware</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Select Webcam Device</label>
            <select
              value={settings.selectedCameraId}
              onChange={(e) => handleChange('selectedCameraId', e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value="">Default System Camera</option>
              {cameras.map((cam, idx) => (
                <option key={cam.deviceId} value={cam.deviceId}>
                  {cam.label || `Camera ${idx + 1}`}
                </option>
              ))}
            </select>
            <p className="text-[11px] text-slate-500">
              Change active webcam input stream device.
            </p>
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Volume2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-white text-sm">Web Speech API Voice</h3>
          </div>

          <div className="space-y-2">
            <label className="text-xs text-slate-300 font-medium block">Speech Language</label>
            <select
              value={settings.speechLanguage}
              onChange={(e) => handleChange('speechLanguage', e.target.value)}
              className="w-full p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 focus:border-cyan-500 outline-none"
            >
              <option value="en-US">English (United States) - en-US</option>
              <option value="en-IN">English (India) - en-IN</option>
              <option value="en-GB">English (United Kingdom) - en-GB</option>
            </select>
          </div>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between text-xs">
              <label className="text-slate-300 font-medium">Speech Rate</label>
              <span className="font-mono font-bold text-cyan-300">{settings.speechRate}x</span>
            </div>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.1"
              value={settings.speechRate}
              onChange={(e) => handleChange('speechRate', parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        <div className="glass-card p-5 rounded-2xl border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <Eye className="w-5 h-5 text-emerald-400" />
            <h3 className="font-semibold text-white text-sm">Camera Overlay Displays</h3>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Show Hand Bounding Box</span>
              <button
                onClick={() => handleChange('showBbox', !settings.showBbox)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  settings.showBbox ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  settings.showBbox ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Show MediaPipe Hand Landmarks</span>
              <button
                onClick={() => handleChange('showLandmarks', !settings.showLandmarks)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  settings.showLandmarks ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  settings.showLandmarks ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>

            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-300">Show Live FPS & Latency Badge</span>
              <button
                onClick={() => handleChange('showFps', !settings.showFps)}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors ${
                  settings.showFps ? 'bg-cyan-500' : 'bg-slate-800'
                }`}
              >
                <div className={`w-4 h-4 rounded-full bg-slate-950 transition-transform ${
                  settings.showFps ? 'translate-x-5' : 'translate-x-0'
                }`} />
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
