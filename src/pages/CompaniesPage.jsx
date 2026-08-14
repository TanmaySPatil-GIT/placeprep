import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { INITIAL_COMPANIES, seedCompaniesInFirestore } from '../utils/seedCompanies';
import { getCompanyInsight } from '../utils/seedCompanyInsights';
import { 
  Building2, 
  Search, 
  CheckCircle2, 
  Sparkles,
  Database,
  ArrowRight,
  Clock,
  Code2,
  MessageSquare,
  ShieldCheck,
  Target,
  Lightbulb,
  AlertTriangle,
  Zap,
  Check,
  Globe,
  Users,
  UserCheck
} from 'lucide-react';

export default function CompaniesPage() {
  const navigate = useNavigate();
  const { 
    selectCompany, 
    selectedField, 
    experienceLevel, 
    experienceYears, 
    difficultyLevel, 
    selectedLanguage,
    interviewMode,
    interviewerPersona,
    selectExperience, 
    selectDifficulty,
    selectLanguage,
    selectInterviewMode,
    selectInterviewerPersona
  } = usePrep();
  
  const [companies, setCompanies] = useState(INITIAL_COMPANIES);
  const [loading, setLoading] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [seedMessage, setSeedMessage] = useState('');
  
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedDifficulty, setSelectedDifficulty] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeInsightCompany, setActiveInsightCompany] = useState('Google');

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Firestore fetch timeout')), 1500)
      );

      const snap = await Promise.race([
        getDocs(collection(db, 'companies')),
        timeoutPromise
      ]);

      if (snap && !snap.empty) {
        const fetched = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setCompanies(fetched);
      } else {
        setCompanies(INITIAL_COMPANIES);
      }
    } catch (err) {
      console.warn('Companies Firestore notice:', err.message);
      setCompanies(INITIAL_COMPANIES);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCompanies();
  }, []);

  const handleSeedDatabase = async () => {
    setSeeding(true);
    setSeedMessage('');
    const res = await seedCompaniesInFirestore();
    if (res.success) {
      setSeedMessage('Successfully seeded 20 recruiters in Firestore!');
      await fetchCompanies();
    } else {
      setSeedMessage(`Seeding note: ${res.error || 'Using local dataset'}`);
    }
    setSeeding(false);
  };

  const handleCompanySelect = (company) => {
    selectCompany(company);
    navigate('/round/aptitude');
  };

  const categories = ['All', 'FAANG / MAMAA', 'Product & Enterprise', 'Finance & FinTech', 'IT Services & Consulting'];

  const filteredCompanies = companies.filter(c => {
    const matchesCategory = selectedCategory === 'All' || c.category === selectedCategory;
    const matchesDiff = selectedDifficulty === 'All' || c.difficulty === selectedDifficulty;
    const matchesSearch = c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          c.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          c.dsaProfile?.notes?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesDiff && matchesSearch;
  });

  return (
    <div className="space-y-8 py-2">
      
      {/* Header Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 bg-peach-50 border border-warmborder shadow-warm-md">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-rust-500 text-white shadow-warm-sm flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> 20 Recruiter Ecosystem
            </span>
            <span className="text-xs text-warmtext-500 font-semibold">• Active Field Track: <strong className="text-rust-500 font-serif">{selectedField?.name || 'Software Development'}</strong></span>
            <button
              onClick={() => navigate('/select-field')}
              className="text-[11px] text-rust-600 hover:text-rust-700 underline font-bold px-2 py-0.5"
            >
              Change Track
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-warmtext-900">Interview Calibration & Recruiter Grid</h1>
          <p className="text-xs sm:text-sm text-warmtext-500">
            Configure candidate experience level and difficulty tier, then select a recruiter to launch your custom placement drive.
          </p>
        </div>

        {/* Seeder Button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-bold text-xs border border-rust-600 shadow-glow-rust transition-all disabled:opacity-50"
          >
            <Database className="w-4 h-4 text-white" />
            <span>{seeding ? 'Seeding Firestore...' : 'Seed 20 Recruiters DB'}</span>
          </button>
          {seedMessage && (
            <span className="text-[11px] text-rust-600 font-semibold">{seedMessage}</span>
          )}
        </div>
      </div>

      {/* Primary Setup Panel: Candidate Experience & Round Difficulty Selectors */}
      <div className="rounded-3xl bg-[#FDF4EC] p-6 sm:p-8 border border-warmborder space-y-6 shadow-warm-md">
        <div className="flex items-center justify-between border-b border-warmborder pb-4">
          <div className="flex items-center gap-2.5">
            <Sparkles className="w-5 h-5 text-rust-500" />
            <h2 className="text-lg sm:text-xl font-bold font-serif text-warmtext-900">Session Calibration & Parameters</h2>
          </div>
          <span className="text-xs sm:text-sm text-warmtext-500 font-mono">
            Active: <strong className="text-rust-500">{difficultyLevel} Difficulty</strong> • <strong className="text-dustyrose-600">{experienceLevel} {experienceLevel === 'Experienced' ? `(${experienceYears} yrs)` : ''}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Selector 1: Experience Level */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-warmborder shadow-warm-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-warmtext-900 font-serif">1. Candidate Experience Level</label>
              <span className="text-xs text-warmtext-500 font-sans">Interview depth focus</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => selectExperience('Fresher', '0-2')}
                className={`p-3.5 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                  experienceLevel === 'Fresher'
                    ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                    : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                }`}
              >
                <span className="text-base sm:text-lg font-bold font-heading">Fresher</span>
                <span className={`text-xs font-medium ${experienceLevel === 'Fresher' ? 'text-white/85' : 'text-warmtext-500'}`}>Fundamentals</span>
              </button>

              <button
                type="button"
                onClick={() => selectExperience('Experienced', experienceYears || '0-2')}
                className={`p-3.5 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                  experienceLevel === 'Experienced'
                    ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                    : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                }`}
              >
                <span className="text-base sm:text-lg font-bold font-heading">Experienced</span>
                <span className={`text-xs font-medium ${experienceLevel === 'Experienced' ? 'text-white/85' : 'text-warmtext-500'}`}>Scale & systems</span>
              </button>
            </div>

            {/* Sub-Selector for Years of Experience if Experienced */}
            {experienceLevel === 'Experienced' && (
              <div className="pt-3 space-y-2 border-t border-warmborder animate-fadeIn">
                <label className="text-xs font-bold text-rust-600">Select Years of Experience:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['0-2', '2-5', '5+'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => selectExperience('Experienced', yr)}
                      className={`py-2 px-3 rounded-lg text-xs sm:text-sm font-bold border transition-colors ${
                        experienceYears === yr
                          ? 'bg-rust-500 text-white border-rust-600 font-extrabold shadow-sm'
                          : 'bg-peach-50 text-warmtext-700 border-warmborder hover:bg-peach-100'
                      }`}
                    >
                      {yr} yrs
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Selector 2: Difficulty Level */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-warmborder shadow-warm-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-warmtext-900 font-serif">2. Round Difficulty Tier</label>
              <span className="text-xs text-warmtext-500 font-sans">Probing intensity</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { id: 'Easy', label: 'Easy', sub: 'Basic' },
                { id: 'Medium', label: 'Medium', sub: 'Standard' },
                { id: 'Hard', label: 'Hard', sub: 'Probing' }
              ].map((diff) => {
                const isSel = difficultyLevel === diff.id;
                return (
                  <button
                    key={diff.id}
                    type="button"
                    onClick={() => selectDifficulty(diff.id)}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col items-center justify-between text-center gap-1 ${
                      isSel
                        ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                        : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-bold font-heading">{diff.label}</span>
                    <span className={`text-xs font-medium leading-tight ${isSel ? 'text-white/85' : 'text-warmtext-500'}`}>{diff.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector 3: Spoken Interview Language */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-warmborder shadow-warm-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-warmtext-900 font-serif flex items-center gap-1.5">
                <Globe className="w-4 h-4 text-rust-500" />
                <span>3. Interview Spoken Language</span>
              </label>
              <span className="text-xs text-warmtext-500 font-sans">STT & TTS Engine</span>
            </div>

            <div className="grid grid-cols-3 gap-2">
              {[
                { code: 'en-US', name: 'English', label: 'English', sub: 'Native English' },
                { code: 'hi-IN', name: 'Hindi', label: 'Hindi', sub: 'हिंदी (Hinglish)' },
                { code: 'mr-IN', name: 'Marathi', label: 'Marathi', sub: 'मराठी (Minglish)' }
              ].map((lang) => {
                const isSel = (selectedLanguage?.code || 'en-US') === lang.code;
                return (
                  <button
                    key={lang.code}
                    type="button"
                    onClick={() => selectLanguage(lang)}
                    className={`p-3.5 rounded-xl border transition-all flex flex-col items-center justify-between text-center gap-1 ${
                      isSel
                        ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                        : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                    }`}
                  >
                    <span className="text-base sm:text-lg font-bold font-heading">{lang.label}</span>
                    <span className={`text-xs font-medium leading-tight ${isSel ? 'text-white/85' : 'text-warmtext-500'}`}>{lang.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector 4: Interviewer Format (Single vs 2-Persona Panel) */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-warmborder shadow-warm-sm">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-warmtext-900 font-serif flex items-center gap-1.5">
                <Users className="w-4 h-4 text-rust-500" />
                <span>4. Interviewer Format</span>
              </label>
              <span className="text-xs text-warmtext-500 font-sans">Interviewer Mode</span>
            </div>

            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => selectInterviewMode('single')}
                className={`p-3.5 rounded-xl border transition-all flex flex-col items-center justify-between text-center gap-1 ${
                  (interviewMode || 'single') === 'single'
                    ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                    : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                }`}
              >
                <span className="text-base sm:text-lg font-bold font-heading">Single AI</span>
                <span className={`text-xs font-medium leading-tight ${(interviewMode || 'single') === 'single' ? 'text-white/85' : 'text-warmtext-500'}`}>Standard 1-on-1</span>
              </button>

              <button
                type="button"
                onClick={() => selectInterviewMode('panel')}
                className={`p-3.5 rounded-xl border transition-all flex flex-col items-center justify-between text-center gap-1 ${
                  interviewMode === 'panel'
                    ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                    : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                }`}
              >
                <span className="text-base sm:text-lg font-bold font-heading">2-Persona Panel</span>
                <span className={`text-xs font-medium leading-tight ${interviewMode === 'panel' ? 'text-white/85' : 'text-warmtext-500'}`}>Tech Lead & HR Lead</span>
              </button>
            </div>
          </div>

          {/* Selector 5: AI Interviewer Persona */}
          <div className="space-y-3.5 p-5 rounded-2xl bg-white border border-warmborder shadow-warm-sm md:col-span-3">
            <div className="flex items-center justify-between">
              <label className="text-sm sm:text-base font-bold text-warmtext-900 font-serif flex items-center gap-1.5">
                <UserCheck className="w-4 h-4 text-rust-500" />
                <span>5. AI Interviewer Persona</span>
              </label>
              <span className="text-xs text-warmtext-500 font-sans">Tone &amp; pacing modifier — same questions, different style</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3.5">
              {[
                {
                  id: 'Strict',
                  icon: '🎯',
                  label: 'Strict',
                  sub: 'Terse, probing, zero filler',
                  desc: 'Minimal encouragement. Cuts through vague answers fast. Expects precision.'
                },
                {
                  id: 'Friendly',
                  icon: '😊',
                  label: 'Friendly',
                  sub: 'Warm, patient, encouraging',
                  desc: 'Affirms good answers, gentle follow-ups, softer tone throughout.'
                },
                {
                  id: 'Rapid-fire',
                  icon: '⚡',
                  label: 'Rapid-fire',
                  sub: 'Short, fast, high volume',
                  desc: 'Shorter questions, minimal wait, covers more ground per session.'
                }
              ].map((p) => {
                const isSel = (interviewerPersona || 'Friendly') === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => selectInterviewerPersona(p.id)}
                    className={`p-4 rounded-xl border transition-all flex flex-col gap-2 text-left ${
                      isSel
                        ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                        : 'bg-peach-50 border-warmborder text-warmtext-700 hover:bg-peach-100 hover:border-rust-300'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <span className="text-xl">{p.icon}</span>
                      <div>
                        <div className="text-base sm:text-lg font-extrabold tracking-wide font-heading">{p.label}</div>
                        <div className={`text-xs font-medium ${isSel ? 'text-white/85' : 'text-warmtext-500'}`}>{p.sub}</div>
                      </div>
                    </div>
                    <p className={`text-xs leading-relaxed ${
                      isSel ? 'text-white/90 font-normal' : 'text-warmtext-500 font-normal'
                    }`}>{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-4 rounded-2xl bg-[#FDF4EC] p-4 sm:p-5 border border-warmborder shadow-warm-sm">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-bold whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-rust-500 text-white shadow-glow-rust font-extrabold'
                  : 'bg-white text-warmtext-700 border border-warmborder hover:text-warmtext-900 hover:bg-peach-100'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Difficulty & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-warmborder pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-warmtext-700 font-bold mr-1">Difficulty Filter:</span>
            {['All', 'Hard', 'Medium', 'Easy'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-rust-500 text-white font-extrabold shadow-sm'
                    : 'bg-white text-warmtext-700 border border-warmborder hover:bg-peach-100'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-warmtext-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white text-xs text-warmtext-900 placeholder:text-warmtext-500 pl-9 pr-4 py-2 rounded-full border border-warmborder focus:outline-none focus:border-rust-500 shadow-warm-xs"
            />
          </div>
        </div>

      </div>

      {/* What [Company] Actually Looks For Static Info Panel */}
      {(() => {
        const insight = getCompanyInsight(activeInsightCompany);
        return (
          <div className="rounded-3xl bg-[#FDF4EC] p-6 space-y-4 border border-warmborder shadow-warm-sm animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warmborder pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rust-100 text-rust-600 border border-warmborder flex items-center justify-center font-bold font-serif text-lg shadow-warm-xs">
                  💡
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-warmtext-900 flex items-center gap-2">
                    <span>What {insight.company} Actually Looks For</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rust-100 text-rust-700 border border-rust-200 font-mono">
                      Curated Hiring Playbook
                    </span>
                  </h3>
                  <p className="text-xs text-warmtext-500">
                    Specific recruiter expectations, typical rounds run, and top mistakes to avoid.
                  </p>
                </div>
              </div>

              {/* Selector buttons for quick insight preview */}
              <div className="flex items-center gap-1.5 overflow-x-auto text-xs">
                {['Google', 'Amazon', 'Microsoft', 'TCS Digital', 'Meta', 'Apple'].map((cName) => (
                  <button
                    key={cName}
                    onClick={() => setActiveInsightCompany(cName)}
                    className={`px-3 py-1 rounded-full text-[11px] font-bold transition-all whitespace-nowrap ${
                      activeInsightCompany === cName
                        ? 'bg-rust-500 text-white shadow-sm font-extrabold'
                        : 'bg-white text-warmtext-700 border border-warmborder hover:bg-peach-100'
                    }`}
                  >
                    {cName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Summary */}
              <div className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 shadow-warm-xs">
                <div className="text-xs font-bold text-rust-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-rust-500" />
                  <span>Interview Style & Culture</span>
                </div>
                <p className="text-warmtext-700 text-[11px] leading-relaxed">
                  {insight.summary}
                </p>
              </div>

              {/* Typical Rounds */}
              <div className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 shadow-warm-xs">
                <div className="text-xs font-bold text-dustyrose-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-dustyrose-500" />
                  <span>Typical Hiring Rounds</span>
                </div>
                <div className="space-y-1 text-[11px] text-warmtext-700">
                  {insight.typicalRounds.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-dustyrose-500 shrink-0"></span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 shadow-warm-xs">
                <div className="text-xs font-bold text-rust-600 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-rust-500" />
                  <span>Top Candidate Mistakes</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-warmtext-700">
                  {insight.commonMistakes.map((m, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-rust-500 font-bold">⚠️</span>
                      <span>{m}</span>
                    </div>
                  ))}
                </div>
                <div className="pt-1 text-[10px] text-rust-600 italic font-serif border-t border-warmborder">
                  💡 Pro-tip: "{insight.proTip}"
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* 20 Companies Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCompanies.map((company) => (
          <div
            key={company.id}
            onClick={() => setActiveInsightCompany(company.name)}
            className={`card-interactive rounded-2xl bg-[#FDF4EC] p-6 flex flex-col justify-between space-y-6 border group ${
              activeInsightCompany === company.name
                ? 'border-rust-500 border-l-4 border-l-rust-500 shadow-glow-rust'
                : 'border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-sm'
            }`}
          >
            
            <div className="space-y-4">
              
              {/* Card Top Bar */}
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-3">
                  <div className="icon-badge w-12 h-12 rounded-xl bg-rust-100 text-rust-500 border border-warmborder font-bold font-serif text-lg shadow-warm-sm">
                    {company.logoText}
                  </div>
                  <div>
                    <h3 className="text-lg font-bold font-serif text-warmtext-900 group-hover:text-rust-500 transition-colors">{company.name}</h3>
                    <span className="text-[10px] text-rust-500 font-semibold">{company.category || 'Recruiter Track'}</span>
                  </div>
                </div>

                <span className={`px-3 py-1 rounded-full text-[10px] font-extrabold uppercase border ${
                  company.difficulty === 'Hard'
                    ? 'bg-rust-100 text-rust-700 border-rust-200'
                    : company.difficulty === 'Medium'
                    ? 'bg-dustyrose-100 text-dustyrose-700 border-dustyrose-200'
                    : 'bg-peach-100 text-warmtext-700 border-warmborder'
                }`}>
                  {company.difficulty}
                </span>
              </div>

              {/* Description */}
              <p className="text-xs text-warmtext-500 leading-relaxed bg-white p-3.5 rounded-xl border border-warmborder shadow-warm-sm">
                {company.description}
              </p>

              {/* What to Expect Callout Line */}
              <div className="p-3.5 rounded-xl bg-peach-100 border border-warmborder text-xs space-y-1">
                <div className="text-[10px] font-extrabold text-rust-500 uppercase tracking-wider flex items-center gap-1">
                  <Target className="w-3 h-3" /> What To Expect:
                </div>
                <p className="text-warmtext-900 leading-normal text-[11px]">
                  {company.dsaProfile?.notes || company.interviewProfile?.notes || 'Comprehensive hiring assessment.'}
                </p>
              </div>

              {/* Round Details Pill */}
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <div className="p-2.5 rounded-xl bg-white border border-warmborder flex items-center gap-1.5 text-warmtext-500">
                  <Clock className="w-3.5 h-3.5 text-rust-500 shrink-0" />
                  <span>DSA Timer: <strong className="text-warmtext-900">{company.dsaProfile?.timeLimitMinutes || 45}m</strong></span>
                </div>
                <div className="p-2.5 rounded-xl bg-white border border-warmborder flex items-center gap-1.5 text-warmtext-500">
                  <Code2 className="w-3.5 h-3.5 text-dustyrose-600 shrink-0" />
                  <span>Topics: <strong className="text-warmtext-900 truncate max-w-[80px]">{company.dsaProfile?.topicsFocus?.[0] || 'Arrays'}</strong></span>
                </div>
              </div>

              {/* Selection Rounds List */}
              <div className="space-y-1.5">
                <div className="text-[10px] font-bold text-warmtext-500 uppercase tracking-wider">
                  Hiring Pipeline Rounds ({company.rounds?.length || 4}):
                </div>
                <div className="space-y-1">
                  {company.rounds?.map((round, idx) => (
                    <div key={idx} className="flex items-center gap-2 text-xs text-warmtext-700">
                      <CheckCircle2 className="w-3.5 h-3.5 text-rust-500 shrink-0" />
                      <span className="truncate">{round}</span>
                    </div>
                  ))}
                </div>
              </div>

            </div>

            {/* Action Button */}
            <button
              onClick={() => handleCompanySelect(company)}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white text-xs font-extrabold shadow-glow-rust transition-all"
            >
              <span className="link-text">Select & Start Round 1 (DSA)</span>
              <ArrowRight className="arrow-icon w-4 h-4" />
            </button>

          </div>
        ))}
      </div>

    </div>
  );
}
