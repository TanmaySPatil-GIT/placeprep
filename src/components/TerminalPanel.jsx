import React, { useState } from 'react';
import { 
  Terminal, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  Trash2, 
  Play, 
  Loader2, 
  Cpu, 
  HardDrive, 
  Maximize2, 
  Minimize2, 
  Check, 
  X,
  Code,
  RefreshCw
} from 'lucide-react';


export default function TerminalPanel({
  isRunning = false,
  executionResult = null,
  executionError = '',
  selectedLanguage = 'javascript',
  onRunCode = () => {},
  onClear = () => {}
}) {
  const [activeTab, setActiveTab] = useState('output'); // 'output' | 'testcases'
  const [isExpanded, setIsExpanded] = useState(false);
  const [selectedTestCaseIdx, setSelectedTestCaseIdx] = useState(0);

  const getLangCommand = () => {
    switch (selectedLanguage) {
      case 'python': return 'python3 solution.py';
      case 'cpp': return 'g++ solution.cpp -o main && ./main';
      case 'java': return 'javac Solution.java && java Solution';
      case 'sql': return 'sqlite3 database.db < query.sql';
      default: return 'node solution.js';
    }
  };

  const getStatusBadge = () => {
    if (isRunning) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <Loader2 className="w-3 h-3 animate-spin text-amber-400" />
          Running...
        </span>
      );
    }

    if (executionError) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <XCircle className="w-3 h-3 text-red-400" />
          Execution Error
        </span>
      );
    }

    if (!executionResult) {
      return (
        <span className="text-[11px] text-gray-500 font-mono">
          Ready
        </span>
      );
    }

    const { allPassed, overallStatus, passedCount, total } = executionResult;

    if (overallStatus === 'Execution Engine Unavailable' || overallStatus === 'Service Unavailable' || allPassed === null) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
          {overallStatus || 'Execution Engine Unavailable'}
        </span>
      );
    }

    if (overallStatus === 'Time Limit Exceeded') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-yellow-500/20 text-yellow-300 border border-yellow-500/30">
          <AlertTriangle className="w-3 h-3 text-yellow-400" />
          Time Limit Exceeded
        </span>
      );
    }

    if (overallStatus === 'Runtime Error' || overallStatus === 'Compilation Error') {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-400 border border-red-500/30">
          <XCircle className="w-3 h-3 text-red-400" />
          {overallStatus}
        </span>
      );
    }

    if (allPassed === true) {
      return (
        <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
          Accepted ({passedCount}/{total} Passed)
        </span>
      );
    }

    return (
      <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-red-500/20 text-red-300 border border-red-500/30">
        <XCircle className="w-3.5 h-3.5 text-red-400" />
        Wrong Answer ({passedCount}/{total} Passed)
      </span>
    );
  };

  const currentTestCase = executionResult?.results?.[selectedTestCaseIdx] || null;

  return (
    <div className={`flex flex-col bg-[#1E1E1E] border-t border-gray-800 text-gray-200 font-mono transition-all duration-200 ${
      isExpanded ? 'h-[460px]' : 'h-[280px]'
    }`}>
      {/* VS Code Terminal Header Tabs */}
      <div className="flex items-center justify-between bg-[#252526] px-3 py-1.5 border-b border-[#333333] select-none">
        <div className="flex items-center gap-1 text-xs">
          <button
            onClick={() => setActiveTab('output')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md font-semibold text-xs transition-colors ${
              activeTab === 'output'
                ? 'bg-[#1E1E1E] text-white border-t-2 border-emerald-500'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2A2D2E]'
            }`}
          >
            <Terminal className="w-3.5 h-3.5 text-emerald-400" />
            <span>Output</span>
            {executionResult && (
              <span className="text-[10px] px-1.5 py-0.2 rounded bg-gray-800 text-gray-400 font-mono">
                {executionResult.results?.length || 0}
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('testcases')}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-t-md font-semibold text-xs transition-colors ${
              activeTab === 'testcases'
                ? 'bg-[#1E1E1E] text-white border-t-2 border-emerald-500'
                : 'text-gray-400 hover:text-gray-200 hover:bg-[#2A2D2E]'
            }`}
          >
            <Code className="w-3.5 h-3.5 text-blue-400" />
            <span>Test Cases</span>
            {executionResult && (
              <span className={`text-[10px] px-1.5 py-0.2 rounded font-mono font-bold ${
                executionResult.allPassed ? 'bg-emerald-950 text-emerald-400' : 'bg-red-950 text-red-400'
              }`}>
                {executionResult.passedCount}/{executionResult.total}
              </span>
            )}
          </button>
        </div>

        {/* Right Header Status & Controls */}
        <div className="flex items-center gap-3 text-xs">
          {getStatusBadge()}

          <div className="h-4 w-px bg-gray-700" />

          <button
            onClick={onClear}
            title="Clear Terminal Output"
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={() => setIsExpanded(!isExpanded)}
            title={isExpanded ? "Minimize Terminal" : "Maximize Terminal"}
            className="p-1 rounded hover:bg-gray-700 text-gray-400 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Terminal Content Body */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 font-mono text-xs leading-relaxed">
        {/* Loading Spinner Indicator */}
        {isRunning && (
          <div className="flex flex-col items-center justify-center py-10 space-y-3 text-gray-400 animate-pulse">
            <Loader2 className="w-8 h-8 text-emerald-400 animate-spin" />
            <div className="text-xs font-mono text-gray-300">
              Executing code against visible test cases in isolated sandbox...
            </div>
            <div className="text-[11px] text-gray-500">
              Running engine: Piston / Judge0 Sandboxed API
            </div>
          </div>
        )}

        {/* OUTPUT TAB CONTENT */}
        {!isRunning && activeTab === 'output' && (
          <div className="space-y-3">
            {/* Terminal Command Line */}
            <div className="flex items-center gap-2 text-gray-400 text-[11px] border-b border-gray-800 pb-2">
              <span className="text-emerald-400 font-bold">placeprep@sandbox:~$</span>
              <span className="text-gray-200">{getLangCommand()}</span>
            </div>

            {/* Execution Global Error */}
            {executionError && (
              <div className="p-3.5 rounded bg-red-950/70 border border-red-800/80 text-red-300 space-y-2.5">
                <div className="font-bold flex items-center justify-between text-red-400">
                  <span className="flex items-center gap-1.5">
                    <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                    <span>Execution Exception / Service Notice:</span>
                  </span>
                  <button
                    onClick={onRunCode}
                    disabled={isRunning}
                    className="inline-flex items-center gap-1.5 px-3 py-1 rounded bg-red-800 hover:bg-red-700 text-white font-bold text-xs transition-colors shadow disabled:opacity-50 cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRunning ? 'animate-spin' : ''}`} />
                    <span>Retry Code Execution</span>
                  </button>
                </div>
                <pre className="whitespace-pre-wrap font-mono text-xs text-red-300 pt-1">
                  {executionError}
                </pre>
              </div>
            )}


            {/* If no execution result yet */}
            {!executionResult && !executionError && (
              <div className="py-8 text-center text-gray-500 space-y-2">
                <Terminal className="w-8 h-8 mx-auto text-gray-600 opacity-60" />
                <p className="text-xs">No execution output yet.</p>
                <p className="text-[11px] text-gray-600">
                  Click <span className="text-emerald-400 font-bold">"Run Code"</span> to execute your solution against test cases.
                </p>
              </div>
            )}

            {/* Detailed Terminal Output Per Test Case */}
            {executionResult && (
              <div className="space-y-4">
                {/* Stats Header Strip */}
                <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded bg-[#252526] border border-gray-800 text-xs">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <Cpu className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Runtime: <strong className="text-emerald-300">{executionResult.executionTimeMs}</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-gray-300">
                      <HardDrive className="w-3.5 h-3.5 text-blue-400" />
                      <span>Memory: <strong className="text-blue-300">{executionResult.memoryUsed}</strong></span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">Status:</span>
                    <span className={`font-bold ${
                      executionResult.allPassed ? 'text-emerald-400' : 'text-red-400'
                    }`}>
                      {executionResult.overallStatus}
                    </span>
                  </div>
                </div>

                {/* Per Case Console Output */}
                {executionResult.results?.map((res, idx) => (
                  <div key={idx} className="space-y-1.5 border-b border-gray-800/80 pb-3 last:border-b-0">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="font-bold text-gray-300 flex items-center gap-1.5">
                        {res.passed ? (
                          <Check className="w-3.5 h-3.5 text-emerald-400 stroke-[3]" />
                        ) : (
                          <X className="w-3.5 h-3.5 text-red-400 stroke-[3]" />
                        )}
                        Test Case #{idx + 1}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        res.passed ? 'bg-emerald-950 text-emerald-400 border border-emerald-800/50' : 'bg-red-950 text-red-400 border border-red-800/50'
                      }`}>
                        {res.status}
                      </span>
                    </div>

                    {/* Stderr / Runtime Error with Red Terminal Formatting */}
                    {res.stderr ? (
                      <div className="p-2.5 rounded bg-red-950/40 border border-red-900/60 text-red-400 font-mono text-[11px] leading-relaxed overflow-x-auto">
                        <div className="font-bold text-red-300 pb-1">Standard Error Output (stderr):</div>
                        <pre className="whitespace-pre-wrap text-red-400">{res.stderr}</pre>
                      </div>
                    ) : (
                      <div className="text-gray-300 font-mono text-[11px] bg-[#161616] p-2.5 rounded border border-gray-850 space-y-1">
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-16 text-right select-none">Input:</span>
                          <span className="text-gray-200">{res.input}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-16 text-right select-none">Expected:</span>
                          <span className="text-emerald-400">{res.expectedOutput}</span>
                        </div>
                        <div className="flex gap-2">
                          <span className="text-gray-500 w-16 text-right select-none">Actual:</span>
                          <span className={res.passed ? "text-emerald-300 font-bold" : "text-red-400 font-bold"}>
                            {res.stdout ? res.stdout : '(Empty Output)'}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TEST CASES TAB CONTENT */}
        {!isRunning && activeTab === 'testcases' && (
          <div className="space-y-4">
            {!executionResult ? (
              <div className="py-8 text-center text-gray-500">
                <p className="text-xs">Run code to evaluate test cases.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Case List Selector Sidebar */}
                <div className="md:col-span-4 flex flex-row md:flex-col gap-2 overflow-x-auto md:overflow-y-auto">
                  {executionResult.results?.map((res, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedTestCaseIdx(idx)}
                      className={`flex items-center justify-between p-2.5 rounded-lg border text-xs font-mono text-left transition-all ${
                        selectedTestCaseIdx === idx
                          ? 'bg-[#252526] border-emerald-500/80 text-white shadow'
                          : 'bg-[#1A1A1A] border-gray-800 text-gray-400 hover:border-gray-700'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        {res.passed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                        ) : (
                          <XCircle className="w-4 h-4 text-red-400 shrink-0" />
                        )}
                        <span>Case #{idx + 1}</span>
                      </div>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                        res.passed ? 'text-emerald-400 bg-emerald-950' : 'text-red-400 bg-red-950'
                      }`}>
                        {res.passed ? 'PASS' : 'FAIL'}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Selected Case Detail View */}
                {currentTestCase && (
                  <div className="md:col-span-8 p-3.5 rounded-xl bg-[#252526] border border-gray-800 space-y-3">
                    <div className="flex items-center justify-between border-b border-gray-800 pb-2">
                      <h4 className="font-bold text-xs text-gray-200 flex items-center gap-2">
                        <span>Test Case #{selectedTestCaseIdx + 1} Details</span>
                      </h4>
                      <span className={`px-2.5 py-0.5 rounded text-[11px] font-bold ${
                        currentTestCase.passed
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-800'
                          : 'bg-red-950 text-red-400 border border-red-800'
                      }`}>
                        {currentTestCase.status}
                      </span>
                    </div>

                    <div className="space-y-2 text-xs font-mono">
                      <div>
                        <div className="text-[11px] text-gray-400 font-semibold mb-1">Input:</div>
                        <div className="p-2 rounded bg-[#1A1A1A] border border-gray-800 text-gray-200 overflow-x-auto">
                          {currentTestCase.input}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-gray-400 font-semibold mb-1">Expected Output:</div>
                        <div className="p-2 rounded bg-[#1A1A1A] border border-gray-800 text-emerald-400 font-bold overflow-x-auto">
                          {currentTestCase.expectedOutput}
                        </div>
                      </div>

                      <div>
                        <div className="text-[11px] text-gray-400 font-semibold mb-1">Actual Output:</div>
                        <div className={`p-2 rounded border overflow-x-auto font-bold ${
                          currentTestCase.passed
                            ? 'bg-[#1A1A1A] border-gray-800 text-emerald-300'
                            : 'bg-red-950/40 border-red-900 text-red-400'
                        }`}>
                          {currentTestCase.actualOutput}
                        </div>
                      </div>

                      {currentTestCase.stderr && (
                        <div>
                          <div className="text-[11px] text-red-400 font-semibold mb-1">Error Traceback:</div>
                          <pre className="p-2 rounded bg-red-950/50 border border-red-900/80 text-red-300 text-[11px] whitespace-pre-wrap overflow-x-auto">
                            {currentTestCase.stderr}
                          </pre>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
