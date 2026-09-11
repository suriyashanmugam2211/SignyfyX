import React from 'react';

interface WaveformProps {
  isSpeaking: boolean;
}

export const Waveform: React.FC<WaveformProps> = ({ isSpeaking }) => {
  if (!isSpeaking) return null;

  return (
    <div className="flex items-center gap-1 h-6 px-3 py-1 rounded-lg bg-cyan-950/60 border border-cyan-500/30">
      <span className="text-[10px] uppercase font-bold text-cyan-300 mr-2 tracking-wider">
        Speaking
      </span>
      {[...Array(7)].map((_, i) => (
        <span
          key={i}
          className="w-1 bg-cyan-400 rounded-full animate-bounce"
          style={{
            height: `${12 + (i % 4) * 4}px`,
            animationDelay: `${i * 0.15}s`,
            animationDuration: '0.6s'
          }}
        />
      ))}
    </div>
  );
};
