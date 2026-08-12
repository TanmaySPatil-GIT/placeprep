import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  Target, 
  Code2, 
  Video, 
  Building2, 
  ArrowRight, 
  Trophy, 
  Eye, 
  BarChart3,
  LogIn,
  Zap,
  ChevronRight,
  Sparkles,
  CheckCircle2
} from 'lucide-react';

export default function LandingPage({ onOpenAuthModal }) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();

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
    <div className="space-y-24 py-4">
      
      {/* 1. HERO SECTION WITH WARM PEACH BASE, OVERLAPPING CIRCLE MOTIFS & ARCH LINE-ART DECORATION */}
      <section className="relative rounded-[32px] overflow-hidden bg-peach-50 shadow-warm-md border border-warmborder">
        
        {/* Soft Organic Overlapping Background Circles */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-rust-500/15 blur-2xl pointer-events-none" />
        <div className="absolute top-12 right-20 w-80 h-80 rounded-full bg-dustyrose-500/20 blur-2xl pointer-events-none" />
        <div className="absolute -bottom-16 -left-16 w-96 h-96 rounded-full bg-espresso-900/10 blur-2xl pointer-events-none" />

        {/* Soft Arch / Rainbow Line-Art Graphic Overlay */}
        <div className="absolute top-4 right-10 opacity-25 pointer-events-none hidden lg:block">
          <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 20 180 A 80 80 0 0 1 180 180" stroke="#B5654A" strokeWidth="2.5" strokeDasharray="4 4" />
            <path d="M 40 180 A 60 60 0 0 1 160 180" stroke="#D98E77" strokeWidth="2" />
            <path d="M 60 180 A 40 40 0 0 1 140 180" stroke="#3D2B24" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto">
          
          {/* Hero Left Content (7 cols) */}
          <div className="lg:col-span-7 space-y-7 text-left">
            
            {/* Color-Block Header Badge */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rust-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-warm-sm">
                <Sparkles className="w-4 h-4 text-dustyrose-200" />
                <span>Next-Generation Placement Accelerator</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-serif text-4xl sm:text-6xl font-bold tracking-tight text-warmtext-900 leading-[1.14]">
              Crack Enterprise Drives with <span className="gradient-text">Real-Time Skill Evaluation</span>
            </h1>

            {/* Body Text */}
            <p className="text-base sm:text-lg text-warmtext-500 max-w-xl leading-relaxed font-sans">
              PlacePrep is an end-to-end placement preparation platform combining ATS resume audits, aptitude rounds, conversational voice mock interviews, and verified skill catalog recommendations.
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4 pt-2">
              <button
                onClick={handleStartPractice}
                className="inline-flex items-center justify-center gap-3 px-8 py-4 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-sm shadow-glow-rust hover:scale-[1.02] transition-all duration-300"
              >
                <span>{currentUser ? 'Start Practice Session' : 'Get Started — Sign Up Free'}</span>
                <ArrowRight className="w-5 h-5" />
              </button>

              {currentUser ? (
                <Link
                  to="/dashboard"
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white hover:bg-dustyrose-100 text-rust-500 font-semibold text-sm border border-dustyrose-400 shadow-warm-sm transition-all"
                >
                  <Trophy className="w-4 h-4 text-dustyrose-500" />
                  <span>Go to Candidate Dashboard</span>
                </Link>
              ) : (
                <button
                  onClick={() => onOpenAuthModal && onOpenAuthModal()}
                  className="inline-flex items-center justify-center gap-2 px-7 py-4 rounded-full bg-white hover:bg-dustyrose-100 text-rust-500 font-semibold text-sm border border-dustyrose-400 shadow-warm-sm transition-all"
                >
                  <LogIn className="w-4 h-4 text-rust-500" />
                  <span>Candidate Sign In</span>
                </button>
              )}
            </div>

          </div>

          {/* Hero Right Side: Layered Floating Card Overlay */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[340px]">
            
            {/* Main Base Card Graphic with Rust Left Border Accent */}
            <div className="w-full max-w-sm bg-[#FDF4EC] rounded-xl p-6 border border-warmborder border-l-4 border-l-rust-500 shadow-warm-md space-y-4">
              <div className="flex items-center justify-between border-b border-warmborder pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center font-bold font-serif text-sm">
                    <Target className="w-4 h-4 text-rust-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-serif text-warmtext-900">Enterprise Hiring Signal</h4>
                    <span className="text-[10px] text-warmtext-500">Google & Amazon Track</span>
                  </div>
                </div>
                <span className="px-3 py-1 rounded-full text-[10px] font-extrabold bg-dustyrose-100 text-dustyrose-700 border border-dustyrose-200">
                  92% Match
                </span>
              </div>

              {/* Metric Row */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="p-3 rounded-lg bg-rust-50 border border-warmborder space-y-1">
                  <span className="text-[10px] text-warmtext-500 font-mono">DSA Proficiency</span>
                  <div className="font-bold text-rust-500 font-mono text-sm">94 / 100</div>
                </div>
                <div className="p-3 rounded-lg bg-dustyrose-100 border border-dustyrose-200 space-y-1">
                  <span className="text-[10px] text-warmtext-500 font-mono">Voice Composure</span>
                  <div className="font-bold text-dustyrose-600 font-mono text-sm">88 / 100</div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-1">
                <div className="flex justify-between text-[11px] font-semibold text-warmtext-700">
                  <span>Placement Readiness Score</span>
                  <span className="font-mono text-rust-500">Level 4</span>
                </div>
                <div className="w-full bg-peach-200 rounded-full h-2 overflow-hidden">
                  <div className="bg-rust-500 h-full rounded-full" style={{ width: '88%' }}></div>
                </div>
              </div>

              {/* Floating Overlay Badge Card */}
              <div className="absolute -bottom-4 -right-2 bg-[#FDF4EC] rounded-xl px-4 py-2.5 border border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-md flex items-center gap-2.5">
                <div className="w-7 h-7 rounded-full bg-rust-500 text-white flex items-center justify-center font-extrabold text-xs shadow-glow-rust">
                  ✓
                </div>
                <div className="text-left">
                  <div className="text-[11px] font-bold text-warmtext-900 font-serif">Verified Assessment</div>
                  <div className="text-[9px] text-dustyrose-600 font-semibold font-mono">Top 5% Peer Leaderboard</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. FEATURE STRIP (ICON ROW SECTION) */}
      <section className="relative rounded-[28px] p-8 sm:p-12 bg-[#FDF4EC] border border-warmborder shadow-warm-sm">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 divide-y sm:divide-y-0 sm:divide-x divide-warmborder text-center">
          
          <div className="space-y-4 pt-4 sm:pt-0 sm:px-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl border border-warmborder bg-rust-100 flex items-center justify-center shadow-warm-sm">
              <Code2 className="w-6 h-6 text-rust-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-warmtext-900">1,200+ Questions</h3>
              <p className="text-xs text-warmtext-500 max-w-xs mx-auto leading-relaxed">LeetCode & FAANG curated technical problem sets.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 sm:pt-0 sm:px-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl border border-warmborder bg-dustyrose-100 flex items-center justify-center shadow-warm-sm">
              <Eye className="w-6 h-6 text-dustyrose-600" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-warmtext-900">Vision Telemetry</h3>
              <p className="text-xs text-warmtext-500 max-w-xs mx-auto leading-relaxed">500ms real-time gaze, posture, and expression monitoring.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 sm:pt-0 sm:px-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl border border-warmborder bg-rust-100 flex items-center justify-center shadow-warm-sm">
              <Building2 className="w-6 h-6 text-rust-500" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-warmtext-900">50+ Enterprise</h3>
              <p className="text-xs text-warmtext-500 max-w-xs mx-auto leading-relaxed">Google, Amazon, TCS, Microsoft hiring tracks.</p>
            </div>
          </div>

          <div className="space-y-4 pt-4 sm:pt-0 sm:px-4 flex flex-col items-center">
            <div className="w-14 h-14 rounded-xl border border-warmborder bg-espresso-100 flex items-center justify-center shadow-warm-sm">
              <BarChart3 className="w-6 h-6 text-espresso-700" />
            </div>
            <div className="space-y-1">
              <h3 className="text-lg font-bold font-serif text-warmtext-900">94.2% Accuracy</h3>
              <p className="text-xs text-warmtext-500 max-w-xs mx-auto leading-relaxed">Benchmarked against real enterprise placement outcomes.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CARD GRID SECTION WITH DIAMOND SPARKLE SECTION HEADER & THIN DIVIDER LINE */}
      <section className="space-y-8 max-w-7xl mx-auto">
        <div className="text-center space-y-3 pb-2 border-b border-dustyrose-200 max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-rust-500 text-white text-xs font-extrabold uppercase tracking-wider">
            <span>✦</span>
            <span>End-to-End Placement Architecture</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-bold font-serif text-warmtext-900 flex items-center justify-center gap-2">
            <span>Comprehensive Hiring Simulator</span>
            <span className="text-rust-500 text-2xl">✧</span>
          </h2>
          <p className="text-xs sm:text-sm text-warmtext-500 max-w-xl mx-auto">
            Experience authentic enterprise selection rounds with real-time diagnostic feedback at every stage.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          
          {/* Card 1: Target Company Selection */}
          <div 
            onClick={() => navigate('/companies')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-rust-500 shadow-warm-sm space-y-6 relative min-h-[260px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="icon-badge w-12 h-12 rounded-lg bg-rust-100 text-rust-500 flex items-center justify-center border border-warmborder shadow-warm-sm">
                <Building2 className="w-6 h-6 text-rust-500" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-rust-500 transition-colors">Target Company Selection</h3>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">Choose from 20+ enterprise recruiters to load authentic hiring rounds.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-rust-500 flex items-center gap-1.5 group-hover:text-rust-600">
              <span className="link-text">Explore Company Tracks</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Code Execution */}
          <div 
            onClick={() => navigate('/companies')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-sm space-y-6 relative min-h-[260px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="icon-badge w-12 h-12 rounded-lg bg-dustyrose-100 text-dustyrose-600 flex items-center justify-center border border-dustyrose-200 shadow-warm-sm">
                <Code2 className="w-6 h-6 text-dustyrose-600" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-dustyrose-600 transition-colors">Code Execution</h3>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">Solve time-bound algorithmic challenges in a professional IDE.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-dustyrose-600 flex items-center gap-1.5 group-hover:text-dustyrose-700">
              <span className="link-text">Launch Environment</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Speech & Pace Analytics */}
          <div 
            onClick={() => navigate('/companies')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-rust-500 shadow-warm-sm space-y-6 relative min-h-[260px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="icon-badge w-12 h-12 rounded-lg bg-rust-100 text-rust-500 flex items-center justify-center border border-warmborder shadow-warm-sm">
                <Video className="w-6 h-6 text-rust-500" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-rust-500 transition-colors">Speech & Pace Analytics</h3>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">Real-time speech pacing analysis tracking words-per-minute.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-rust-500 flex items-center gap-1.5 group-hover:text-rust-600">
              <span className="link-text">View Speech Metrics</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Vision Gaze Telemetry */}
          <div 
            onClick={() => navigate('/companies')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-espresso-500 shadow-warm-sm space-y-6 relative min-h-[260px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="icon-badge w-12 h-12 rounded-lg bg-espresso-100 text-espresso-700 flex items-center justify-center border border-espresso-100 shadow-warm-sm">
                <Eye className="w-6 h-6 text-espresso-700" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-espresso-700 transition-colors">Vision Gaze Telemetry</h3>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">WebCam tracking to evaluate interview eye-contact ratio.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-espresso-700 flex items-center gap-1.5 group-hover:text-espresso-900">
              <span className="link-text">Inspect Tracking</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 5: Executive Diagnostic Report */}
          <div 
            onClick={() => navigate('/dashboard')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-rust-500 shadow-warm-sm space-y-6 relative min-h-[260px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="icon-badge w-12 h-12 rounded-lg bg-rust-100 text-rust-500 flex items-center justify-center border border-warmborder shadow-warm-sm">
                <BarChart3 className="w-6 h-6 text-rust-500" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-rust-500 transition-colors">Executive Diagnostic Report</h3>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans font-medium">Instant feedback with score gauges and skill gap analysis.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-rust-500 flex items-center gap-1.5 group-hover:text-rust-600">
              <span className="link-text">View Sample Diagnostics</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 6: Peer Benchmarks */}
          <div 
            onClick={() => navigate('/dashboard')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-sm space-y-6 relative min-h-[260px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="icon-badge w-12 h-12 rounded-lg bg-dustyrose-100 text-dustyrose-600 flex items-center justify-center border border-dustyrose-200 shadow-warm-sm">
                <Trophy className="w-6 h-6 text-dustyrose-600" />
              </div>
              <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-dustyrose-600 transition-colors">Peer Benchmarks</h3>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans font-medium">Benchmark your readiness against verified engineering candidate leaderboards.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-dustyrose-600 flex items-center gap-1.5 group-hover:text-dustyrose-700">
              <span className="link-text">View Rankings</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

      {/* 4. PROMINENT BOTTOM CTA SECTION WITH OVERLAPPING CIRCLES */}
      <section className="rounded-[28px] p-8 sm:p-12 text-center space-y-6 max-w-4xl mx-auto bg-peach-50 border border-warmborder shadow-warm-md relative overflow-hidden">
        {/* Background Circles */}
        <div className="absolute -top-12 -right-12 w-64 h-64 rounded-full bg-rust-500/10 blur-xl pointer-events-none" />
        <div className="absolute -bottom-12 -left-12 w-64 h-64 rounded-full bg-dustyrose-500/15 blur-xl pointer-events-none" />

        <div className="relative z-10 space-y-6">
          <div className="w-16 h-16 rounded-full bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center mx-auto shadow-warm-sm">
            <Target className="w-8 h-8 text-rust-500" />
          </div>
          <div className="space-y-2">
            <h3 className="text-3xl sm:text-4xl font-bold font-serif text-warmtext-900">Ready for Your Target Placement Drive?</h3>
            <p className="text-xs sm:text-sm text-warmtext-500 max-w-xl mx-auto">
              Start a practice session now to test your coding efficiency and interview composure with instant skill gap feedback.
            </p>
          </div>
          <Link
            to="/select-field"
            className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-sm shadow-glow-rust hover:scale-[1.02] transition-all"
          >
            <span>Start Practicing Now</span>
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
