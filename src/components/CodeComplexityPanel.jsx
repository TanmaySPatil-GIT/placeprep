import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Zap, 
  Cpu, 
  HardDrive, 
  Clock, 
  Info, 
  Sparkles, 
  AlertCircle, 
  ChevronDown, 
  ChevronUp, 
  TrendingUp,
  Award
} from 'lucide-react';

export default function CodeComplexityPanel({ analysisData }) {
  const [showTimeInfo, setShowTimeInfo] = useState(false);
  const [showSpaceInfo, setShowSpaceInfo] = useState(false);

  if (!analysisData) return null;

  const {
    timeComplexity = 'O(N)',
    spaceComplexity = 'O(1)',
    explanation = 'Single-pass traversal over input elements.',
    comparedToOptimal = {},
    executionTimeMs = 28,
    memoryUsedKb = 14200,
    runtimePercentile = 86.4,
    memoryPercentile = 91.2,
    disclaimer = 'AI-estimated based on code structure & execution telemetry'
  } = analysisData;

  const isOptimal = comparedToOptimal.isOptimal !== false;
  const optimalComplexityStr = comparedToOptimal.optimalComplexity || 'O(N) time, O(1) space';
  const improvementHint = comparedToOptimal.improvementHint || '';

  // Format Memory KB -> MB
  const memoryMb = (memoryUsedKb / 1024).toFixed(1);

  return (
    <div className="rounded-3xl bg-white border border-warmborder p-6 space-y-6 shadow-warm-sm animate-fadeIn text-darkcharcoal-900 font-sans">
      
      {/* Accepted Status Banner */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-warmborder pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-mint-100 border border-warmborder text-leaf-600 flex items-center justify-center shadow-warm-sm">
            <CheckCircle2 className="w-6 h-6 text-leaf-600" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-lg font-bold font-serif text-darkcharcoal-900">Submitted & Accepted</h3>
              <span className="px-3 py-0.5 rounded-full text-xs font-extrabold bg-mint-100 text-leaf-600 border border-warmborder">
                All Test Cases Passed
              </span>
            </div>
            <p className="text-xs text-darkcharcoal-500 font-medium">LeetCode-style static code complexity & execution telemetry report</p>
          </div>
        </div>

        {/* Runtime & Memory Quick Badges */}
        <div className="flex items-center gap-2">
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-mint-50 text-leaf-700 border border-warmborder">
            <Zap className="w-3.5 h-3.5 text-leaf-600" />
            {executionTimeMs} ms
          </span>
          <span className="flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-mono font-bold bg-mint-50 text-leaf-700 border border-warmborder">
            <HardDrive className="w-3.5 h-3.5 text-leaf-600" />
            {memoryMb} MB
          </span>
        </div>
      </div>

      {/* Grid 1: Execution Stats (Runtime & Memory Percentile Beats) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Runtime Percentile Card */}
        <div className="p-4 rounded-2xl bg-mint-50/60 border border-warmborder space-y-3 shadow-warm-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-darkcharcoal-700 font-serif flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-leaf-600" />
              Runtime Telemetry
            </span>
            <span className="font-mono font-bold text-leaf-600 text-base">{executionTimeMs} ms</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-leaf-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-leaf-600" />
                Faster than {runtimePercentile}% of submissions
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white border border-warmborder overflow-hidden">
              <div 
                className="h-full bg-leaf-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, Math.min(100, runtimePercentile))}%` }}
              />
            </div>
          </div>
        </div>

        {/* Memory Percentile Card */}
        <div className="p-4 rounded-2xl bg-mint-50/60 border border-warmborder space-y-3 shadow-warm-sm">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-darkcharcoal-700 font-serif flex items-center gap-1.5">
              <HardDrive className="w-4 h-4 text-leaf-600" />
              Memory Usage
            </span>
            <span className="font-mono font-bold text-leaf-600 text-base">{memoryMb} MB</span>
          </div>

          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-[11px] font-mono">
              <span className="text-leaf-700 font-bold flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-leaf-600" />
                Uses less memory than {memoryPercentile}% of submissions
              </span>
            </div>
            {/* Visual Progress Bar */}
            <div className="w-full h-2 rounded-full bg-white border border-warmborder overflow-hidden">
              <div 
                className="h-full bg-leaf-500 rounded-full transition-all duration-500"
                style={{ width: `${Math.max(10, Math.min(100, memoryPercentile))}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Grid 2: Big-O Time & Space Complexity Analysis */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        
        {/* Time Complexity Card */}
        <div className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 shadow-warm-sm relative">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-darkcharcoal-500 uppercase tracking-wider font-mono">
              Analyzed Time Complexity
            </div>
            <button
              onClick={() => setShowTimeInfo(!showTimeInfo)}
              className="p-1 rounded-full hover:bg-mint-100 text-darkcharcoal-500 hover:text-leaf-600 transition-colors"
              title="View Time Complexity Rationale"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-leaf-600">{timeComplexity}</div>
            <span className="text-[10px] text-darkcharcoal-500 font-mono">Worst-case Big-O</span>
          </div>

          {showTimeInfo && (
            <div className="pt-2 border-t border-warmborder text-xs text-darkcharcoal-700 leading-relaxed font-sans animate-fadeIn">
              {explanation}
            </div>
          )}
        </div>

        {/* Space Complexity Card */}
        <div className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 shadow-warm-sm relative">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-bold text-darkcharcoal-500 uppercase tracking-wider font-mono">
              Analyzed Space Complexity
            </div>
            <button
              onClick={() => setShowSpaceInfo(!showSpaceInfo)}
              className="p-1 rounded-full hover:bg-mint-100 text-darkcharcoal-500 hover:text-leaf-600 transition-colors"
              title="View Space Complexity Rationale"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>

          <div className="flex items-baseline justify-between">
            <div className="text-2xl font-bold font-mono text-gold-600">{spaceComplexity}</div>
            <span className="text-[10px] text-darkcharcoal-500 font-mono">Auxiliary Memory</span>
          </div>

          {showSpaceInfo && (
            <div className="pt-2 border-t border-warmborder text-xs text-darkcharcoal-700 leading-relaxed font-sans animate-fadeIn">
              {explanation}
            </div>
          )}
        </div>
      </div>

      {/* Explanation Text Box (Always Visible) */}
      <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-1.5 text-xs">
        <div className="font-bold text-leaf-600 font-serif flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-gold-500" />
          <span>AI Complexity Breakdown</span>
        </div>
        <p className="text-darkcharcoal-700 leading-relaxed font-sans text-xs">
          {explanation}
        </p>
      </div>

      {/* Comparison against Optimal Complexity Banner */}
      {isOptimal ? (
        <div className="p-4 rounded-2xl bg-mint-100/70 border border-warmborder text-xs text-leaf-700 flex items-center gap-3 shadow-warm-sm">
          <Award className="w-5 h-5 text-leaf-600 shrink-0" />
          <div>
            <div className="font-bold font-serif text-leaf-700 text-sm">✨ Optimal Solution Achieved!</div>
            <div className="text-xs text-leaf-600">
              Your solution matches the problem's target optimal complexity of <code className="font-mono font-bold">{optimalComplexityStr}</code>.
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-gold-50 border border-gold-200 text-xs text-darkcharcoal-900 space-y-2 shadow-warm-sm">
          <div className="flex items-center gap-2 font-bold text-gold-600 font-serif text-sm">
            <AlertCircle className="w-4 h-4 text-gold-500 shrink-0" />
            <span>💡 Constructive Optimization Hint</span>
          </div>
          <p className="text-darkcharcoal-700 leading-relaxed font-sans">
            Your solution works and passed all test cases! However, the expected optimal complexity is <code className="font-mono font-bold text-leaf-600">{optimalComplexityStr}</code>.
          </p>
          {improvementHint && (
            <div className="p-3 rounded-xl bg-white border border-gold-200 font-mono text-[11px] text-darkcharcoal-900">
              💡 <strong>Hint:</strong> {improvementHint}
            </div>
          )}
        </div>
      )}

      {/* LLM Disclaimer Footer */}
      <div className="pt-2 border-t border-warmborder flex items-center justify-between text-[11px] text-darkcharcoal-500 font-mono">
        <span className="flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-gold-500" />
          <span>{disclaimer}</span>
        </span>
        <span className="italic">PlacePrep DSA Telemetry Engine</span>
      </div>
    </div>
  );
}
