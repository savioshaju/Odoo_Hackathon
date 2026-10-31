import React from 'react';

export default function BrightloopLogo({ className = "h-8 w-8", withText = true, textClassName = "text-xl font-extrabold text-deepNavy" }) {
  return (
    <div className="flex items-center gap-2.5 select-none">
      <div className={`relative flex items-center justify-center rounded-xl bg-gradient-to-tr from-[#5145E5] via-[#8067F8] to-[#38C6D9] p-0.5 shadow-md shadow-[#5145E5]/20 ${className}`}>
        <div className="w-full h-full bg-deepNavy/10 backdrop-blur-xs rounded-[10px] flex items-center justify-center">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-white" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="5" />
            <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
          </svg>
        </div>
      </div>
      {withText && (
        <span className={`tracking-tight font-sans ${textClassName}`}>
          Bright<span className="text-primary">loop</span>
        </span>
      )}
    </div>
  );
}

