import React from 'react';
import { Link } from 'react-router-dom';

export default function Logo({ size = 'md', showText = true, className = '' }) {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-12 h-12'
  };

  const textSizes = {
    sm: 'text-base',
    md: 'text-xl',
    lg: 'text-3xl'
  };

  return (
    <Link to="/" className={`inline-flex items-center gap-2.5 group transition-transform duration-200 ease-out hover:scale-[1.03] active:scale-[0.98] ${className}`}>
      
      {/* SVG Icon: Speech Bubble with Ascending Readiness Bars */}
      <div className={`${iconSizes[size] || 'w-9 h-9'} rounded-xl bg-gradient-to-br from-peach-100 to-white border border-warmborder p-1.5 flex items-center justify-center shadow-warm-sm group-hover:shadow-warm-md group-hover:border-rust-500/40 transition-all duration-200`}>
        <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
          {/* Speech Bubble Outline */}
          <path 
            d="M8 8 C 8 8, 40 8, 40 28 C 40 38, 28 38, 28 38 L 18 44 L 20 38 C 8 38, 8 28, 8 8 Z" 
            stroke="url(#logoRustGrad)" 
            strokeWidth="3.5" 
            strokeLinejoin="round"
          />
          {/* Ascending Growth Bars */}
          <rect x="15" y="24" width="4" height="8" rx="2" fill="#D98E77" />
          <rect x="22" y="18" width="4" height="14" rx="2" fill="#B5654A" />
          <rect x="29" y="12" width="4" height="20" rx="2" fill="url(#logoRustGrad)" />

          <defs>
            <linearGradient id="logoRustGrad" x1="0" y1="0" x2="48" y2="48" gradientUnits="userSpaceOnUse">
              <stop stopColor="#B5654A" />
              <stop offset="0.5" stopColor="#D98E77" />
              <stop offset="1" stopColor="#3D2B24" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Wordmark */}
      {showText && (
        <span className={`${textSizes[size] || 'text-xl'} font-bold font-serif tracking-tight group-hover:text-rust-600 transition-colors duration-200`}>
          <span className="text-warmtext-900">Place</span>
          <span className="text-rust-500">Prep</span>
        </span>
      )}

    </Link>
  );
}
