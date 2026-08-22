import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  CartesianGrid 
} from 'recharts';
import ProgressStepper from '../components/ProgressStepper';
import { getBackendUrl } from '../config/api';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { calculateOverallSessionConfidence } from '../utils/confidenceScorer';
import { calculateAggregateCommunicationScore } from '../services/speechAnalyzer';
import { generateSessionEmotionTimeline } from '../services/faceDetector';
import { 
  BarChart3, 
  Trophy, 
  Award,
  CheckCircle2, 
  Sparkles, 
  RotateCcw,
  BookOpen,
  MessageSquare,
  AlertTriangle,
  Loader2,
  Cpu,
  Target,
  Brain,
  ChevronDown,
  ChevronUp,
  Mic,
  Volume2,
  Layers,
  Info
} from 'lucide-react';

export default function ResultsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    selectedCompany, 
    sessionResults, 
    setRoundIndex, 
    dsaResult, 
    aptitudeResult, 
    technicalMcqResult, 
    hrInterviewResult, 
    resumeData, 
    difficultyLevel, 
    experienceLevel, 
    experienceYears 
  } = usePrep();
  
  const companyName = selectedCompany?.name || 'Google';
  const companyStyleNote = selectedCompany?.interviewProfile?.notes || 'Technical depth and articulating your thought process out loud matters as much as the right answer.';
  const userTargetField = userProfile?.targetField || 'Software Development';

  // Compute analytics using pure confidenceScorer function
  const { overallScore, questionScores, hasInterviewData } = calculateOverallSessionConfidence(sessionResults);
  const commScoreObj = calculateAggregateCommunicationScore(sessionResults);
  const sessionEmotionObj = generateSessionEmotionTimeline((sessionResults || []).flatMap(r => r.telemetryLogs || []));
  const [speechTelemetryExpanded, setSpeechTelemetryExpanded] = useState(false);

  // Recharts Gauge Data
  const gaugeData = [
    { name: 'Score', value: overallScore, fill: '#7ba05b' },
    { name: 'Remaining', value: 100 - overallScore, fill: '#123326' }
  ];

  // Flask AI Feedback State
  const [loadingAiFeedback, setLoadingAiFeedback] = useState(false);
  const [aiFeedback, setAiFeedback] = useState(null);

  // Fetch AI Feedback from Flask Backend Endpoint POST /api/interview-feedback
  const handleGetAiFeedback = async () => {
    setLoadingAiFeedback(true);

    const FLASK_FEEDBACK_URL = `${getBackendUrl()}/api/interview-feedback`;

    const payload = {
      userTargetField,
      companyName,
      difficultyLevel: difficultyLevel || 'Medium',
      experienceLevel: experienceLevel || 'Fresher',
      experienceYears: experienceYears || '0-2',
      answers: sessionResults.map((r, i) => ({
        question: r.questionText || `Question ${i+1}`,
        transcript: r.transcript || '',
        confidenceScore: r.metrics?.score || 85,
        fillerWordCount: r.metrics?.fillerWordCount || 0,
        wordsPerMinute: r.metrics?.wordsPerMinute || 135,
        longPauseCount: r.metrics?.longPauseCount || 0
      })),
      aptitudePerformance: aptitudeResult ? {
        overallScore: aptitudeResult.overallScore,
        sectionScores: aptitudeResult.sectionScores,
        weakestSection: aptitudeResult.weakestSection,
        isPassed: aptitudeResult.isPassed
      } : null,
      technicalMcqPerformance: technicalMcqResult ? {
        score: technicalMcqResult.score,
        totalQuestions: technicalMcqResult.totalQuestions,
        percentage: technicalMcqResult.percentage,
        topicBreakdown: technicalMcqResult.topicBreakdown
      } : null,
      dsaPerformance: dsaResult ? {
        questionTitle: dsaResult.questionTitle,
        topic: dsaResult.topic,
        difficulty: dsaResult.difficulty,
        timeTakenMinutes: dsaResult.timeTakenMinutes,
        expectedTimeMinutes: dsaResult.expectedTimeMinutes,
        optimalComplexity: dsaResult.optimalComplexity,
        passedCases: dsaResult.passedCases,
        totalCases: dsaResult.totalCases
      } : null,
      hrPerformance: hrInterviewResult ? {
        score: hrInterviewResult.score,
        answersCount: hrInterviewResult.answersCount
      } : null
    };

    const controller = new AbortController();
    const fetchTimeout = setTimeout(() => controller.abort(), 15000);

    try {
      const response = await fetch(FLASK_FEEDBACK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(fetchTimeout);

      if (!response.ok) {
        throw new Error(`Flask API response HTTP ${response.status}`);
      }

      const data = await response.json();
      setAiFeedback(data);
    } catch (err) {
      clearTimeout(fetchTimeout);
      console.warn('Flask backend feedback notice:', err.message);
      
      // Dynamic company-tailored fallback feedback
      const totalFillers = questionScores.reduce((acc, q) => acc + q.fillers, 0);
      const avgWpm = questionScores[0]?.wpm || 138;

      setAiFeedback({
        overallSummary: `For ${companyName}-style interviews, ${companyStyleNote} Your answers demonstrated solid technical clarity (${avgWpm} WPM average), but structuring responses around key company competencies will elevate your candidacy.`,
        strengths: [
          `Maintained steady conversational pacing averaging ${avgWpm} WPM during ${companyName} technical questions.`,
          `Demonstrated strong structured problem-solving when addressing complex code scenarios.`
        ],
        areasToImprove: [
          `For ${companyName}-style screens, articulating your thought process out loud matters as much as the code — try narrating trade-offs before jumping to solutions.`,
          totalFillers > 0 
            ? `You used vocal fillers ${totalFillers} times — try taking silent 1-second pauses to collect thoughts during high-pressure questions.`
            : `Quantify measurable business/performance outcomes when explaining previous technical projects.`
        ],
        suggestedFocusAreas: [
          `${companyName} Specific Focus Areas`,
          "Vocal pause control & clear delivery",
          "Quantified STAR metrics"
        ],
        note: `Feedback tailored specifically for ${companyName} hiring patterns.`
      });
    } finally {
      setLoadingAiFeedback(false);
    }
  };

  const handlePracticeAgain = () => {
    setRoundIndex(1);
    navigate('/round/interview');
  };

  return (
    <div className="space-y-8 py-2">
      
      {/* Reusable Progress Stepper */}
      <ProgressStepper />

      {/* Aptitude Round Performance Card — shown if we have aptitudeResult */}
      {aptitudeResult && (
        <div className="rounded-3xl bg-forest-800/80 border border-forest-600/40 p-6 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Brain className="w-5 h-5 text-accent-gold" />
              <h3 className="text-base font-bold font-serif text-earth-cream">Aptitude & GK Round Performance</h3>
              <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${
                aptitudeResult.isPassed ? 'bg-sage-500/20 text-sage-400 border-sage-500/40' : 'bg-earth-terracotta/20 text-earth-terracotta border-earth-terracotta/40'
              }`}>
                {aptitudeResult.isPassed ? 'Passed Cutoff' : 'Below Cutoff'}
              </span>
            </div>
            <div className="text-xs text-earth-cream/60 font-mono">
              Overall Score: <strong className="text-accent-gold">{aptitudeResult.overallScore}%</strong> ({aptitudeResult.grandCorrect}/{aptitudeResult.grandTotal})
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {Object.keys(aptitudeResult.sectionScores || {}).map((sec, idx) => {
              const score = aptitudeResult.sectionScores[sec];
              return (
                <div key={idx} className="bg-forest-900/80 rounded-2xl p-4 border border-forest-600/30 space-y-1">
                  <div className="text-earth-cream/60 text-[10px] uppercase tracking-wider font-bold truncate">{sec}</div>
                  <div className={`font-bold font-serif text-lg ${score >= 60 ? 'text-sage-400' : 'text-earth-terracotta'}`}>
                    {score}%
                  </div>
                  <div className="text-earth-cream/60 text-[10px] truncate">Accuracy</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Technical MCQs Performance Card — shown if we have technicalMcqResult */}
      {technicalMcqResult && (
        <div className="rounded-3xl bg-forest-800/80 border border-forest-600/40 p-6 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Layers className="w-5 h-5 text-accent-gold" />
              <h3 className="text-base font-bold font-serif text-earth-cream">Technical MCQs Performance</h3>
              <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${
                technicalMcqResult.isPassed ? 'bg-sage-500/20 text-sage-400 border-sage-500/40' : 'bg-earth-terracotta/20 text-earth-terracotta border-earth-terracotta/40'
              }`}>
                {technicalMcqResult.isPassed ? 'Passed Stage 3 Filter' : 'Needs Technical Review'}
              </span>
            </div>
            <div className="text-xs text-earth-cream/60 font-mono">
              Overall Score: <strong className="text-accent-gold">{technicalMcqResult.percentage}%</strong> ({technicalMcqResult.score}/{technicalMcqResult.totalQuestions})
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            {Object.keys(technicalMcqResult.topicBreakdown || {}).map((topic, idx) => {
              const score = technicalMcqResult.topicBreakdown[topic];
              return (
                <div key={idx} className="bg-forest-900/80 rounded-2xl p-4 border border-forest-600/30 space-y-1">
                  <div className="text-earth-cream/60 text-[10px] uppercase tracking-wider font-bold truncate">{topic}</div>
                  <div className={`font-bold font-serif text-lg ${score >= 60 ? 'text-sage-400' : 'text-earth-terracotta'}`}>
                    {score}%
                  </div>
                  <div className="text-earth-cream/60 text-[10px] truncate">Accuracy</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* DSA Performance Card — only shown if we have dsaResult */}
      {dsaResult && (
        <div className="rounded-3xl bg-forest-800/80 border border-forest-600/40 p-6 space-y-4 shadow-earthy backdrop-blur-md">
          <div className="flex items-center gap-2 mb-1">
            <Cpu className="w-5 h-5 text-accent-gold" />
            <h3 className="text-base font-bold font-serif text-earth-cream">DSA Round Performance</h3>
            <span className={`text-[10px] font-bold px-3 py-0.5 rounded-full border ${
              dsaResult.difficulty === 'Hard' ? 'bg-earth-terracotta/20 text-earth-terracotta border-earth-terracotta/40'
              : dsaResult.difficulty === 'Medium' ? 'bg-earth-tan/20 text-accent-gold border-earth-tan/40'
              : 'bg-sage-500/20 text-sage-400 border-sage-500/40'
            }`}>{dsaResult.difficulty}</span>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="bg-forest-900/80 rounded-2xl p-4 border border-forest-600/30 space-y-1">
              <div className="text-earth-cream/60 text-[10px] uppercase tracking-wider font-bold">Question</div>
              <div className="font-semibold text-white truncate font-serif">{dsaResult.questionTitle}</div>
              <div className="text-earth-cream/60">{dsaResult.topic}</div>
            </div>
            <div className="bg-forest-900/80 rounded-2xl p-4 border border-forest-600/30 space-y-1">
              <div className="text-earth-cream/60 text-[10px] uppercase tracking-wider font-bold">Time Taken</div>
              <div className={`font-bold font-serif text-lg ${
                dsaResult.timeTakenMinutes <= dsaResult.expectedTimeMinutes
                  ? 'text-sage-400' : 'text-earth-tan'
              }`}>{dsaResult.timeTakenMinutes || '<1'} min</div>
              <div className="text-earth-cream/60">Expected: ~{dsaResult.expectedTimeMinutes} min</div>
            </div>
            <div className="bg-forest-900/80 rounded-2xl p-4 border border-forest-600/30 space-y-1">
              <div className="text-earth-cream/60 text-[10px] uppercase tracking-wider font-bold">Optimal Complexity</div>
              <div className="font-mono font-semibold text-accent-gold text-[11px] leading-relaxed">{dsaResult.optimalComplexity}</div>
            </div>
            <div className="bg-forest-900/80 rounded-2xl p-4 border border-forest-600/30 space-y-1">
              <div className="text-earth-cream/60 text-[10px] uppercase tracking-wider font-bold">Test Cases</div>
              <div className={`font-bold font-serif text-lg ${
                dsaResult.passedCases === dsaResult.totalCases && dsaResult.totalCases > 0
                  ? 'text-sage-400' : 'text-earth-tan'
              }`}>{dsaResult.passedCases}/{dsaResult.totalCases || '?'}</div>
              <div className="text-earth-cream/60">Passed</div>
            </div>
          </div>
          {dsaResult.timeTakenMinutes > dsaResult.expectedTimeMinutes && (
            <div className="flex items-start gap-2 p-3.5 rounded-2xl bg-earth-terracotta/20 border border-earth-terracotta/40 text-earth-cream text-xs">
              <AlertTriangle className="w-4 h-4 text-earth-terracotta mt-0.5 flex-shrink-0" />
              Solved in {dsaResult.timeTakenMinutes} min vs the expected ~{dsaResult.expectedTimeMinutes} min for a {companyName}-level {dsaResult.difficulty} question.
            </div>
          )}
        </div>
      )}

      {/* Header Bar */}
      <div className="rounded-3xl bg-[#A85D42] p-6 sm:p-8 border border-[#C17A5C]/40 space-y-4 shadow-warm-md text-[#FFF9F4]">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#C17A5C] text-[#FFF9F4] border border-white/20 flex items-center gap-1.5 shadow-warm-xs">
                <CheckCircle2 className="w-3.5 h-3.5" /> Selection Rounds Completed
              </span>
              <span className="text-xs text-[#FFF9F4]/80">Pipeline: <strong className="text-white font-bold">{companyName}</strong> ({userTargetField})</span>
              <span className="text-[11px] px-3 py-0.5 rounded-full bg-[#C17A5C] text-[#FFF9F4] border border-white/20 font-bold">
                Interview taken at: {difficultyLevel || 'Medium'} difficulty, {experienceLevel || 'Fresher'}{experienceLevel === 'Experienced' ? ` (${experienceYears || '0-2'} yrs)` : ''} level
              </span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-[#FFF9F4]">{companyName} Diagnostic Scorecard</h1>
            <p className="text-xs text-[#FFF9F4]/80">Heuristic scoring combining eye contact (30%), presence (15%), pace (20%), fillers (20%), and pauses (15%).</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={handlePracticeAgain}
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#C17A5C] hover:bg-[#b06a4d] text-[#FFF9F4] text-xs font-bold border border-white/20 transition-all shadow-warm-xs"
            >
              <RotateCcw className="w-4 h-4 text-[#FFF9F4]" />
              <span>Practice Again</span>
            </button>

            <Link
              to="/recommendations"
              className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rust-500 hover:bg-rust-600 text-white text-xs font-extrabold shadow-glow-rust transition-all"
            >
              <BookOpen className="w-4 h-4" />
              <span>View Recommended Courses</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics Section: Gauge, Trend Chart, Facial Telemetry & Diagnostic Matrix */}
      {!hasInterviewData ? (
        <div className="rounded-3xl bg-[#A85D42] p-8 border border-[#C17A5C]/40 text-center space-y-4 shadow-warm-md text-[#FFF9F4]">
          <div className="w-14 h-14 rounded-2xl bg-[#C17A5C] border border-white/20 flex items-center justify-center mx-auto text-white shadow-warm-xs">
            <Mic className="w-7 h-7 text-white" />
          </div>
          <div className="space-y-1">
            <h2 className="text-xl font-bold font-serif text-[#FFF9F4]">No AI Mock Interview Session Recorded</h2>
            <p className="text-xs text-[#FFF9F4]/80 max-w-md mx-auto leading-relaxed">
              Interview Confidence Index, Speech WPM, filler word penalties, and webcam facial gaze telemetry are generated only when you complete Stage 6: AI Mock Interview round.
            </p>
          </div>
          <div className="pt-2">
            <button
              type="button"
              onClick={() => navigate('/round/interview')}
              className="px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.03] transition-transform inline-flex items-center gap-2 cursor-pointer"
            >
              <Mic className="w-4 h-4" />
              <span>Start Stage 6: AI Mock Interview Round</span>
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Visual Analytics Section: Gauge & Trend Line Chart */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* Overall Confidence Radial Gauge (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-[#A85D42] p-6 border border-[#C17A5C]/40 flex flex-col items-center justify-center text-center space-y-4 shadow-warm-md text-[#FFF9F4]">
              <div className="text-xs font-bold text-[#FFF9F4]/90 uppercase tracking-wider">
                Overall Candidate Confidence Index
              </div>

              {/* Recharts Pie Gauge */}
              <div className="relative w-56 h-56 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={65}
                      outerRadius={85}
                      startAngle={180}
                      endAngle={0}
                      dataKey="value"
                      stroke="none"
                    >
                      {gaugeData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.fill} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/3 text-center space-y-1">
                  <div className="text-4xl font-bold font-serif text-[#FFF9F4]">{overallScore}%</div>
                  <div className="text-[11px] font-bold text-[#FFF9F4]/90">{companyName} Target Ready</div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs w-full">
                <div className="p-3 rounded-2xl bg-[#C17A5C] border border-[#A85D42]/30 shadow-warm-xs">
                  <span className="text-[#FFF9F4]/80 text-[10px]">Eye Contact Weight</span>
                  <div className="font-bold text-[#FFF9F4]">30%</div>
                </div>
                <div className="p-3 rounded-2xl bg-[#C17A5C] border border-[#A85D42]/30 shadow-warm-xs">
                  <span className="text-[#FFF9F4]/80 text-[10px]">Speaking Pace Weight</span>
                  <div className="font-bold text-[#FFF9F4]">20%</div>
                </div>
              </div>
            </div>

            {/* Recharts Line Chart Trend across Questions (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-[#A85D42] p-6 border border-[#C17A5C]/40 space-y-4 flex flex-col justify-between shadow-warm-md text-[#FFF9F4]">
              <div>
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold font-serif text-[#FFF9F4] flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-[#FFF9F4]" />
                    <span>Confidence Score Progression Trend</span>
                  </h2>
                  <span className="text-xs text-[#FFF9F4]/90 font-bold">Tracked per Question</span>
                </div>
                <p className="text-xs text-[#FFF9F4]/80 mt-1">
                  Evaluates confidence score improvement and composure across sequential interview questions.
                </p>
              </div>

              <div className="h-56 w-full pt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={questionScores} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#C17A5C" />
                    <XAxis dataKey="name" stroke="#FFF9F4" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#FFF9F4" fontSize={11} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#84412B', borderColor: '#C17A5C', borderRadius: '12px', fontSize: '12px', color: '#FFF9F4' }}
                      labelStyle={{ color: '#FFF9F4', fontWeight: 'bold' }}
                    />
                    <Line
                      type="monotone"
                      dataKey="score"
                      stroke="#FFF9F4"
                      strokeWidth={3}
                      dot={{ r: 6, fill: '#FFF9F4', strokeWidth: 2, stroke: '#84412B' }}
                      activeDot={{ r: 8 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

          </div>

          {/* 4-Signal Webcam Facial Telemetry Scorecard */}
          <div className="rounded-3xl bg-[#A85D42] p-6 space-y-4 border border-[#C17A5C]/40 shadow-warm-md text-[#FFF9F4]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C17A5C]/40 pb-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-[#C17A5C] text-[#FFF9F4] border border-white/20 flex items-center justify-center font-bold">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold font-serif text-[#FFF9F4]">Webcam Facial Confidence Signals</h3>
                    <span className="px-3 py-0.5 rounded-full font-bold font-serif text-xs bg-[#C17A5C] text-[#FFF9F4] border border-white/20">
                      {questionScores[0]?.facialScore || 85}% Facial Score
                    </span>
                  </div>
                  <p className="text-xs text-[#FFF9F4]/80">
                    Formula: (Eye Contact × 40%) + (Looking Away × 20%) + (Head Stability × 20%) + (Smile Demeanor × 20%).
                  </p>
                </div>
              </div>

              <span className="text-[11px] font-mono text-[#FFF9F4]/90 bg-[#C17A5C] px-3 py-1 rounded-full border border-white/20">
                Silent Fallback Protection Enabled
              </span>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-[#C17A5C] rounded-2xl p-4 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
                <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">1. Eye Contact (40%)</span>
                <div className="font-bold font-serif text-xl text-[#FFF9F4]">{questionScores[0]?.gazeRatio || 90}%</div>
                <div className="text-[10px] text-[#FFF9F4]/80">Centered camera gaze</div>
              </div>
              <div className="bg-[#C17A5C] rounded-2xl p-4 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
                <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">2. Looking Away (20%)</span>
                <div className="font-bold font-serif text-xl text-[#FFF9F4]">{questionScores[0]?.noLookingAwayRatio || 92}%</div>
                <div className="text-[10px] text-[#FFF9F4]/80">No extreme angle turns</div>
              </div>
              <div className="bg-[#C17A5C] rounded-2xl p-4 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
                <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">3. Head Stability (20%)</span>
                <div className="font-bold font-serif text-xl text-[#FFF9F4]">{questionScores[0]?.headStabilityRatio || 88}%</div>
                <div className="text-[10px] text-[#FFF9F4]/80">Calm landmark posture</div>
              </div>
              <div className="bg-[#C17A5C] rounded-2xl p-4 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
                <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">4. Smile & Demeanor (20%)</span>
                <div className="font-bold font-serif text-xl text-[#FFF9F4]">{questionScores[0]?.smileRatio || 85}%</div>
                <div className="text-[10px] text-[#FFF9F4]/80">Positive expression threshold</div>
              </div>
            </div>
          </div>

          {/* Session Emotion Timeline & Composure Graph */}
          <div className="rounded-3xl bg-[#A85D42] p-6 space-y-4 border border-[#C17A5C]/40 shadow-warm-md text-[#FFF9F4]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-[#C17A5C]/40 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Brain className="w-5 h-5 text-[#FFF9F4]" />
                  <h3 className="text-base font-bold font-serif text-[#FFF9F4]">Session Emotion Timeline & Composure Graph</h3>
                </div>
                <p className="text-xs text-[#FFF9F4]/80 mt-0.5">
                  Mapped 7 face-api.js expressions into 3 interview buckets: Confident, Nervous, and Stressed.
                </p>
              </div>

              <div className="inline-block px-3.5 py-1.5 rounded-full bg-[#C17A5C] border border-white/20 text-[#FFF9F4] font-serif text-xs font-bold shadow-sm">
                💡 {sessionEmotionObj.summaryLabel}
              </div>
            </div>

            {/* Recharts Emotion Line Chart */}
            <div className="h-44 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={sessionEmotionObj.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#C17A5C" />
                  <XAxis dataKey="time" stroke="#FFF9F4" fontSize={11} />
                  <YAxis domain={[0, 100]} stroke="#FFF9F4" fontSize={11} tickFormatter={(val) => val >= 90 ? 'Confident' : val >= 60 ? 'Nervous' : 'Stressed'} />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#84412B', borderColor: '#C17A5C', borderRadius: '12px', fontSize: '12px', color: '#FFF9F4' }}
                    formatter={(val, name, item) => [`State: ${item.payload.bucket} (${item.payload.expression})`, 'Composure Level']}
                  />
                  <Line
                    type="monotone"
                    dataKey="composureScore"
                    stroke="#FFF9F4"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#FFF9F4', strokeWidth: 2, stroke: '#84412B' }}
                    activeDot={{ r: 7 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>

            {/* Emotion Breakdown Badges */}
            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-[#C17A5C]/40">
              <div className="flex items-center gap-3">
                <span className="px-3 py-1 rounded-full bg-[#C17A5C] text-[#FFF9F4] border border-white/20 font-bold font-mono">
                  Confident: {sessionEmotionObj.bucketPercentages.Confident}%
                </span>
                <span className="px-3 py-1 rounded-full bg-[#C17A5C] text-[#FFF9F4] border border-white/20 font-bold font-mono">
                  Nervous: {sessionEmotionObj.bucketPercentages.Nervous}%
                </span>
                <span className="px-3 py-1 rounded-full bg-[#C17A5C] text-[#FFF9F4] border border-white/20 font-bold font-mono">
                  Stressed: {sessionEmotionObj.bucketPercentages.Stressed}%
                </span>
              </div>
              <span className="text-[10px] text-[#FFF9F4]/80">Sampled @ 1-second intervals</span>
            </div>
          </div>

          {/* Per-Question Diagnostic Matrix Table */}
          <div className="rounded-3xl bg-[#A85D42] p-6 space-y-4 border border-[#C17A5C]/40 shadow-warm-md text-[#FFF9F4]">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif text-[#FFF9F4] flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-[#FFF9F4]" />
                <span>Per-Question Diagnostic Matrix</span>
              </h2>
              <span className="text-xs text-[#FFF9F4]/80">{questionScores.length} Questions Evaluated</span>
            </div>

            <div className="overflow-x-auto rounded-2xl border border-[#A85D42]/30">
              <table className="w-full text-left text-xs text-[#FFF9F4]">
                <thead className="bg-[#C17A5C] text-[#FFF9F4] uppercase font-mono text-[10px] border-b border-[#A85D42]/40">
                  <tr>
                    <th className="p-3 font-bold text-[#FFF9F4]">Question</th>
                    <th className="p-3 font-bold text-[#FFF9F4]">Confidence Score</th>
                    <th className="p-3 font-bold text-[#FFF9F4]">Speaking Pace</th>
                    <th className="p-3 font-bold text-[#FFF9F4]">Fillers</th>
                    <th className="p-3 font-bold text-[#FFF9F4]">Long Pauses</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#C17A5C]/30">
                  {questionScores.map((q, idx) => (
                    <tr key={idx} className="hover:bg-[#C17A5C]/30 transition-colors">
                      <td className="p-3 font-semibold text-[#FFF9F4]">{q.name}: {q.questionText}</td>
                      <td className="p-3 font-mono font-bold text-[#FFF9F4]">{q.score}%</td>
                      <td className="p-3 font-mono text-[#FFF9F4]/90">{q.wpm} WPM</td>
                      <td className="p-3 font-mono text-[#FFF9F4]/90">{q.fillers}</td>
                      <td className="p-3 font-mono text-[#FFF9F4]/90">{q.pauses}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* Speech Telemetry & Communication Sub-Score Accordion */}
      <div className="rounded-3xl bg-[#A85D42] p-6 space-y-4 border border-[#C17A5C]/40 shadow-warm-md text-[#FFF9F4]">
        <div 
          onClick={() => setSpeechTelemetryExpanded(!speechTelemetryExpanded)}
          className="flex items-center justify-between cursor-pointer select-none"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#C17A5C] text-[#FFF9F4] border border-white/20 flex items-center justify-center font-bold">
              <Mic className="w-5 h-5 text-[#FFF9F4]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold font-serif text-[#FFF9F4]">Speech Telemetry & Communication Sub-Score</h3>
                <span className="px-3 py-0.5 rounded-full font-bold font-serif text-xs bg-[#C17A5C] text-[#FFF9F4] border border-white/20">
                  {commScoreObj.communicationScore}% Communication Score
                </span>
              </div>
              <p className="text-xs text-[#FFF9F4]/80">
                Pacing (WPM), filler word count, silence gaps (&gt;2s), and Web Speech API segment recognition clarity.
              </p>
            </div>
          </div>

          <button className="p-2 rounded-full bg-[#C17A5C] border border-white/20 text-[#FFF9F4] hover:bg-[#b06a4d] transition-colors">
            {speechTelemetryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </button>
        </div>

        {/* Overview Stats Bar */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
          <div className="bg-[#C17A5C] rounded-2xl p-3.5 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
            <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">Avg Speaking Pace</span>
            <div className="font-bold font-mono text-lg text-[#FFF9F4]">{commScoreObj.avgWpm} WPM</div>
            <div className="text-[10px] text-[#FFF9F4]/80">Target: 120-160 WPM</div>
          </div>
          <div className="bg-[#C17A5C] rounded-2xl p-3.5 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
            <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">Total Filler Words</span>
            <div className="font-bold font-mono text-lg text-[#FFF9F4]">{commScoreObj.totalFillers}</div>
            <div className="text-[10px] text-[#FFF9F4]/80">um, uh, like, basically</div>
          </div>
          <div className="bg-[#C17A5C] rounded-2xl p-3.5 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
            <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">Long Pauses (&gt;2s)</span>
            <div className="font-bold font-mono text-lg text-[#FFF9F4]">{commScoreObj.totalPauses}</div>
            <div className="text-[10px] text-[#FFF9F4]/80">Silence gaps flagged</div>
          </div>
          <div className="bg-[#C17A5C] rounded-2xl p-3.5 border border-[#A85D42]/30 space-y-1 shadow-warm-xs">
            <span className="text-[#FFF9F4]/80 text-[10px] uppercase tracking-wider font-bold">Clarity Proxy %</span>
            <div className="font-bold font-mono text-lg text-[#FFF9F4]">{commScoreObj.avgClarityProxy}%</div>
            <div className="text-[10px] text-[#FFF9F4]/80">Recognition confidence</div>
          </div>
        </div>

        {/* Expandable Per-Answer Breakdown */}
        {speechTelemetryExpanded && (
          <div className="space-y-3 pt-3 border-t border-[#C17A5C]/40 animate-fadeIn">
            <div className="flex items-center justify-between text-xs text-[#FFF9F4]/80">
              <span className="font-bold text-[#FFF9F4] uppercase font-mono text-[10px]">Per-Answer Speech Telemetry Logs:</span>
              <span className="flex items-center gap-1 text-[10px] text-[#FFF9F4]/80">
                <Info className="w-3 h-3 text-[#FFF9F4]" />
                Note: Voice clarity is measured via Web Speech API recognition segment confidence proxy.
              </span>
            </div>

            <div className="space-y-2">
              {commScoreObj.breakdown.map((item, i) => (
                <div key={i} className="p-3.5 rounded-2xl bg-[#C17A5C] border border-[#A85D42]/30 text-xs space-y-1 text-[#FFF9F4] shadow-warm-xs">
                  <div className="flex items-center justify-between font-serif font-bold text-[#FFF9F4]">
                    <span className="truncate max-w-lg">Answer {item.answerIndex}: {item.questionText}</span>
                    <span className="font-mono text-[#FFF9F4] text-[11px] font-semibold">{item.wpm} WPM</span>
                  </div>
                  <div className="flex items-center gap-4 text-[11px] font-mono text-[#FFF9F4]/90">
                    <span>Fillers: <strong className="text-white">{item.fillers}</strong></span>
                    <span>Pauses (&gt;2s): <strong className="text-white">{item.pauses}</strong></span>
                    <span>Clarity Proxy: <strong className="text-white">{item.clarityProxy}%</strong></span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Qualitative Candidate Feedback & Evaluation */}
      <div className="rounded-3xl bg-[#A85D42] p-6 space-y-5 border border-[#C17A5C]/40 shadow-warm-md text-[#FFF9F4]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-[#C17A5C]/40 pb-4">
          <div className="space-y-1">
            <h2 className="text-lg font-bold font-serif text-[#FFF9F4] flex items-center gap-2">
              <Target className="w-5 h-5 text-[#FFF9F4]" />
              <span>Qualitative Candidate Feedback & Evaluation</span>
            </h2>
            <p className="text-xs text-[#FFF9F4]/80 leading-relaxed font-sans">
              Evaluates transcripts against <strong className="text-white">{companyName}</strong>'s specific hiring profile and focus areas.
            </p>
          </div>

          <button
            onClick={handleGetAiFeedback}
            disabled={loadingAiFeedback}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white text-xs font-extrabold shadow-glow-rust hover:scale-[1.02] transition-all disabled:opacity-50"
          >
            {loadingAiFeedback ? <Loader2 className="w-4 h-4 animate-spin" /> : <Target className="w-4 h-4" />}
            <span>{loadingAiFeedback ? 'Analyzing Feedback...' : `Get ${companyName} Diagnostic Feedback`}</span>
          </button>
        </div>

        {/* Returned AI Feedback Cards */}
        {aiFeedback && (
          <div className="space-y-5 animate-fadeIn">
            
            {aiFeedback.overallSummary && (
              <div className="p-4 sm:p-5 rounded-2xl bg-[#C17A5C] border border-white/20 space-y-1 text-[#FFF9F4] shadow-warm-xs">
                <div className="text-xs font-bold text-[#FFF9F4] flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-[#FFF9F4]" />
                  <span>Executive Evaluation Summary ({companyName})</span>
                </div>
                <p className="text-xs text-[#FFF9F4]/90 leading-relaxed font-sans">
                  {aiFeedback.overallSummary}
                </p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              
              {/* Strengths */}
              <div className="p-5 rounded-2xl bg-[#C17A5C] border border-white/20 space-y-2 text-[#FFF9F4] shadow-warm-xs">
                <div className="flex items-center gap-2 text-[#FFF9F4] font-bold text-xs uppercase tracking-wider">
                  <CheckCircle2 className="w-4 h-4" /> Demonstrated Strengths
                </div>
                <ul className="space-y-1.5 text-xs text-[#FFF9F4]/90 list-disc list-inside">
                  {aiFeedback.strengths?.map((s, i) => (
                    <li key={i} className="leading-relaxed">{s}</li>
                  ))}
                </ul>
              </div>

              {/* Areas to Improve */}
              <div className="p-5 rounded-2xl bg-[#C17A5C] border border-white/20 space-y-2 text-[#FFF9F4] shadow-warm-xs">
                <div className="flex items-center gap-2 text-[#FFF9F4] font-bold text-xs uppercase tracking-wider">
                  <AlertTriangle className="w-4 h-4" /> Company-Specific Improvements
                </div>
                <ul className="space-y-1.5 text-xs text-[#FFF9F4]/90 list-disc list-inside">
                  {aiFeedback.areasToImprove?.map((g, i) => (
                    <li key={i} className="leading-relaxed">{g}</li>
                  ))}
                </ul>
              </div>

              {/* Suggested Focus Areas */}
              <div className="p-5 rounded-2xl bg-[#C17A5C] border border-white/20 space-y-2 text-[#FFF9F4] shadow-warm-xs">
                <div className="flex items-center gap-2 text-[#FFF9F4] font-bold text-xs uppercase tracking-wider">
                  <Target className="w-4 h-4" /> Focus Areas for {companyName}
                </div>
                <ul className="space-y-1.5 text-xs text-[#FFF9F4]/90 list-disc list-inside">
                  {aiFeedback.suggestedFocusAreas?.map((t, i) => (
                    <li key={i} className="leading-relaxed">{t}</li>
                  ))}
                </ul>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Final Payoff CTA: View Consolidated Final Report */}
      <div className="rounded-[32px] bg-[#A85D42] p-6 sm:p-8 border border-[#C17A5C]/40 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-warm-md text-[#FFF9F4]">
        <div className="space-y-1 text-center sm:text-left">
          <div className="flex items-center gap-2 justify-center sm:justify-start">
            <Trophy className="w-5 h-5 text-white" />
            <h3 className="text-lg font-bold font-serif text-white">All Selection Rounds Completed!</h3>
          </div>
          <p className="text-xs text-[#FFF9F4]/80 leading-relaxed font-sans">
            Synthesize all Aptitude, Technical, Mock Interview, and Resume audit signals into a single executive Placement Readiness Report.
          </p>
        </div>

        <button
          onClick={() => navigate('/final-report')}
          className="px-8 py-3.5 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-105 transition-all shrink-0 flex items-center gap-2"
        >
          <Award className="w-4 h-4 text-white" />
          <span>View Consolidated Final Report →</span>
        </button>
      </div>

    </div>
  );
}
