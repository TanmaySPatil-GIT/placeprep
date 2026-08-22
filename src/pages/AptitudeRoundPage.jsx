import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import ProgressStepper from '../components/ProgressStepper';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { INITIAL_APTITUDE_QUESTIONS } from '../utils/seedAptitudeQuestions';
import { 
  Brain, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  AlertTriangle, 
  ArrowRight, 
  HelpCircle, 
  BookOpen, 
  Building2, 
  ChevronRight,
  Sparkles,
  RotateCcw
} from 'lucide-react';

import { shuffleArray } from '../utils/shuffle';

// LocalStorage Recent Question IDs tracker (avoids immediate repeats across back-to-back sessions)
const RECENT_Q_STORAGE_KEY = 'placeprep_recent_aptitude_qids';

const getRecentQuestionIds = () => {
  try {
    const saved = localStorage.getItem(RECENT_Q_STORAGE_KEY);
    return saved ? JSON.parse(saved) : [];
  } catch (e) {
    return [];
  }
};

const saveRecentQuestionIds = (newQIds) => {
  try {
    const current = getRecentQuestionIds();
    const combined = Array.from(new Set([...newQIds, ...current])).slice(0, 30);
    localStorage.setItem(RECENT_Q_STORAGE_KEY, JSON.stringify(combined));
  } catch (e) {
    console.warn('Could not save recent question IDs:', e);
  }
};

export default function AptitudeRoundPage() {
  const navigate = useNavigate();
  const { authUser } = useAuth();
  const { selectedCompany, selectedField, setAptitudeResult, aptitudeResult: savedAptitudeResult, difficultyLevel } = usePrep();

  const companyName = selectedCompany?.name || 'TCS';
  const fieldId = selectedField?.fieldId || 'sde';
  const fieldName = selectedField?.name || 'Software Development';

  const aptitudeProfile = selectedCompany?.aptitudeProfile || {
    hasAptitudeRound: true,
    weightage: 'primary',
    sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
    questionCountPerSection: 3,
    timeLimitMinutes: 15,
    notes: 'TCS NQT-style cognitive & technical screen'
  };

  const hasAptitude = true;

  // Test state
  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({}); // { qId: optionIndex }
  const [timeLeftSeconds, setTimeLeftSeconds] = useState((aptitudeProfile.timeLimitMinutes || 15) * 60);
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(savedAptitudeResult);

  const timerRef = useRef(null);

  // Core randomized question loader function
  const fetchAptitudeQuestions = async () => {
    setLoading(true);
    try {
      let fetched = INITIAL_APTITUDE_QUESTIONS;
      try {
        if (db) {
          const snap = await getDocs(collection(db, 'aptitudeQuestions'));
          if (snap && !snap.empty) {
            fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
          }
        }
      } catch (firestoreErr) {
        console.warn('[AptitudeRoundPage] Firestore read notice, using initial dataset:', firestoreErr.message);
        fetched = INITIAL_APTITUDE_QUESTIONS;
      }

      const targetSections = aptitudeProfile.sections || ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'];
      const perSection = aptitudeProfile.questionCountPerSection || 3;
      const currentDiff = difficultyLevel || 'Medium';
      const recentIds = getRecentQuestionIds();

      let assembled = [];
      let newlySelectedIds = [];

      targetSections.forEach(sec => {
        let matchedSec = fetched.filter(q => q.section?.toLowerCase() === sec.toLowerCase() || q.section?.includes(sec));
        
        if (matchedSec.length === 0) {
          matchedSec = fetched;
        }

        // Prioritize fieldId matched questions if present
        const fieldMatched = matchedSec.filter(q => q.fieldId === fieldId || (Array.isArray(q.fieldIds) && q.fieldIds.includes(fieldId)));
        if (fieldMatched.length > 0) {
          matchedSec = fieldMatched;
        }

        // Filter out recently seen question IDs if enough unseen questions exist in this section
        const unseenSec = matchedSec.filter(q => !recentIds.includes(q.id));
        const candidatePool = unseenSec.length >= perSection ? unseenSec : matchedSec;

        // Bucket by difficulty match
        const exactDiff = candidatePool.filter(q => (q.difficulty || 'Medium') === currentDiff);
        const otherDiff = candidatePool.filter(q => (q.difficulty || 'Medium') !== currentDiff);

        // Fisher-Yates Shuffle both difficulty buckets
        const shuffledExact = shuffleArray(exactDiff);
        const shuffledOther = shuffleArray(otherDiff);

        // Prioritize exact difficulty, fill remaining from other difficulties
        const combinedCandidates = [...shuffledExact, ...shuffledOther];

        // Select perSection questions for this section
        const sectionSubset = combinedCandidates.slice(0, perSection);
        
        assembled = [...assembled, ...sectionSubset];
        sectionSubset.forEach(q => newlySelectedIds.push(q.id));
      });

      // Fallback if assembled is empty
      if (assembled.length === 0) {
        assembled = shuffleArray(INITIAL_APTITUDE_QUESTIONS).slice(0, 12);
        assembled.forEach(q => newlySelectedIds.push(q.id));
      }

      // Save newly selected IDs to recent history
      saveRecentQuestionIds(newlySelectedIds);
      setQuestions(assembled);
    } catch (err) {
      console.warn('Aptitude questions fetch error, using initial dataset:', err.message);
      const fallback = shuffleArray(INITIAL_APTITUDE_QUESTIONS).slice(0, 12);
      setQuestions(fallback);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Questions on track/company/difficulty change
  useEffect(() => {
    if (!hasAptitude) return;

    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsFinished(false);
    setTestResult(null);
    setTimeLeftSeconds((aptitudeProfile.timeLimitMinutes || 15) * 60);

    fetchAptitudeQuestions();
  }, [companyName, hasAptitude, difficultyLevel, fieldId, fieldName]);

  // Retake / Try New Questions Handler
  const handleRetakeTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsFinished(false);
    setTestResult(null);
    setAptitudeResult(null);
    setTimeLeftSeconds((aptitudeProfile.timeLimitMinutes || 15) * 60);
    fetchAptitudeQuestions();
  };

  // Timer countdown
  useEffect(() => {
    if (!hasAptitude || isFinished || loading) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleAutoSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [hasAptitude, isFinished, loading]);

  const handleSelectOption = (questionId, optionIdx) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIdx
    }));
  };

  const handleNext = () => {
    if (currentIdx < questions.length - 1) {
      setCurrentIdx(prev => prev + 1);
    } else {
      handleSubmitTest();
    }
  };

  const handleAutoSubmit = () => {
    handleSubmitTest();
  };

  const handleSubmitTest = () => {
    if (timerRef.current) clearInterval(timerRef.current);

    // Calculate section scores
    const sectionStats = {};
    const incorrectList = [];

    questions.forEach(q => {
      const sec = q.section || 'General';
      if (!sectionStats[sec]) {
        sectionStats[sec] = { total: 0, correct: 0 };
      }
      sectionStats[sec].total += 1;

      const userAns = selectedAnswers[q.id];
      const isCorrect = userAns === q.correctAnswerIndex;

      if (isCorrect) {
        sectionStats[sec].correct += 1;
      } else {
        incorrectList.push({
          ...q,
          userAnswerIndex: userAns !== undefined ? userAns : -1
        });
      }
    });

    const sectionScores = {};
    let grandTotal = 0;
    let grandCorrect = 0;

    Object.keys(sectionStats).forEach(sec => {
      const { total, correct } = sectionStats[sec];
      grandTotal += total;
      grandCorrect += correct;
      sectionScores[sec] = Math.round((correct / Math.max(1, total)) * 100);
    });

    const overallScore = Math.round((grandCorrect / Math.max(1, grandTotal)) * 100);
    const cutoffPercentage = aptitudeProfile.weightage === 'primary' ? 60 : 50;
    const isPassed = overallScore >= cutoffPercentage;

    // Identify weakest section
    let weakestSection = Object.keys(sectionScores)[0] || 'Quantitative';
    let minScore = 100;
    Object.keys(sectionScores).forEach(sec => {
      if (sectionScores[sec] < minScore) {
        minScore = sectionScores[sec];
        weakestSection = sec;
      }
    });

    const resultPayload = {
      companyName,
      overallScore,
      grandTotal,
      grandCorrect,
      cutoffPercentage,
      isPassed,
      sectionScores,
      weakestSection,
      incorrectQuestions: incorrectList,
      timestamp: new Date().toISOString()
    };

    setTestResult(resultPayload);
    setAptitudeResult(resultPayload);
    setIsFinished(true);
  };

  // If company skips aptitude, show clear skip notice card
  if (!hasAptitude) {
    return (
      <div className="space-y-6 py-2 max-w-4xl mx-auto">
        <ProgressStepper />

        <div className="rounded-3xl p-8 bg-white border border-warmborder text-center space-y-5 shadow-warm-sm">
          <div className="w-16 h-16 rounded-full bg-mint-100 border border-warmborder text-leaf-600 flex items-center justify-center mx-auto">
            <Brain className="w-8 h-8 text-leaf-600" />
          </div>

          <div className="space-y-2">
            <span className="px-3.5 py-1 rounded-full text-xs font-bold bg-gold-100 text-gold-600 border border-gold-200">
              No Aptitude Filter
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-darkcharcoal-900">
              {companyName} Skips Standalone Aptitude Round
            </h1>
            <p className="text-xs sm:text-sm text-darkcharcoal-500 max-w-lg mx-auto leading-relaxed">
              {aptitudeProfile.notes || `${companyName} evaluates candidate technical abilities directly through DSA coding and system architecture interviews.`}
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={() => navigate('/round/dsa')}
              className="inline-flex items-center gap-2 px-8 py-3.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-all"
            >
              <span>Proceed Directly to DSA Coding Round</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Active Question item
  const currentQuestion = questions[currentIdx];
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const progressPercent = Math.round(((currentIdx + 1) / Math.max(1, questions.length)) * 100);

  // Prepare chart data for results view
  const chartData = testResult?.sectionScores
    ? Object.keys(testResult.sectionScores).map(sec => ({
        section: sec,
        Score: testResult.sectionScores[sec]
      }))
    : [];

  return (
    <div className="space-y-6 py-2 max-w-6xl mx-auto">
      
      {/* Dynamic Progress Stepper */}
      <ProgressStepper />

      {/* BEFORE FINISHING: ACTIVE TEST INTERFACE */}
      {!isFinished && (
        <div className="space-y-4">
          
          {/* Top Bar: Timer, Current Section & Progress */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-white border border-warmborder shadow-warm-sm">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-mint-100 border border-warmborder text-leaf-600">
                  Section: {currentQuestion?.section || 'Quantitative'}
                </span>
                <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-gold-100 text-gold-600 border border-gold-200">
                  {difficultyLevel || 'Medium'} Complexity ({difficultyLevel === 'Easy' ? 'Basic Formulas' : difficultyLevel === 'Hard' ? 'Multi-Step Reasoning' : 'Standard Logic'})
                </span>
                <span className="text-xs text-darkcharcoal-500">• Topic: {currentQuestion?.topicTag}</span>
              </div>
              <h2 className="text-sm font-bold font-serif text-darkcharcoal-900">
                {companyName} Aptitude Assessment ({aptitudeProfile.weightage?.toUpperCase()} FILTER)
              </h2>
            </div>

            {/* Countdown Timer Badge */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold shrink-0 ${
              timeLeftSeconds < 120 ? 'bg-[#F5E6E6] text-[#A83232] border-[#F0C2C2] animate-pulse' : 'bg-mint-50 text-leaf-600 border-warmborder'
            }`}>
              <Clock className="w-4 h-4 text-leaf-600" />
              <span>Time Left: {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}</span>
            </div>
          </div>

          {/* Question Progress Bar */}
          <div className="space-y-1">
            <div className="flex items-center justify-between text-xs font-bold text-darkcharcoal-700">
              <span>Question {currentIdx + 1} of {questions.length}</span>
              <span>{progressPercent}% Completed</span>
            </div>
            <div className="w-full bg-mint-100 h-2 rounded-full overflow-hidden border border-warmborder">
              <div 
                className="bg-leaf-500 h-full transition-all duration-300 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          {/* Main Question Card */}
          {loading ? (
            <div className="p-12 text-center text-darkcharcoal-500 font-serif">Loading Randomized Aptitude Questions...</div>
          ) : currentQuestion ? (
            <div className="rounded-3xl bg-white p-6 sm:p-8 border border-warmborder space-y-6 shadow-warm-sm">
              
              <div className="space-y-2">
                <span className="text-xs text-leaf-600 font-bold font-mono">Q{currentIdx + 1}.</span>
                <p className="text-base sm:text-lg font-bold font-serif text-darkcharcoal-900 leading-relaxed whitespace-pre-line">
                  {currentQuestion.question}
                </p>
              </div>

              {/* 4 MCQ Options */}
              <div className="grid grid-cols-1 gap-3">
                {currentQuestion.options?.map((opt, optIdx) => {
                  const isSelected = selectedAnswers[currentQuestion.id] === optIdx;
                  return (
                    <button
                      key={optIdx}
                      onClick={() => handleSelectOption(currentQuestion.id, optIdx)}
                      className={`w-full p-4 rounded-2xl border text-left text-xs sm:text-sm font-semibold transition-all flex items-center justify-between gap-3 ${
                        isSelected
                          ? 'bg-mint-100 border-leaf-500 text-leaf-700 shadow-warm-sm'
                          : 'bg-mint-50/50 border-warmborder text-darkcharcoal-900 hover:border-leaf-300 hover:bg-mint-50'
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <span className={`w-7 h-7 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${
                          isSelected ? 'bg-leaf-500 text-white' : 'bg-white text-darkcharcoal-700 border border-warmborder'
                        }`}>
                          {String.fromCharCode(65 + optIdx)}
                        </span>
                        <span>{opt}</span>
                      </div>
                      {isSelected && <CheckCircle2 className="w-5 h-5 text-leaf-600 shrink-0" />}
                    </button>
                  );
                })}
              </div>

              {/* Navigation Controls */}
              <div className="flex items-center justify-between pt-4 border-t border-warmborder">
                <span className="text-xs text-darkcharcoal-500 italic">
                  Note: Real test conditions enforced (No going back to previous questions).
                </span>

                <button
                  onClick={handleNext}
                  className="flex items-center gap-2 px-8 py-3 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-sm hover:scale-[1.02] transition-all"
                >
                  <span>{currentIdx < questions.length - 1 ? 'Next Question' : 'Submit Aptitude Test'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

            </div>
          ) : null}

        </div>
      )}

      {/* AFTER FINISHING: RESULTS & INCORRECT EXPLANATIONS SUMMARY */}
      {isFinished && testResult && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top Result Banner */}
          <div className={`p-8 rounded-3xl border shadow-warm-sm flex flex-col md:flex-row items-center justify-between gap-6 ${
            testResult.isPassed 
              ? 'bg-gradient-to-r from-mint-100 via-white to-mint-50 border-warmborder'
              : 'bg-gradient-to-r from-[#FDF3F3] via-white to-[#F9EAEB] border-[#F0C2C2]'
          }`}>
            <div className="space-y-2 text-center md:text-left">
              <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full text-xs font-bold border bg-white text-darkcharcoal-900 shadow-warm-sm">
                {testResult.isPassed ? (
                  <span className="text-leaf-600 flex items-center gap-1.5"><CheckCircle2 className="w-4 h-4" /> Cutoff Met ({testResult.cutoffPercentage}% Required)</span>
                ) : (
                  <span className="text-[#D32F2F] flex items-center gap-1.5"><XCircle className="w-4 h-4" /> Below Cutoff ({testResult.cutoffPercentage}% Required)</span>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl font-bold font-serif text-darkcharcoal-900">
                {testResult.isPassed ? 'Aptitude Round Cleared!' : 'Aptitude Round Needs Review'}
              </h1>
              <p className="text-xs text-darkcharcoal-500">
                You scored <strong className="text-leaf-600">{testResult.overallScore}%</strong> ({testResult.grandCorrect} out of {testResult.grandTotal} questions correct).
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={handleRetakeTest}
                className="flex items-center gap-2 px-6 py-3.5 rounded-full bg-white hover:bg-mint-50 border border-warmborder text-darkcharcoal-900 font-bold text-xs shadow-warm-sm transition-all"
              >
                <RotateCcw className="w-4 h-4 text-leaf-600" />
                <span>Retake Test (New Question Set)</span>
              </button>

              <button
                onClick={() => navigate('/round/dsa')}
                className="flex items-center gap-2 px-8 py-3.5 rounded-full bg-leaf-500 hover:bg-leaf-600 text-white font-extrabold text-xs shadow-warm-md hover:scale-[1.02] transition-all"
              >
                <span>Proceed to Round 2 (DSA Coding)</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Section Score Breakdown Bar Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Chart (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-white p-6 border border-warmborder space-y-4 shadow-warm-sm">
              <h3 className="text-base font-bold font-serif text-darkcharcoal-900 flex items-center gap-2">
                <Brain className="w-5 h-5 text-leaf-600" />
                <span>Score Breakdown per Section</span>
              </h3>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chartData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E2CE" />
                    <XAxis dataKey="section" stroke="#4C5E47" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#4C5E47" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D6E2CE', borderRadius: '12px', fontSize: '12px', color: '#1F2E1A' }}
                    />
                    <Bar dataKey="Score" fill="#5B8C3E" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Section Summary Cards (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-white p-6 border border-warmborder space-y-4 shadow-warm-sm">
              <h3 className="text-base font-bold font-serif text-darkcharcoal-900 flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-gold-500" />
                <span>Section Accuracy Summary</span>
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {Object.keys(testResult.sectionScores || {}).map((sec, idx) => {
                  const score = testResult.sectionScores[sec];
                  return (
                    <div key={idx} className="p-4 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                      <div className="text-xs text-darkcharcoal-500 font-semibold">{sec}</div>
                      <div className={`text-xl font-bold font-serif ${score >= 60 ? 'text-leaf-600' : 'text-gold-600'}`}>
                        {score}% Accuracy
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="p-4 rounded-2xl bg-mint-100 border border-warmborder text-xs text-darkcharcoal-900">
                <strong className="text-gold-600">Weakest Section Identified:</strong> {testResult.weakestSection} ({testResult.sectionScores[testResult.weakestSection]}%). Focus additional practice on this area before taking real campus drives for {companyName}.
              </div>
            </div>

          </div>

          {/* Detailed Incorrect Questions Explanations */}
          {testResult.incorrectQuestions?.length > 0 && (
            <div className="rounded-3xl bg-white p-6 sm:p-8 space-y-4 border border-warmborder shadow-warm-sm">
              <div className="space-y-1">
                <h3 className="text-lg font-bold font-serif text-darkcharcoal-900 flex items-center gap-2">
                  <HelpCircle className="w-5 h-5 text-gold-500" />
                  <span>Review Missed Questions & Explanations ({testResult.incorrectQuestions.length})</span>
                </h3>
                <p className="text-xs text-darkcharcoal-500">
                  Detailed step-by-step solutions to strengthen your problem solving methodology.
                </p>
              </div>

              <div className="space-y-4 pt-2">
                {testResult.incorrectQuestions.map((q, idx) => (
                  <div key={idx} className="p-5 rounded-2xl bg-mint-50 border border-warmborder space-y-3">
                    
                    <div className="flex items-center justify-between text-xs">
                      <span className="px-2.5 py-0.5 rounded-full bg-gold-100 text-gold-600 border border-gold-200 font-bold">
                        {q.section} • {q.topicTag}
                      </span>
                      <span className="text-darkcharcoal-500">Question #{idx + 1}</span>
                    </div>

                    <p className="text-sm font-bold font-serif text-darkcharcoal-900 leading-relaxed">
                      "{q.question}"
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                      <div className="p-3 rounded-xl bg-[#FDF3F3] border border-[#F0C2C2] text-darkcharcoal-900">
                        <span className="font-bold text-[#D32F2F]">Your Choice: </span>
                        {q.userAnswerIndex >= 0 ? q.options[q.userAnswerIndex] : 'Not Answered'}
                      </div>

                      <div className="p-3 rounded-xl bg-mint-100 border border-warmborder text-darkcharcoal-900">
                        <span className="font-bold text-leaf-600">Correct Answer: </span>
                        {q.options[q.correctAnswerIndex]}
                      </div>
                    </div>

                    <div className="p-4 rounded-xl bg-white border border-warmborder text-xs text-darkcharcoal-900 space-y-1 shadow-warm-sm">
                      <div className="font-bold text-gold-600 uppercase tracking-wider text-[10px]">
                        Solution & Explanation:
                      </div>
                      <p className="leading-relaxed">{q.explanation}</p>
                    </div>

                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      )}

    </div>
  );
}
