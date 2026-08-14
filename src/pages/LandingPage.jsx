import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import PlacementReadinessSection from '../components/PlacementReadinessSection';
import StatsStripSection from '../components/StatsStripSection';
import PlacementCoachSection from '../components/PlacementCoachSection';
import TopCompaniesSection from '../components/TopCompaniesSection';
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
  CheckCircle2,
  Brain,
  FileText
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
        <div className="absolute top-4 right-10 opacity-30 pointer-events-none hidden lg:block">
          <svg width="220" height="220" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M 20 180 A 80 80 0 0 1 180 180" stroke="#B5654A" strokeWidth="2.5" strokeDasharray="4 4" />
            <path d="M 40 180 A 60 60 0 0 1 160 180" stroke="#D98E77" strokeWidth="2" />
            <path d="M 60 180 A 40 40 0 0 1 140 180" stroke="#3D2B24" strokeWidth="1.5" />
          </svg>
        </div>

        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-10 items-center px-6 sm:px-12 py-16 sm:py-24 max-w-7xl mx-auto">
          
          {/* Hero Left Content (7 cols) */}
          <div className="lg:col-span-7 space-y-7 text-left animate-fade-up">
            
            {/* Color-Block Header Badge */}
            <div className="flex items-center gap-3">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-rust-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-warm-sm">
                <Sparkles className="w-4 h-4 text-dustyrose-200" />
                <span>Next-Generation Placement Accelerator</span>
              </div>
            </div>

            {/* Headline */}
            <h1 className="font-heading text-4xl sm:text-6xl font-extrabold tracking-tight text-warmtext-900 leading-[1.14]">
              Prepare Smarter.<br />
              <span className="gradient-text">Get Placed Faster.</span>
            </h1>

            {/* Body Text */}
            <p className="text-base sm:text-lg text-warmtext-500 max-w-xl leading-relaxed font-sans">
              AI-powered placement preparation platform combining resume audits, aptitude rounds, mock interviews, and skill tracking.
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

          {/* Hero Right Side: 3 Separate Layered Floating Cards */}
          <div className="lg:col-span-5 relative flex items-center justify-center min-h-[380px] w-full py-4">
            
            {/* Card 1: Main Primary Placement Score Card (Center) */}
            <div className="w-full max-w-[310px] bg-[#FFFDFB] rounded-2xl p-5 border border-warmborder border-l-4 border-l-rust-500 shadow-warm-lg space-y-3.5 animate-float-1 relative z-20">
              <div className="flex items-center justify-between border-b border-warmborder/80 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center font-bold text-sm">
                    <Target className="w-4 h-4 text-rust-500" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold font-heading text-warmtext-900">Placement Score</h4>
                    <span className="text-[10px] text-warmtext-500 font-sans">Enterprise Diagnostic</span>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-extrabold text-rust-500 font-mono">87 / 100</div>
                  <span className="text-[9px] text-dustyrose-600 font-bold uppercase font-mono">Top Tier</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="space-y-1.5 pt-0.5">
                <div className="flex justify-between text-[11px] font-bold text-warmtext-700">
                  <span className="font-heading">Placement Readiness</span>
                  <span className="font-mono text-rust-500">87%</span>
                </div>
                <div className="w-full bg-peach-200 rounded-full h-2.5 overflow-hidden">
                  <div className="bg-rust-500 h-full rounded-full transition-all duration-500" style={{ width: '87%' }} />
                </div>
              </div>
            </div>

            {/* Card 2: Smaller Offset Top-Right Badge (92% Match) */}
            <div className="absolute -top-1 right-0 sm:right-2 bg-[#FFFDFB] rounded-xl px-4 py-2.5 border border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-lg flex items-center gap-3 animate-float-2 z-30">
              <div className="w-8 h-8 rounded-full bg-dustyrose-100 text-dustyrose-600 flex items-center justify-center font-extrabold text-xs shadow-warm-sm border border-dustyrose-200 shrink-0">
                <Trophy className="w-4 h-4 text-dustyrose-600" />
              </div>
              <div className="text-left min-w-[110px]">
                <div className="text-xs font-extrabold text-warmtext-900 font-heading">92% Match</div>
                <div className="text-[10px] text-dustyrose-700 font-semibold font-mono">Google & Amazon Track</div>
              </div>
            </div>

            {/* Card 3: Smaller Offset Bottom-Left Badge (Resume ATS Score 94%) */}
            <div className="absolute -bottom-2 left-0 sm:left-2 bg-[#FFFDFB] rounded-xl px-4 py-2.5 border border-warmborder border-l-4 border-l-espresso-500 shadow-warm-lg flex items-center gap-3 animate-float-3 z-30">
              <div className="w-8 h-8 rounded-full bg-espresso-100 text-espresso-700 flex items-center justify-center font-extrabold text-xs shadow-warm-sm border border-espresso-200 shrink-0">
                <Sparkles className="w-4 h-4 text-espresso-700" />
              </div>
              <div className="text-left min-w-[130px]">
                <div className="text-xs font-extrabold text-warmtext-900 font-heading">Resume ATS 94%</div>
                <div className="text-[10px] text-warmtext-500 font-semibold font-mono">Keyword Audit Verified</div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* SIGNATURE SECTION: YOUR PLACEMENT READINESS */}
      <PlacementReadinessSection onOpenAuthModal={onOpenAuthModal} />

      {/* ANIMATED HORIZONTAL STATS STRIP SECTION */}
      <StatsStripSection />

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

      {/* 3. "PREPARE FOR EVERY ROUND" CORE PREP CARDS SECTION */}
      <section className="space-y-8 max-w-7xl mx-auto">
        <div className="space-y-4 max-w-3xl mx-auto text-center">
          <div className="flex items-center justify-center gap-3">
            <div className="h-px bg-rust-400/40 flex-1 max-w-[80px]" />
            <div className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-rust-500 text-[#FFF9F4] text-xs font-bold uppercase tracking-wider shadow-warm-sm">
              <span>✦</span>
              <span>Selection Rounds</span>
            </div>
            <div className="h-px bg-rust-400/40 flex-1 max-w-[80px]" />
          </div>

          <h2 className="text-3xl sm:text-4xl font-extrabold font-serif text-[#FFF9F4] flex items-center justify-center gap-3 tracking-tight">
            <span>Prepare for Every Round</span>
            <span className="text-rust-400 text-xl font-sans">✧</span>
          </h2>

          <div className="flex items-center gap-4 max-w-lg mx-auto">
            <div className="h-px bg-[#E8D9CE]/30 flex-1" />
            <p className="text-xs sm:text-sm text-[#E8D9CE] font-sans">
              Authentic enterprise selection filters with real-time AI diagnostic feedback
            </p>
            <div className="h-px bg-[#E8D9CE]/30 flex-1" />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          
          {/* Card 1: Aptitude */}
          <div 
            onClick={() => navigate('/round/aptitude')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-6 sm:p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-rust-500 shadow-warm-sm space-y-6 relative min-h-[280px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="icon-badge w-12 h-12 rounded-lg bg-rust-100 text-rust-500 flex items-center justify-center border border-warmborder shadow-warm-sm">
                  <Brain className="w-6 h-6 text-rust-500" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-peach-100 border border-warmborder text-warmtext-700">
                  Round 1
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-rust-500 transition-colors">Aptitude</h3>
                <p className="text-[11px] font-mono font-bold text-rust-500">50+ Seeded Questions • 4 Sections</p>
              </div>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">Quantitative speed, logical reasoning, verbal ability, and general awareness tests.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-rust-500 flex items-center gap-1.5 group-hover:text-rust-600">
              <span className="link-text">Start Practice</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 2: Technical */}
          <div 
            onClick={() => navigate('/round/dsa')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-6 sm:p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-sm space-y-6 relative min-h-[280px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="icon-badge w-12 h-12 rounded-lg bg-dustyrose-100 text-dustyrose-600 flex items-center justify-center border border-dustyrose-200 shadow-warm-sm">
                  <Code2 className="w-6 h-6 text-dustyrose-600" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-peach-100 border border-warmborder text-warmtext-700">
                  Round 2
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-dustyrose-600 transition-colors">Technical</h3>
                <p className="text-[11px] font-mono font-bold text-dustyrose-600">1,200+ Questions • 15 Topics</p>
              </div>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">Algorithmic DSA problems, Technical MCQs, machine coding, and system architecture.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-dustyrose-600 flex items-center gap-1.5 group-hover:text-dustyrose-700">
              <span className="link-text">Start Practice</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 3: Resume */}
          <div 
            onClick={() => navigate('/resume')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-6 sm:p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-espresso-500 shadow-warm-sm space-y-6 relative min-h-[280px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="icon-badge w-12 h-12 rounded-lg bg-espresso-100 text-espresso-700 flex items-center justify-center border border-espresso-100 shadow-warm-sm">
                  <FileText className="w-6 h-6 text-espresso-700" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-peach-100 border border-warmborder text-warmtext-700">
                  Audit
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-espresso-700 transition-colors">Resume</h3>
                <p className="text-[11px] font-mono font-bold text-espresso-700">ATS Keyword Match • 20+ Recruiters</p>
              </div>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">ATS optical parser audit, impact sentence re-writing, and personalized resume questions.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-espresso-700 flex items-center gap-1.5 group-hover:text-espresso-900">
              <span className="link-text">Start Practice</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

          {/* Card 4: Interview */}
          <div 
            onClick={() => navigate('/round/interview')}
            className="card-interactive bg-[#FDF4EC] rounded-xl p-6 sm:p-8 flex flex-col justify-between border border-warmborder border-l-4 border-l-rust-500 shadow-warm-sm space-y-6 relative min-h-[280px] cursor-pointer group"
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="icon-badge w-12 h-12 rounded-lg bg-rust-100 text-rust-500 flex items-center justify-center border border-warmborder shadow-warm-sm">
                  <Video className="w-6 h-6 text-rust-500" />
                </div>
                <span className="text-[10px] font-mono font-extrabold px-2.5 py-1 rounded-full bg-peach-100 border border-warmborder text-warmtext-700">
                  Final AI Mock
                </span>
              </div>
              <div className="space-y-1.5">
                <h3 className="text-2xl font-bold font-serif text-warmtext-900 leading-snug group-hover:text-rust-500 transition-colors">Interview</h3>
                <p className="text-[11px] font-mono font-bold text-rust-500">Real-time Telemetry • STAR Audio</p>
              </div>
              <p className="text-xs text-warmtext-500 leading-relaxed font-sans">AI voice mock screens tracking speech pace (WPM), filler words, and facial composure.</p>
            </div>
            <div className="pt-2 text-xs font-bold text-rust-500 flex items-center gap-1.5 group-hover:text-rust-600">
              <span className="link-text">Start Practice</span>
              <ChevronRight className="arrow-icon w-4 h-4" />
            </div>
          </div>

        </div>
      </section>

      {/* DYNAMIC PERSONAL PLACEMENT COACH SECTION */}
      <PlacementCoachSection />

      {/* MONOCHROME TOP COMPANIES HIRING SECTION */}
      <TopCompaniesSection />

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
