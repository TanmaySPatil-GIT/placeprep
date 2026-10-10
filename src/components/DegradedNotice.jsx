import React from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

/**
 * Shared DegradedNotice Component
 * Visually distinct subtle amber/gold tone (not red/error styling)
 * Clearly signals "this part is limited right now" without alarming the user.
 */
export default function DegradedNotice({
  title,
  reason,
  onRetry,
  retryLabel = 'Try Again',
  className = ''
}) {
  return (
    <div
      role="status"
      className={`rounded-2xl bg-amber-50/95 border border-amber-300/80 p-4 text-amber-950 shadow-warm-sm flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 animate-fadeIn ${className}`}
    >
      <div className="flex items-start gap-3">
        <div className="p-2 rounded-xl bg-amber-100 text-amber-700 border border-amber-200 shrink-0 mt-0.5 sm:mt-0">
          <AlertTriangle className="w-4 h-4" />
        </div>
        <div className="space-y-0.5">
          {title && (
            <h4 className="text-xs font-bold font-serif text-amber-900 tracking-wide">
              {title}
            </h4>
          )}
          <p className="text-xs text-amber-800 leading-relaxed font-sans">
            {reason}
          </p>
        </div>
      </div>

      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="self-end sm:self-auto px-3.5 py-1.5 rounded-full bg-white hover:bg-amber-100/70 border border-amber-300 text-amber-900 text-xs font-bold transition-colors flex items-center gap-1.5 shrink-0 shadow-warm-xs"
        >
          <RefreshCw className="w-3.5 h-3.5 text-amber-700" />
          <span>{retryLabel}</span>
        </button>
      )}
    </div>
  );
}
