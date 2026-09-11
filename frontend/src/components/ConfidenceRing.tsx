import React from 'react';

interface ConfidenceRingProps {
  confidence: number; // 0..1
  isConfident: boolean;
  size?: number;
}

export const ConfidenceRing: React.FC<ConfidenceRingProps> = ({ 
  confidence, 
  isConfident,
  size = 140 
}) => {
  const strokeWidth = 10;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const percent = Math.min(1.0, Math.max(0.0, confidence));
  const strokeDashoffset = circumference - percent * circumference;
  const displayPercent = (percent * 100).toFixed(1);

  const strokeColor = isConfident ? '#00F0FF' : '#F59E0B';
  const glowShadow = isConfident 
    ? 'drop-shadow(0 0 10px rgba(0, 240, 255, 0.6))'
    : 'drop-shadow(0 0 10px rgba(245, 158, 11, 0.6))';

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background track */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="#1E293B"
          strokeWidth={strokeWidth}
          fill="transparent"
        />
        {/* Progress Arc */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          fill="transparent"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{
            filter: glowShadow,
            transition: 'stroke-dashoffset 0.3s ease, stroke 0.3s ease'
          }}
        />
      </svg>
      {/* Inner Label */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
        <span 
          className={`font-bold text-2xl tracking-tight ${isConfident ? 'text-cyan-300' : 'text-amber-400'}`}
          style={{ textShadow: isConfident ? '0 0 12px rgba(0, 240, 255, 0.5)' : '0 0 12px rgba(245, 158, 11, 0.5)' }}
        >
          {displayPercent}%
        </span>
        <span className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider">
          Confidence
        </span>
      </div>
    </div>
  );
};
