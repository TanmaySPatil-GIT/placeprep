import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, query, where, getDocs } from 'firebase/firestore';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  LineChart,
  Line,
  Legend,
  Cell
} from 'recharts';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import {
  School,
  Users,
  BarChart3,
  TrendingUp,
  AlertTriangle,
  Award,
  Target,
  Building2,
  ChevronRight,
  Sparkles,
  Eye,
  EyeOff,
  RefreshCw
} from 'lucide-react';

// ─── Seeded Mock Data ─────────────────────────────────────────────────────────
const MOCK_STUDENTS = [
  { id: 'u1a2', company: 'Google', field: 'SDE', overallScore: 88, sessions: 4, completedFull: true, weaknesses: ['System Design', 'STAR Format'], rounds: { aptitude: 85, dsa: 92, techInterview: 88, hr: 80 }, date: '2026-08-10' },
  { id: 'u3b4', company: 'Amazon', field: 'SDE', overallScore: 76, sessions: 3, completedFull: true, weaknesses: ['Dynamic Programming', 'Confidence'], rounds: { aptitude: 78, dsa: 74, techInterview: 76, hr: 82 }, date: '2026-08-09' },
  { id: 'u5c6', company: 'Microsoft', field: 'SDE', overallScore: 81, sessions: 2, completedFull: true, weaknesses: ['STAR Format', 'Logical Reasoning'], rounds: { aptitude: 80, dsa: 85, techInterview: 79, hr: 77 }, date: '2026-08-09' },
  { id: 'u7d8', company: 'TCS Digital', field: 'SDE', overallScore: 68, sessions: 5, completedFull: false, weaknesses: ['Aptitude Speed', 'Verbal Communication'], rounds: { aptitude: 62, dsa: 70, techInterview: 68, hr: 72 }, date: '2026-08-08' },
  { id: 'u9e0', company: 'Infosys', field: 'Data Science', overallScore: 72, sessions: 2, completedFull: true, weaknesses: ['Dynamic Programming', 'System Design'], rounds: { aptitude: 75, dsa: 68, techInterview: 72, hr: 78 }, date: '2026-08-08' },
  { id: 'uaf1', company: 'Google', field: 'SDE', overallScore: 91, sessions: 6, completedFull: true, weaknesses: ['Filler Words'], rounds: { aptitude: 90, dsa: 95, techInterview: 91, hr: 88 }, date: '2026-08-07' },
  { id: 'ubg2', company: 'Flipkart', field: 'SDE', overallScore: 79, sessions: 3, completedFull: false, weaknesses: ['Logical Reasoning', 'STAR Format'], rounds: { aptitude: 74, dsa: 82, techInterview: 78, hr: 75 }, date: '2026-08-07' },
  { id: 'uch3', company: 'Amazon', field: 'Cloud/DevOps', overallScore: 84, sessions: 4, completedFull: true, weaknesses: ['System Design', 'Networking Concepts'], rounds: { aptitude: 82, dsa: 85, techInterview: 84, hr: 86 }, date: '2026-08-06' },
  { id: 'udi4', company: 'Wipro', field: 'SDE', overallScore: 65, sessions: 1, completedFull: false, weaknesses: ['Aptitude Speed', 'Confidence', 'STAR Format'], rounds: { aptitude: 58, dsa: 65, techInterview: 62, hr: 70 }, date: '2026-08-05' },
  { id: 'uej5', company: 'Cognizant', field: 'SDE', overallScore: 70, sessions: 2, completedFull: true, weaknesses: ['Dynamic Programming', 'Logical Reasoning'], rounds: { aptitude: 68, dsa: 72, techInterview: 70, hr: 74 }, date: '2026-08-05' },
  { id: 'ufk6', company: 'Google', field: 'ML/AI', overallScore: 87, sessions: 5, completedFull: true, weaknesses: ['System Design'], rounds: { aptitude: 88, dsa: 90, techInterview: 86, hr: 84 }, date: '2026-08-04' },
  { id: 'ugl7', company: 'Zomato', field: 'SDE', overallScore: 73, sessions: 2, completedFull: false, weaknesses: ['STAR Format', 'Verbal Communication'], rounds: { aptitude: 70, dsa: 75, techInterview: 73, hr: 68 }, date: '2026-08-04' },
  { id: 'uhm8', company: 'Paytm', field: 'FinTech', overallScore: 69, sessions: 3, completedFull: true, weaknesses: ['Confidence', 'Dynamic Programming'], rounds: { aptitude: 65, dsa: 70, techInterview: 69, hr: 72 }, date: '2026-08-03' },
  { id: 'uin9', company: 'Microsoft', field: 'Cloud/DevOps', overallScore: 83, sessions: 4, completedFull: true, weaknesses: ['Logical Reasoning'], rounds: { aptitude: 80, dsa: 84, techInterview: 85, hr: 82 }, date: '2026-08-03' },
  { id: 'ujo0', company: 'TCS Digital', field: 'SDE', overallScore: 71, sessions: 2, completedFull: false, weaknesses: ['Aptitude Speed', 'Dynamic Programming'], rounds: { aptitude: 65, dsa: 72, techInterview: 70, hr: 76 }, date: '2026-08-02' },
  { id: 'ukp1', company: 'Amazon', field: 'SDE', overallScore: 78, sessions: 3, completedFull: true, weaknesses: ['STAR Format', 'Filler Words'], rounds: { aptitude: 76, dsa: 80, techInterview: 77, hr: 79 }, date: '2026-08-02' },
  { id: 'ulq2', company: 'Flipkart', field: 'ML/AI', overallScore: 82, sessions: 3, completedFull: true, weaknesses: ['System Design', 'Confidence'], rounds: { aptitude: 80, dsa: 83, techInterview: 82, hr: 84 }, date: '2026-08-01' },
  { id: 'umr3', company: 'Infosys', field: 'SDE', overallScore: 67, sessions: 2, completedFull: false, weaknesses: ['Aptitude Speed', 'STAR Format', 'Confidence'], rounds: { aptitude: 60, dsa: 68, techInterview: 66, hr: 72 }, date: '2026-08-01' },
  { id: 'uns4', company: 'Google', field: 'SDE', overallScore: 85, sessions: 4, completedFull: true, weaknesses: ['Dynamic Programming'], rounds: { aptitude: 84, dsa: 88, techInterview: 85, hr: 82 }, date: '2026-07-31' },
  { id: 'uot5', company: 'Swiggy', field: 'SDE', overallScore: 74, sessions: 2, completedFull: true, weaknesses: ['System Design', 'Logical Reasoning'], rounds: { aptitude: 72, dsa: 76, techInterview: 74, hr: 78 }, date: '2026-07-31' }
];

const WEEK_TREND = [
  { week: 'Jul 21', avgScore: 71, sessions: 8 },
  { week: 'Jul 28', avgScore: 74, sessions: 12 },
  { week: 'Aug 4', avgScore: 77, sessions: 15 },
  { week: 'Aug 11', avgScore: 79, sessions: 20 }
];

// ─── Helpers ──────────────────────────────────────────────────────────────────
const avg = (arr) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : 0;

const getCompanyStats = (students) => {
  const map = {};
  students.forEach(s => {
    if (!map[s.company]) map[s.company] = [];
    map[s.company].push(s.overallScore);
  });
  return Object.entries(map)
    .map(([company, scores]) => ({ company, avgScore: avg(scores), count: scores.length }))
    .sort((a, b) => b.avgScore - a.avgScore);
};

const getWeaknessFrequency = (students) => {
  const map = {};
  students.forEach(s => s.weaknesses.forEach(w => { map[w] = (map[w] || 0) + 1; }));
  return Object.entries(map)
    .map(([weakness, count]) => ({ weakness, count }))
    .sort((a, b) => b.count - a.count);
};

const getRoundFunnel = (students) => {
  const total = students.length;
  const withAptitude  = students.filter(s => s.rounds.aptitude > 0).length;
  const withDsa       = students.filter(s => s.rounds.dsa > 0).length;
  const withTech      = students.filter(s => s.rounds.techInterview > 0).length;
  const withFull      = students.filter(s => s.completedFull).length;
  return [
    { round: 'Aptitude',       count: withAptitude },
    { round: 'Coding DSA',     count: withDsa },
    { round: 'Tech Interview', count: withTech },
    { round: 'Full Report',    count: withFull }
  ];
};

const BAR_COLORS = ['#c9a96e', '#88a86a', '#d4956b', '#7ca8c0', '#b07ab0', '#6abfa6', '#c96e7f', '#a0c96e'];

// ─── Custom Tooltip ────────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-forest-900 border border-forest-600/60 rounded-xl px-3 py-2 text-xs text-earth-cream shadow-earthy">
      <p className="font-bold font-serif mb-0.5">{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color }}>{p.name}: <strong>{p.value}</strong>{p.name.toLowerCase().includes('score') ? '%' : ''}</p>
      ))}
    </div>
  );
};

// ─── Component ────────────────────────────────────────────────────────────────
export default function MentorDashboardPage() {
  const navigate = useNavigate();
  const { userProfile, currentUser } = useAuth();

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showIds, setShowIds] = useState(false);

  const mentorName = userProfile?.name || currentUser?.email?.split('@')[0] || 'Placement Officer';
  const institution = userProfile?.mentorInfo?.institution || 'Your Institution';
  const roleTitle   = userProfile?.mentorInfo?.roleTitle   || 'Placement Cell';

  // Attempt live Firestore query; fall back to seeded mock
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        if (auth.currentUser) {
          const q = query(
            collection(db, 'users'),
            where('mentorDataOptIn', '==', true),
            where('role', '==', 'student')
          );
          const snap = await getDocs(q);
          if (!snap.empty) {
            const live = snap.docs.map(d => {
              const data = d.data();
              const uid = d.id;
              return {
                id: uid.slice(-4),
                company: data.selectedCompany || data.targetCompanies?.[0] || 'Unknown',
                field: data.targetField || 'SDE',
                overallScore: data.lastReportScore || 75,
                sessions: data.sessionCount || 1,
                completedFull: !!data.lastReportTimestamp,
                weaknesses: data.lastReportWeaknesses || [],
                rounds: data.lastReportRounds || { aptitude: 0, dsa: 0, techInterview: 0, hr: 0 },
                date: data.lastReportTimestamp || new Date().toISOString().slice(0, 10)
              };
            });
            setStudents(live);
            return;
          }
        }
        // Fallback to demo mock data
        setStudents(MOCK_STUDENTS);
      } catch (err) {
        console.warn('Mentor Firestore fetch notice:', err.message);
        setStudents(MOCK_STUDENTS);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (students.length > 0) setLoading(false);
  }, [students]);

  // Guard: non-mentors get redirected
  useEffect(() => {
    if (userProfile && userProfile.role !== 'mentor') {
      navigate('/dashboard', { replace: true });
    }
  }, [userProfile, navigate]);

  // ── Computed Stats
  const totalStudents = students.length;
  const completionRate = totalStudents ? Math.round((students.filter(s => s.completedFull).length / totalStudents) * 100) : 0;
  const avgOverallScore = avg(students.map(s => s.overallScore));
  const topCompany = getCompanyStats(students)[0]?.company || 'Google';
  const topWeakness = getWeaknessFrequency(students)[0]?.weakness || 'Dynamic Programming';

  const companyStats = getCompanyStats(students);
  const weaknessFreq = getWeaknessFrequency(students);
  const funnelData   = getRoundFunnel(students);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24 space-y-4 flex-col">
        <RefreshCw className="w-8 h-8 text-accent-gold animate-spin" />
        <p className="text-xs text-earth-cream/70">Loading placement analytics...</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-2">

      {/* ── Header Banner ── */}
      <div className="rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-forest-800 via-forest-900 to-earth-brown border border-sage-500/40 shadow-earthy flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sage-500/25 text-sage-400 border border-sage-400/30 flex items-center gap-1.5">
              <School className="w-3.5 h-3.5" /> Mentor Dashboard
            </span>
            <span className="text-xs text-earth-cream/60">{institution} · {roleTitle}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-earth-cream">
            Welcome, {mentorName} 📊
          </h1>
          <p className="text-xs text-earth-cream/70 max-w-xl">
            Aggregate analytics across opted-in students. All scores are anonymized — no personal data is visible.
          </p>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setShowIds(prev => !prev)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-full text-xs font-bold bg-forest-900 border border-forest-600/40 text-earth-cream hover:bg-forest-700 transition-colors"
          >
            {showIds ? <EyeOff className="w-4 h-4 text-sage-400" /> : <Eye className="w-4 h-4 text-sage-400" />}
            {showIds ? 'Hide IDs' : 'Show Anon. IDs'}
          </button>
          <button
            onClick={() => navigate('/companies')}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-gradient-to-r from-sage-500 to-sage-400 text-forest-900 font-extrabold text-xs shadow-glow-gold hover:scale-[1.02] transition-all"
          >
            <Sparkles className="w-4 h-4" />
            <span>View as Student</span>
          </button>
        </div>
      </div>

      {/* ── KPI Row ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Opted-In Students', value: totalStudents, unit: '', icon: Users, color: 'text-sage-400', bg: 'bg-sage-500/15 border-sage-500/30' },
          { label: 'Avg Overall Score', value: avgOverallScore, unit: '%', icon: Award, color: 'text-accent-gold', bg: 'bg-accent-gold/15 border-accent-gold/30' },
          { label: 'Full Pipeline Rate', value: completionRate, unit: '%', icon: Target, color: 'text-earth-tan', bg: 'bg-earth-tan/15 border-earth-tan/30' },
          { label: 'Most Practiced', value: topCompany, unit: '', icon: Building2, color: 'text-sage-300', bg: 'bg-forest-700/60 border-forest-600/40' }
        ].map(({ label, value, unit, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-2xl p-4 ${bg} border space-y-2 backdrop-blur-md shadow-earthy`}>
            <div className="flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-earth-cream/60">{label}</span>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div className={`text-2xl font-extrabold font-serif ${color}`}>{value}{unit}</div>
          </div>
        ))}
      </div>

      {/* ── Charts Row 1: Trend Line + Avg by Company ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Score Trend Line Chart */}
        <div className="rounded-2xl bg-forest-800/90 p-5 border border-forest-600/40 shadow-earthy space-y-3">
          <div className="flex items-center gap-2 border-b border-forest-600/30 pb-2">
            <TrendingUp className="w-4 h-4 text-accent-gold" />
            <h2 className="text-sm font-bold font-serif text-earth-cream">Average Score Trend</h2>
            <span className="ml-auto text-[10px] text-earth-cream/50">Last 4 weeks</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={WEEK_TREND} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="week" tick={{ fill: '#a09080', fontSize: 10 }} />
              <YAxis domain={[60, 100]} tick={{ fill: '#a09080', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Line type="monotone" dataKey="avgScore" name="Avg Score" stroke="#c9a96e" strokeWidth={2.5} dot={{ r: 4, fill: '#c9a96e' }} />
              <Line type="monotone" dataKey="sessions" name="Sessions" stroke="#88a86a" strokeWidth={2} strokeDasharray="4 2" dot={{ r: 3, fill: '#88a86a' }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Company Avg Bar Chart */}
        <div className="rounded-2xl bg-forest-800/90 p-5 border border-forest-600/40 shadow-earthy space-y-3">
          <div className="flex items-center gap-2 border-b border-forest-600/30 pb-2">
            <BarChart3 className="w-4 h-4 text-accent-gold" />
            <h2 className="text-sm font-bold font-serif text-earth-cream">Avg Score by Company</h2>
            <span className="ml-auto text-[10px] text-earth-cream/50">60% = pass bar</span>
          </div>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={companyStats.slice(0, 8)} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
              <XAxis dataKey="company" tick={{ fill: '#a09080', fontSize: 9 }} />
              <YAxis domain={[0, 100]} tick={{ fill: '#a09080', fontSize: 10 }} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="avgScore" name="Avg Score" radius={[4, 4, 0, 0]}>
                {companyStats.slice(0, 8).map((_, i) => (
                  <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Charts Row 2: Weakness Freq + Completion Funnel ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Weakness Frequency */}
        <div className="rounded-2xl bg-forest-800/90 p-5 border border-forest-600/40 shadow-earthy space-y-3">
          <div className="flex items-center gap-2 border-b border-forest-600/30 pb-2">
            <AlertTriangle className="w-4 h-4 text-earth-terracotta" />
            <h2 className="text-sm font-bold font-serif text-earth-cream">Top Weakness Patterns</h2>
            <span className="ml-auto text-[10px] text-earth-cream/50">Across all students</span>
          </div>
          <div className="space-y-2">
            {weaknessFreq.slice(0, 7).map(({ weakness, count }, i) => {
              const pct = Math.round((count / totalStudents) * 100);
              return (
                <div key={weakness} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className={`font-semibold ${i === 0 ? 'text-earth-terracotta' : 'text-earth-cream/80'}`}>{weakness}</span>
                    <span className="font-mono text-earth-cream/60 text-[10px]">{count} students ({pct}%)</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-forest-700">
                    <div
                      className={`h-1.5 rounded-full ${i === 0 ? 'bg-earth-terracotta' : i < 3 ? 'bg-earth-tan' : 'bg-sage-500'}`}
                      style={{ width: `${pct}%`, transition: 'width 0.6s ease' }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Completion Funnel */}
        <div className="rounded-2xl bg-forest-800/90 p-5 border border-forest-600/40 shadow-earthy space-y-3">
          <div className="flex items-center gap-2 border-b border-forest-600/30 pb-2">
            <ChevronRight className="w-4 h-4 text-sage-400" />
            <h2 className="text-sm font-bold font-serif text-earth-cream">Round Completion Funnel</h2>
            <span className="ml-auto text-[10px] text-earth-cream/50">{totalStudents} total students</span>
          </div>
          <ResponsiveContainer width="100%" height={195}>
            <BarChart data={funnelData} layout="vertical" margin={{ top: 5, right: 30, left: 10, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
              <XAxis type="number" domain={[0, totalStudents]} tick={{ fill: '#a09080', fontSize: 10 }} />
              <YAxis dataKey="round" type="category" tick={{ fill: '#a09080', fontSize: 10 }} width={90} />
              <Tooltip content={<ChartTooltip />} />
              <Bar dataKey="count" name="Students" fill="#88a86a" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ── Anonymized Student Table ── */}
      <div className="rounded-2xl bg-forest-800/90 p-5 border border-forest-600/40 shadow-earthy space-y-4">
        <div className="flex items-center gap-2 border-b border-forest-600/30 pb-3">
          <Users className="w-4 h-4 text-accent-gold" />
          <h2 className="text-sm font-bold font-serif text-earth-cream">Per-Student Overview (Anonymized)</h2>
          <span className="ml-auto text-[10px] bg-sage-500/20 text-sage-400 border border-sage-500/30 px-2.5 py-0.5 rounded-full font-bold">
            {totalStudents} Students
          </span>
        </div>

        <div className="overflow-x-auto rounded-xl">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-forest-600/40">
                {['Student', 'Company', 'Field', 'Overall', 'Sessions', 'Status'].map(h => (
                  <th key={h} className="text-left py-2 px-3 text-[10px] font-bold uppercase text-earth-cream/50 tracking-wider whitespace-nowrap">
                    {h}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-forest-600/20">
              {students.map((s, i) => (
                <tr key={s.id} className="hover:bg-forest-700/40 transition-colors">
                  <td className="py-2.5 px-3 font-mono text-earth-cream/70">
                    {showIds ? `User${s.id}` : `User****`}
                  </td>
                  <td className="py-2.5 px-3 font-semibold text-earth-cream">{s.company}</td>
                  <td className="py-2.5 px-3 text-earth-cream/70">{s.field}</td>
                  <td className="py-2.5 px-3">
                    <span className={`font-extrabold font-mono ${s.overallScore >= 80 ? 'text-sage-400' : s.overallScore >= 65 ? 'text-accent-gold' : 'text-earth-terracotta'}`}>
                      {s.overallScore}%
                    </span>
                  </td>
                  <td className="py-2.5 px-3 text-earth-cream/60 font-mono">{s.sessions}</td>
                  <td className="py-2.5 px-3">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                      s.completedFull
                        ? 'bg-sage-500/20 text-sage-400 border-sage-500/30'
                        : 'bg-earth-tan/20 text-earth-tan border-earth-tan/30'
                    }`}>
                      {s.completedFull ? '✓ Completed' : 'In Progress'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <p className="text-[10px] text-earth-cream/40 italic pt-1">
          * All student identifiers are anonymized. Data includes only students who explicitly opted in from their dashboard.
        </p>
      </div>

      {/* ── Top Weakness Alert Card ── */}
      <div className="rounded-2xl p-5 bg-earth-terracotta/10 border border-earth-terracotta/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <AlertTriangle className="w-5 h-5 text-earth-terracotta shrink-0" />
          <div>
            <p className="text-sm font-bold font-serif text-earth-cream">Cohort-Wide Priority: <span className="text-earth-terracotta">{topWeakness}</span></p>
            <p className="text-xs text-earth-cream/70">
              {weaknessFreq[0]?.count || 0} of {totalStudents} opted-in students show this as a top weakness. Consider scheduling a focused workshop or targeted content.
            </p>
          </div>
        </div>
        <button
          onClick={() => navigate('/companies')}
          className="shrink-0 px-5 py-2.5 rounded-full bg-earth-terracotta text-white font-extrabold text-xs hover:scale-[1.02] transition-all"
        >
          View Course Catalog
        </button>
      </div>

    </div>
  );
}
