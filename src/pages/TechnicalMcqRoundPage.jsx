import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { INITIAL_TECHNICAL_MCQ_QUESTIONS } from '../utils/seedTechnicalMcqQuestions';
import ProgressStepper from '../components/ProgressStepper';
import { 
  Code2, 
  Clock, 
  CheckCircle2, 
  XCircle, 
  HelpCircle, 
  ArrowRight, 
  RotateCcw, 
  Award, 
  BookOpen, 
  Layers, 
  Sparkles 
} from 'lucide-react';

import { shuffleArray } from '../utils/shuffle';

export default function TechnicalMcqRoundPage() {
  const navigate = useNavigate();
  const { selectedField, selectedCompany, setTechnicalMcqResult, technicalMcqResult: savedMcqResult } = usePrep();

  const companyName = selectedCompany?.name || 'Google';
  const fieldName = selectedField?.name || 'Software Development';
  const fieldId = selectedField?.fieldId || 'sde';

  const [questions, setQuestions] = useState([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState({});
  const [timeLeftSeconds, setTimeLeftSeconds] = useState(15 * 60); // 15 mins
  const [isFinished, setIsFinished] = useState(false);
  const [loading, setLoading] = useState(true);
  const [testResult, setTestResult] = useState(savedMcqResult);

  const timerRef = useRef(null);

  useEffect(() => {
    // Reset test state when track/field changes
    setCurrentIdx(0);
    setSelectedAnswers({});
    setIsFinished(false);
    setTestResult(null);

    const fetchMcqQuestions = async () => {
      setLoading(true);
      try {
        let fetched = INITIAL_TECHNICAL_MCQ_QUESTIONS;
        try {
          if (db) {
            const snap = await getDocs(collection(db, 'technicalMcqQuestions'));
            if (snap && !snap.empty) {
              fetched = snap.docs.map(d => ({ id: d.id, ...d.data() }));
            }
          }
        } catch (firestoreErr) {
          console.warn('[TechnicalMcqRoundPage] Firestore read notice, using initial dataset:', firestoreErr.message);
          fetched = INITIAL_TECHNICAL_MCQ_QUESTIONS;
        }

        // Filter questions by active fieldId or fallback to SDE
        let matched = fetched.filter(q => q.fieldId === fieldId || q.fieldId === 'sde');
        if (matched.length === 0) matched = INITIAL_TECHNICAL_MCQ_QUESTIONS;

        setQuestions(shuffleArray(matched));
      } catch (err) {
        console.warn('Tech MCQ error, fallback to filtered dataset:', err.message);
        const matchedFallback = INITIAL_TECHNICAL_MCQ_QUESTIONS.filter(q => q.fieldId === fieldId || q.fieldId === 'sde');
        setQuestions(shuffleArray(matchedFallback.length > 0 ? matchedFallback : INITIAL_TECHNICAL_MCQ_QUESTIONS));
      } finally {
        setLoading(false);
      }
    };

    fetchMcqQuestions();
  }, [fieldId, fieldName]);

  // Timer Countdown
  useEffect(() => {
    if (loading || isFinished || questions.length === 0) return;

    timerRef.current = setInterval(() => {
      setTimeLeftSeconds(prev => {
        if (prev <= 1) {
          clearInterval(timerRef.current);
          handleSubmitTest();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [loading, isFinished, questions]);

  const handleSelectOption = (questionId, optionIndex) => {
    if (isFinished) return;
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: optionIndex
    }));
  };

  const handleSubmitTest = () => {
    if (isFinished) return;
    if (timerRef.current) clearInterval(timerRef.current);

    let totalScore = 0;
    const topicScores = {};
    const topicCounts = {};
    const questionDetails = [];

    questions.forEach(q => {
      const selectedOption = selectedAnswers[q.id];
      const isCorrect = selectedOption === q.correctAnswerIndex;

      if (isCorrect) totalScore += 1;

      const topic = q.topic || 'General Technical';
      topicCounts[topic] = (topicCounts[topic] || 0) + 1;
      if (isCorrect) {
        topicScores[topic] = (topicScores[topic] || 0) + 1;
      } else if (!topicScores[topic]) {
        topicScores[topic] = 0;
      }

      questionDetails.push({
        id: q.id,
        question: q.question,
        topic,
        selectedOption,
        correctAnswerIndex: q.correctAnswerIndex,
        isCorrect,
        explanation: q.explanation
      });
    });

    const totalQuestions = questions.length;
    const percentage = Math.round((totalScore / Math.max(1, totalQuestions)) * 100);

    const topicBreakdown = {};
    Object.keys(topicCounts).forEach(t => {
      const correct = topicScores[t] || 0;
      const count = topicCounts[t];
      topicBreakdown[t] = Math.round((correct / count) * 100);
    });

    const resultPayload = {
      score: totalScore,
      totalQuestions,
      percentage,
      topicBreakdown,
      questionDetails,
      isPassed: percentage >= 60,
      timestamp: new Date().toISOString()
    };

    setTestResult(resultPayload);
    setTechnicalMcqResult(resultPayload);
    setIsFinished(true);
  };

  const currentQ = questions[currentIdx];
  const minutes = Math.floor(timeLeftSeconds / 60);
  const seconds = timeLeftSeconds % 60;
  const progressPercent = Math.round(((currentIdx + 1) / Math.max(1, questions.length)) * 100);

  if (loading) {
    return (
      <div className="space-y-6 py-6 max-w-5xl mx-auto text-center">
        <ProgressStepper />
        <div className="p-16 rounded-3xl bg-forest-800/80 border border-forest-600/40 text-earth-cream space-y-4 shadow-earthy">
          <Layers className="w-10 h-10 text-accent-gold animate-bounce mx-auto" />
          <h2 className="text-xl font-bold font-serif">Loading {fieldName} Technical MCQs...</h2>
          <p className="text-xs text-earth-cream/70">Assembling OOP, DBMS, OS & Computer Networks questions for Stage 3.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 py-2 max-w-6xl mx-auto">
      
      {/* 7-Stage Pipeline Navigation Stepper */}
      <ProgressStepper />

      {/* ACTIVE TEST INTERFACE */}
      {!isFinished ? (
        <div className="space-y-4">
          
          {/* Header Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-5 rounded-3xl bg-forest-800/80 border border-forest-600/40 shadow-earthy backdrop-blur-md">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold uppercase bg-accent-gold/20 text-accent-gold border border-accent-gold/30">
                  Stage 3 • Technical MCQs
                </span>
                <span className="text-xs text-earth-cream/70">• Domain: <strong className="text-accent-gold">{fieldName}</strong></span>
              </div>
              <h1 className="text-base font-bold font-serif text-earth-cream">
                {companyName} Technical Domain Screening (OOP, DBMS, OS & Networks)
              </h1>
            </div>

            {/* Countdown Timer */}
            <div className={`flex items-center gap-2 px-4 py-2 rounded-full border text-xs font-mono font-bold shrink-0 ${
              timeLeftSeconds < 180 ? 'bg-earth-terracotta/30 text-earth-terracotta border-earth-terracotta/50 animate-pulse' : 'bg-forest-900 text-accent-gold border-forest-600/40'
            }`}>
              <Clock className="w-4 h-4 text-accent-gold" />
              <span>{String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')} remaining</span>
            </div>
          </div>

          {/* Question Card */}
          <div className="rounded-3xl bg-forest-800/90 p-6 sm:p-8 border border-forest-600/40 space-y-6 shadow-earthy">
            
            <div className="flex items-center justify-between border-b border-forest-600/30 pb-4">
              <span className="text-xs font-bold text-sage-400 font-serif">
                Question {currentIdx + 1} of {questions.length} • <span className="text-earth-cream/80">{currentQ?.topic}</span>
              </span>
              <span className="text-xs font-mono text-accent-gold font-bold">
                {progressPercent}% Complete
              </span>
            </div>

            <h2 className="text-lg sm:text-xl font-bold font-serif text-earth-cream leading-relaxed">
              {currentQ?.question}
            </h2>

            {/* Options */}
            <div className="space-y-3">
              {currentQ?.options?.map((opt, idx) => {
                const isSelected = selectedAnswers[currentQ.id] === idx;
                return (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectOption(currentQ.id, idx)}
                    className={`w-full text-left p-4 rounded-2xl border text-sm font-medium transition-all flex items-center justify-between gap-3 ${
                      isSelected
                        ? 'bg-gradient-to-r from-accent-gold/25 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                        : 'bg-forest-900/80 border-forest-600/30 text-earth-cream/90 hover:bg-forest-700/60 hover:text-white'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono border ${
                        isSelected ? 'bg-accent-gold text-forest-900 border-accent-gold font-extrabold' : 'bg-forest-800 text-earth-cream/70 border-forest-600/40'
                      }`}>
                        {String.fromCharCode(65 + idx)}
                      </span>
                      <span>{opt}</span>
                    </span>
                    {isSelected && <CheckCircle2 className="w-5 h-5 text-accent-gold shrink-0" />}
                  </button>
                );
              })}
            </div>

            {/* Navigation & Submit Controls */}
            <div className="flex items-center justify-between pt-4 border-t border-forest-600/30">
              <button
                type="button"
                onClick={() => setCurrentIdx(prev => Math.max(0, prev - 1))}
                disabled={currentIdx === 0}
                className="px-4 py-2 rounded-xl bg-forest-900 border border-forest-600/40 text-earth-cream/70 hover:text-white disabled:opacity-40 text-xs font-semibold"
              >
                Previous
              </button>

              {currentIdx < questions.length - 1 ? (
                <button
                  type="button"
                  onClick={() => setCurrentIdx(prev => Math.min(questions.length - 1, prev + 1))}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-xs shadow-glow-gold hover:scale-[1.02] transition-transform"
                >
                  Next Question
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmitTest}
                  className="px-6 py-2.5 rounded-xl bg-emerald-600 text-white font-extrabold text-xs shadow-glow-gold hover:bg-emerald-500 transition-all flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Submit Technical MCQ Test</span>
                </button>
              )}
            </div>

          </div>

        </div>
      ) : (

        /* STAGE 3 RESULTS SCORECARD */
        <div className="space-y-6 animate-fadeIn">
          
          <div className="rounded-3xl bg-gradient-to-r from-forest-800 via-forest-900 to-earth-brown p-8 border border-forest-600/40 space-y-6 shadow-earthy text-earth-cream">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="space-y-2">
                <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-sage-500/25 border border-sage-400/30 text-accent-gold text-xs font-semibold">
                  <Award className="w-4 h-4" /> Stage 3 Completed • Technical MCQs
                </div>
                <h1 className="text-2xl sm:text-3xl font-bold font-serif">
                  {companyName} Technical Domain Screening Results
                </h1>
                <p className="text-xs text-earth-cream/70">
                  Evaluated across core computer science concepts: OOP, DBMS, Operating Systems, and Computer Networks.
                </p>
              </div>

              {/* Score Badge */}
              <div className="flex items-center gap-4 bg-forest-900/90 p-5 rounded-2xl border border-forest-600/40 shrink-0">
                <div className="text-center">
                  <div className="text-3xl font-black font-mono text-accent-gold">{testResult?.percentage}%</div>
                  <div className="text-[10px] font-semibold text-earth-cream/70">Overall Score</div>
                </div>
                <div className="h-10 w-px bg-forest-600/40"></div>
                <div className="space-y-1 text-xs font-semibold">
                  <div className={`px-3 py-1 rounded-full text-[11px] font-bold ${
                    testResult?.isPassed ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40' : 'bg-earth-terracotta/20 text-earth-terracotta border border-earth-terracotta/40'
                  }`}>
                    {testResult?.isPassed ? 'Passed Stage 3 Filter' : 'Needs Technical Review'}
                  </div>
                  <div className="text-[11px] text-earth-cream/70">Correct: {testResult?.score} / {testResult?.totalQuestions}</div>
                </div>
              </div>
            </div>

            {/* Topic Breakdown Grid */}
            <div className="space-y-3 pt-4 border-t border-forest-600/30">
              <h3 className="text-xs font-bold font-serif text-accent-gold">Topic Accuracy Breakdown:</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {testResult?.topicBreakdown && Object.entries(testResult.topicBreakdown).map(([topic, pct]) => (
                  <div key={topic} className="p-3 rounded-xl bg-forest-900/80 border border-forest-600/30 space-y-1">
                    <span className="text-[11px] font-semibold text-earth-cream/80 block truncate">{topic}</span>
                    <div className="flex items-center justify-between text-xs font-bold font-mono">
                      <span className={pct >= 60 ? 'text-sage-400' : 'text-earth-terracotta'}>{pct}%</span>
                      <span className="text-[10px] text-earth-cream/50">{pct >= 60 ? 'Good' : 'Review'}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Advance to Stage 4 CTA */}
            <div className="flex items-center justify-between pt-6 border-t border-forest-600/30">
              <button
                type="button"
                onClick={() => setIsFinished(false)}
                className="px-5 py-2.5 rounded-full bg-forest-900 text-earth-cream/80 hover:text-white border border-forest-600/40 text-xs font-bold transition-colors flex items-center gap-2"
              >
                <RotateCcw className="w-4 h-4 text-accent-gold" />
                <span>Re-run Stage 3 MCQs</span>
              </button>

              <button
                type="button"
                onClick={() => navigate('/round/dsa')}
                className="px-6 py-3 rounded-full bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold text-xs shadow-glow-gold hover:scale-[1.02] transition-transform flex items-center gap-2"
              >
                <span>Proceed to Stage 4: Coding Round</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>

          </div>

        </div>
      )}

    </div>
  );
}
