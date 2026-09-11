import React from 'react';
import { Camera, Sparkles, ArrowRight, Video, Scan, Brain, CheckCircle2, Type, Volume2 } from 'lucide-react';

interface HomeProps {
  setActiveTab: (tab: string) => void;
}

export const Home: React.FC<HomeProps> = ({ setActiveTab }) => {
  const steps = [
    { title: 'Webcam Stream', desc: 'Real-time WebRTC camera feed capture', icon: Video, color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/30' },
    { title: 'Hand Detection', desc: 'MediaPipe 21 3D landmarks & bounding box', icon: Scan, color: 'text-violet-400', bg: 'bg-violet-500/10 border-violet-500/30' },
    { title: 'Hand Crop & 128×128', desc: 'Adaptive padding & /255 RGB normalization', icon: Brain, color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/30' },
    { title: 'Trained CNN Model', desc: '36-Class Softmax prediction probabilities', icon: CheckCircle2, color: 'text-emerald-400', bg: 'bg-emerald-500/10 border-emerald-500/30' },
    { title: 'Confidence & Buffer', desc: 'Debounced high-confidence sign-to-text', icon: Type, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/30' },
    { title: 'Text-to-Speech', desc: 'Browser Web Speech API voice synthesis', icon: Volume2, color: 'text-rose-400', bg: 'bg-rose-500/10 border-rose-500/30' },
  ];

  return (
    <div className="space-y-12 max-w-6xl mx-auto py-6 px-4">
      {/* Hero Section */}
      <div className="text-center space-y-6 pt-6">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card bg-cyan-950/40 border border-cyan-500/40 text-cyan-300 text-xs font-semibold tracking-wider uppercase">
          <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
          <span>Phase 3 ML Accessibility System</span>
        </div>

        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-white">
          SIGNYFY<span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-violet-500">X</span>
        </h1>

        <p className="text-xl md:text-2xl font-light text-cyan-200/90 tracking-wide">
          “Understand Every Gesture.”
        </p>

        <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-400 leading-relaxed">
          An ML-powered real-time Indian Sign Language character recognition and translation system using CNN, MediaPipe hand detection, confidence filtering, signer personalization, and speech synthesis.
        </p>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
          <button
            onClick={() => setActiveTab('live')}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm shadow-neon-cyan transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Camera className="w-5 h-5" />
            <span>START RECOGNITION</span>
            <ArrowRight className="w-4 h-4 ml-1" />
          </button>

          <button
            onClick={() => setActiveTab('personalize')}
            className="flex items-center gap-2.5 px-7 py-3.5 rounded-xl glass-card hover:bg-slate-800/80 text-violet-300 border border-violet-500/40 font-semibold text-sm transition-all duration-300 transform hover:-translate-y-0.5"
          >
            <Sparkles className="w-5 h-5 text-violet-400" />
            <span>PERSONALIZE SIGNER</span>
          </button>
        </div>
      </div>

      {/* Workflow Diagram */}
      <div className="space-y-6 pt-8">
        <div className="text-center space-y-1">
          <h2 className="text-xl font-bold text-white tracking-wide">
            Real-Time System Workflow Pipeline
          </h2>
          <p className="text-xs text-slate-400">
            Complete end-to-end processing pipeline from camera feed to spoken text
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {steps.map((step, idx) => {
            const Icon = step.icon;
            return (
              <div
                key={idx}
                className={`glass-card p-5 rounded-2xl border ${step.bg} glass-card-hover flex flex-col justify-between`}
              >
                <div className="flex items-start justify-between">
                  <div className={`p-3 rounded-xl bg-slate-900/80 border border-slate-800 ${step.color}`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-mono font-bold text-slate-500">
                    STEP 0{idx + 1}
                  </span>
                </div>
                <div className="mt-4">
                  <h3 className="font-semibold text-white text-base mb-1">{step.title}</h3>
                  <p className="text-xs text-slate-400">{step.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
