import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { analyzeResumeApi, generateResumeQuestionsApi } from '../services/resumeService';
import ProgressStepper from '../components/ProgressStepper';
import { 
  UploadCloud, 
  Upload,
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Sparkles, 
  Loader2, 
  ArrowRight, 
  Cpu, 
  Target, 
  Building2, 
  Award, 
  BookOpen, 
  ChevronDown, 
  ChevronUp,
  Tag,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';

export default function ResumePage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { selectedCompany, selectedField, setResumeData, setResumeQuestions, resumeData } = usePrep();

  const companyName = selectedCompany?.name || 'Google';
  const targetField = userProfile?.targetField || selectedField?.name || selectedField?.title || 'Software Development';

  const [file, setFile] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [errorMsg, setErrorMsg] = useState('');
  const [generatingQuestions, setGeneratingQuestions] = useState(false);

  // Local copy of analysis results or context resumeData
  const [analysisResults, setAnalysisResults] = useState(resumeData);
  const [expandedWeakness, setExpandedWeakness] = useState(null);

  const handleFileDrop = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const droppedFile = e.dataTransfer?.files?.[0];
    validateAndSelectFile(droppedFile);
  };

  const handleFileSelect = (e) => {
    setErrorMsg('');
    const selectedFile = e.target.files?.[0];
    validateAndSelectFile(selectedFile);
  };

  const validateAndSelectFile = (selectedFile) => {
    if (!selectedFile) return;

    if (selectedFile.type !== 'application/pdf' && !selectedFile.name.endsWith('.pdf')) {
      setErrorMsg('Only PDF files are supported. Please select a .pdf file.');
      return;
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      setErrorMsg('File size exceeds 5MB limit. Please upload a smaller PDF resume.');
      return;
    }

    setFile(selectedFile);
    uploadAndAnalyzeResume(selectedFile);
  };

  const uploadAndAnalyzeResume = async (pdfFile) => {
    setAnalyzing(true);
    setAnalysisProgress(15);
    setErrorMsg('');

    const progressInterval = setInterval(() => {
      setAnalysisProgress((prev) => (prev < 85 ? prev + 15 : prev));
    }, 400);

    try {
      const data = await analyzeResumeApi(pdfFile, targetField, companyName);

      clearInterval(progressInterval);
      setAnalysisProgress(100);

      setAnalysisResults(data);
      await setResumeData(data);
    } catch (err) {
      console.warn('Resume analysis notice:', err.message);
      setErrorMsg(err.message || 'Failed to analyze resume. Please ensure the PDF is text-based and try again.');
    } finally {
      clearInterval(progressInterval);
      setAnalyzing(false);
    }
  };

  const handleStartResumeInterview = async () => {
    if (!analysisResults?.extractedProfile) {
      navigate('/round/interview');
      return;
    }

    setGeneratingQuestions(true);

    try {
      const data = await generateResumeQuestionsApi(
        analysisResults.extractedProfile,
        companyName,
        targetField
      );

      if (data.questions && Array.isArray(data.questions) && data.questions.length > 0) {
        setResumeQuestions(data.questions);
      }
    } catch (err) {
      console.warn('Questions generation notice:', err.message);
    } finally {
      setGeneratingQuestions(false);
      navigate('/round/interview');
    }
  };

  const atsScore = analysisResults?.atsScore || 82;
  const scoreColor = atsScore > 75 ? '#7ba05b' : atsScore >= 50 ? '#d4a574' : '#a8623f';
  const gaugeData = [
    { name: 'Score', value: atsScore, fill: scoreColor },
    { name: 'Remaining', value: 100 - atsScore, fill: '#123326' }
  ];

  return (
    <div className="space-y-8 py-2 max-w-7xl mx-auto">
      
      {/* 7-Stage Pipeline Stepper Bar */}
      <ProgressStepper />

      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[32px] p-6 sm:p-8 bg-[#FDF4EC] border border-warmborder shadow-warm-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-100 text-rust-500 border border-warmborder text-xs font-bold">
            <FileText className="w-3.5 h-3.5 text-rust-500" />
            <span>Resume Auditor & ATS Optimizer</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-warmtext-900">Upload Resume for Personalised Evaluation</h1>
          <p className="text-xs text-warmtext-500 max-w-2xl leading-relaxed font-sans">
            Extract technical skills, compute ATS parseability scores, identify missing industry keywords, and generate custom interview questions for <strong className="text-rust-500">{companyName}</strong>.
          </p>
        </div>

        <button
          onClick={() => navigate('/companies')}
          className="flex items-center gap-2 px-5 py-2 rounded-full bg-white hover:bg-dustyrose-100 text-warmtext-700 text-xs font-bold border border-warmborder transition-all shadow-warm-sm"
        >
          <Building2 className="w-4 h-4 text-rust-500" />
          <span>Skip for now</span>
        </button>
      </div>

      {/* Upload Drop Zone Card */}
      <div 
        onDragOver={(e) => e.preventDefault()}
        onDrop={handleFileDrop}
        className="rounded-[32px] bg-[#FDF4EC] p-8 sm:p-12 border-2 border-dashed border-warmborder hover:border-rust-400 text-center space-y-5 transition-colors shadow-warm-sm"
      >
        <div className="w-16 h-16 rounded-2xl bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center mx-auto shadow-warm-sm">
          <Upload className="w-8 h-8 text-rust-500" />
        </div>

        <div className="space-y-1">
          <h2 className="text-xl font-bold font-serif text-warmtext-900">Drag & Drop Your PDF Resume Here</h2>
          <p className="text-xs text-warmtext-500">Supports standard single/multi-page engineering resumes (PDF format up to 10MB)</p>
        </div>

        <div className="pt-2">
          <label className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.02] cursor-pointer transition-all">
            <FileText className="w-4 h-4" />
            <span>Choose PDF File</span>
            <input 
              type="file" 
              accept=".pdf,application/pdf" 
              onChange={handleFileSelect} 
              className="hidden" 
            />
          </label>
        </div>

        {file && (
          <div className="pt-2 text-xs font-semibold text-rust-500 flex items-center justify-center gap-2">
            <FileText className="w-4 h-4" />
            <span>Selected File: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
          </div>
        )}

        {/* Loading / Analyzing State */}
        {analyzing && (
          <div className="pt-4 space-y-3 max-w-md mx-auto animate-fadeIn">
            <div className="flex items-center justify-between text-xs font-bold text-rust-500">
              <span className="flex items-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-rust-500" /> Analyzing resume and extracting skills...
              </span>
              <span>{analysisProgress}%</span>
            </div>
            <div className="w-full bg-peach-200 h-2 rounded-full overflow-hidden border border-warmborder">
              <div 
                className="bg-rust-500 h-full transition-all duration-300"
                style={{ width: `${analysisProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Error Notice */}
        {errorMsg && (
          <div className="p-4 rounded-2xl bg-amber-100 border border-amber-200 text-amber-800 text-xs flex items-center justify-center gap-2 max-w-xl mx-auto font-semibold">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* Stage 1 Gate Status & Next Stage Navigation */}
      {analysisResults && (
        <div className="rounded-3xl bg-peach-50 p-6 border border-warmborder shadow-warm-md space-y-4 text-warmtext-900 animate-fadeIn">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="px-3 py-1 rounded-full text-xs font-bold bg-rust-100 text-rust-700 border border-warmborder">
                  Stage 1 • Resume Screening Gate
                </span>
                <span className={`px-3 py-1 rounded-full text-xs font-bold border ${
                  analysisResults.atsScore >= 60 
                    ? 'bg-emerald-100 text-emerald-700 border-emerald-200' 
                    : 'bg-amber-100 text-amber-800 border-amber-200'
                }`}>
                  {analysisResults.atsScore >= 60 ? '✓ Gate Passed (ATS Score >= 60%)' : '⚠️ Needs Work (< 60% ATS Score)'}
                </span>
              </div>
              <h2 className="text-xl font-bold font-serif">
                Stage 1 Screening Analysis Complete
              </h2>
              <p className="text-xs text-warmtext-500">
                Your resume was audited against <strong className="text-rust-500">{companyName}</strong> hiring requirements for <strong className="text-warmtext-900">{targetField}</strong>.
              </p>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <button
                type="button"
                onClick={() => navigate('/round/aptitude')}
                className="px-6 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust hover:scale-[1.03] transition-transform flex items-center gap-2"
              >
                <span>Proceed to Stage 2: Aptitude Test</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Results Display Section */}
      {analysisResults && (
        <div className="space-y-8 animate-fadeIn">
          
          {/* Top Score & Impression Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            
            {/* ATS Score Gauge (5 cols) */}
            <div className="lg:col-span-5 rounded-3xl bg-[#FDF4EC] p-6 border border-warmborder flex flex-col items-center justify-center text-center space-y-4 shadow-warm-sm">
              <div className="text-xs font-bold text-warmtext-900 uppercase tracking-wider font-serif">
                ATS Audit Parseability Score
              </div>

              {/* Radial Score Gauge */}
              <div className="relative w-52 h-52 flex items-center justify-center">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={gaugeData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
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
                  <div className="text-4xl font-bold font-serif text-warmtext-900">{atsScore}/100</div>
                  <div className="text-[11px] font-bold" style={{ color: scoreColor }}>
                    {atsScore > 75 ? 'Tier-1 High Pass' : atsScore >= 50 ? 'Moderate ATS Score' : 'Needs Formatting Revision'}
                  </div>
                </div>
              </div>

              <div className="text-xs text-warmtext-500 max-w-xs">
                Evaluated against enterprise recruitment parsers for {targetField} roles.
              </div>
            </div>

            {/* Overall Impression & Strengths (7 cols) */}
            <div className="lg:col-span-7 rounded-3xl bg-[#FDF4EC] p-6 border border-warmborder space-y-5 shadow-warm-sm flex flex-col justify-between">
              
              {/* Impression */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-rust-500 font-serif flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-rust-500" /> Executive Recruiter Impression
                </div>
                <p className="text-xs sm:text-sm text-warmtext-900 leading-relaxed bg-white p-4 rounded-2xl border border-warmborder font-sans shadow-warm-sm">
                  {analysisResults.overallImpression}
                </p>
              </div>

              {/* Strengths Chips */}
              <div className="space-y-2">
                <div className="text-xs font-bold uppercase tracking-wider text-dustyrose-600 font-serif flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-dustyrose-600" /> Key Demonstrated Strengths
                </div>
                <div className="space-y-2">
                  {analysisResults.strengths?.map((str, idx) => (
                    <div key={idx} className="p-3 rounded-xl bg-dustyrose-100 border border-dustyrose-200 text-xs text-warmtext-900 flex items-start gap-2">
                      <CheckCircle2 className="w-4 h-4 text-dustyrose-600 shrink-0 mt-0.5" />
                      <span>{str}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

          </div>

          {/* Areas to Improve (Weaknesses) Expandable List */}
          <div className="rounded-3xl bg-[#FDF4EC] p-6 space-y-4 border border-warmborder shadow-warm-sm">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold font-serif text-warmtext-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rust-500" />
                <span>Areas to Improve & Weakness Rewrites ({analysisResults.weaknesses?.length || 0})</span>
              </h2>
              <span className="text-xs text-warmtext-500">Click item to view specific resume line fix</span>
            </div>

            <div className="space-y-3">
              {analysisResults.weaknesses?.map((item, idx) => {
                const isExpanded = expandedWeakness === idx;
                const severityColor = item.severity === 'high' 
                  ? 'bg-rust-100 text-rust-700 border-rust-200'
                  : item.severity === 'medium'
                  ? 'bg-dustyrose-100 text-dustyrose-700 border-dustyrose-200'
                  : 'bg-peach-100 text-warmtext-700 border-warmborder';

                return (
                  <div 
                    key={idx} 
                    className="rounded-2xl bg-white border border-warmborder overflow-hidden transition-colors shadow-warm-sm"
                  >
                    <button
                      onClick={() => setExpandedWeakness(isExpanded ? null : idx)}
                      className="w-full p-4 flex items-center justify-between text-left gap-4 hover:bg-peach-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${severityColor}`}>
                          {item.severity || 'medium'}
                        </span>
                        <span className="text-xs font-bold font-serif text-warmtext-900">{item.issue}</span>
                      </div>
                      {isExpanded ? <ChevronUp className="w-4 h-4 text-warmtext-500" /> : <ChevronDown className="w-4 h-4 text-warmtext-500" />}
                    </button>

                    {isExpanded && (
                      <div className="p-4 pt-0 space-y-3 text-xs border-t border-warmborder bg-peach-50/50 font-sans">
                        {item.example && (
                          <div className="p-3 rounded-xl bg-white border border-warmborder space-y-1">
                            <span className="text-[10px] font-bold uppercase tracking-wider text-warmtext-500">Current Line in Resume:</span>
                            <p className="text-warmtext-900 italic font-mono text-[11px]">"{item.example}"</p>
                          </div>
                        )}
                        <div className="p-3 rounded-xl bg-dustyrose-100 border border-dustyrose-200 space-y-1">
                          <span className="text-[10px] font-bold uppercase tracking-wider text-rust-500">Concrete Actionable Fix:</span>
                          <p className="text-warmtext-900 leading-relaxed">{item.suggestion}</p>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Missing Keywords & Extracted Profile */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Missing Keywords */}
            <div className="rounded-3xl bg-[#FDF4EC] p-6 space-y-4 border border-warmborder shadow-warm-sm">
              <h3 className="text-base font-bold font-serif text-warmtext-900 flex items-center gap-2">
                <Tag className="w-5 h-5 text-rust-500" />
                <span>Missing Industry Keywords for {companyName}</span>
              </h3>
              <p className="text-xs text-warmtext-500">
                Skills commonly expected for {targetField} roles at {companyName} not detected in your resume text:
              </p>

              <div className="flex flex-wrap gap-2 pt-1">
                {analysisResults.missingKeywords?.map((kw, idx) => (
                  <span key={idx} className="px-3.5 py-1.5 rounded-full text-xs font-semibold bg-rust-100 border border-warmborder text-rust-700">
                    + {kw}
                  </span>
                ))}
              </div>
            </div>

            {/* Extracted Profile Summary */}
            <div className="rounded-3xl bg-[#FDF4EC] p-6 space-y-4 border border-warmborder shadow-warm-sm">
              <h3 className="text-base font-bold font-serif text-warmtext-900 flex items-center gap-2">
                <Cpu className="w-5 h-5 text-dustyrose-600" />
                <span>Parsed Candidate Profile</span>
              </h3>

              <div className="space-y-3 text-xs">
                <div>
                  <span className="font-bold text-warmtext-500 text-[11px] uppercase tracking-wider">Top Detected Skills:</span>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    {analysisResults.extractedProfile?.skills?.map((sk, idx) => (
                      <span key={idx} className="px-2.5 py-1 rounded-full text-[11px] bg-white text-warmtext-900 border border-warmborder font-semibold">
                        {sk}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="font-bold text-warmtext-500 text-[11px] uppercase tracking-wider">Extracted Projects:</span>
                  <ul className="list-disc list-inside text-warmtext-900 space-y-1 mt-1 font-medium">
                    {analysisResults.extractedProfile?.projects?.map((proj, idx) => (
                      <li key={idx} className="truncate">{proj}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

          </div>

          {/* CTA: Start Resume-Based Interview */}
          <div className="rounded-3xl p-8 bg-peach-50 border border-warmborder text-center space-y-5 shadow-warm-md">
            <div className="space-y-2">
              <h3 className="text-2xl sm:text-3xl font-bold font-serif text-warmtext-900">
                Ready for Personalized Interview Practice?
              </h3>
              <p className="text-xs sm:text-sm text-warmtext-500 max-w-xl mx-auto">
                Generate 6-8 interview questions customized to your actual resume projects and {companyName}'s technical interview bar.
              </p>
            </div>

            <button
              onClick={handleStartResumeInterview}
              disabled={generatingQuestions}
              className="inline-flex items-center justify-center gap-3 px-10 py-4 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-sm shadow-glow-rust hover:scale-[1.02] transition-all disabled:opacity-50"
            >
              {generatingQuestions ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
              <span>{generatingQuestions ? 'Generating Resume Questions...' : 'Start Resume-Based Interview'}</span>
              <ArrowRight className="w-5 h-5" />
            </button>
          </div>

        </div>
      )}

    </div>
  );
}
