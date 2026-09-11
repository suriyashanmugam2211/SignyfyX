import React from 'react';
import { Activity, ShieldCheck, Cpu, Wifi } from 'lucide-react';
import type { SystemHealth } from '../types';

interface HeaderProps {
  health: SystemHealth;
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

export const Header: React.FC<HeaderProps> = ({ health, activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'home', label: 'Home' },
    { id: 'live', label: 'Live' },
    { id: 'personalize', label: 'Personalize' },
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'settings', label: 'Settings' },
    { id: 'about', label: 'About' },
  ];

  return (
    <header className="glass-card border-b border-slate-800/80 px-6 py-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-3 md:hidden">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-violet-600 flex items-center justify-center">
          <Activity className="w-5 h-5 text-white" />
        </div>
        <span className="font-bold text-white tracking-wide">SIGNYFYX</span>
      </div>

      <div className="hidden md:flex items-center gap-6 text-xs text-slate-300">
        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <Cpu className="w-4 h-4 text-cyan-400" />
          <span>CNN Model:</span>
          <span className={health.cnn_model_loaded ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {health.cnn_model_loaded ? 'Loaded (PyTorch)' : 'Loading...'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <ShieldCheck className="w-4 h-4 text-violet-400" />
          <span>MediaPipe:</span>
          <span className={health.mediapipe_ready ? 'text-emerald-400 font-semibold' : 'text-amber-400 font-semibold'}>
            {health.mediapipe_ready ? 'Ready' : 'Initializing'}
          </span>
        </div>

        <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <Wifi className="w-4 h-4 text-blue-400" />
          <span>Backend:</span>
          <span className={health.backend_connected ? 'text-emerald-400 font-semibold' : 'text-rose-400 font-semibold'}>
            {health.backend_connected ? 'Connected' : 'Offline'}
          </span>
        </div>
      </div>

      {/* Mobile nav bar */}
      <div className="flex md:hidden items-center gap-1 overflow-x-auto max-w-[240px] text-xs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-2.5 py-1 rounded-md whitespace-nowrap transition-colors ${
              activeTab === tab.id
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/50'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </header>
  );
};
