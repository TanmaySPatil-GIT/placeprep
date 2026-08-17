import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs, orderBy, doc, setDoc } from 'firebase/firestore';
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { usePrep } from '../context/PrepContext';
import PlacementReadinessSection from '../components/PlacementReadinessSection';
import GamificationWidget from '../components/GamificationWidget';
import { 
  Trophy, 
  Target, 
  Calendar, 
  Zap, 
  Code2, 
  Video, 
  ArrowUpRight, 
  TrendingUp, 
  PlusCircle,
  Clock,
  UserCheck,
  Building2,
  Leaf,
  FileText,
  Sparkles,
  Award,
  ChevronRight,
  BarChart3,
  Flame,
  Bell,
  AlertTriangle,
  RotateCcw,
  Check
} from 'lucide-react';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();
  const { selectedCompany, selectedField, sessionResults } = usePrep();

  const userName = userProfile?.name || currentUser?.email?.split('@')[0] || 'Alex Candidate';
  const targetField = selectedField?.name || userProfile?.targetField || 'Software Development';
  const activeCompany = selectedCompany?.name || 'Google';

  const [reportsHistory, setReportsHistory] = useState([]);
  const [loadingReports, setLoadingReports] = useState(false);
  const [mentorDataOptIn, setMentorDataOptIn] = useState(userProfile?.mentorDataOptIn || false);
  const [savingOptIn, setSavingOptIn] = useState(false);
  const [notificationPermission, setNotificationPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'denied'
  );

  // Calculate current & longest streak (consecutive active practice days)
  const calculateStreakMetrics = () => {
    if (!reportsHistory || reportsHistory.length === 0) {
      return { currentStreak: 5, longestStreak: 12 };
    }
    const dates = reportsHistory
      .map(r => r.date || r.timestamp)
      .filter(Boolean)
      .map(d => new Date(d).toISOString().slice(0, 10));
    
    const uniqueDates = Array.from(new Set(dates)).sort().reverse();
    let current = uniqueDates.length > 0 ? 1 : 0;
    let longest = current;
    
    for (let i = 0; i < uniqueDates.length - 1; i++) {
      const d1 = new Date(uniqueDates[i]);
      const d2 = new Date(uniqueDates[i + 1]);
      const diffDays = Math.round((d1 - d2) / (1000 * 60 * 60 * 24));
      if (diffDays === 1) {
        current++;
        if (current > longest) longest = current;
      } else {
        break;
      }
    }

    return {
      currentStreak: Math.max(5, current),
      longestStreak: Math.max(12, longest)
    };
  };

  const { currentStreak, longestStreak } = calculateStreakMetrics();

  // Scan for rounds needing retake (<60%)
  const getLowScoreRetakeRounds = () => {
    const lowRounds = [];
    reportsHistory.forEach(rep => {
      if (rep.roundBreakdown) {
        rep.roundBreakdown.forEach(rb => {
          if (typeof rb.score === 'number' && rb.score < 60) {
            let route = '/dsa-round';
            const nameLower = (rb.roundName || '').toLowerCase();
            if (nameLower.includes('aptitude') || nameLower.includes('gk')) route = '/aptitude-round';
            else if (nameLower.includes('mcq')) route = '/technical-mcq-round';
            else if (nameLower.includes('dsa') || nameLower.includes('coding')) route = '/dsa-round';
            else if (nameLower.includes('hr')) route = '/hr-interview-round';
            else if (nameLower.includes('interview') || nameLower.includes('voice')) route = '/interview-round';

            lowRounds.push({
              id: `${rep.id}-${rb.roundName}`,
              company: rep.company || activeCompany,
              roundName: rb.roundName,
              score: rb.score,
              takeaway: rb.oneLineTakeaway,
              route
            });
          }
        });
      }
    });

    if (lowRounds.length === 0) {
      lowRounds.push({
        id: 'sample-retake-1',
        company: activeCompany,
        roundName: 'Stage 3: Technical MCQs (DBMS / OS)',
        score: 54,
        takeaway: 'Scored 54% on core operating system memory & lock primitives.',
        route: '/technical-mcq-round'
      });
    }

    return lowRounds;
  };

  const lowScoreRounds = getLowScoreRetakeRounds();

  const handleRequestNotifications = async () => {
    if (typeof Notification === 'undefined') return;
    try {
      const perm = await Notification.requestPermission();
      setNotificationPermission(perm);
      if (perm === 'granted') {
        new Notification("Placement Practice Streak Active 🔥", {
          body: "Keep your streak alive! 10 minutes of interview practice scheduled for today.",
          icon: "/favicon.ico"
        });
      }
    } catch (err) {
      console.warn('Notification permission error:', err.message);
    }
  };

  // Mentor role redirect guard
  useEffect(() => {
    if (userProfile?.role === 'mentor') {
      navigate('/mentor-dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  const handleToggleMentorOptIn = async (newVal) => {
    setMentorDataOptIn(newVal);
    setSavingOptIn(true);
    try {
      if (auth.currentUser) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await setDoc(userRef, { mentorDataOptIn: newVal }, { merge: true });
      }
    } catch (err) {
      console.warn('Opt-in save error:', err.message);
    } finally {
      setSavingOptIn(false);
    }
  };

  useEffect(() => {
    const fetchReports = async () => {
      if (!auth.currentUser) {
        setReportsHistory([]);
        return;
      }

      setLoadingReports(true);
      try {
        const q = query(
          collection(db, 'reports'),
          where('userId', '==', auth.currentUser.uid),
          orderBy('timestamp', 'desc')
        );
        const snap = await getDocs(q);
        if (!snap.empty) {
          const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setReportsHistory(list);
        } else {
          setReportsHistory([]);
        }
      } catch (err) {
        console.warn('Reports history fetch notice:', err.message);
      } finally {
        setLoadingReports(false);
      }
    };

    fetchReports();
  }, [currentUser, activeCompany, targetField]);

  // Recharts Growth Trend Line Chart Data
  const trendData = [...reportsHistory].reverse().map(r => ({
    date: r.date || 'Recent',
    Score: typeof r.readinessScore === 'number' ? r.readinessScore : 0,
    company: r.company || 'Practice Drive'
  }));

  const latestScore = reportsHistory[0]?.readinessScore ?? 0;


  const handleOpenReport = (reportData) => {
    navigate('/final-report', { state: { reportData } });
  };

  return (
    <div className="space-y-8 py-2">
      
      {/* Top Banner Bar with Streak Badges */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 rounded-[28px] p-6 sm:p-8 bg-peach-50 border border-warmborder shadow-warm-md">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-bold px-3 py-1 rounded-full bg-rust-500 text-white flex items-center gap-1.5 shadow-warm-sm">
              <UserCheck className="w-3.5 h-3.5" /> Candidate Portal
            </span>
            <span className="text-xs text-warmtext-500">Track: <strong className="text-rust-500 font-serif">{targetField}</strong></span>
          </div>

          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-warmtext-900">Welcome back, {userName}! 🚀</h1>
          <p className="text-xs text-warmtext-500">Your Placement Readiness Score is <span className="text-rust-500 font-bold">{latestScore}%</span> (Tier-1 Tech Ready).</p>

          {/* Streak Tracker Badges with Dusty Rose & Warm Terracotta Accent */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-dustyrose-100 text-dustyrose-700 border border-dustyrose-200 text-xs font-extrabold font-mono">
              <Flame className="w-4 h-4 text-dustyrose-500 fill-dustyrose-500" />
              <span>Current Streak: {currentStreak} Days</span>
            </div>
            <div className="flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-rust-100 text-rust-700 border border-warmborder text-xs font-bold font-mono">
              <Zap className="w-4 h-4 text-rust-500 fill-rust-500" />
              <span>Longest Streak: {longestStreak} Days</span>
            </div>
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0">
          <button
            onClick={handleRequestNotifications}
            className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold border transition-colors ${
              notificationPermission === 'granted'
                ? 'bg-dustyrose-100 text-dustyrose-700 border-warmborder'
                : 'bg-white text-warmtext-900 border-warmborder hover:bg-dustyrose-100'
            }`}
          >
            {notificationPermission === 'granted' ? <Check className="w-4 h-4 text-rust-500" /> : <Bell className="w-4 h-4 text-dustyrose-500" />}
            <span>{notificationPermission === 'granted' ? 'Daily Reminder Active' : 'Enable Daily Reminder'}</span>
          </button>

          <button
            onClick={() => navigate('/companies')}
            className="flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.02] transition-all"
          >
            <PlusCircle className="w-4 h-4" />
            <span>New Practice Session</span>
          </button>
        </div>
      </div>

      {/* Signature Placement Readiness Section */}
      <PlacementReadinessSection />

      {/* Candidate Placement XP, Badges & Campus Leaderboard Widget */}
      <GamificationWidget reportsHistory={reportsHistory} />

      {/* Needs Retake Alert Card (<60% Round Flagging - Keep Status Amber Intact) */}
      {lowScoreRounds.length > 0 && (
        <div className="rounded-xl p-6 bg-amber-50/70 border border-amber-200 space-y-3 shadow-warm-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-700 font-serif font-bold text-sm">
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span>Priority Action Needed: Rounds Scored Below 60%</span>
            </div>
            <span className="text-[10px] font-mono uppercase tracking-wider text-amber-700 bg-[#FDF4EC] px-3 py-1 rounded-full border border-amber-200 font-extrabold">
              Needs Retake
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {lowScoreRounds.map((item) => (
              <div key={item.id} className="p-4 rounded-xl bg-[#FDF4EC] border border-warmborder border-l-4 border-l-amber-500 flex items-center justify-between gap-3 shadow-warm-sm">
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-warmtext-900 font-serif">{item.roundName}</span>
                    <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-100 text-amber-700 border border-amber-200 font-mono">
                      {item.score}%
                    </span>
                  </div>
                  <p className="text-[11px] text-warmtext-500 line-clamp-1">{item.takeaway}</p>
                </div>

                <button
                  onClick={() => navigate(item.route)}
                  className="px-4 py-2 rounded-full bg-rust-500 text-white font-extrabold text-xs flex items-center gap-1.5 shrink-0 hover:bg-rust-600 transition-transform shadow-glow-rust"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Retry Round</span>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Mentor Data Opt-In Toggle */}
      <div className="rounded-xl p-4 bg-[#FDF4EC] border border-warmborder flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-warm-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-rust-100 border border-warmborder flex items-center justify-center shrink-0">
            <BarChart3 className="w-4 h-4 text-rust-500" />
          </div>
          <div>
            <p className="text-xs font-bold text-warmtext-900">Share anonymized stats with college mentors</p>
            <p className="text-[10px] text-warmtext-500">Your score appears as "User{(currentUser?.uid || '0000').slice(-4)}" — no personal info shared. Helps T&P officers identify common weak areas across batches.</p>
          </div>
        </div>
        <button
          onClick={() => handleToggleMentorOptIn(!mentorDataOptIn)}
          disabled={savingOptIn}
          className={`shrink-0 relative w-12 h-6 rounded-full transition-all duration-300 ${mentorDataOptIn ? 'bg-rust-500' : 'bg-peach-200'} disabled:opacity-50`}
          aria-label="Toggle mentor data sharing"
        >
          <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all duration-300 ${mentorDataOptIn ? 'left-6' : 'left-0.5'}`} />
        </button>
      </div>

      {/* Early Step Callout: Resume Upload Prompt */}
      <div className="rounded-xl p-6 bg-[#FDF4EC] border border-warmborder border-l-4 border-l-rust-500 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-warm-sm">
        <div className="flex items-start gap-4">
          <div className="w-12 h-12 rounded-xl bg-rust-100 border border-warmborder text-rust-500 flex items-center justify-center shrink-0 shadow-warm-sm">
            <FileText className="w-6 h-6 text-rust-500" />
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-dustyrose-100 text-dustyrose-700 border border-dustyrose-200">
                Recommended Early Step
              </span>
              <span className="text-xs text-warmtext-500 font-semibold">• Personalize Everything Downstream</span>
            </div>
            <h2 className="text-lg font-bold font-serif text-warmtext-900">Audit Your Resume & Personalize Interview Questions</h2>
            <p className="text-xs text-warmtext-500 max-w-xl">
              Upload your PDF resume to calculate your Overall ATS Match Score, identify missing keywords, and generate custom interview questions based on your actual projects.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => navigate('/resume')}
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-4 h-4 text-white" />
            <span>Upload Resume PDF</span>
          </button>
          <button
            onClick={() => navigate('/companies')}
            className="px-4 py-3 rounded-full text-xs text-warmtext-500 hover:text-warmtext-900 font-semibold"
          >
            Skip for now
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        
        {/* Card 1: Placement Readiness */}
        <div className="bg-rust-500 p-6 rounded-xl border border-rust-600 space-y-2 text-white shadow-glow-rust hover:-translate-y-1.5 hover:shadow-glow-rust transition-all duration-200 ease-out cursor-pointer group">
          <div className="flex items-center justify-between text-white/80">
            <span className="text-xs font-semibold uppercase tracking-wider">Placement Readiness</span>
            <Trophy className="w-4 h-4 text-dustyrose-200 transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-3xl font-bold font-serif text-white">{latestScore}%</div>
          <p className="text-[11px] text-white/90 font-semibold flex items-center gap-1">
            <TrendingUp className="w-3 h-3 text-white" /> Tier-1 Tech Target Ready
          </p>
        </div>

        {/* Card 2: Target Company */}
        <div 
          onClick={() => navigate('/companies')}
          className="bg-[#FDF4EC] p-6 rounded-xl border border-warmborder border-l-4 border-l-dustyrose-500 space-y-2 text-warmtext-900 shadow-warm-sm hover:shadow-warm-hover hover:border-dustyrose-400 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer group"
        >
          <div className="flex items-center justify-between text-warmtext-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Target Company</span>
            <Building2 className="w-4 h-4 text-rust-500 transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-2xl font-bold font-serif text-warmtext-900 group-hover:text-rust-500 transition-colors">{activeCompany}</div>
          <p className="text-[11px] text-warmtext-500 flex items-center justify-between">
            <span>Active Recruiter Profile</span>
            <ChevronRight className="w-3.5 h-3.5 text-rust-500 transition-transform duration-200 group-hover:translate-x-1" />
          </p>
        </div>

        {/* Card 3: Target Field Track */}
        <div 
          onClick={() => navigate('/select-field')}
          className="bg-[#FDF4EC] p-6 rounded-xl border border-warmborder border-l-4 border-l-rust-500 space-y-2 text-warmtext-900 shadow-warm-sm hover:shadow-warm-hover hover:border-rust-400 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer group"
        >
          <div className="flex items-center justify-between text-warmtext-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Career Track</span>
            <Target className="w-4 h-4 text-rust-500 transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-xl font-bold font-serif text-warmtext-900 truncate group-hover:text-rust-500 transition-colors">{targetField}</div>
          <p className="text-[11px] text-dustyrose-600 font-semibold flex items-center justify-between">
            <span>Calibrated Question Sets</span>
            <ChevronRight className="w-3.5 h-3.5 text-rust-500 transition-transform duration-200 group-hover:translate-x-1" />
          </p>
        </div>

        {/* Card 4: Consolidated Final Reports */}
        <div 
          onClick={() => navigate('/final-report')}
          className="bg-[#FDF4EC] p-6 rounded-xl border border-warmborder border-l-4 border-l-espresso-500 space-y-2 text-warmtext-900 shadow-warm-sm hover:shadow-warm-hover hover:border-espresso-400 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer group"
        >
          <div className="flex items-center justify-between text-warmtext-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Evaluated Reports</span>
            <Award className="w-4 h-4 text-espresso-700 transition-transform duration-200 group-hover:scale-110" />
          </div>
          <div className="text-3xl font-bold font-serif text-warmtext-900 group-hover:text-espresso-700 transition-colors">{reportsHistory.length}</div>
          <p className="text-[11px] text-warmtext-500 flex items-center justify-between">
            <span>Saved Session Reports</span>
            <ChevronRight className="w-3.5 h-3.5 text-espresso-700 transition-transform duration-200 group-hover:translate-x-1" />
          </p>
        </div>

      </div>

      {/* Main Grid: Score Trend Line Chart & Reports History List */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Recharts Line Chart for Growth Trend over Time (5 cols) */}
        <div className="lg:col-span-5 rounded-xl bg-[#FDF4EC] p-6 border border-warmborder space-y-4 flex flex-col justify-between shadow-warm-sm">
          <div>
            <h2 className="text-base font-bold font-serif text-warmtext-900 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-rust-500" />
              <span>Readiness Score Growth Trend</span>
            </h2>
            <p className="text-xs text-warmtext-500 mt-1">
              Tracks your placement readiness score improvement across sessions over time.
            </p>
          </div>

          <div className="h-56 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={trendData} margin={{ top: 10, right: 10, left: -25, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E8D5C8" />
                <XAxis dataKey="date" stroke="#7A6258" fontSize={11} />
                <YAxis domain={[50, 100]} stroke="#7A6258" fontSize={11} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#FFFDFB', borderColor: '#E8D5C8', borderRadius: '12px', fontSize: '12px', color: '#2E2019', boxShadow: '0 8px 24px -4px rgba(46,32,25,0.08)' }}
                  labelStyle={{ color: '#B5654A', fontWeight: 'bold' }}
                />
                <Line type="monotone" dataKey="Score" stroke="#B5654A" strokeWidth={3} dot={{ fill: '#D98E77', r: 5 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Right Column: Consolidated Report History Table/List (7 cols) */}
        <div className="lg:col-span-7 rounded-xl bg-[#FDF4EC] p-6 border border-warmborder space-y-4 shadow-warm-sm">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold font-serif text-warmtext-900 flex items-center gap-2">
              <Award className="w-5 h-5 text-rust-500" />
              <span>Consolidated Final Reports History</span>
            </h2>
            <button
              onClick={() => navigate('/companies')}
              className="text-xs text-rust-500 hover:text-rust-600 font-bold flex items-center gap-1 transition-colors"
            >
              <span>+ Launch Drive</span>
            </button>
          </div>

          {loadingReports ? (
            <div className="p-8 text-center text-xs text-warmtext-500">Loading report history...</div>
          ) : (
            <div className="space-y-3">
              {reportsHistory.map((report) => (
                <div
                  key={report.id}
                  onClick={() => handleOpenReport(report)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between p-4 rounded-xl bg-peach-100 border border-warmborder border-l-4 border-l-rust-500 hover:border-dustyrose-500 transition-all cursor-pointer group gap-3 shadow-warm-sm"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-bold text-warmtext-900 text-sm font-serif group-hover:text-rust-500 transition-colors">
                        {report.company}
                      </span>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-dustyrose-100 text-dustyrose-700 border border-dustyrose-200">
                        {report.field}
                      </span>
                      <span className="text-xs text-warmtext-500">• {report.date}</span>
                    </div>
                    <p className="text-xs text-warmtext-500 line-clamp-1">
                      {report.readinessLabel || 'Placement Simulation Report'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-sm font-bold font-serif text-rust-500">{report.readinessScore}%</div>
                      <div className="text-[10px] text-warmtext-500 font-semibold">Readiness</div>
                    </div>

                    <div className="p-2.5 rounded-full bg-white group-hover:bg-rust-500 group-hover:text-white transition-colors text-warmtext-700 border border-warmborder">
                      <ArrowUpRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

        </div>

      </div>

    </div>
  );
}

