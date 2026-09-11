import React from 'react';
import type { PredictionCandidate } from '../types';

interface TopPredictionsCardProps {
  candidates: PredictionCandidate[];
}

export const TopPredictionsCard: React.FC<TopPredictionsCardProps> = ({ candidates }) => {
  if (!candidates || candidates.length === 0) {
    return (
      <div className="glass-card p-4 rounded-xl text-center text-slate-500 text-xs">
        No candidate predictions available
      </div>
    );
  }

  const ranks = ['#1', '#2', '#3'];
  const colors = [
    { bar: 'bg-cyan-400', text: 'text-cyan-300', glow: 'shadow-[0_0_10px_#00F0FF]' },
    { bar: 'bg-violet-400', text: 'text-violet-300', glow: 'shadow-[0_0_10px_#8B5CF6]' },
    { bar: 'bg-blue-400', text: 'text-blue-300', glow: 'shadow-[0_0_10px_#3B82F6]' }
  ];

  return (
    <div className="glass-card p-4 rounded-2xl space-y-3">
      <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1 flex items-center justify-between">
        <span>Top-3 Predictions</span>
        <span className="text-[10px] text-slate-500">Softmax Probs</span>
      </h3>

      {candidates.slice(0, 3).map((item, idx) => {
        const pct = (item.confidence * 100).toFixed(1);
        const style = colors[idx] || colors[2];
        return (
          <div key={item.label + idx} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono font-bold text-slate-500">{ranks[idx]}</span>
                <span className={`font-mono font-bold text-base ${style.text}`}>
                  {item.label}
                </span>
              </div>
              <span className="font-mono font-semibold text-xs text-slate-300">{pct}%</span>
            </div>
            {/* Animated Bar */}
            <div className="w-full h-2 rounded-full bg-slate-800/80 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${style.bar} ${style.glow}`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
};
