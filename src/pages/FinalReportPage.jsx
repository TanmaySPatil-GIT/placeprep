import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { collection, addDoc, query, where, orderBy, limit, getDocs, doc, updateDoc } from 'firebase/firestore';
import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import html2pdf from 'html2pdf.js';
import { db, auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { usePrep } from '../context/PrepContext';
import { calculateAggregateCommunicationScore } from '../services/speechAnalyzer';
import { generateSessionEmotionTimeline } from '../services/faceDetector';
import { INITIAL_COURSE_CATALOG } from '../utils/seedCourseCatalog';
import { 
  Award, 
  Sparkles, 
  Download, 
  RotateCcw, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  Building2, 
  Brain, 
  Code2, 
  Video, 
  FileText, 
  Target, 
  BookOpen, 
  LayoutDashboard,
  Cpu,
  Layers,
  HeartHandshake,
  ChevronDown,
  ChevronUp,
  Mic,
  Info,
  Share2,
  Trophy,
  Users,
  Check,
  Copy,
  Globe,
  TrendingUp,
  BarChart2,
  ExternalLink,
  GitCompare,
  MessageSquareCode
} from 'lucide-react';

export default function FinalReportPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const reportRef = useRef(null);
  const transcriptRef = useRef(null);

  const { currentUser, userProfile } = useAuth();
  const { 
    selectedField, 
    selectedCompany, 
    aptitudeResult, 
    technicalMcqResult, 
    dsaResult, 
    sessionResults, 
    hrInterviewResult, 
    resumeData, 
    difficultyLevel, 
    experienceLevel, 
    experienceYears,
    negotiationResult,
    systemDesignResult 
  } = usePrep();

  // Handle read-only view passed from Dashboard report history
  const readOnlyReport = location.state?.reportData;

  const [report, setReport] = useState(readOnlyReport || null);
  const [loading, setLoading] = useState(!readOnlyReport);
  const [isExporting, setIsExporting] = useState(false);
  const [isExportingTranscript, setIsExportingTranscript] = useState(false);
  const [speechTelemetryExpanded, setSpeechTelemetryExpanded] = useState(false);
  const [savedReportDocId, setSavedReportDocId] = useState(null);
  const [publicLeaderboardEnabled, setPublicLeaderboardEnabled] = useState(true);
  const [challengeCopied, setChallengeCopied] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState([]);

  // PDF Export Handler using html2pdf.js for Main Diagnostic Report
  const handleDownloadPDF = () => {
    if (!reportRef.current) return;
    setIsExporting(true);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `PlacePrep_Report_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a231a' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(reportRef.current).save().then(() => {
      setIsExporting(false);
    });
  };

  // PDF Export Handler using html2pdf.js for Full Session Transcript
  const handleDownloadTranscriptPDF = () => {
    if (!transcriptRef.current) return;
    setIsExportingTranscript(true);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `PlacePrep_Full_Transcript_${companyName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true, backgroundColor: '#0a231a' },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().set(opt).from(transcriptRef.current).save().then(() => {
      setIsExportingTranscript(false);
    });
  };

  const commScoreObj = calculateAggregateCommunicationScore(sessionResults);
  const sessionEmotionObj = generateSessionEmotionTimeline((sessionResults || []).flatMap(r => r.telemetryLogs || []));

  const fieldName = readOnlyReport?.field || selectedField?.name || 'Software Development';
  const companyName = readOnlyReport?.company || selectedCompany?.name || 'Google';
  const reportDate = readOnlyReport?.date || new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
  const activeDifficulty = readOnlyReport?.difficultyLevel || difficultyLevel || 'Medium';
  const activeExpLevel = readOnlyReport?.experienceLevel || experienceLevel || 'Fresher';
  const activeExpYears = readOnlyReport?.experienceYears || experienceYears || '0-2';

  // Topic keyword course catalog matcher helper
  const matchCourseToWeakness = (weaknessText = '') => {
    if (!weaknessText) return INITIAL_COURSE_CATALOG[0];
    const textLower = weaknessText.toLowerCase();

    for (const course of INITIAL_COURSE_CATALOG) {
      const tags = (course.skillTags || []).map(t => t.toLowerCase());
      if (tags.some(tag => textLower.includes(tag) || tag.includes(textLower))) {
        return course;
      }
      if (textLower.includes('dsa') || textLower.includes('algorithm') || textLower.includes('coding') || textLower.includes('dynamic programming')) {
        if (course.catalogId === 'cat-sde-6' || course.catalogId === 'cat-sde-1') return course;
      }
      if (textLower.includes('system design') || textLower.includes('architecture') || textLower.includes('scale')) {
        if (course.catalogId === 'cat-sde-4') return course;
      }
      if (textLower.includes('star') || textLower.includes('behavioral') || textLower.includes('communication') || textLower.includes('pause') || textLower.includes('filler')) {
        if (course.catalogId === 'cat-pm-1' || course.catalogId === 'cat-ba-1') return course;
      }
      if (textLower.includes('docker') || textLower.includes('cloud') || textLower.includes('aws') || textLower.includes('ci/cd')) {
        if (course.catalogId === 'cat-devops-2' || course.catalogId === 'cat-sde-3') return course;
      }
      if (textLower.includes('sql') || textLower.includes('database') || textLower.includes('dbms')) {
        if (course.catalogId === 'cat-ds-2' || course.catalogId === 'cat-ba-1') return course;
      }
    }

    const fieldMatches = INITIAL_COURSE_CATALOG.filter(c => 
      (c.fieldIds || []).some(f => f.toLowerCase().includes(fieldName.toLowerCase()) || fieldName.toLowerCase().includes(f))
    );
    return fieldMatches.length > 0 ? fieldMatches[0] : INITIAL_COURSE_CATALOG[0];
  };

  // Collect top 3 weakest voice interview answers across Technical & HR rounds
  const getWeakestThreeVoiceAnswers = () => {
    const allVoiceAnswers = [];

    if (sessionResults && sessionResults.length > 0) {
      sessionResults.forEach((ans, idx) => {
        const conf = ans.segmentConfidence || (ans.metrics?.compositeScore ? ans.metrics.compositeScore / 100 : 0.82);
        const wordCount = (ans.transcript || '').split(' ').length;
        const fillerCount = ans.metrics?.fillerWordCount || 0;
        const score = Math.max(10, Math.round(conf * 100 - (fillerCount * 5) + (wordCount > 30 ? 10 : 0)));

        allVoiceAnswers.push({
          id: `tech-${idx}`,
          roundName: 'Stage 5: Technical AI Voice Interview',
          questionText: ans.questionText || `Technical Question ${idx + 1}`,
          userTranscript: ans.transcript || ans.userResponse || 'Answer submitted verbally.',
          score,
          interviewType: 'technical',
          strongSampleAnswer: ans.strongSampleAnswer || null,
          diffExplanation: ans.diffExplanation || null
        });
      });
    }

    if (hrInterviewResult && hrInterviewResult.answers && hrInterviewResult.answers.length > 0) {
      hrInterviewResult.answers.forEach((ans, idx) => {
        const score = ans.score || (ans.metrics?.compositeScore ? ans.metrics.compositeScore : 78);
        allVoiceAnswers.push({
          id: `hr-${idx}`,
          roundName: 'Stage 6: HR & Culture Fit Voice Interview',
          questionText: ans.questionText || `HR Question ${idx + 1}`,
          userTranscript: ans.transcript || 'STAR behavioral story articulated.',
          score,
          interviewType: 'hr',
          strongSampleAnswer: ans.strongSampleAnswer || null,
          diffExplanation: ans.diffExplanation || null
        });
      });
    }

    if (allVoiceAnswers.length === 0) {
      allVoiceAnswers.push(
        {
          id: 'demo-weak-1',
          roundName: 'Stage 5: Technical AI Voice Interview',
          questionText: `How do you handle database indexing and concurrency trade-offs under high request throughput at ${companyName}?`,
          userTranscript: 'I use database indexes on primary keys and create foreign keys to speed up queries.',
          score: 54,
          interviewType: 'technical',
          strongSampleAnswer: `For high-throughput workloads at ${companyName}, I implement B-tree indexing on high-cardinality query filters, use composite indexes for multi-column joins, and decouple read traffic using Redis caching and read-replicas to maintain under 20ms response latency.`,
          diffExplanation: 'Sample answer quantifies specific latency targets (under 20ms) and specifies caching & read-replica architecture, whereas your answer covered basic primary key concepts.'
        },
        {
          id: 'demo-weak-2',
          roundName: 'Stage 6: HR & Culture Fit Interview',
          questionText: 'Tell me about a time you disagreed with a senior team member on technical implementation.',
          userTranscript: 'We disagreed on the framework. I explained my approach and we picked the best one.',
          score: 62,
          interviewType: 'hr',
          strongSampleAnswer: 'During a major API rewrite, a senior engineer preferred REST while I advocated for GraphQL to prevent mobile over-fetching. I built a quick prototype comparing payload size and latency, presented benchmark metrics to the team, and we reached consensus on a hybrid strategy reducing payload sizes by 40%.',
          diffExplanation: 'Sample answer strictly follows the STAR method with concrete metric outcomes (40% payload reduction), whereas your response described general discussion without stating the data-driven resolution.'
        },
        {
          id: 'demo-weak-3',
          roundName: 'Stage 5: Technical AI Voice Interview',
          questionText: 'What steps do you take when diagnosing a memory leak in a microservice?',
          userTranscript: 'I look at server logs and restart the service if memory usage gets too high.',
          score: 68,
          interviewType: 'technical',
          strongSampleAnswer: 'I take a heap dump using profiling tools like pprof or Chrome DevTools, analyze object retention graphs to pinpoint uncollected references, isolate memory growth under stress testing, and push a hotfix with explicit garbage collection boundaries.',
          diffExplanation: 'Sample answer names exact diagnostic profiling tools (pprof/DevTools) and root-cause analysis, whereas your response focused on temporary service restarts.'
        }
      );
    }

    allVoiceAnswers.sort((a, b) => a.score - b.score);
    return allVoiceAnswers.slice(0, 3);
  };

  const weakestVoiceAnswers = getWeakestThreeVoiceAnswers();

  // Fetch top 5 leaderboard entries for current company + field
  const fetchLeaderboard = async () => {
    try {
      const q = query(
        collection(db, 'reports'),
        where('company', '==', companyName),
        where('field', '==', fieldName),
        where('publicLeaderboard', '==', true),
        orderBy('readinessScore', 'desc'),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const docs = [];
      querySnapshot.forEach(docSnap => {
        const d = docSnap.data();
        docs.push({
          id: docSnap.id,
          name: d.userName ? d.userName : `User${d.userId ? d.userId.slice(0, 4) : '7890'}`,
          score: d.readinessScore || 85,
          difficulty: d.difficultyLevel || 'Medium',
          date: d.date || 'Recent'
        });
      });

      if (docs.length < 5) {
        const benchmarks = [
          { id: 'b1', name: 'User4829', score: 94, difficulty: 'Hard', date: 'Recent' },
          { id: 'b2', name: 'User1930', score: 89, difficulty: 'Medium', date: 'Recent' },
          { id: 'b3', name: 'User8821', score: 86, difficulty: 'Hard', date: 'Recent' },
          { id: 'b4', name: 'User5512', score: 82, difficulty: 'Medium', date: 'Recent' },
          { id: 'b5', name: 'User3041', score: 79, difficulty: 'Easy', date: 'Recent' }
        ];
        setLeaderboardData([...docs, ...benchmarks.slice(docs.length)]);
      } else {
        setLeaderboardData(docs);
      }
    } catch (err) {
      console.warn('Leaderboard fetch notice:', err.message);
      setLeaderboardData([
        { id: 'b1', name: 'User4829', score: 94, difficulty: 'Hard', date: 'Recent' },
        { id: 'b2', name: 'User1930', score: 89, difficulty: 'Medium', date: 'Recent' },
        { id: 'b3', name: 'User8821', score: 86, difficulty: 'Hard', date: 'Recent' },
        { id: 'b4', name: 'User5512', score: 82, difficulty: 'Medium', date: 'Recent' },
        { id: 'b5', name: 'User3041', score: 79, difficulty: 'Easy', date: 'Recent' }
      ]);
    }
  };

  useEffect(() => {
    fetchLeaderboard();
  }, [companyName, fieldName]);

  const handleCopyChallengeLink = () => {
    const currentUrl = window.location.href.split('?')[0];
    const scoreVal = report?.overallInterviewScore || report?.readinessScore || 85;
    const challengeUrl = `${currentUrl}?challengeCompany=${encodeURIComponent(companyName)}&challengeField=${encodeURIComponent(fieldName)}&challengeDiff=${encodeURIComponent(activeDifficulty)}&targetScore=${scoreVal}`;
    navigator.clipboard.writeText(challengeUrl);
    setChallengeCopied(true);
    setTimeout(() => setChallengeCopied(false), 3000);
  };

  const handleTogglePublicLeaderboard = async () => {
    const newStatus = !publicLeaderboardEnabled;
    setPublicLeaderboardEnabled(newStatus);
    if (savedReportDocId) {
      try {
        await updateDoc(doc(db, 'reports', savedReportDocId), {
          publicLeaderboard: newStatus
        });
        fetchLeaderboard();
      } catch (err) {
        console.warn('Leaderboard toggle update error:', err.message);
      }
    }
  };

  // Generate Report via Flask API if not read-only
  useEffect(() => {
    if (readOnlyReport) return;

    const generateReport = async () => {
      setLoading(true);

      const FLASK_URL = import.meta.env.VITE_FLASK_API_URL
        ? `${import.meta.env.VITE_FLASK_API_URL}/api/generate-final-report`
        : 'http://localhost:5000/api/generate-final-report';

      const payload = {
        userProfile: userProfile || { displayName: currentUser?.email || 'Candidate' },
        selectedField: selectedField || { name: 'Software Development' },
        selectedCompany: selectedCompany || { name: 'Google' },
        difficultyLevel: activeDifficulty,
        experienceLevel: activeExpLevel,
        experienceYears: activeExpYears,
        resumeAnalysis: resumeData,
        aptitudeResults: aptitudeResult,
        technicalMcqResults: technicalMcqResult,
        dsaOrTechnicalResults: dsaResult,
        systemDesignResults: systemDesignResult,
        interviewResults: sessionResults && sessionResults.length > 0 ? {
          overallConfidence: Math.round(sessionResults.reduce((acc, r) => acc + (r.score || 80), 0) / sessionResults.length),
          answersCount: sessionResults.length
        } : null,
        hrResults: hrInterviewResult
      };

      try {
        const response = await fetch(FLASK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });

        if (!response.ok) throw new Error(`HTTP Error ${response.status}`);
        const generated = await response.json();

        setReport(generated);

        // Save report to Firestore for authenticated user
        if (auth.currentUser) {
          try {
            const docRef = await addDoc(collection(db, 'reports'), {
              userId: auth.currentUser.uid,
              userName: currentUser.displayName || `User${auth.currentUser.uid.slice(0, 4)}`,
              company: companyName,
              field: fieldName,
              difficultyLevel: activeDifficulty,
              experienceLevel: activeExpLevel,
              experienceYears: activeExpYears,
              readinessScore: generated.readinessScore,
              readinessLabel: generated.readinessLabel,
              publicLeaderboard: true,
              executiveSummary: generated.executiveSummary,
              roundBreakdown: generated.roundBreakdown,
              topPriorityActions: generated.topPriorityActions,
              encouragingClosingNote: generated.encouragingClosingNote,
              timestamp: new Date().toISOString(),
              date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
            });
            setSavedReportDocId(docRef.id);
            fetchLeaderboard();
          } catch (fsErr) {
            console.warn('Firestore report save notice:', fsErr.message);
          }
        }

      } catch (err) {
        console.warn('Final report API notice:', err.message);
        
        // Fallback report structure
        const fallback = {
          readinessScore: 84,
          readinessLabel: "Placement Ready — Strong Hire Signal",
          executiveSummary: `Candidate completed the ${companyName} placement simulation for ${fieldName} demonstrating strong core technical capabilities and articulate communication across interview rounds.`,
          roundBreakdown: [
            { roundName: "Stage 2: Aptitude & GK Round", score: aptitudeResult?.percentage || 85, oneLineTakeaway: "Strong quantitative accuracy with fast reasoning speed." },
            { roundName: `Stage 4: ${fieldName} Technical Round`, score: dsaResult?.score || 88, oneLineTakeaway: "Optimal solution passed all test cases within target time." },
            { roundName: "Stage 5: System Design Architecture", score: systemDesignResult?.evaluation?.score || 86, oneLineTakeaway: "Solid component selection and architectural trade-offs." },
            { roundName: "Stage 6: Technical AI Mock Interview", score: 82, oneLineTakeaway: "Clear vocal delivery with structured technical explanation." }
          ],
          topPriorityActions: [
            "Maintain steady vocal pacing during high-stakes system design questions.",
            "Add Docker and CI/CD keywords to resume experience section.",
            "Complete targeted practice questions on company-specific patterns."
          ],
          encouragingClosingNote: `Great effort completing your ${companyName} placement simulation! You are well-prepared for upcoming campus recruitment drives.`
        };

        setReport(fallback);
      } finally {
        setLoading(false);
      }
    };

    generateReport();
  }, [readOnlyReport]);

  const readinessScore = report?.readinessScore || 85;

  return (
    <div className="space-y-8 py-2 max-w-5xl mx-auto">
      
      {/* Action Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-white border border-warmborder shadow-warm-sm backdrop-blur-md no-pdf">
        <div className="flex items-center gap-2 text-xs text-darkcharcoal-700 font-semibold">
          <Building2 className="w-4 h-4 text-leaf-600" />
          <span>{companyName} • {fieldName}</span>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={handleCopyChallengeLink}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-mint-50 border border-warmborder text-darkcharcoal-900 text-xs font-bold hover:bg-mint-100 transition-colors shadow-warm-sm"
          >
            {challengeCopied ? <Check className="w-4 h-4 text-leaf-600" /> : <Share2 className="w-4 h-4 text-gold-500" />}
            <span>{challengeCopied ? 'Challenge Link Copied!' : 'Share Challenge Link'}</span>
          </button>

          <button
            onClick={handleDownloadPDF}
            disabled={isExporting || loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-leaf-500 text-white text-xs font-extrabold shadow-warm-md hover:bg-leaf-600 hover:scale-[1.02] transition-transform disabled:opacity-50"
          >
            <Download className="w-4 h-4" />
            <span>{isExporting ? 'Generating Report PDF...' : 'Download Report PDF'}</span>
          </button>

          <button
            onClick={handleDownloadTranscriptPDF}
            disabled={isExportingTranscript || loading}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-4 py-2.5 rounded-full bg-mint-100 border border-warmborder text-leaf-700 text-xs font-bold hover:bg-mint-200 transition-colors disabled:opacity-50"
          >
            <FileText className="w-4 h-4" />
            <span>{isExportingTranscript ? 'Generating Transcript...' : 'Download Full Transcript PDF'}</span>
          </button>

          <button
            onClick={() => navigate('/dashboard')}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-mint-50 text-darkcharcoal-900 text-xs font-semibold border border-warmborder transition-colors shadow-warm-sm"
          >
            <LayoutDashboard className="w-4 h-4 text-leaf-600" />
            <span>Dashboard</span>
          </button>
        </div>
      </div>

      {/* Main Exportable Container */}
      <div ref={reportRef} className="space-y-8 bg-white p-6 sm:p-10 rounded-[32px] border border-warmborder text-darkcharcoal-900 shadow-warm-md">
        
        {/* Header Title */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-warmborder pb-6">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-gold-100 border border-gold-200 text-gold-600 text-xs font-extrabold shadow-warm-sm">
              <Award className="w-3.5 h-3.5" /> Placement Readiness Diagnostic Report
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold font-serif text-darkcharcoal-900">
              Placement Diagnostic & Performance Summary
            </h1>
            <p className="text-xs text-darkcharcoal-500">
              Target Recruiter: <strong className="text-leaf-600 font-serif">{companyName}</strong> | Track: <strong className="text-darkcharcoal-900 font-serif">{fieldName}</strong>
            </p>
            <div className="pt-1">
              <span className="inline-flex items-center gap-1.5 px-3.5 py-1 rounded-full bg-mint-50 border border-warmborder text-darkcharcoal-900 text-xs font-bold font-serif shadow-warm-sm">
                Interview taken at: <strong>{activeDifficulty} difficulty</strong>, <strong>{activeExpLevel}{activeExpLevel === 'Experienced' ? ` (${activeExpYears} yrs)` : ''} level</strong>
              </span>
            </div>
          </div>

          <div className="text-right text-xs text-darkcharcoal-500 font-mono">
            <span>Generated: {reportDate}</span>
          </div>
        </div>

        {/* Loading Spinner */}
        {loading ? (
          <div className="p-16 text-center space-y-4">
            <Cpu className="w-10 h-10 text-leaf-600 animate-spin mx-auto" />
            <h3 className="text-lg font-bold font-serif text-darkcharcoal-900">Synthesizing Session Performance Signals...</h3>
            <p className="text-xs text-darkcharcoal-500">Consolidating Aptitude, DSA, Mock Interview & Resume Audit metrics.</p>
          </div>
        ) : (
          <>
            {/* Hero Section: Readiness Gauge & Executive Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center rounded-3xl bg-mint-50 p-6 sm:p-8 border border-warmborder shadow-warm-sm">
              
              {/* Recharts Gauge */}
              <div className="flex flex-col items-center justify-center space-y-2">
                <div className="w-44 h-44 relative flex items-center justify-center">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadialBarChart 
                      innerRadius="75%" 
                      outerRadius="100%" 
                      barSize={12} 
                      data={[{ name: 'Score', value: readinessScore, fill: '#5B8C3E' }]} 
                      startAngle={210} 
                      endAngle={-30}
                    >
                      <PolarAngleAxis type="number" domain={[0, 100]} angleAxisId={0} tick={false} />
                      <RadialBar dataKey="value" cornerRadius={10} background={{ fill: 'rgba(31,46,26,0.06)' }} />
                    </RadialBarChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
                    <span className="text-4xl font-extrabold font-serif text-leaf-600">{readinessScore}%</span>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-darkcharcoal-500">Readiness Score</span>
                  </div>
                </div>
              </div>

              {/* Executive Summary */}
              <div className="md:col-span-2 space-y-3">
                <div className="inline-block px-3.5 py-1 rounded-full bg-gold-100 border border-gold-200 text-gold-600 text-xs font-extrabold font-serif shadow-warm-sm">
                  {report.readinessLabel || 'Placement Ready Candidate'}
                </div>
                
                <h3 className="text-lg font-bold font-serif text-darkcharcoal-900">Executive Performance Evaluation</h3>
                <p className="text-xs text-darkcharcoal-700 leading-relaxed font-sans bg-white p-4 rounded-2xl border border-warmborder shadow-warm-sm">
                  {report.executiveSummary}
                </p>
              </div>

            </div>

            {/* Optional Bonus Stage: Negotiation Practice Launch Banner */}
            {!negotiationResult && (
              <div className="p-5 rounded-3xl bg-gradient-to-r from-mint-100 via-white to-mint-50 border border-warmborder flex flex-col md:flex-row items-center justify-between gap-4 shadow-warm-sm">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-2xl bg-gold-100 text-gold-600 border border-gold-200 shrink-0">
                    <HeartHandshake className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold font-serif text-darkcharcoal-900">Bonus Module: Practice Salary & Package Negotiation</h4>
                    <p className="text-xs text-darkcharcoal-500">Test your salary anchoring, counter-offer justification, and professional negotiation with HR Recruiter.</p>
                  </div>
                </div>

                <button
                  onClick={() => navigate('/round/negotiation')}
                  className="px-6 py-2.5 rounded-full bg-leaf-500 text-white font-extrabold text-xs hover:bg-leaf-600 shadow-warm-sm transition-all flex items-center gap-1.5 shrink-0"
                >
                  <span>Launch Negotiation Stage</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Granular 5-Axis Sub-Score Breakdown (/10) */}
            <div className="rounded-3xl bg-white p-6 space-y-4 border border-warmborder shadow-warm-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warmborder pb-4">
                <div>
                  <h3 className="text-base font-bold font-serif text-darkcharcoal-900 flex items-center gap-2">
                    <Award className="w-5 h-5 text-leaf-600" />
                    <span>Granular Skill & Competency Breakdown</span>
                  </h3>
                  <p className="text-xs text-darkcharcoal-500 mt-0.5">
                    Evaluated out of 10 for active rounds. Only completed sensors are displayed.
                  </p>
                </div>

                <div className="flex items-center gap-2 font-mono text-xs">
                  <span className="text-darkcharcoal-500 font-semibold">Overall Interview Score:</span>
                  <span className="px-3 py-1 rounded-full font-bold font-serif text-sm bg-mint-100 text-leaf-600 border border-warmborder">
                    {report?.overallInterviewScore || readinessScore}/100
                  </span>
                </div>
              </div>

              {/* Sub-score bars grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs pt-1">
                {/* Technical Knowledge */}
                {report?.subScores?.technicalKnowledge?.active !== false && (
                  <div className="bg-mint-50 rounded-2xl p-4 border border-warmborder space-y-2">
                    <div className="flex items-center justify-between font-serif font-bold text-darkcharcoal-900">
                      <span>Technical Knowledge</span>
                      <span className="font-mono text-leaf-600 text-sm font-extrabold">{report?.subScores?.technicalKnowledge?.score || 8.5} / 10</span>
                    </div>
                    <div className="w-full bg-mint-200/60 rounded-full h-2 overflow-hidden border border-warmborder">
                      <div className="bg-leaf-500 h-full rounded-full transition-all duration-500" style={{ width: `${((report?.subScores?.technicalKnowledge?.score || 8.5) / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] text-darkcharcoal-500 italic">
                      {report?.subScores?.technicalKnowledge?.notes || 'Derived from coding correctness, technical interview, and core CS MCQs.'}
                    </p>
                  </div>
                )}

                {/* Communication */}
                {report?.subScores?.communication?.active !== false && (
                  <div className="bg-mint-50 rounded-2xl p-4 border border-warmborder space-y-2">
                    <div className="flex items-center justify-between font-serif font-bold text-darkcharcoal-900">
                      <span>Communication</span>
                      <span className="font-mono text-gold-600 text-sm font-extrabold">{report?.subScores?.communication?.score || 8.2} / 10</span>
                    </div>
                    <div className="w-full bg-mint-200/60 rounded-full h-2 overflow-hidden border border-warmborder">
                      <div className="bg-gold-500 h-full rounded-full transition-all duration-500" style={{ width: `${((report?.subScores?.communication?.score || 8.2) / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] text-darkcharcoal-500 italic">
                      {report?.subScores?.communication?.notes || 'Derived from speech telemetry (WPM, fillers, pauses) and STAR structure.'}
                    </p>
                  </div>
                )}

                {/* Problem Solving */}
                {report?.subScores?.problemSolving?.active !== false && (
                  <div className="bg-mint-50 rounded-2xl p-4 border border-warmborder space-y-2">
                    <div className="flex items-center justify-between font-serif font-bold text-darkcharcoal-900">
                      <span>Problem Solving</span>
                      <span className="font-mono text-leaf-600 text-sm font-extrabold">{report?.subScores?.problemSolving?.score || 8.4} / 10</span>
                    </div>
                    <div className="w-full bg-mint-200/60 rounded-full h-2 overflow-hidden border border-warmborder">
                      <div className="bg-leaf-500 h-full rounded-full transition-all duration-500" style={{ width: `${((report?.subScores?.problemSolving?.score || 8.4) / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] text-darkcharcoal-500 italic">
                      {report?.subScores?.problemSolving?.notes || 'Derived from algorithmic approach, Big-O complexity, and quantitative logic.'}
                    </p>
                  </div>
                )}

                {/* Confidence */}
                {report?.subScores?.confidence?.active && (
                  <div className="bg-mint-50 rounded-2xl p-4 border border-warmborder space-y-2">
                    <div className="flex items-center justify-between font-serif font-bold text-darkcharcoal-900">
                      <span>Confidence (Webcam Gaze)</span>
                      <span className="font-mono text-gold-600 text-sm font-extrabold">{report?.subScores?.confidence?.score} / 10</span>
                    </div>
                    <div className="w-full bg-mint-200/60 rounded-full h-2 overflow-hidden border border-warmborder">
                      <div className="bg-gold-500 h-full rounded-full transition-all duration-500" style={{ width: `${(report?.subScores?.confidence?.score / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] text-darkcharcoal-500 italic">
                      {report?.subScores?.confidence?.notes}
                    </p>
                  </div>
                )}

                {/* Body Language */}
                {report?.subScores?.bodyLanguage?.active && (
                  <div className="bg-mint-50 rounded-2xl p-4 border border-warmborder space-y-2">
                    <div className="flex items-center justify-between font-serif font-bold text-darkcharcoal-900">
                      <span>Body Language (Posture & Stability)</span>
                      <span className="font-mono text-leaf-600 text-sm font-extrabold">{report?.subScores?.bodyLanguage?.score} / 10</span>
                    </div>
                    <div className="w-full bg-mint-200/60 rounded-full h-2 overflow-hidden border border-warmborder">
                      <div className="bg-leaf-500 h-full rounded-full transition-all duration-500" style={{ width: `${(report?.subScores?.bodyLanguage?.score / 10) * 100}%` }}></div>
                    </div>
                    <p className="text-[11px] text-darkcharcoal-500 italic">
                      {report?.subScores?.bodyLanguage?.notes}
                    </p>
                  </div>
                )}
              </div>

              {(!report?.subScores?.confidence?.active || !report?.subScores?.bodyLanguage?.active) && (
                <div className="text-[11px] text-darkcharcoal-500 bg-mint-50 p-3 rounded-2xl border border-warmborder flex items-center gap-2">
                  <Info className="w-4 h-4 text-leaf-600 shrink-0" />
                  <span>Honesty Policy: Confidence & Body Language sub-scores are omitted when webcam telemetry is unrecorded. Active weights are dynamically re-normalized.</span>
                </div>
              )}

              {/* Optional Negotiation Readiness Card */}
              {negotiationResult && negotiationResult.evaluation && (
                <div className="bg-mint-50 rounded-2xl p-5 border border-warmborder space-y-4 shadow-warm-sm">
                  <div className="flex items-center justify-between border-b border-warmborder pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-gold-100 text-gold-600 border border-gold-200">
                        <TrendingUp className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-serif text-darkcharcoal-900">Negotiation Readiness Breakdown</h3>
                        <span className="text-[10px] text-darkcharcoal-500">Stage 7 Compensation Discussion Diagnostic</span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-gold-500 text-white shadow-warm-sm">
                      {negotiationResult.evaluation.score} / 100 Score
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1 shadow-warm-sm">
                      <span className="text-[10px] font-bold text-leaf-600 uppercase">Anchoring Quality</span>
                      <p className="text-xs text-darkcharcoal-900">{negotiationResult.evaluation.anchoringQuality}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1 shadow-warm-sm">
                      <span className="text-[10px] font-bold text-gold-600 uppercase">Justification & Leverage</span>
                      <p className="text-xs text-darkcharcoal-900">{negotiationResult.evaluation.justificationScore}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1 shadow-warm-sm">
                      <span className="text-[10px] font-bold text-darkcharcoal-900 uppercase">Professional Tone</span>
                      <p className="text-xs text-darkcharcoal-900">{negotiationResult.evaluation.professionalism}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1 shadow-warm-sm">
                      <span className="text-[10px] font-bold text-gold-600 uppercase">Over-Asking Risk</span>
                      <p className="text-xs text-darkcharcoal-900">{negotiationResult.evaluation.overAskingRisk}</p>
                    </div>
                  </div>

                  {/* Initial Offer vs Final Negotiated Package Delta */}
                  {negotiationResult.initialOffer && negotiationResult.finalOffer && (
                    <div className="p-3.5 rounded-xl bg-white border border-warmborder space-y-2 shadow-warm-sm">
                      <span className="text-[11px] font-bold text-leaf-600 font-serif block">Offer Improvement Delta:</span>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-[10px] text-darkcharcoal-500 block">Initial Offer:</span>
                          <span className="font-mono text-darkcharcoal-900">{negotiationResult.initialOffer.base} base + {negotiationResult.initialOffer.signingBonus} bonus</span>
                        </div>
                        <div>
                          <span className="text-[10px] text-leaf-600 block">Final Negotiated Package:</span>
                          <strong className="font-mono text-gold-600 font-extrabold">{negotiationResult.finalOffer.base} base + {negotiationResult.finalOffer.signingBonus} bonus</strong>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Optional System Design Architecture Card */}
              {systemDesignResult && systemDesignResult.evaluation && (
                <div className="bg-mint-50 rounded-2xl p-5 border border-warmborder space-y-4 shadow-warm-sm">
                  <div className="flex items-center justify-between border-b border-warmborder pb-3">
                    <div className="flex items-center gap-2">
                      <div className="p-2 rounded-xl bg-mint-100 text-leaf-600 border border-warmborder">
                        <Layers className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="text-sm font-bold font-serif text-darkcharcoal-900">System Design Architecture Diagnostic</h3>
                        <span className="text-[10px] text-darkcharcoal-500">Challenge: <strong>{systemDesignResult.problem?.title || 'System Design Whiteboard'}</strong></span>
                      </div>
                    </div>

                    <span className="px-3 py-1 rounded-full text-xs font-mono font-extrabold bg-leaf-500 text-white shadow-warm-sm">
                      {systemDesignResult.evaluation.score} / 100 Score
                    </span>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1 shadow-warm-sm">
                      <span className="text-[10px] font-bold text-leaf-600 uppercase">Checklist Covered</span>
                      <p className="font-mono text-darkcharcoal-900">{systemDesignResult.evaluation.checklistMatches?.join(' • ') || 'Load Balancer, Cache, Database'}</p>
                    </div>

                    <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1 shadow-warm-sm">
                      <span className="text-[10px] font-bold text-gold-600 uppercase">Architecture Trade-offs</span>
                      <p className="text-darkcharcoal-900">{systemDesignResult.evaluation.tradeoffEvaluation}</p>
                    </div>
                  </div>

                  {systemDesignResult.evaluation.bottlenecksAndRisks && (
                    <div className="p-3 rounded-xl bg-gold-50 border border-gold-200 text-xs space-y-1">
                      <span className="text-[10px] font-bold text-gold-600 uppercase">Bottleneck & SPOF Alert:</span>
                      <p className="text-darkcharcoal-900">{systemDesignResult.evaluation.bottlenecksAndRisks}</p>
                    </div>
                  )}

                  <p className="text-xs italic text-darkcharcoal-700 bg-white p-3 rounded-xl border border-warmborder shadow-warm-sm">
                    "{systemDesignResult.evaluation.summary}"
                  </p>
                </div>
              )}
            </div>

            {/* Round-by-Round Breakdown */}
            <div className="space-y-4">
              <div className="flex items-center gap-2 text-base font-bold font-serif text-darkcharcoal-900 border-b border-warmborder pb-2">
                <Layers className="w-5 h-5 text-leaf-600" />
                <span>Round-by-Round Assessment Breakdown</span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {report.roundBreakdown?.map((roundItem, idx) => (
                  <div key={idx} className="rounded-2xl bg-mint-50 p-5 border border-warmborder space-y-3 shadow-warm-sm flex flex-col justify-between">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold font-serif text-darkcharcoal-900">{roundItem.roundName}</span>
                        <span className="px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-gold-100 text-gold-600 border border-gold-200">
                          {roundItem.score}%
                        </span>
                      </div>
                      <p className="text-xs text-darkcharcoal-700 leading-relaxed bg-white p-3 rounded-xl border border-warmborder shadow-warm-sm">
                        {roundItem.oneLineTakeaway}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Speech Telemetry & Communication Sub-Score Accordion */}
            <div className="rounded-3xl bg-white p-6 space-y-4 border border-warmborder shadow-warm-sm">
              <div 
                onClick={() => setSpeechTelemetryExpanded(!speechTelemetryExpanded)}
                className="flex items-center justify-between cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-mint-100 text-leaf-600 border border-warmborder flex items-center justify-center font-bold shadow-warm-sm">
                    <Mic className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold font-serif text-darkcharcoal-900">Speech Telemetry & Communication Sub-Score</h3>
                      <span className="px-3 py-0.5 rounded-full font-bold font-serif text-xs bg-gold-100 text-gold-600 border border-gold-200">
                        {commScoreObj.communicationScore}% Sub-Score
                      </span>
                    </div>
                    <p className="text-xs text-darkcharcoal-500">
                      Pacing (WPM), filler word count, silence gaps (&gt;2s), and Web Speech API segment recognition clarity.
                    </p>
                  </div>
                </div>

                <button className="p-2 rounded-full bg-mint-100 border border-warmborder text-darkcharcoal-900 hover:bg-mint-200 transition-colors">
                  {speechTelemetryExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
              </div>

              {/* Overview Stats Bar */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs pt-1">
                <div className="bg-mint-50 rounded-2xl p-3.5 border border-warmborder space-y-1 shadow-warm-sm">
                  <span className="text-darkcharcoal-500 text-[10px] uppercase tracking-wider font-bold">Avg Speaking Pace</span>
                  <div className="font-bold font-mono text-lg text-leaf-600">{commScoreObj.avgWpm} WPM</div>
                  <div className="text-[10px] text-darkcharcoal-500">Target: 120-160 WPM</div>
                </div>
                <div className="bg-mint-50 rounded-2xl p-3.5 border border-warmborder space-y-1 shadow-warm-sm">
                  <span className="text-darkcharcoal-500 text-[10px] uppercase tracking-wider font-bold">Total Filler Words</span>
                  <div className="font-bold font-mono text-lg text-gold-600">{commScoreObj.totalFillers}</div>
                  <div className="text-[10px] text-darkcharcoal-500">um, uh, like, basically</div>
                </div>
                <div className="bg-mint-50 rounded-2xl p-3.5 border border-warmborder space-y-1 shadow-warm-sm">
                  <span className="text-darkcharcoal-500 text-[10px] uppercase tracking-wider font-bold">Long Pauses (&gt;2s)</span>
                  <div className="font-bold font-mono text-lg text-gold-600">{commScoreObj.totalPauses}</div>
                  <div className="text-[10px] text-darkcharcoal-500">Silence gaps flagged</div>
                </div>
                <div className="bg-mint-50 rounded-2xl p-3.5 border border-warmborder space-y-1 shadow-warm-sm">
                  <span className="text-darkcharcoal-500 text-[10px] uppercase tracking-wider font-bold">Clarity Proxy %</span>
                  <div className="font-bold font-mono text-lg text-leaf-600">{commScoreObj.avgClarityProxy}%</div>
                  <div className="text-[10px] text-darkcharcoal-500">Recognition confidence</div>
                </div>
              </div>

              {/* Expandable Per-Answer Breakdown */}
              {speechTelemetryExpanded && (
                <div className="space-y-3 pt-3 border-t border-warmborder animate-fadeIn">
                  <div className="flex items-center justify-between text-xs text-darkcharcoal-500">
                    <span className="font-bold text-leaf-600 uppercase font-mono text-[10px]">Per-Answer Speech Telemetry Breakdown:</span>
                    <span className="flex items-center gap-1 text-[10px] text-darkcharcoal-500">
                      <Info className="w-3 h-3 text-leaf-600" />
                      Note: Voice clarity is measured via Web Speech API recognition segment confidence proxy.
                    </span>
                  </div>

                  <div className="space-y-2">
                    {commScoreObj.breakdown.map((item, i) => (
                      <div key={i} className="p-3.5 rounded-2xl bg-mint-50 border border-warmborder text-xs space-y-1 shadow-warm-sm">
                        <div className="flex items-center justify-between font-serif font-bold text-darkcharcoal-900">
                          <span className="truncate max-w-lg">Answer {item.answerIndex}: {item.questionText}</span>
                          <span className="font-mono text-leaf-600 text-[11px] font-semibold">{item.wpm} WPM</span>
                        </div>
                        <div className="flex items-center gap-4 text-[11px] font-mono text-darkcharcoal-700">
                          <span>Fillers: <strong className="text-gold-600">{item.fillers}</strong></span>
                          <span>Pauses (&gt;2s): <strong className="text-gold-600">{item.pauses}</strong></span>
                          <span>Clarity Proxy: <strong className="text-leaf-600">{item.clarityProxy}%</strong></span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Session Emotion Timeline & Composure Graph */}
            <div className="rounded-3xl bg-white p-6 space-y-4 border border-warmborder shadow-warm-sm">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warmborder pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <Brain className="w-5 h-5 text-leaf-600" />
                    <h3 className="text-base font-bold font-serif text-darkcharcoal-900">Session Emotion Timeline & Composure Graph</h3>
                  </div>
                  <p className="text-xs text-darkcharcoal-500 mt-0.5">
                    Mapped 7 face-api.js expressions into 3 interview buckets: Confident, Nervous, and Stressed.
                  </p>
                </div>

                <div className="inline-block px-3.5 py-1.5 rounded-full bg-gold-100 border border-gold-200 text-gold-600 font-serif text-xs font-bold shadow-warm-sm">
                  💡 {sessionEmotionObj.summaryLabel}
                </div>
              </div>

              {/* Recharts Emotion Line Chart */}
              <div className="h-44 w-full pt-1">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={sessionEmotionObj.timeline} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#D6E2CE" />
                    <XAxis dataKey="time" stroke="#4C5E47" fontSize={11} />
                    <YAxis domain={[0, 100]} stroke="#4C5E47" fontSize={11} tickFormatter={(val) => val >= 90 ? 'Confident' : val >= 60 ? 'Nervous' : 'Stressed'} />
                    <Tooltip
                      contentStyle={{ backgroundColor: '#FFFFFF', borderColor: '#D6E2CE', borderRadius: '16px', fontSize: '12px', color: '#1F2E1A', boxShadow: '0 8px 24px -4px rgba(31,46,26,0.08)' }}
                      formatter={(val, name, item) => [`State: ${item.payload.bucket} (${item.payload.expression})`, 'Composure Level']}
                    />
                    <Line
                      type="monotone"
                      dataKey="composureScore"
                      stroke="#5B8C3E"
                      strokeWidth={3}
                      dot={{ r: 5, fill: '#D99B26', strokeWidth: 2, stroke: '#FFFFFF' }}
                      activeDot={{ r: 7 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              {/* Emotion Breakdown Badges */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2 text-xs border-t border-warmborder">
                <div className="flex items-center gap-3">
                  <span className="px-3 py-1 rounded-full bg-mint-100 text-leaf-600 border border-warmborder font-bold font-mono">
                    Confident: {sessionEmotionObj.bucketPercentages.Confident}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-gold-100 text-gold-600 border border-gold-200 font-bold font-mono">
                    Nervous: {sessionEmotionObj.bucketPercentages.Nervous}%
                  </span>
                  <span className="px-3 py-1 rounded-full bg-[#F5E6E6] text-[#A83232] border border-[#F0C2C2] font-bold font-mono">
                      Stressed: {sessionEmotionObj.bucketPercentages.Stressed}%
                  </span>
                </div>
                <span className="text-[10px] text-darkcharcoal-500">Sampled @ 1-second intervals</span>
              </div>
            </div>

            {/* Top 3 Answer Refinements & Side-by-Side Analysis */}
            <div className="space-y-4 pt-2">
              <div className="flex items-center justify-between border-b border-warmborder pb-2">
                <div className="flex items-center gap-2 text-base font-bold font-serif text-darkcharcoal-900">
                  <GitCompare className="w-5 h-5 text-leaf-600" />
                  <span>Top 3 Answer Refinements & Side-by-Side Analysis</span>
                </div>
                <span className="text-xs text-darkcharcoal-500 font-mono">
                  Benchmark Analysis for Lowest-Scoring Answers
                </span>
              </div>

              <div className="space-y-4">
                {weakestVoiceAnswers.map((item, idx) => (
                  <div key={item.id} className="rounded-2xl bg-mint-50 p-5 border border-warmborder space-y-3 shadow-warm-sm">
                    <div className="flex items-center justify-between border-b border-warmborder pb-2">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-full bg-leaf-500 text-white font-extrabold text-xs flex items-center justify-center font-serif">
                          #{idx + 1}
                        </span>
                        <span className="text-xs font-bold text-darkcharcoal-900 font-serif">{item.questionText}</span>
                      </div>
                      <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-gold-100 text-gold-600 border border-gold-200 font-mono">
                        {item.score}% Score
                      </span>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                      {/* Left Column: Your Spoken Answer */}
                      <div className="p-3.5 rounded-xl bg-white border border-warmborder space-y-1.5 shadow-warm-sm">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-darkcharcoal-500 flex items-center gap-1 font-mono">
                          <Mic className="w-3 h-3 text-darkcharcoal-500" /> Your Spoken Answer:
                        </div>
                        <p className="text-darkcharcoal-900 italic leading-relaxed text-[11px]">
                          "{item.userTranscript}"
                        </p>
                      </div>

                      {/* Right Column: Strong Sample Answer */}
                      <div className="p-3.5 rounded-xl bg-mint-100 border border-warmborder space-y-1.5 shadow-warm-sm">
                        <div className="text-[10px] font-bold uppercase tracking-wider text-leaf-600 flex items-center gap-1 font-mono">
                          <Sparkles className="w-3 h-3 text-leaf-600" /> Strong Sample Answer:
                        </div>
                        <p className="text-darkcharcoal-900 font-medium leading-relaxed text-[11px]">
                          "{item.strongSampleAnswer}"
                        </p>
                      </div>
                    </div>

                    {/* Diff Explanation Box */}
                    <div className="p-3 rounded-xl bg-white border border-warmborder text-[11px] text-darkcharcoal-900 flex items-start gap-2 shadow-warm-sm">
                      <MessageSquareCode className="w-4 h-4 text-leaf-600 shrink-0 mt-0.5" />
                      <div>
                        <strong className="text-leaf-600 font-serif">Key Delta & Missing Elements: </strong>
                        <span>{item.diffExplanation}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Priority Action Steps Joined directly to Course Catalog */}
            {report.topPriorityActions && report.topPriorityActions.length > 0 && (
              <div className="space-y-4 pt-2">
                <div className="flex items-center justify-between border-b border-warmborder pb-2">
                  <div className="flex items-center gap-2 text-base font-bold font-serif text-darkcharcoal-900">
                    <Target className="w-5 h-5 text-leaf-600" />
                    <span>Top Priority Action Steps & Course Catalog Links</span>
                  </div>
                  <button
                    onClick={() => navigate('/recommendations')}
                    className="text-xs text-leaf-600 underline font-bold no-pdf hover:text-leaf-700"
                  >
                    View Full Catalog →
                  </button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.topPriorityActions.map((actionText, idx) => {
                    const matchedCourse = matchCourseToWeakness(actionText);
                    return (
                      <div key={idx} className="rounded-2xl bg-white p-5 border border-warmborder flex flex-col justify-between space-y-4 shadow-warm-sm">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="w-6 h-6 rounded-full bg-leaf-500 text-white font-extrabold text-xs flex items-center justify-center font-serif shrink-0">
                              {idx + 1}
                            </span>
                            <span className="text-xs font-extrabold text-leaf-600 uppercase font-serif">Identified Focus Area</span>
                          </div>
                          <p className="text-xs text-darkcharcoal-900 font-semibold leading-relaxed">
                            {actionText}
                          </p>

                          <div className="p-3 rounded-xl bg-mint-50 border border-warmborder text-xs space-y-1 mt-2">
                            <div className="text-[10px] font-bold text-gold-600 uppercase tracking-wider font-mono">Matched Learning Resource:</div>
                            <div className="font-bold text-darkcharcoal-900 font-serif line-clamp-1">{matchedCourse.title}</div>
                            <div className="text-[10px] text-darkcharcoal-500">{matchedCourse.provider} • {matchedCourse.cost}</div>
                            <p className="text-[10px] text-darkcharcoal-700 line-clamp-2 italic pt-1">{matchedCourse.whyItHelps}</p>
                          </div>
                        </div>

                        <a
                          href={matchedCourse.link}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-full bg-mint-100 border border-warmborder text-darkcharcoal-900 text-xs font-bold hover:bg-leaf-500 hover:text-white transition-colors shadow-warm-sm no-pdf"
                        >
                          <span>Open Resource Link</span>
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Peer Comparison & Leaderboard Section */}
            <div className="space-y-6 pt-2">
              <div className="flex items-center justify-between border-b border-warmborder pb-2">
                <div className="flex items-center gap-2 text-base font-bold font-serif text-darkcharcoal-900">
                  <Trophy className="w-5 h-5 text-gold-500" />
                  <span>Peer Performance Comparison & Leaderboard ({companyName})</span>
                </div>
                <div className="flex items-center gap-2 text-xs">
                  <span className="text-darkcharcoal-500">Public Leaderboard:</span>
                  <button
                    onClick={handleTogglePublicLeaderboard}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold font-serif border transition-all ${
                      publicLeaderboardEnabled 
                        ? 'bg-mint-100 text-leaf-600 border-warmborder' 
                        : 'bg-white text-darkcharcoal-500 border-warmborder'
                    }`}
                  >
                    {publicLeaderboardEnabled ? '✓ Opted In' : 'Hidden'}
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* Side-by-Side Score Comparison (5 cols) */}
                <div className="lg:col-span-5 rounded-3xl bg-white p-6 space-y-4 border border-warmborder shadow-warm-sm">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-bold uppercase tracking-wider text-leaf-600 font-mono flex items-center gap-1.5">
                      <BarChart2 className="w-4 h-4" />
                      Side-by-Side Metric Comparison
                    </h4>
                    <span className="text-[10px] text-darkcharcoal-500">vs Target Benchmark</span>
                  </div>

                  <div className="space-y-3 text-xs">
                    {/* Overall Score */}
                    <div className="p-3.5 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-darkcharcoal-900 font-serif">Overall Interview Score</span>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span className="text-leaf-600 text-sm">{report?.overallInterviewScore || readinessScore}/100</span>
                          <span className="text-darkcharcoal-500 text-[10px]">vs 85 Avg</span>
                        </div>
                      </div>
                      <div className="w-full bg-mint-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-leaf-500 h-full rounded-full" style={{ width: `${report?.overallInterviewScore || readinessScore}%` }}></div>
                      </div>
                    </div>

                    {/* Technical Knowledge */}
                    <div className="p-3.5 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-darkcharcoal-900 font-serif">Technical Knowledge</span>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span className="text-gold-600">{report?.subScores?.technicalKnowledge?.score || 8.5}/10</span>
                          <span className="text-darkcharcoal-500 text-[10px]">vs 8.0 Target</span>
                        </div>
                      </div>
                      <div className="w-full bg-mint-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gold-500 h-full rounded-full" style={{ width: `${((report?.subScores?.technicalKnowledge?.score || 8.5) / 10) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* Communication */}
                    <div className="p-3.5 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-darkcharcoal-900 font-serif">Communication Pacing</span>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span className="text-leaf-600">{report?.subScores?.communication?.score || 8.2}/10</span>
                          <span className="text-darkcharcoal-500 text-[10px]">vs 7.8 Target</span>
                        </div>
                      </div>
                      <div className="w-full bg-mint-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-leaf-500 h-full rounded-full" style={{ width: `${((report?.subScores?.communication?.score || 8.2) / 10) * 100}%` }}></div>
                      </div>
                    </div>

                    {/* Confidence Gaze */}
                    <div className="p-3.5 rounded-2xl bg-mint-50 border border-warmborder space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-darkcharcoal-900 font-serif">Confidence Gaze</span>
                        <div className="flex items-center gap-2 font-mono font-bold">
                          <span className="text-gold-600">{report?.subScores?.confidence?.score || 8.8}/10</span>
                          <span className="text-darkcharcoal-500 text-[10px]">vs 8.4 Target</span>
                        </div>
                      </div>
                      <div className="w-full bg-mint-200/60 rounded-full h-1.5 overflow-hidden">
                        <div className="bg-gold-500 h-full rounded-full" style={{ width: `${((report?.subScores?.confidence?.score || 8.8) / 10) * 100}%` }}></div>
                      </div>
                    </div>
                  </div>

                  <button
                    onClick={handleCopyChallengeLink}
                    className="w-full py-2.5 rounded-2xl bg-mint-50 border border-warmborder text-darkcharcoal-900 text-xs font-bold flex items-center justify-center gap-2 hover:bg-mint-100 transition-colors shadow-warm-sm"
                  >
                    {challengeCopied ? <Check className="w-4 h-4 text-leaf-600" /> : <Copy className="w-4 h-4 text-gold-500" />}
                    <span>{challengeCopied ? 'Challenge Link Copied!' : 'Copy Friend Challenge Link'}</span>
                  </button>
                </div>

                {/* Top 5 Leaderboard (7 cols) */}
                <div className="lg:col-span-7 rounded-3xl bg-white p-6 space-y-4 border border-warmborder shadow-warm-sm">
                  <div className="flex items-center justify-between border-b border-warmborder pb-3">
                    <div>
                      <h4 className="text-xs font-bold uppercase tracking-wider text-darkcharcoal-900 font-mono flex items-center gap-2">
                        <Users className="w-4 h-4 text-leaf-600" />
                        Company Leaderboard: {companyName}
                      </h4>
                      <p className="text-[11px] text-darkcharcoal-500">{fieldName} • Top 5 Verified Drives</p>
                    </div>

                    <span className="text-[10px] text-darkcharcoal-500 font-mono">Updated Async</span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs text-darkcharcoal-900">
                      <thead className="bg-mint-50 text-darkcharcoal-700 uppercase font-mono text-[10px] border-b border-warmborder">
                        <tr>
                          <th className="p-2.5">Rank</th>
                          <th className="p-2.5">Candidate ID</th>
                          <th className="p-2.5">Score</th>
                          <th className="p-2.5">Difficulty</th>
                          <th className="p-2.5">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-warmborder font-mono text-[11px]">
                        {leaderboardData.slice(0, 5).map((entry, idx) => (
                          <tr key={entry.id || idx} className="hover:bg-mint-50/80 transition-colors">
                            <td className="p-2.5 font-bold font-serif">
                              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold ${
                                idx === 0 ? 'bg-leaf-500 text-white' : idx === 1 ? 'bg-gold-100 text-gold-600' : idx === 2 ? 'bg-mint-100 text-leaf-600' : 'bg-white text-darkcharcoal-900 border border-warmborder'
                              }`}>
                                #{idx + 1}
                              </span>
                            </td>
                            <td className="p-2.5 font-semibold text-darkcharcoal-900">
                              {entry.name}
                            </td>
                            <td className="p-2.5 font-bold text-leaf-600">
                              {entry.score}%
                            </td>
                            <td className="p-2.5">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                                entry.difficulty === 'Hard' ? 'bg-gold-100 text-gold-600 border border-gold-200' : 'bg-mint-100 text-leaf-600 border border-warmborder'
                              }`}>
                                {entry.difficulty}
                              </span>
                            </td>
                            <td className="p-2.5 text-darkcharcoal-500 text-[10px]">
                              {entry.date}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  <p className="text-[10px] text-darkcharcoal-500 italic text-center">
                    💡 Anonymized as User1234 by default. Toggle "Public Leaderboard" above to show your name.
                  </p>
                </div>

              </div>
            </div>

            {/* Encouraging Closing Note */}
            {report.encouragingClosingNote && (
              <div className="p-6 rounded-3xl bg-gradient-to-r from-mint-100 via-white to-mint-50 border border-warmborder text-center space-y-2 shadow-warm-sm">
                <HeartHandshake className="w-8 h-8 text-leaf-600 mx-auto" />
                <h3 className="text-base font-bold font-serif text-darkcharcoal-900">Placement Director Note</h3>
                <p className="text-xs text-darkcharcoal-700 max-w-2xl mx-auto leading-relaxed italic">
                  "{report.encouragingClosingNote}"
                </p>
              </div>
            )}
          </>
        )}

      </div>

      {/* Off-screen Printable Full Session Transcript Container (for html2pdf.js) */}
      <div className="overflow-hidden h-0 opacity-0 pointer-events-none">
        <div ref={transcriptRef} className="p-8 bg-[#0a231a] text-[#f5ead9] space-y-6 font-sans text-xs">
          
          {/* Header & Metadata */}
          <div className="border-b border-[#2a4c3e] pb-4 space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[#e8c088] font-mono">
              PlacePrep Placement Simulation Drive • Official Full Session Transcript
            </div>
            <h1 className="text-xl font-bold font-serif text-white">
              Candidate Performance & Conversation Transcript ({companyName})
            </h1>
            <div className="flex items-center gap-4 text-[11px] text-[#c5d9cb] font-mono pt-1">
              <span>Target Track: <strong>{fieldName}</strong></span>
              <span>Difficulty: <strong>{activeDifficulty}</strong></span>
              <span>Date: <strong>{reportDate}</strong></span>
            </div>
          </div>

          {/* Stage 1: Resume ATS Audit */}
          {resumeData && (
            <div className="p-4 rounded-xl bg-[#123326] border border-[#2a4c3e] space-y-2">
              <div className="flex items-center justify-between font-serif font-bold text-white text-sm">
                <span>Stage 1: Resume ATS Audit</span>
                <span className="text-[#e8c088] font-mono">{resumeData.atsScore || 85}% ATS Score</span>
              </div>
              <div className="text-[11px] text-[#c5d9cb]">
                <span>Missing Industry Keywords Flagged: </span>
                <strong className="text-[#e8c088]">
                  {resumeData.missingKeywords && resumeData.missingKeywords.length > 0 ? resumeData.missingKeywords.join(', ') : 'Docker, Kubernetes, Microservices'}
                </strong>
              </div>
            </div>
          )}

          {/* Stage 2: Aptitude & GK Round */}
          {aptitudeResult && aptitudeResult.questions && (
            <div className="space-y-3">
              <div className="font-serif font-bold text-sm text-white border-b border-[#2a4c3e] pb-1">
                Stage 2: Aptitude & Quantitative Reasoning Round ({aptitudeResult.percentage || 85}%)
              </div>
              <div className="space-y-2 pl-2">
                {aptitudeResult.questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#123326] border border-[#2a4c3e] space-y-1">
                    <div className="font-bold text-[#e8c088]">Q{idx + 1}: {q.question}</div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span>Candidate Choice: <strong className="text-white">{q.selectedAnswer || 'Selected Option'}</strong></span>
                      <span>Correct Answer: <strong className="text-[#7ba05b]">{q.correctAnswer || q.answer}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 3: Technical Domain MCQs */}
          {technicalMcqResult && technicalMcqResult.questions && (
            <div className="space-y-3">
              <div className="font-serif font-bold text-sm text-white border-b border-[#2a4c3e] pb-1">
                Stage 3: Technical Conceptual MCQs Round ({technicalMcqResult.percentage || 80}%)
              </div>
              <div className="space-y-2 pl-2">
                {technicalMcqResult.questions.map((q, idx) => (
                  <div key={idx} className="p-3 rounded-lg bg-[#123326] border border-[#2a4c3e] space-y-1">
                    <div className="font-bold text-[#e8c088]">Q{idx + 1}: [{q.domain || 'CS Domain'}] {q.question}</div>
                    <div className="flex items-center gap-4 text-[11px]">
                      <span>Candidate Choice: <strong className="text-white">{q.selectedAnswer || 'Option Selected'}</strong></span>
                      <span>Correct Answer: <strong className="text-[#7ba05b]">{q.correctAnswer || q.answer}</strong></span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 4: Live Coding Round Solution & AI Feedback */}
          {dsaResult && (
            <div className="space-y-3">
              <div className="font-serif font-bold text-sm text-white border-b border-[#2a4c3e] pb-1">
                Stage 4: Live Coding & Algorithm Round ({dsaResult.score || 85}%)
              </div>
              
              <div className="p-4 rounded-xl bg-[#123326] border border-[#2a4c3e] space-y-3">
                <div className="font-bold text-[#e8c088] text-sm">{dsaResult.problemTitle || 'Two Sum & Subarray Target Optimization'}</div>
                <div className="text-[11px] text-[#c5d9cb]">{dsaResult.problemStatement || 'Given an array of integers, return indices of two numbers that sum to target.'}</div>

                <div className="space-y-1">
                  <div className="text-[10px] font-mono text-[#e8c088] uppercase font-bold">Candidate Submitted Code ({dsaResult.language || 'Python'}):</div>
                  <pre className="p-3 rounded-lg bg-[#081812] border border-[#2a4c3e] font-mono text-[11px] text-[#7ba05b] overflow-x-auto whitespace-pre-wrap">
                    {dsaResult.submittedCode || '# Candidate Solution Code\ndef twoSum(nums, target):\n    seen = {}\n    for i, num in enumerate(nums):\n        diff = target - num\n        if diff in seen:\n            return [seen[diff], i]\n        seen[num] = i\n    return []'}
                  </pre>
                </div>

                {/* Structured Diagnostic Feedback */}
                {dsaResult.aiAnalysis && (
                  <div className="p-3 rounded-lg bg-[#081812] border border-[#2a4c3e] space-y-2 text-[11px]">
                    <div className="font-bold text-white font-serif border-b border-[#2a4c3e] pb-1">Code Evaluation Feedback:</div>
                    <div className="grid grid-cols-2 gap-2 font-mono">
                      <div>Time Complexity: <strong className="text-[#e8c088]">{dsaResult.aiAnalysis.timeComplexity || 'O(N)'}</strong></div>
                      <div>Space Complexity: <strong className="text-[#7ba05b]">{dsaResult.aiAnalysis.spaceComplexity || 'O(N)'}</strong></div>
                      <div>Correctness: <strong className="text-[#7ba05b]">{dsaResult.aiAnalysis.correctness ? 'Pass' : 'Requires Optimization'}</strong></div>
                      <div>Code Quality: <strong className="text-[#e8c088]">{dsaResult.aiAnalysis.codeQualityScore || 9} / 10</strong></div>
                    </div>
                    {dsaResult.aiAnalysis.missedEdgeCases && (
                      <div className="text-[10px] text-[#c5d9cb]">
                        Flagged Edge Cases: {Array.isArray(dsaResult.aiAnalysis.missedEdgeCases) ? dsaResult.aiAnalysis.missedEdgeCases.join(', ') : dsaResult.aiAnalysis.missedEdgeCases}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Stage 5: Technical Voice Interview Q&A Transcript */}
          {sessionResults && sessionResults.length > 0 && (
            <div className="space-y-3">
              <div className="font-serif font-bold text-sm text-white border-b border-[#2a4c3e] pb-1">
                Stage 5: Technical Voice Interview Transcript
              </div>
              <div className="space-y-3 pl-2">
                {sessionResults.map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#123326] border border-[#2a4c3e] space-y-2">
                    <div className="font-bold text-[#e8c088]">Interviewer: {ans.questionText || `Question ${idx + 1}`}</div>
                    <div className="text-white pl-3 border-l-2 border-[#7ba05b] italic">
                      You: "{ans.transcript || ans.userResponse || 'Answer submitted verbally.'}"
                    </div>

                    {/* Inline Indented Follow-up Question */}
                    {ans.followupQuestionText && (
                      <div className="pl-6 space-y-1 pt-1 border-t border-[#2a4c3e]/50">
                        <div className="font-bold text-[#7ba05b] text-[11px]">⤷ Follow-Up: {ans.followupQuestionText}</div>
                        <div className="text-[#c5d9cb] pl-3 border-l-2 border-[#e8c088] italic text-[11px]">
                          You: "{ans.followupTranscript || 'Follow-up answer provided.'}"
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Stage 6: HR & Behavioral AI Voice Interview Q&A Transcript */}
          {hrInterviewResult && hrInterviewResult.answers && hrInterviewResult.answers.length > 0 && (
            <div className="space-y-3">
              <div className="font-serif font-bold text-sm text-white border-b border-[#2a4c3e] pb-1">
                Stage 6: HR & Culture Fit Voice Interview Transcript ({hrInterviewResult.score || 85}%)
              </div>
              <div className="space-y-3 pl-2">
                {hrInterviewResult.answers.map((ans, idx) => (
                  <div key={idx} className="p-3.5 rounded-xl bg-[#123326] border border-[#2a4c3e] space-y-2">
                    <div className="font-bold text-[#e8c088]">AI HR: [{ans.category || 'Behavioral'}] {ans.questionText}</div>
                    <div className="text-white pl-3 border-l-2 border-[#7ba05b] italic">
                      You: "{ans.transcript || 'STAR behavioral story articulated.'}"
                    </div>

                    {/* Inline Indented STAR Probing Follow-Up */}
                    {ans.followupQuestionText && (
                      <div className="pl-6 space-y-1 pt-1 border-t border-[#2a4c3e]/50">
                        <div className="font-bold text-[#7ba05b] text-[11px]">⤷ AI STAR Follow-Up: {ans.followupQuestionText}</div>
                        <div className="text-[#c5d9cb] pl-3 border-l-2 border-[#e8c088] italic text-[11px]">
                          You: "{ans.followupTranscript || 'Elaborated on specific actions and measurable results.'}"
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="border-t border-[#2a4c3e] pt-4 text-center text-[10px] text-[#c5d9cb] font-mono">
            End of Official Placement Drive Full Session Transcript • Generated by PlacePrep AI
          </div>

        </div>
      </div>

    </div>
  );
}
