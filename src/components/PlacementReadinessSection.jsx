import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { calculateOverallSessionConfidence } from '../utils/confidenceScorer';
import { getCompanyTier } from '../utils/seedCompanies';

import { 
  Trophy, 
  Target, 
  Sparkles, 
  FileText, 
  Brain, 
  Code2, 
  Video, 
  ArrowRight, 
  CheckCircle2, 
  Award,
  ChevronRight,
  TrendingUp,
  BarChart3,
  RotateCcw
} from 'lucide-react';

/**
 * Returns Level Badge Info based on score (0 - 100)
 */
export function getReadinessLevelInfo(score = 0) {
  if (score >= 90) {
    return {
      level: 5,
      title: 'Level 5 — Master',
      badgeText: 'Level 5 — Master',
      subtitle: 'Top-Tier Enterprise Hire Signal',
      description: 'Exceptional performance across all selection rounds.',
      bgGradient: 'from-rust-600 to-rust-500',
      badgeBg: 'bg-rust-100 text-rust-700 border-rust-200'
    };
  }
  if (score >= 75) {
    return {
      level: 4,
      title: 'Level 4 — Advanced',
      badgeText: 'Level 4 — Advanced',
      subtitle: 'Tier-1 Enterprise Diagnostic Ready',
      description: 'Strong interview readiness across technical & behavioral standards.',
      bgGradient: 'from-rust-500 to-dustyrose-500',
      badgeBg: 'bg-rust-100 text-rust-700 border-warmborder'
    };
  }
  if (score >= 60) {
    return {
      level: 3,
      title: 'Level 3 — Intermediate',
      badgeText: 'Level 3 — Intermediate',
      subtitle: 'Solid Foundation with Targeted Gaps',
      description: 'Competent candidate profile with minor round polish required.',
      bgGradient: 'from-dustyrose-600 to-dustyrose-400',
      badgeBg: 'bg-dustyrose-100 text-dustyrose-700 border-dustyrose-200'
    };
  }
  if (score >= 45) {
    return {
      level: 2,
      title: 'Level 2 — Foundational',
      badgeText: 'Level 2 — Foundational',
      subtitle: 'Skill Building in Progress',
      description: 'Core concepts established; requires focused practice sessions.',
      bgGradient: 'from-espresso-600 to-espresso-400',
      badgeBg: 'bg-espresso-100 text-espresso-700 border-espresso-200'
    };
  }
  return {
    level: 1,
    title: 'Level 1 — Beginner',
    badgeText: 'Level 1 — Beginner',
    subtitle: 'Diagnostic Onboarding Needed',
    description: 'Complete your first practice round to establish baseline telemetry.',
    bgGradient: 'from-warmtext-700 to-warmtext-500',
    badgeBg: 'bg-warmtext-100 text-warmtext-700 border-warmborder'
  };
}

export default function PlacementReadinessSection({ onOpenAuthModal }) {
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
    technicalInterviewResult,
    selectedCompany,
    selectedField
  } = usePrep();

  const sectionRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);
  const [latestReport, setLatestReport] = useState(null);
  const [loadingReport, setLoadingReport] = useState(false);

  // IntersectionObserver for scroll-into-view animation
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  // Fetch user's latest report from Firestore if available
  useEffect(() => {
    const fetchLatestReport = async () => {
      if (!auth.currentUser) return;
      setLoadingReport(true);
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
        console.warn('PlacementReadinessSection report fetch notice:', err.message);
      } finally {
        setLoadingReport(false);
      }
    };

    fetchLatestReport();
  }, [currentUser]);

  // Derive Scores from context data or latest report
  const rawResumeScore = resumeData?.atsScore ?? resumeData?.overallScore ?? resumeData?.score ?? resumeData?.atsMatchScore ?? null;
  const rawAptitudeScore = aptitudeResult?.percentage ?? aptitudeResult?.overallScore ?? aptitudeResult?.score ?? null;
  
  // Technical round composite calculation (Technical MCQ, DSA, System Design)
  const techScores = [];
  if (typeof technicalMcqResult?.percentage === 'number') techScores.push(technicalMcqResult.percentage);
  if (typeof technicalMcqResult?.score === 'number' && typeof technicalMcqResult?.percentage !== 'number') techScores.push(technicalMcqResult.score);
  if (typeof dsaResult?.score === 'number') techScores.push(dsaResult.score);
  if (typeof systemDesignResult?.evaluation?.score === 'number') techScores.push(systemDesignResult.evaluation.score);
  if (typeof systemDesignResult?.score === 'number' && !systemDesignResult?.evaluation?.score) techScores.push(systemDesignResult.score);
  const rawTechScore = techScores.length > 0 ? Math.round(techScores.reduce((a, b) => a + b, 0) / techScores.length) : null;

  // Interview round composite calculation
  let rawInterviewScore = null;
  if (sessionResults && sessionResults.length > 0) {
    const interviewTelemetry = calculateOverallSessionConfidence(sessionResults);
    rawInterviewScore = interviewTelemetry.overallScore;
  } else if (typeof hrInterviewResult?.score === 'number') {
    rawInterviewScore = hrInterviewResult.score;
  } else if (typeof technicalInterviewResult?.score === 'number') {
    rawInterviewScore = technicalInterviewResult.score;
  }

  // Extract from latest report roundBreakdown if context values are partial
  let reportResumeScore = null;
  let reportAptitudeScore = null;
  let reportTechScore = null;
  let reportInterviewScore = null;

  if (latestReport?.roundBreakdown && Array.isArray(latestReport.roundBreakdown)) {
    latestReport.roundBreakdown.forEach(rb => {
      const name = (rb.roundName || '').toLowerCase();
      if (name.includes('resume') && typeof rb.score === 'number') reportResumeScore = rb.score;
      if (name.includes('aptitude') && typeof rb.score === 'number') reportAptitudeScore = rb.score;
      if ((name.includes('technical') || name.includes('dsa') || name.includes('coding') || name.includes('mcq')) && typeof rb.score === 'number') reportTechScore = rb.score;
      if ((name.includes('interview') || name.includes('hr') || name.includes('ai')) && typeof rb.score === 'number') reportInterviewScore = rb.score;
    });
  }

  const finalResumeScore = rawResumeScore ?? reportResumeScore;
  const finalAptitudeScore = rawAptitudeScore ?? reportAptitudeScore;
  const finalTechScore = rawTechScore ?? reportTechScore;
  const finalInterviewScore = rawInterviewScore ?? reportInterviewScore;

  // Strictly collect attempted scores
  const attemptedScores = [];
  if (typeof finalResumeScore === 'number') attemptedScores.push(finalResumeScore);
  if (typeof finalAptitudeScore === 'number') attemptedScores.push(finalAptitudeScore);
  if (typeof finalTechScore === 'number') attemptedScores.push(finalTechScore);
  if (typeof finalInterviewScore === 'number') attemptedScores.push(finalInterviewScore);

  const hasAnyCompletedSession = Boolean(
    attemptedScores.length > 0 || (typeof latestReport?.readinessScore === 'number' && latestReport.readinessScore > 0)
  );

  // Compute Overall Placement Readiness Percentage strictly from attempted rounds
  let overallPercentage = 0;
  if (typeof latestReport?.readinessScore === 'number' && latestReport.readinessScore > 0) {
    overallPercentage = latestReport.readinessScore;
  } else if (attemptedScores.length > 0) {
    overallPercentage = Math.round(
      attemptedScores.reduce((sum, score) => sum + score, 0) / attemptedScores.length
    );
  } else {
    overallPercentage = 0;
  }

  const levelInfo = getReadinessLevelInfo(overallPercentage);

  const categories = [
    {
      id: 'resume',
      label: 'Resume',
      subtitle: 'ATS Audit & Keyword Match',
      score: typeof finalResumeScore === 'number' ? finalResumeScore : 0,
      attempted: typeof finalResumeScore === 'number',
      icon: FileText,
      color: 'rust'
    },
    {
      id: 'aptitude',
      label: 'Aptitude',
      subtitle: 'Quantitative & Logical Speed',
      score: typeof finalAptitudeScore === 'number' ? finalAptitudeScore : 0,
      attempted: typeof finalAptitudeScore === 'number',
      icon: Brain,
      color: 'dustyrose'
    },
    {
      id: 'technical',
      label: 'Technical',
      subtitle: 'DSA & System Architecture',
      score: typeof finalTechScore === 'number' ? finalTechScore : 0,
      attempted: typeof finalTechScore === 'number',
      icon: Code2,
      color: 'rust'
    },
    {
      id: 'interview',
      label: 'Interview',
      subtitle: 'AI Speech & Facial Telemetry',
      score: typeof finalInterviewScore === 'number' ? finalInterviewScore : 0,
      attempted: typeof finalInterviewScore === 'number',
      icon: Video,
      color: 'espresso'
    }
  ];


  const handleStartPractice = () => {
    if (currentUser) {
      navigate('/select-field');
    } else if (onOpenAuthModal) {
      onOpenAuthModal();
    } else {
      navigate('/select-field');
    }
  };

  return (
    <section 
      ref={sectionRef}
      className="relative rounded-[32px] overflow-hidden bg-peach-card border border-warmborder shadow-warm-md p-6 sm:p-10 my-8 transition-all"
    >
      {/* Background Decor Elements */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-rust-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-72 h-72 bg-dustyrose-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Section Header with Sparkle Identifier */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warmborder/80 pb-6 mb-8">
        <div className="space-y-1 text-left">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-warm-sm">
            <Sparkles className="w-3.5 h-3.5 text-dustyrose-200" />
            <span>Platform Signature Metric</span>
          </div>
          <h2 className="font-heading text-2xl sm:text-4xl font-extrabold text-warmtext-900 tracking-tight">
            Your Placement Readiness
          </h2>
          <p className="text-xs sm:text-sm text-warmtext-500 font-sans">
            Composite diagnostic evaluation across enterprise candidate selection filters
          </p>
        </div>

        {hasAnyCompletedSession && (
          <button
            onClick={() => navigate('/final-report')}
            className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-dustyrose-50 text-rust-500 border border-dustyrose-300 font-extrabold text-xs shadow-warm-sm transition-all self-start sm:self-auto"
          >
            <BarChart3 className="w-4 h-4 text-rust-500" />
            <span>View Full Diagnostic Report</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Empty State when zero completed sessions exist */}
      {!hasAnyCompletedSession ? (
        <div className="py-12 px-6 rounded-2xl bg-peach-50/70 border border-dashed border-warmborder text-center space-y-5">
          <div className="w-16 h-16 rounded-2xl bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center mx-auto shadow-warm-sm">
            <Target className="w-8 h-8 text-rust-500" />
          </div>

          <div className="space-y-2 max-w-md mx-auto">
            <h3 className="text-xl font-extrabold font-heading text-warmtext-900">
              Complete your first round to see your Placement Readiness
            </h3>
            <p className="text-xs text-warmtext-500 leading-relaxed font-sans">
              Run a resume audit, aptitude test, coding round, or AI mock interview to generate your personalized readiness benchmark and level badge.
            </p>
          </div>

          <div className="pt-2">
            <button
              onClick={handleStartPractice}
              className="inline-flex items-center justify-center gap-3 px-8 py-3.5 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.02] transition-all"
            >
              <span>Start Placement Round</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      ) : (
        /* Populated Signature Placement Readiness Layout */
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left Column: Large Overall Percentage & Status (5 cols) */}
          <div className="lg:col-span-5 flex flex-col items-center text-center p-6 sm:p-8 rounded-2xl bg-peach-50/80 border border-warmborder shadow-warm-sm space-y-6">
            
            {/* Percentage Display Ring Badge */}
            <div className="relative flex items-center justify-center w-44 h-44 rounded-full bg-white border-4 border-peach-200 shadow-warm-md p-4">
              <div className="flex flex-col items-center justify-center">
                <span className="font-mono text-5xl sm:text-6xl font-black text-rust-500 tracking-tight">
                  {overallPercentage}%
                </span>
                <span className="text-xs font-bold font-serif text-warmtext-900 uppercase tracking-widest mt-1">
                  Placement Ready
                </span>
              </div>

              {/* Decorative Top Accent Badge */}
              <div className="absolute -top-3 px-3 py-0.5 rounded-full bg-rust-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-warm-xs">
                Verified Benchmark
              </div>
            </div>

            {/* Level Badge Box */}
            <div className="w-full space-y-3 pt-2">
              <div className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white border border-warmborder shadow-warm-xs w-full">
                <Trophy className="w-4 h-4 text-rust-500 shrink-0" />
                <span className="font-heading font-extrabold text-sm text-warmtext-900">
                  {levelInfo.badgeText}
                </span>
              </div>

              {/* 5-Step Level Indicator Pills */}
              <div className="flex items-center justify-center gap-1.5 pt-1">
                {[1, 2, 3, 4, 5].map((stepNum) => (
                  <div
                    key={stepNum}
                    className={`h-2 flex-1 rounded-full transition-all duration-500 ${
                      stepNum <= levelInfo.level
                        ? 'bg-rust-500 shadow-warm-xs'
                        : 'bg-peach-200/80'
                    }`}
                  />
                ))}
              </div>

              <p className="text-[11px] text-warmtext-500 font-sans leading-relaxed">
                {levelInfo.description}
              </p>

              {selectedCompany && (
                <div className="pt-2.5 border-t border-warmborder/60">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-warmtext-500 block mb-1">
                    Target Recruiter Benchmark
                  </span>
                  <div className={`px-3 py-1.5 rounded-lg border text-xs font-bold inline-flex items-center gap-1.5 ${getCompanyTier(selectedCompany).badgeBg}`}>
                    <Target className="w-3.5 h-3.5" />
                    <span>{selectedCompany.name || 'Company'} • {getCompanyTier(selectedCompany).label}</span>
                  </div>
                  <p className="text-[10px] text-warmtext-500 italic mt-1 leading-tight text-left">
                    {getCompanyTier(selectedCompany).expectations}
                  </p>
                </div>
              )}
            </div>


          </div>

          {/* Right Column: 4 Horizontal Category Progress Bars (7 cols) */}
          <div className="lg:col-span-7 space-y-5 text-left">
            {categories.map((cat) => {
              const IconComp = cat.icon;
              return (
                <div key={cat.id} className="space-y-2 p-4 rounded-xl bg-white border border-warmborder shadow-warm-xs">
                  
                  {/* Category Label Header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-peach-50 text-rust-500 border border-warmborder flex items-center justify-center shrink-0">
                        <IconComp className="w-4 h-4 text-rust-500" />
                      </div>
                      <div>
                        <h4 className="text-sm font-bold font-serif text-warmtext-900 leading-none">
                          {cat.label}
                        </h4>
                        <span className="text-[10px] text-warmtext-500 font-sans">
                          {cat.subtitle}
                        </span>
                      </div>
                    </div>

                    <div className="text-right">
                      {cat.attempted ? (
                        <span className="font-mono text-base font-extrabold text-rust-500">
                          {cat.score}%
                        </span>
                      ) : (
                        <span className="font-mono text-xs font-semibold text-warmtext-500 bg-peach-100 px-2.5 py-1 rounded-md border border-warmborder">
                          Not Attempted
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Horizontal Progress Bar with Scroll Animation */}
                  <div className="w-full bg-peach-100 rounded-full h-3 overflow-hidden p-0.5 border border-warmborder/60">
                    <div
                      className="bg-rust-500 h-full rounded-full transition-all duration-1000 ease-out shadow-warm-xs"
                      style={{
                        width: isVisible && cat.attempted ? `${cat.score}%` : '0%'
                      }}
                    />
                  </div>


                </div>
              );
            })}
          </div>

        </div>
      )}

    </section>
  );
}
