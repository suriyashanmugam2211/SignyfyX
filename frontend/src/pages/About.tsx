import React from 'react';
import { Info, Cpu, Layers, ShieldCheck, Sparkles, CheckCircle2 } from 'lucide-react';

export const About: React.FC = () => {
  const techStack = [
    { title: 'Convolutional Neural Network (CNN)', desc: 'Custom 11-layer architecture trained on 36 Indian Sign Language classes', icon: Cpu },
    { title: 'TensorFlow / Keras 3', desc: 'PyTorch backend execution engine loading best_signyfyx_model.keras', icon: Layers },
    { title: 'MediaPipe Vision Tasks', desc: 'Real-time 21 3D hand keypoint localization & adaptive bounding box cropping', icon: ShieldCheck },
    { title: 'FastAPI Backend', desc: 'High-throughput async Python REST API for live frame inference & prototype management', icon: Sparkles },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto py-2">
      {/* Title */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
        <div className="flex items-center gap-2 text-cyan-400 text-xs font-semibold uppercase tracking-wider">
          <Info className="w-4 h-4" />
          <span>Project Documentation & Technical Overview</span>
        </div>
        <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">
          SignyfyX – ML-Based Real-Time Sign Language Recognition and Translation System Using CNN
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          SignyfyX is a Phase 3 college project designed to bridge communication gaps by recognizing hand gestures in real time using webcam video streams and converting them into written text and spoken voice.
        </p>
      </div>

      {/* System Scope Statement */}
      <div className="p-4 rounded-xl glass-card bg-cyan-950/30 border border-cyan-500/40 space-y-1">
        <span className="text-xs font-bold text-cyan-300 uppercase tracking-wider">
          Dataset & Recognition Scope Notice
        </span>
        <p className="text-xs text-cyan-100/90 leading-relaxed">
          The system is trained on 36 Indian Sign Language classes (Digits 0–9 and Letters A–Z). It performs <strong>character-level sign recognition and sign-to-text translation</strong> with 128×128 RGB normalization.
        </p>
      </div>

      {/* Tech Stack Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {techStack.map((tech, idx) => {
          const Icon = tech.icon;
          return (
            <div key={idx} className="glass-card p-5 rounded-2xl border border-slate-800 space-y-2">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-cyan-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-semibold text-white text-sm">{tech.title}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{tech.desc}</p>
            </div>
          );
        })}
      </div>

      {/* Core Innovation Highlights */}
      <div className="glass-card p-6 rounded-2xl border border-slate-800 space-y-3">
        <h3 className="font-bold text-white text-sm uppercase tracking-wider text-slate-400">
          Phase 3 Core Innovations
        </h3>
        <ul className="space-y-2 text-xs text-slate-300">
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Prototype-Based Signer Personalization:</strong> Extracts 256-dim feature embeddings from the bottleneck dense layer to calibrate for user-specific signing variations without full model retraining.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Confidence-Aware Prediction Filtering:</strong> Rejects predictions below the 80% threshold and alerts the user to repeat the gesture.</span>
          </li>
          <li className="flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
            <span><strong>Sign-to-Text & Web Speech API TTS:</strong> Debounced consecutive frame stability check prevents duplicate letter spam and synthesizes audio voice output.</span>
          </li>
        </ul>
      </div>
    </div>
  );
};
