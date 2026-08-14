import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Editor from '@monaco-editor/react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import ProgressStepper from '../components/ProgressStepper';
import { usePrep } from '../context/PrepContext';
import { INITIAL_QUESTIONS, seedQuestionsInFirestore } from '../utils/seedQuestions';
import { INITIAL_ROLE_QUESTIONS } from '../utils/seedRoleQuestions';
import { shuffleArray } from '../utils/shuffle';
import { executeBatchTestCases } from '../services/codeExecution';
import { getBackendUrl } from '../config/api';
import TerminalPanel from '../components/TerminalPanel';
import CodeComplexityPanel from '../components/CodeComplexityPanel';
import { 
  Code2, 
  Play, 
  Send, 
  Clock, 
  Sparkles, 
  Terminal, 
  CheckCircle2, 
  XCircle,
  RotateCcw,
  Database,
  Loader2,
  AlertCircle,
  Target,
  Info,
  Layers,
  FileCode,
  Building2,
  ArrowRight
} from 'lucide-react';

const RECENT_DSA_STORAGE_KEY = 'placeprep_recent_dsa_qids';

const getRecentDsaQuestionIds = () => {
  try {
    const saved = localStorage.getItem(RECENT_DSA_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveRecentDsaQuestionIds = (newQIds) => {
  try {
    const current = getRecentDsaQuestionIds();
    const combined = Array.from(new Set([...newQIds, ...current])).slice(0, 20);
    localStorage.setItem(RECENT_DSA_STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Could not save recent DSA question IDs:', e);
  }
};

export default function DsaRoundPage() {
  const navigate = useNavigate();
  const { selectedCompany, selectedField, setRoundIndex, setDsaResult, difficultyLevel } = usePrep();

  const isDsaHeavy = selectedField?.isDsaHeavy !== false;
  const companyName = selectedCompany?.name || 'Google';
  const timeLimitMinutes = selectedCompany?.dsaProfile?.timeLimitMinutes || 45;
  const companyTopics = selectedCompany?.dsaProfile?.topicsFocus || ['Arrays & Hash Maps', 'Trees & Graphs'];
  const companyNotes = selectedCompany?.dsaProfile?.notes || 'Optimal time & space complexity expected.';

  const [questions, setQuestions] = useState(INITIAL_QUESTIONS);
  const [activeQuestion, setActiveQuestion] = useState(null);
  const [loadingQuestion, setLoadingQuestion] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMsg, setSeedMsg] = useState('');

  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [showCompanyNote, setShowCompanyNote] = useState(false);
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(timeLimitMinutes * 60);

  const [selectedLanguage, setSelectedLanguage] = useState(isDsaHeavy ? 'javascript' : 'sql');
  const [code, setCode] = useState('');
  const [showAiHint, setShowAiHint] = useState(false);

  const [isRunning, setIsRunning] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [executionResult, setExecutionResult] = useState(null);
  const [executionError, setExecutionError] = useState('');
  const [complexityAnalysisData, setComplexityAnalysisData] = useState(null);
  const [aiCodeEvaluation, setAiCodeEvaluation] = useState(null);
  const [showEvalModal, setShowEvalModal] = useState(false);

  const handleLanguageChange = (newLang) => {
    setSelectedLanguage(newLang);
    if (activeQuestion?.starterCode?.[newLang]) {
      setCode(activeQuestion.starterCode[newLang]);
    }
  };

  useEffect(() => {
    setTimeLeftSeconds(timeLimitMinutes * 60);
    const interval = setInterval(() => {
      setTimeLeftSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [timeLimitMinutes]);

  const formatTime = (totalSec) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  };

  const fetchQuestions = async () => {
    setLoadingQuestion(true);
    try {
      if (!isDsaHeavy) {
        const snap = await getDocs(collection(db, 'roleQuestions'));
        let rolePool = snap.empty ? INITIAL_ROLE_QUESTIONS : snap.docs.map(d => ({ id: d.id, ...d.data() }));
        const matchedField = rolePool.filter(q => q.fieldId === selectedField?.fieldId);
        const chosen = matchedField.length > 0 ? matchedField[0] : (rolePool[0] || INITIAL_ROLE_QUESTIONS[0]);

        setActiveQuestion({
          id: chosen.id,
          title: chosen.title,
          difficulty: chosen.difficulty || 'Medium',
          topic: chosen.category || selectedField?.name,
          description: chosen.question,
          starterCode: chosen.starterCode || '// Write your solution / assessment response here',
          testCases: [{ input: 'Field Assessment', expected: 'Passed' }]
        });
        setCode(chosen.starterCode || '// Write your solution / assessment response here');
        setLoadingQuestion(false);
        return;
      }

      const snap = await getDocs(collection(db, 'questions'));
      const pool = (snap && !snap.empty) ? snap.docs.map(d => ({ id: d.id, ...d.data() })) : INITIAL_QUESTIONS;
      selectFromPool(pool);
    } catch (err) {
      selectFromPool(INITIAL_QUESTIONS);
    } finally {
      setLoadingQuestion(false);
    }
  };

  const selectFromPool = (pool) => {
    const required = selectedCompany?.dsaProfile?.typicalQuestionCount || 1;
    const targetDiff = difficultyLevel || selectedCompany?.difficulty || 'Medium';
    const recentIds = getRecentDsaQuestionIds();

    let tier1 = pool.filter(q => (q.difficulty || 'Medium') === targetDiff && Array.isArray(q.companiesAsked) && q.companiesAsked.includes(companyName));
    let tier2 = pool.filter(q => (q.difficulty || 'Medium') === targetDiff);
    let tier3 = pool.filter(q => Array.isArray(q.companiesAsked) && q.companiesAsked.includes(companyName));

    const combinedMap = new Map();
    [...tier1, ...tier2, ...tier3, ...pool].forEach(q => { if (!combinedMap.has(q.id)) combinedMap.set(q.id, q); });

    const fullCandidatePool = Array.from(combinedMap.values());
    const unseenPool = fullCandidatePool.filter(q => !recentIds.includes(q.id));
    const activeCandidatePool = unseenPool.length >= required ? unseenPool : fullCandidatePool;

    const shuffled = shuffleArray(activeCandidatePool);
    const selected = shuffled.slice(0, Math.max(1, required));

    saveRecentDsaQuestionIds(selected.map(q => q.id));
    setQuestions(selected);
    const first = selected[0] || INITIAL_QUESTIONS[0];
    setActiveQuestion(first);
    setQuestionStartTime(Date.now());

    if (first?.starterCode?.[selectedLanguage]) {
      setCode(first.starterCode[selectedLanguage]);
    } else if (first?.starterCode?.javascript) {
      setCode(first.starterCode.javascript);
    }
  };

  const handleRetakeDsa = () => {
    setExecutionResult(null);
    setExecutionError('');
    setAiCodeEvaluation(null);
    setShowEvalModal(false);
    setTimeLeftSeconds(timeLimitMinutes * 60);
    fetchQuestions();
  };

  useEffect(() => {
    setExecutionResult(null);
    setAiCodeEvaluation(null);
    setShowEvalModal(false);
    setSelectedLanguage(isDsaHeavy ? 'javascript' : (selectedField?.defaultLanguage || 'sql'));
    fetchQuestions();
  }, [companyName, difficultyLevel, selectedField?.fieldId, selectedField?.name, isDsaHeavy]);

  const handleSeedQuestions = async () => {
    setSeeding(true);
    const res = await seedQuestionsInFirestore();
    if (res.success) fetchQuestions();
    setSeeding(false);
  };

  const handleClearTerminal = () => {
    setExecutionResult(null);
    setExecutionError('');
    setComplexityAnalysisData(null);
  };

  const fetchComplexityAnalysis = async (execRes, currentCode) => {
    if (!activeQuestion) return null;
    const FLASK_COMPLEXITY_URL = `${getBackendUrl()}/api/analyze-code-complexity`;

    const numericTime = parseInt(execRes?.executionTimeMs) || 28;
    let numericMemKb = 14200;
    if (execRes?.memoryUsed) {
      const rawMem = parseFloat(execRes.memoryUsed);
      if (execRes.memoryUsed.includes('MB')) numericMemKb = Math.round(rawMem * 1024);
      else numericMemKb = Math.round(rawMem);
    }

    try {
      const res = await fetch(FLASK_COMPLEXITY_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          code: currentCode || code,
          language: selectedLanguage,
          questionId: activeQuestion.id,
          executionTimeMs: numericTime,
          memoryUsedKb: numericMemKb,
          optimalComplexity: activeQuestion.optimalComplexity || 'O(N) time, O(1) space'
        })
      });
      if (res.ok) {
        const compData = await res.json();
        setComplexityAnalysisData(compData);
        return compData;
      }
    } catch (err) {
      console.warn('Complexity analysis notice:', err.message);
    }
    return null;
  };

  const handleRunCode = async () => {
    if (!activeQuestion) return;
    setIsRunning(true);
    setExecutionError('');
    setExecutionResult(null);
    setComplexityAnalysisData(null);

    try {
      const casesToRun = activeQuestion.testCases || [{ input: 'Default', expectedOutput: 'Default' }];
      const judgeResult = await executeBatchTestCases({ language: selectedLanguage, sourceCode: code, testCases: casesToRun });
      setExecutionResult(judgeResult);
      if (judgeResult?.allPassed) {
        await fetchComplexityAnalysis(judgeResult, code);
      }
    } catch (err) {
      setExecutionError(err.message || 'Execution failed.');
    } finally {
      setIsRunning(false);
    }
  };

  const handleSubmitCode = async () => {
    if (!activeQuestion) return;
    setIsSubmitting(true);
    setExecutionError('');

    try {
      let execRes = executionResult;
      if (!execRes) {
        execRes = await executeBatchTestCases({ language: selectedLanguage, sourceCode: code, testCases: activeQuestion.testCases || [] });
        setExecutionResult(execRes);
      }

      let compData = complexityAnalysisData;
      if (execRes?.allPassed && !compData) {
        compData = await fetchComplexityAnalysis(execRes, code);
      }

      const timeTakenMinutes = Math.max(1, Math.round((Date.now() - questionStartTime) / 60000));
      
      const FLASK_EVAL_URL = `${getBackendUrl()}/api/evaluate-code`;
      
      let evaluationData = null;
      try {
        const response = await fetch(FLASK_EVAL_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code, language: selectedLanguage, problemTitle: activeQuestion.title, problemDescription: activeQuestion.description,
            testResults: { passedCount: execRes?.passedCount || 0, total: execRes?.total || 0, allPassed: execRes?.allPassed || false }
          })
        });
        if (response.ok) evaluationData = await response.json();
      } catch (e) { console.warn('AI eval failed'); }

      if (!evaluationData) {
        evaluationData = {
          correctness: execRes?.allPassed || false,
          correctnessReasoning: "Code executed against test suite.",
          timeComplexity: compData?.timeComplexity || activeQuestion.optimalComplexity || "O(N)",
          spaceComplexity: compData?.spaceComplexity || "O(1)",
          missedEdgeCases: ["Check empty inputs", "Handle boundary conditions"],
          codeQualityScore: execRes?.allPassed ? 9 : 6,
          codeQualityReasoning: "Standard algorithmic approach."
        };
      }

      setAiCodeEvaluation(evaluationData);
      setShowEvalModal(true);

      const isOpt = compData?.comparedToOptimal?.isOptimal !== false;
      setDsaResult({
        questionId: activeQuestion.id,
        questionTitle: activeQuestion.title,
        difficulty: activeQuestion.difficulty,
        timeTakenMinutes,
        score: evaluationData.codeQualityScore * 10,
        executionTimeMs: compData?.executionTimeMs || 28,
        memoryUsedKb: compData?.memoryUsedKb || 14200,
        timeComplexity: compData?.timeComplexity || 'O(N)',
        spaceComplexity: compData?.spaceComplexity || 'O(1)',
        isOptimal: isOpt,
        optimalComplexity: activeQuestion.optimalComplexity || 'O(N) time, O(1) space',
        codeEfficiency: {
          isOptimal: isOpt,
          timeComplexity: compData?.timeComplexity || 'O(N)',
          spaceComplexity: compData?.spaceComplexity || 'O(1)',
          improvementHint: compData?.comparedToOptimal?.improvementHint || ''
        }
      });
    } catch (err) {
      setExecutionError('Submission error.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="space-y-4 py-2">
      <ProgressStepper />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-warmborder shadow-warm-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-mint-100 text-leaf-600 flex items-center justify-center font-bold shadow-warm-sm border border-warmborder">
            <Code2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-sm font-bold text-darkcharcoal-900 font-serif">
                {activeQuestion ? activeQuestion.title : 'DSA Technical Round'}
              </h1>
              <span className={`text-[10px] font-extrabold px-2.5 py-0.5 rounded-full border ${
                activeQuestion?.difficulty === 'Hard' ? 'bg-gold-100 text-gold-600 border-gold-200' : 'bg-mint-100 text-leaf-600 border-warmborder'
              }`}>
                {activeQuestion?.difficulty || 'Medium'}
              </span>
            </div>
            <span className="text-xs text-darkcharcoal-500">Target Recruiter: <strong className="text-leaf-600 font-serif">{companyName}</strong> DSA Assessment</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-mint-50 border border-warmborder font-mono text-xs font-bold text-leaf-600">
            <Clock className="w-3.5 h-3.5 text-leaf-600 animate-pulse" />
            <span>Timer: {formatTime(timeLeftSeconds)}</span>
          </div>

          <button
            onClick={handleRetakeDsa}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-mint-100 hover:bg-mint-200 text-leaf-700 font-bold text-xs border border-warmborder transition-colors shadow-warm-sm"
            title="Try Another Randomized Problem"
          >
            <RotateCcw className="w-3.5 h-3.5 text-leaf-600" />
            <span>Try New Problem</span>
          </button>

          <button
            onClick={handleSeedQuestions}
            disabled={seeding}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white hover:bg-mint-50 text-darkcharcoal-700 font-semibold text-xs border border-warmborder transition-colors disabled:opacity-50 shadow-warm-sm"
          >
            <Database className="w-3.5 h-3.5 text-leaf-600" />
            <span>{seeding ? 'Seeding...' : 'Seed DB'}</span>
          </button>

          <button
            onClick={() => setShowAiHint(!showAiHint)}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-bold border transition-all ${
              showAiHint
                ? 'bg-gold-100 text-gold-600 border-gold-200 shadow-warm-sm'
                : 'bg-white hover:bg-mint-50 text-darkcharcoal-700 border-warmborder'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-gold-500" />
            <span>{showAiHint ? 'Hide Hint' : 'AI Hint'}</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 min-h-[600px]">
        <div className="lg:col-span-5 flex flex-col bg-white rounded-3xl border border-warmborder overflow-hidden shadow-warm-sm">
          <div className="flex items-center justify-between border-b border-warmborder bg-mint-50 px-4 py-2.5">
            <div className="flex items-center gap-2 overflow-x-auto">
              {questions.map((q) => (
                <button
                  key={q.id}
                  onClick={() => { setActiveQuestion(q); setQuestionStartTime(Date.now()); setShowCompanyNote(false); }}
                  className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                    activeQuestion?.id === q.id
                      ? 'bg-leaf-500 text-white shadow-warm-sm'
                      : 'text-darkcharcoal-700 hover:text-darkcharcoal-900 hover:bg-mint-100'
                  }`}
                >
                  {q.title}
                </button>
              ))}
            </div>
          </div>

          <div className="p-5 overflow-y-auto space-y-5 text-xs text-darkcharcoal-900 flex-1">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warmborder pb-3 text-xs">
              <div className="flex items-center gap-2">
                <span className="font-semibold text-darkcharcoal-500">Topic:</span>
                <span className="px-2.5 py-0.5 rounded-full bg-mint-100 text-leaf-600 border border-warmborder font-mono font-bold text-[11px]">
                  {activeQuestion?.topic || activeQuestion?.topics?.[0] || 'Data Structures'}
                </span>
              </div>
              <div className="flex items-center gap-1 font-mono text-[11px] text-darkcharcoal-500">
                <Target className="w-3.5 h-3.5 text-leaf-600" />
                <span>Target: {activeQuestion?.expectedTimeMinutes || 15} mins</span>
              </div>
            </div>

            <div className="space-y-2">
              <h2 className="text-base font-bold font-serif text-darkcharcoal-900">Problem Description</h2>
              <p className="text-xs text-darkcharcoal-700 leading-relaxed font-sans whitespace-pre-line">
                {activeQuestion?.description}
              </p>
            </div>

            {activeQuestion?.examples?.map((ex, idx) => (
              <div key={idx} className="p-3.5 rounded-2xl bg-mint-50 border border-warmborder space-y-1.5 font-mono text-[11px]">
                <div className="font-bold text-leaf-600 font-serif text-xs">Example {idx + 1}:</div>
                <div><span className="text-darkcharcoal-500 font-semibold">Input: </span><code className="text-darkcharcoal-900">{ex.input}</code></div>
                <div><span className="text-darkcharcoal-500 font-semibold">Output: </span><code className="text-leaf-600 font-bold">{ex.output}</code></div>
                {ex.explanation && (
                  <div className="text-[10px] text-darkcharcoal-500 font-sans italic pt-1">{ex.explanation}</div>
                )}
              </div>
            ))}

            {showAiHint && (
              <div className="p-4 rounded-2xl bg-gold-50 border border-gold-200 text-xs space-y-2 shadow-warm-sm animate-fadeIn">
                <div className="flex items-center gap-2 font-bold text-gold-600 font-serif">
                  <Sparkles className="w-4 h-4 text-gold-500" />
                  <span>AI Algorithmic Hint</span>
                </div>
                <p className="text-darkcharcoal-700 leading-relaxed text-[11px]">
                  💡 Optimal complexity for this question is <code className="font-bold font-mono text-leaf-600">{activeQuestion?.optimalComplexity || 'O(N)'}</code>. Consider storing visited elements in a Hash Set or using a Two-Pointer technique to reduce nested loop checks.
                </p>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-leaf-600 font-serif flex items-center gap-1.5">
                  <Building2 className="w-4 h-4 text-leaf-600" />
                  {companyName} Interviewer Expectations
                </span>
                <button
                  onClick={() => setShowCompanyNote(!showCompanyNote)}
                  className="text-[10px] text-leaf-600 underline font-bold"
                >
                  {showCompanyNote ? 'Hide Insights' : 'View Expectations'}
                </button>
              </div>

              {showCompanyNote ? (
                <p className="text-xs text-darkcharcoal-700 leading-relaxed italic bg-white p-3 rounded-xl border border-warmborder">
                  "{activeQuestion?.companyNotes?.[companyName] || companyNotes}"
                </p>
              ) : (
                <p className="text-[11px] text-darkcharcoal-500 line-clamp-1">
                  {companyNotes}
                </p>
              )}
            </div>
          </div>
        </div>

        <div className="lg:col-span-7 flex flex-col bg-white rounded-3xl border border-warmborder overflow-hidden shadow-warm-sm">
          <div className="flex items-center justify-between border-b border-warmborder bg-mint-50 px-4 py-2.5">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-leaf-600" />
              <span className="text-xs font-bold font-serif text-darkcharcoal-900">Solution Code Editor</span>
            </div>

            <select
              value={selectedLanguage}
              onChange={(e) => handleLanguageChange(e.target.value)}
              className="px-3 py-1 rounded-full text-xs font-bold bg-white text-darkcharcoal-900 border border-warmborder focus:outline-none focus:border-leaf-500 shadow-warm-sm"
            >
              {isDsaHeavy ? (
                <>
                  <option value="javascript">JavaScript (ES6)</option>
                  <option value="python">Python 3</option>
                  <option value="cpp">C++ (GCC)</option>
                  <option value="java">Java 17</option>
                </>
              ) : (
                <>
                  <option value="sql">SQL Query</option>
                  <option value="python">Python Data Analysis</option>
                  <option value="javascript">JavaScript</option>
                </>
              )}
            </select>
          </div>

          <div className="flex-1 min-h-[360px] relative bg-[#1e1e1e]">
            <Editor
              height="360px"
              language={selectedLanguage === 'cpp' ? 'cpp' : selectedLanguage}
              theme="vs-dark"
              value={code}
              onChange={(val) => setCode(val || '')}
              options={{ fontSize: 13, minimap: { enabled: false }, scrollBeyondLastLine: false, lineNumbers: 'on', automaticLayout: true, padding: { top: 12, bottom: 12 } }}
            />
          </div>

          <div className="flex items-center justify-between border-t border-warmborder bg-white px-5 py-3">
            <div className="flex items-center gap-2 text-xs text-darkcharcoal-500 font-mono">
              <Terminal className="w-4 h-4 text-leaf-600" />
              <span>Judge0 Sandbox Engine</span>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={handleRunCode}
                disabled={isRunning || isSubmitting}
                className="flex items-center gap-2 px-5 py-2 rounded-full bg-mint-100 hover:bg-mint-200 text-leaf-700 text-xs font-bold border border-warmborder transition-colors disabled:opacity-50 shadow-warm-sm"
              >
                {isRunning ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5 text-leaf-600" />}
                <span>{isRunning ? 'Running...' : 'Run Code'}</span>
              </button>

              <button
                onClick={handleSubmitCode}
                disabled={isSubmitting || isRunning}
                className="flex items-center gap-2 px-6 py-2 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white text-xs font-extrabold shadow-warm-md hover:scale-[1.02] transition-all disabled:opacity-50"
              >
                {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
                <span>{isSubmitting ? 'Evaluating...' : 'Submit & Evaluate'}</span>
              </button>
            </div>
          </div>

          <TerminalPanel
            isRunning={isRunning}
            executionResult={executionResult}
            executionError={executionError}
            selectedLanguage={selectedLanguage}
            onRunCode={handleRunCode}
            onClear={handleClearTerminal}
          />

          {complexityAnalysisData && (
            <CodeComplexityPanel analysisData={complexityAnalysisData} />
          )}
        </div>
      </div>

      {showEvalModal && aiCodeEvaluation && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white border border-warmborder rounded-[32px] p-6 sm:p-8 max-w-2xl w-full space-y-6 shadow-warm-md animate-fadeIn text-darkcharcoal-900 overflow-y-auto max-h-[90vh]">
            <div className="flex items-center justify-between border-b border-warmborder pb-4">
              <div className="flex items-center gap-2">
                <Sparkles className="w-6 h-6 text-gold-500" />
                <div>
                  <h3 className="text-lg font-bold font-serif text-darkcharcoal-900">AI Code Evaluation & Diagnostic Breakdown</h3>
                  <span className="text-xs text-darkcharcoal-500">Problem: {activeQuestion?.title} ({selectedLanguage.toUpperCase()})</span>
                </div>
              </div>
              <span className={`px-3.5 py-1 rounded-full text-xs font-extrabold border ${
                aiCodeEvaluation.correctness
                  ? 'bg-mint-100 text-leaf-600 border-warmborder'
                  : 'bg-gold-100 text-gold-600 border-gold-200'
              }`}>
                {aiCodeEvaluation.correctness ? 'Correct Solution ✓' : 'Needs Revision ✗'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
              <div className="text-xs font-bold text-leaf-600 uppercase tracking-wider font-serif">Correctness Verification</div>
              <p className="text-xs text-darkcharcoal-700 leading-relaxed font-sans">{aiCodeEvaluation.correctnessReasoning}</p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                <div className="text-[10px] font-bold text-darkcharcoal-500 uppercase tracking-wider font-mono">Worst-Case Time Complexity</div>
                <div className="text-xl font-bold font-mono text-leaf-600">{aiCodeEvaluation.timeComplexity || 'O(N)'}</div>
              </div>
              <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                <div className="text-[10px] font-bold text-darkcharcoal-500 uppercase tracking-wider font-mono">Auxiliary Space Complexity</div>
                <div className="text-xl font-bold font-mono text-gold-600">{aiCodeEvaluation.spaceComplexity || 'O(1)'}</div>
              </div>
            </div>

            {aiCodeEvaluation.missedEdgeCases && aiCodeEvaluation.missedEdgeCases.length > 0 && (
              <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-2">
                <div className="text-xs font-bold text-gold-600 uppercase tracking-wider flex items-center gap-1.5 font-serif">
                  <AlertCircle className="w-4 h-4 text-gold-500" />
                  <span>Flagged Missed / Potential Edge Cases</span>
                </div>
                <ul className="space-y-1 text-xs text-darkcharcoal-700 list-disc list-inside">
                  {aiCodeEvaluation.missedEdgeCases.map((ec, idx) => <li key={idx}>{ec}</li>)}
                </ul>
              </div>
            )}

            <div className="p-4 rounded-2xl bg-mint-50 border border-warmborder flex items-center justify-between gap-4">
              <div className="space-y-1">
                <div className="text-xs font-bold text-gold-600 uppercase tracking-wider font-serif">Code Quality & Readability</div>
                <p className="text-xs text-darkcharcoal-700 leading-relaxed max-w-md">{aiCodeEvaluation.codeQualityReasoning}</p>
              </div>
              <div className="text-center px-4 py-2 rounded-2xl bg-white border border-warmborder shrink-0 shadow-warm-sm">
                <div className="text-2xl font-bold font-serif text-leaf-600">{aiCodeEvaluation.codeQualityScore}/10</div>
                <div className="text-[10px] text-darkcharcoal-500 uppercase font-mono">Rating</div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-4 border-t border-warmborder">
              <button
                onClick={handleRetakeDsa}
                className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-mint-100 hover:bg-mint-200 text-leaf-700 font-bold text-xs border border-warmborder transition-colors shadow-warm-sm"
              >
                <RotateCcw className="w-4 h-4 text-leaf-600" />
                <span>Try Another Coding Problem</span>
              </button>

              <button
                onClick={() => {
                  setShowEvalModal(false);
                  setRoundIndex(1);
                  navigate('/round/interview');
                }}
                className="flex items-center gap-2 px-6 py-2.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-all"
              >
                <span>Proceed to Stage 5 Technical AI Voice Interview</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
