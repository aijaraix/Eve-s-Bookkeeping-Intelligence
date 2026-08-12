import React from 'react';

interface EvesLogoProps {
  className?: string;
  variant?: 'full' | 'emblem' | 'horizontal';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  onClick?: () => void;
}

export const EvesLogo: React.FC<EvesLogoProps> = ({
  className = '',
  variant = 'horizontal',
  size = 'md',
  onClick,
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16',
  };

  const emblemSvg = (
    <svg viewBox="0 0 120 120" className={`${iconSizes[size]} shrink-0`} fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Outer dark navy circle */}
      <circle cx="60" cy="60" r="56" fill="#1e293b" stroke="#0f172a" strokeWidth="3" />
      
      {/* Document shape inside circle */}
      <path
        d="M 45 28 L 78 28 C 81 28, 85 32, 85 36 L 85 88 C 85 91, 81 94, 78 94 L 45 94 C 41 94, 38 91, 38 88 L 38 36 C 38 32, 41 28, 45 28 Z"
        fill="#ffffff"
      />
      {/* Folded corner on top right of document */}
      <path d="M 72 28 L 85 41 L 72 41 Z" fill="#cbd5e1" />

      {/* Navy left block containing 'E' */}
      <rect x="26" y="32" width="28" height="56" rx="5" fill="#1e293b" />
      {/* 'E' serif letter monogram */}
      <text
        x="40"
        y="72"
        fontFamily="Georgia, serif"
        fontSize="40"
        fontWeight="bold"
        fill="#ffffff"
        textAnchor="middle"
      >
        E
      </text>

      {/* Document text lines */}
      <line x1="58" y1="42" x2="78" y2="42" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="58" y1="50" x2="78" y2="50" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />
      <line x1="58" y1="58" x2="72" y2="58" stroke="#475569" strokeWidth="3.5" strokeLinecap="round" />

      {/* Green bar chart in bottom right of document */}
      <rect x="58" y="76" width="6" height="12" rx="1" fill="#16a34a" />
      <rect x="67" y="70" width="6" height="18" rx="1" fill="#16a34a" />
      <rect x="76" y="62" width="6" height="26" rx="1" fill="#15803d" />
    </svg>
  );

  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
        {emblemSvg}
      </div>
    );
  }

  if (variant === 'full') {
    return (
      <div className={`flex flex-col items-center text-center ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
        {emblemSvg}
        <div className="mt-2 text-center">
          <span className="font-serif font-bold text-xl tracking-[0.2em] text-neutral-900 block uppercase leading-tight">E V E ' s</span>
          <div className="w-full h-[1.5px] bg-neutral-300 my-1" />
          <span className="font-sans font-extrabold text-xs tracking-[0.3em] text-emerald-700 block uppercase">B O O K K E E P I N G</span>
          <span className="font-sans text-[9px] font-bold text-neutral-500 tracking-wider block uppercase mt-1">ACCURATE RECORDS. SMART INSIGHTS. CONFIDENT DECISIONS.</span>
        </div>
      </div>
    );
  }

  // Horizontal variant default
  return (
    <div className={`inline-flex items-center space-x-3 ${onClick ? 'cursor-pointer' : ''} ${className}`} onClick={onClick}>
      {emblemSvg}
      <div className="flex flex-col justify-center">
        <div className="flex items-center space-x-1.5 leading-none">
          <span className="font-serif font-extrabold text-base tracking-widest text-neutral-900">EVE's</span>
          <span className="font-sans font-bold text-xs tracking-widest text-emerald-700 uppercase">BOOKKEEPING</span>
        </div>
        <div className="w-full h-[1px] bg-neutral-200 my-1" />
        <span className="text-[9px] font-mono font-bold text-neutral-500 tracking-tight uppercase leading-none">
          ACCURATE RECORDS • SMART INSIGHTS • CONFIDENT DECISIONS
        </span>
      </div>
    </div>
  );
};
