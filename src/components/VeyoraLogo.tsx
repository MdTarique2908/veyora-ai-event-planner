import React from 'react';

interface VeyoraLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showWordmark?: boolean;
  showTagline?: boolean;
  variant?: 'light' | 'dark' | 'auto';
  className?: string;
  badgeStyle?: boolean;
}

export const VeyoraIcon: React.FC<{ size?: number; className?: string }> = ({
  size = 32,
  className = '',
}) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      aria-label="Veyora Star"
    >
      <defs>
        <linearGradient id="veyoraIconGold" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#FFF8E8" />
          <stop offset="35%" stopColor="#E8D4A8" />
          <stop offset="100%" stopColor="#C5A869" />
        </linearGradient>
        <linearGradient id="veyoraIconGoldSec" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E8D4A8" stopOpacity="0.85" />
          <stop offset="100%" stopColor="#B39352" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Ambient center gold aura */}
      <circle cx="32" cy="32" r="16" fill="#E8D4A8" opacity="0.18" />

      {/* Secondary 45-degree diagonal star facet */}
      <path
        d="M 32,18 C 32,27 27,32 18,32 C 27,32 32,37 32,46 C 32,37 37,32 46,32 C 37,32 32,27 32,18 Z"
        fill="url(#veyoraIconGoldSec)"
        transform="rotate(45 32 32)"
      />

      {/* Primary 4-point cardinal star */}
      <path
        d="M 32,10 C 32,23 23,32 10,32 C 23,32 32,41 32,54 C 32,41 41,32 54,32 C 41,32 32,23 32,10 Z"
        fill="url(#veyoraIconGold)"
      />

      {/* Diamond sparkle core */}
      <polygon points="32,27 37,32 32,37 27,32" fill="#FFFFFF" opacity="0.95" />
    </svg>
  );
};

export const VeyoraLogo: React.FC<VeyoraLogoProps> = ({
  size = 'md',
  showWordmark = true,
  showTagline = false,
  variant = 'auto',
  className = '',
  badgeStyle = true,
}) => {
  // Sizing tokens
  const sizeMap = {
    sm: { iconBox: 'h-8 w-8', iconSize: 22, text: 'text-base', subText: 'text-[9px]' },
    md: { iconBox: 'h-10 w-10', iconSize: 28, text: 'text-xl', subText: 'text-[10px]' },
    lg: { iconBox: 'h-12 w-12', iconSize: 34, text: 'text-2xl', subText: 'text-xs' },
    xl: { iconBox: 'h-16 w-16', iconSize: 44, text: 'text-3xl sm:text-4xl', subText: 'text-xs sm:text-sm' },
  };

  const currentSize = sizeMap[size];

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      {/* Geometric Starburst Symbol */}
      {badgeStyle ? (
        <div
          className={`flex shrink-0 ${currentSize.iconBox} items-center justify-center rounded-xl bg-gradient-to-br from-[#1E2B45] to-[#172033] border border-[#E8D4A8]/40 shadow-sm shadow-[#172033]/30 transition-transform`}
        >
          <VeyoraIcon size={currentSize.iconSize} />
        </div>
      ) : (
        <div className={`flex shrink-0 items-center justify-center`}>
          <VeyoraIcon size={currentSize.iconSize} />
        </div>
      )}

      {/* Wordmark & Optional Tagline */}
      {showWordmark && (
        <div className="flex flex-col justify-center">
          <div className="flex items-center gap-1.5 leading-none">
            <span
              className={`font-display font-extrabold tracking-tight text-slate-900 dark:text-slate-100 ${currentSize.text}`}
            >
              Veyora
            </span>
            <span className="inline-block h-1.5 w-1.5 rounded-full bg-[#D4B876]" />
          </div>

          {showTagline && (
            <p className={`font-medium text-slate-500 dark:text-slate-400 mt-0.5 tracking-normal ${currentSize.subText}`}>
              Every occasion, extraordinary.
            </p>
          )}
        </div>
      )}
    </div>
  );
};
