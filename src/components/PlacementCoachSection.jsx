import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { calculateOverallSessionConfidence } from '../utils/confidenceScorer';
import { 
  Sparkles, 
  Target, 
  ArrowRight, 
  Brain, 
  Code2, 
  FileText, 
  Video, 
  ChevronRight, 
  Lightbulb,
  CheckCircle2,
  TrendingUp,
  UserCheck
} from 'lucide-react';

export default function PlacementCoachSection({ useAiBranding = false }) {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const { 
    resumeData, 
    aptitudeResult, 
    technicalMcqResult, 
    dsaResult, 
    systemDesignResult, 
    sessionResults, 
    hrInterviewResult,
    technicalInterviewResult 
  } = usePrep();

  const [latestReport, setLatestReport] = useState(null);

  // Fetch latest report from Firestore if authenticated
  useEffect(() => {
    const fetchLatestReport = async () => {
      if (!auth.currentUser) return;
      try {
        const q = query(
          collection(db, 'reports'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc'),
          limit(1)
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          setLatestReport(snap.docs[0].data());
        }
      } catch (err) {
        console.warn('PlacementCoachSection report fetch notice:', err.message);
      }
    };

    fetchLatestReport();
  }, [currentUser]);

  // Extract raw category scores
  const rawResumeScore = resumeData?.atsScore ?? resumeData?.overallScore ?? resumeData?.score ?? resumeData?.atsMatchScore ?? null;
  const rawAptitudeScore = aptitudeResult?.percentage ?? aptitudeResult?.overallScore ?? aptitudeResult?.score ?? null;

  const techScores = [];
  if (typeof technicalMcqResult?.percentage === 'number') techScores.push(technicalMcqResult.percentage);
  if (typeof dsaResult?.score === 'number') techScores.push(dsaResult.score);
  if (typeof systemDesignResult?.evaluation?.score === 'number') techScores.push(systemDesignResult.evaluation.score);
  const rawTechScore = techScores.length > 0 ? Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length) : null;

  let rawInterviewScore = null;
  if (sessionResults && sessionResults.length > 0) {
    rawInterviewScore = calculateOverallSessionConfidence(sessionResults).overallScore;
  } else if (typeof hrInterviewResult?.score === 'number') {
    rawInterviewScore = hrInterviewResult.score;
  } else if (typeof technicalInterviewResult?.score === 'number') {
    rawInterviewScore = technicalInterviewResult.score;
  }

  // Extract report scores fallback
  let reportResume = null, reportAptitude = null, reportTech = null, reportInterview = null;
  if (latestReport?.roundBreakdown && Array.isArray(latestReport.roundBreakdown)) {
    latestReport.roundBreakdown.forEach(rb => {
      const name = (rb.roundName || '').toLowerCase();
      if (name.includes('resume') && typeof rb.score === 'number') reportResume = rb.score;
      if (name.includes('aptitude') && typeof rb.score === 'number') reportAptitude = rb.score;
      if ((name.includes('technical') || name.includes('dsa')) && typeof rb.score === 'number') reportTech = rb.score;
      if ((name.includes('interview') || name.includes('hr')) && typeof rb.score === 'number') reportInterview = rb.score;
    });
  }

  const resumeScore = rawResumeScore ?? reportResume;
  const aptitudeScore = rawAptitudeScore ?? reportAptitude;
  const techScore = rawTechScore ?? reportTech;
  const interviewScore = rawInterviewScore ?? reportInterview;

  const hasSessionData = Boolean(
    resumeScore !== null ||
    aptitudeScore !== null ||
    techScore !== null ||
    interviewScore !== null ||
    latestReport?.readinessScore !== undefined
  );

  const categories = [
    {
      id: 'aptitude',
      label: 'Aptitude Reasoning',
      shortLabel: 'Aptitude',
      score: aptitudeScore ?? 75,
      route: '/round/aptitude',
      actionLabel: 'Practice Aptitude',
      icon: Brain
    },
    {
      id: 'technical',
      label: 'DSA & Technical',
      shortLabel: 'DSA & Technical',
      score: techScore ?? 70,
      route: '/round/dsa',
      actionLabel: 'Improve DSA',
      icon: Code2
    },
    {
      id: 'resume',
      label: 'Resume ATS Alignment',
      shortLabel: 'Resume ATS',
      score: resumeScore ?? 85,
      route: '/resume',
      actionLabel: 'Audit Resume ATS',
      icon: FileText
    },
    {
      id: 'interview',
      label: 'Voice Interview Composure',
      shortLabel: 'Mock Interview',
      score: interviewScore ?? 78,
      route: '/round/interview',
      actionLabel: 'Start Mock Interview',
      icon: Video
    }
  ];

  // Dynamic Insight Generation
  let insightSentence = "Complete a round to get your personalized coaching insights";
  let targetActions = [];

  if (hasSessionData) {
    const sorted = [...categories].sort((a, b) => b.score - a.score);
    const strongest = sorted[0];
    const weakest = sorted[sorted.length - 1];

    if (strongest.score - weakest.score >= 8) {
      insightSentence = `Based on your diagnostic performance, you demonstrate strong capability in ${strongest.shortLabel} (${strongest.score}%) but need improvement in ${weakest.shortLabel} (${weakest.score}%).`;
    } else {
      insightSentence = `Your performance is balanced across rounds (${strongest.score}% peak in ${strongest.shortLabel}). Focus on polishing ${weakest.shortLabel} (${weakest.score}%) to elevate your overall readiness.`;
    }

    // Filter categories scoring < 80% or select lowest 2-3 categories
    const weakCategories = categories.filter(c => c.score < 80);
    targetActions = (weakCategories.length >= 2 ? weakCategories : sorted.slice(-3)).slice(0, 3);
  } else {
    // Default encouraging action links when 0 sessions completed
    targetActions = [
      { id: 'def-apt', actionLabel: 'Practice Aptitude', route: '/round/aptitude', icon: Brain },
      { id: 'def-dsa', actionLabel: 'Improve DSA', route: '/round/dsa', icon: Code2 },
      { id: 'def-mock', actionLabel: 'Start Mock Interview', route: '/round/interview', icon: Video }
    ];
  }

  const titleText = useAiBranding ? "Your Personal AI Placement Coach" : "Your Personal Placement Coach";

  return (
    <section className="relative rounded-[32px] overflow-hidden bg-peach-50 border border-warmborder shadow-warm-md p-6 sm:p-10 my-8">
      {/* Background Subtle Gradient Blobs */}
      <div className="absolute -top-12 -right-12 w-72 h-72 rounded-full bg-rust-500/10 blur-2xl pointer-events-none" />
      <div className="absolute -bottom-12 -left-12 w-72 h-72 rounded-full bg-dustyrose-500/10 blur-2xl pointer-events-none" />

      <div className="relative z-10 space-y-6 max-w-4xl mx-auto text-center">
        
        {/* Section Badge */}
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-rust-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-warm-sm">
          <Sparkles className="w-3.5 h-3.5 text-dustyrose-200" />
          <span>Personalized Placement Intelligence</span>
        </div>

        {/* Section Title */}
        <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-warmtext-900 tracking-tight">
          {titleText}
        </h2>

        {/* Dynamic Insight Box */}
        <div className="p-6 rounded-2xl bg-white border border-warmborder shadow-warm-sm space-y-3 max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 text-rust-500 font-serif font-bold text-xs uppercase tracking-wider">
            <Lightbulb className="w-4 h-4 text-rust-500" />
            <span>Candidate Telemetry Feedback</span>
          </div>

          <p className="text-sm sm:text-base font-sans text-warmtext-900 font-semibold leading-relaxed">
            "{insightSentence}"
          </p>
        </div>

        {/* Dynamic Action Links (2-3 targeted round links based on weak areas) */}
        <div className="pt-2">
          <div className="text-xs font-bold text-warmtext-500 font-sans uppercase tracking-wider mb-3">
            {hasSessionData ? "Recommended Focus Actions for You:" : "Get Started with a Targeted Practice Round:"}
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3">
            {targetActions.map((action) => {
              const ActionIcon = action.icon || ArrowRight;
              return (
                <button
                  key={action.id}
                  onClick={() => navigate(action.route)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.02] transition-all group"
                >
                  <ActionIcon className="w-4 h-4 text-dustyrose-200" />
                  <span>{action.actionLabel}</span>
                  <ChevronRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
                </button>
              );
            })}
          </div>
        </div>

      </div>
    </section>
  );
}
