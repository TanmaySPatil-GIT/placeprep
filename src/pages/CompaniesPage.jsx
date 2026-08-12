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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 bg-gradient-to-r from-forest-800 via-forest-900 to-earth-brown border border-forest-600/40 shadow-earthy">
        <div className="space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-semibold px-3 py-1 rounded-full bg-sage-500/25 text-accent-gold border border-sage-400/30 flex items-center gap-1.5">
              <Building2 className="w-3.5 h-3.5" /> 20 Recruiter Ecosystem
            </span>
            <span className="text-xs text-earth-cream/70 font-semibold">• Active Field Track: <strong className="text-accent-gold font-serif">{selectedField?.name || 'Software Development'}</strong></span>
            <button
              onClick={() => navigate('/select-field')}
              className="text-[10px] text-earth-cream/80 hover:text-white underline font-bold px-2 py-0.5"
            >
              Change Track
            </button>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-earth-cream">Interview Calibration & Recruiter Grid</h1>
          <p className="text-xs text-earth-cream/70">
            Configure candidate experience level and difficulty tier, then select a recruiter to launch your custom placement drive.
          </p>
        </div>

        {/* Seeder Button */}
        <div className="flex flex-col items-end gap-1">
          <button
            onClick={handleSeedDatabase}
            disabled={seeding}
            className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-forest-900/80 hover:bg-forest-600 text-accent-gold font-semibold text-xs border border-accent-gold/30 transition-all disabled:opacity-50"
          >
            <Database className="w-4 h-4 text-accent-gold" />
            <span>{seeding ? 'Seeding Firestore...' : 'Seed 20 Recruiters DB'}</span>
          </button>
          {seedMessage && (
            <span className="text-[11px] text-sage-400 font-semibold">{seedMessage}</span>
          )}
        </div>
      </div>

      {/* Primary Setup Panel: Candidate Experience & Round Difficulty Selectors */}
      <div className="rounded-3xl bg-forest-800/90 p-6 border border-forest-600/40 space-y-5 shadow-earthy backdrop-blur-md">
        <div className="flex items-center justify-between border-b border-forest-600/30 pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-accent-gold" />
            <h2 className="text-base font-bold font-serif text-earth-cream">Session Calibration & Parameters</h2>
          </div>
          <span className="text-xs text-earth-cream/70 font-mono">
            Active: <strong className="text-accent-gold">{difficultyLevel} Difficulty</strong> • <strong className="text-sage-400">{experienceLevel} {experienceLevel === 'Experienced' ? `(${experienceYears} yrs)` : ''}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Selector 1: Experience Level */}
          <div className="space-y-3 p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-earth-cream font-serif">1. Candidate Experience Level</label>
              <span className="text-[10px] text-earth-cream/60">Interview depth focus</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectExperience('Fresher', '0-2')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  experienceLevel === 'Fresher'
                    ? 'bg-gradient-to-r from-accent-gold/20 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                    : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                }`}
              >
                <span>Fresher</span>
                <span className="text-[10px] font-normal text-earth-cream/60">Fundamentals</span>
              </button>

              <button
                type="button"
                onClick={() => selectExperience('Experienced', experienceYears || '0-2')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  experienceLevel === 'Experienced'
                    ? 'bg-gradient-to-r from-accent-gold/20 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                    : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                }`}
              >
                <span>Experienced</span>
                <span className="text-[10px] font-normal text-earth-cream/60">Scale & systems</span>
              </button>
            </div>

            {/* Sub-Selector for Years of Experience if Experienced */}
            {experienceLevel === 'Experienced' && (
              <div className="pt-2 space-y-1.5 border-t border-forest-600/30 animate-fadeIn">
                <label className="text-[11px] font-semibold text-accent-gold">Select Years of Experience:</label>
                <div className="grid grid-cols-3 gap-2">
                  {['0-2', '2-5', '5+'].map((yr) => (
                    <button
                      key={yr}
                      type="button"
                      onClick={() => selectExperience('Experienced', yr)}
                      className={`py-1.5 px-3 rounded-lg text-xs font-bold border transition-colors ${
                        experienceYears === yr
                          ? 'bg-accent-gold text-forest-900 border-accent-gold font-extrabold'
                          : 'bg-forest-800 text-earth-cream/70 border-forest-600/40 hover:text-white'
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
          <div className="space-y-3 p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-earth-cream font-serif">2. Round Difficulty Tier</label>
              <span className="text-[10px] text-earth-cream/60">Probing intensity</span>
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
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-between text-center gap-1 ${
                      isSel
                        ? diff.id === 'Hard' 
                          ? 'bg-earth-terracotta/30 border-earth-terracotta text-earth-cream shadow-glow-gold'
                          : diff.id === 'Medium'
                          ? 'bg-earth-tan/30 border-accent-gold text-accent-gold shadow-glow-gold'
                          : 'bg-sage-500/30 border-sage-400 text-sage-400 shadow-glow-gold'
                        : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                    }`}
                  >
                    <span>{diff.label}</span>
                    <span className="text-[9px] font-normal text-earth-cream/60 leading-tight">{diff.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector 3: Spoken Interview Language */}
          <div className="space-y-3 p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-earth-cream font-serif flex items-center gap-1">
                <Globe className="w-3.5 h-3.5 text-accent-gold" />
                <span>3. Interview Spoken Language</span>
              </label>
              <span className="text-[10px] text-earth-cream/60">STT & TTS Engine</span>
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
                    className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-between text-center gap-1 ${
                      isSel
                        ? 'bg-gradient-to-r from-accent-gold/20 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                        : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                    }`}
                  >
                    <span>{lang.label}</span>
                    <span className="text-[9px] font-normal text-earth-cream/60 leading-tight">{lang.sub}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Selector 4: Interviewer Format (Single vs 2-Persona Panel) */}
          <div className="space-y-3 p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-earth-cream font-serif flex items-center gap-1">
                <Users className="w-3.5 h-3.5 text-accent-gold" />
                <span>4. Interviewer Format</span>
              </label>
              <span className="text-[10px] text-earth-cream/60">Interviewer Mode</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectInterviewMode('single')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-between text-center gap-1 ${
                  (interviewMode || 'single') === 'single'
                    ? 'bg-gradient-to-r from-accent-gold/20 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                    : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                }`}
              >
                <span>Single AI</span>
                <span className="text-[9px] font-normal text-earth-cream/60 leading-tight">Standard 1-on-1</span>
              </button>

              <button
                type="button"
                onClick={() => selectInterviewMode('panel')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center justify-between text-center gap-1 ${
                  interviewMode === 'panel'
                    ? 'bg-gradient-to-r from-accent-gold/20 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                    : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                }`}
              >
                <span>2-Persona Panel</span>
                <span className="text-[9px] font-normal text-earth-cream/60 leading-tight">Tech Lead & HR Lead</span>
              </button>
            </div>
          </div>

          {/* Selector 5: Interviewer Persona */}
          <div className="space-y-3 p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30 md:col-span-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-earth-cream font-serif flex items-center gap-1">
                <UserCheck className="w-3.5 h-3.5 text-accent-gold" />
                <span>5. AI Interviewer Persona</span>
              </label>
              <span className="text-[10px] text-earth-cream/60">Tone &amp; pacing modifier — same questions, different style</span>
            </div>

            <div className="grid grid-cols-3 gap-3">
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
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col gap-1.5 text-left ${
                      isSel
                        ? p.id === 'Strict'
                          ? 'bg-earth-terracotta/20 border-earth-terracotta text-earth-cream shadow-glow-gold'
                          : p.id === 'Rapid-fire'
                          ? 'bg-sage-500/20 border-sage-400 text-sage-400 shadow-glow-gold'
                          : 'bg-gradient-to-r from-accent-gold/20 to-earth-tan/20 border-accent-gold text-accent-gold shadow-glow-gold'
                        : 'bg-forest-800 border-forest-600/40 text-earth-cream/70 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{p.icon}</span>
                      <div>
                        <div className="font-extrabold tracking-wide">{p.label}</div>
                        <div className="text-[9px] font-normal text-earth-cream/60">{p.sub}</div>
                      </div>
                    </div>
                    <p className={`text-[10px] font-normal leading-tight ${
                      isSel ? 'text-earth-cream/80' : 'text-earth-cream/40'
                    }`}>{p.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

      {/* Category Tabs & Search Bar */}
      <div className="space-y-4 rounded-2xl bg-forest-800/80 p-4 border border-forest-600/40 shadow-earthy backdrop-blur-md">
        
        {/* Category Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                selectedCategory === cat
                  ? 'bg-gradient-to-r from-accent-gold to-earth-tan text-forest-900 font-extrabold shadow-glow-gold'
                  : 'bg-forest-900/60 text-earth-cream/70 hover:text-earth-cream hover:bg-forest-600'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Difficulty & Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 border-t border-forest-600/30 pt-3">
          <div className="flex items-center gap-2">
            <span className="text-xs text-earth-cream/70 font-bold mr-1">Difficulty Filter:</span>
            {['All', 'Hard', 'Medium', 'Easy'].map((diff) => (
              <button
                key={diff}
                onClick={() => setSelectedDifficulty(diff)}
                className={`px-3.5 py-1 rounded-full text-xs font-semibold transition-colors ${
                  selectedDifficulty === diff
                    ? 'bg-earth-terracotta text-white font-extrabold'
                    : 'bg-forest-900/60 text-earth-cream/70 hover:text-white'
                }`}
              >
                {diff}
              </button>
            ))}
          </div>

          <div className="relative min-w-[240px]">
            <Search className="w-4 h-4 text-earth-cream/60 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search company or topics..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-forest-900/80 text-xs text-earth-cream placeholder:text-earth-cream/50 pl-9 pr-4 py-2 rounded-full border border-forest-600/40 focus:outline-none focus:border-accent-gold"
            />
          </div>
        </div>

      </div>

      {/* What [Company] Actually Looks For Static Info Panel */}
      {(() => {
        const insight = getCompanyInsight(activeInsightCompany);
        return (
          <div className="rounded-3xl bg-forest-800/90 p-6 space-y-4 border border-accent-gold/40 shadow-earthy backdrop-blur-md animate-fadeIn">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-forest-600/40 pb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-accent-gold/20 text-accent-gold border border-accent-gold/30 flex items-center justify-center font-bold font-serif text-lg">
                  💡
                </div>
                <div>
                  <h3 className="text-base font-bold font-serif text-earth-cream flex items-center gap-2">
                    <span>What {insight.company} Actually Looks For</span>
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-accent-gold/20 text-accent-gold border border-accent-gold/30 font-mono">
                      Curated Hiring Playbook
                    </span>
                  </h3>
                  <p className="text-xs text-earth-cream/70">
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
                        ? 'bg-accent-gold text-forest-900 shadow-sm font-extrabold'
                        : 'bg-forest-900/80 text-earth-cream/70 border border-forest-600/30 hover:text-white'
                    }`}
                  >
                    {cName}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
              {/* Summary */}
              <div className="p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30 space-y-2">
                <div className="text-xs font-bold text-accent-gold uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <Lightbulb className="w-4 h-4 text-accent-gold" />
                  <span>Interview Style & Culture</span>
                </div>
                <p className="text-earth-cream/90 text-[11px] leading-relaxed">
                  {insight.summary}
                </p>
              </div>

              {/* Typical Rounds */}
              <div className="p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30 space-y-2">
                <div className="text-xs font-bold text-sage-400 uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-sage-400" />
                  <span>Typical Hiring Rounds</span>
                </div>
                <div className="space-y-1 text-[11px] text-earth-cream/80">
                  {insight.typicalRounds.map((r, i) => (
                    <div key={i} className="flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-sage-400 shrink-0"></span>
                      <span>{r}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Common Mistakes */}
              <div className="p-4 rounded-2xl bg-forest-900/80 border border-forest-600/30 space-y-2">
                <div className="text-xs font-bold text-earth-terracotta uppercase tracking-wider font-mono flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4 text-earth-terracotta" />
                  <span>Top Candidate Mistakes</span>
                </div>
                <div className="space-y-1.5 text-[11px] text-earth-cream/80">
                  {insight.commonMistakes.map((m, i) => (
                    <div key={i} className="flex items-start gap-1.5">
                      <span className="text-earth-terracotta font-bold">⚠️</span>
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

      {/* Primary Setup Panel: Candidate Experience & Round Difficulty Selectors */}
      <div className="rounded-3xl bg-[#FDF4EC] p-6 border border-warmborder space-y-5 shadow-warm-sm">
        <div className="flex items-center justify-between border-b border-warmborder pb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-rust-500" />
            <h2 className="text-base font-bold font-serif text-warmtext-900">Session Calibration & Parameters</h2>
          </div>
          <span className="text-xs text-warmtext-500 font-mono">
            Active: <strong className="text-rust-500">{difficultyLevel} Difficulty</strong> • <strong className="text-dustyrose-600">{experienceLevel} {experienceLevel === 'Experienced' ? `(${experienceYears} yrs)` : ''}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          
          {/* Selector 1: Experience Level */}
          <div className="space-y-3 p-4 rounded-2xl bg-white border border-warmborder">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-warmtext-900 font-serif">1. Candidate Experience Level</label>
              <span className="text-[10px] text-warmtext-500">Interview depth focus</span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => selectExperience('Fresher', '0-2')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  experienceLevel === 'Fresher'
                    ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                    : 'bg-peach-50 border-warmborder text-warmtext-700 hover:text-rust-500'
                }`}
              >
                <span>Fresher</span>
                <span className={`text-[10px] font-normal ${experienceLevel === 'Fresher' ? 'text-white/80' : 'text-warmtext-500'}`}>Fundamentals</span>
              </button>

              <button
                type="button"
                onClick={() => selectExperience('Experienced', experienceYears || '0-2')}
                className={`p-3 rounded-xl border text-xs font-bold transition-all flex flex-col items-center gap-1 ${
                  experienceLevel === 'Experienced'
                    ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                    : 'bg-peach-50 border-warmborder text-warmtext-700 hover:text-rust-500'
                }`}
              >
                <span>Experienced</span>
                <span className={`text-[10px] font-normal ${experienceLevel === 'Experienced' ? 'text-white/80' : 'text-warmtext-500'}`}>Architecture</span>
              </button>
            </div>
          </div>

          {/* Selector 2: Difficulty Tier */}
          <div className="space-y-3 p-4 rounded-2xl bg-white border border-warmborder">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-warmtext-900 font-serif">2. Round Difficulty</label>
              <span className="text-[10px] text-warmtext-500 font-mono">Calibrated Questions</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {['Easy', 'Medium', 'Hard'].map((diff) => (
                <button
                  key={diff}
                  type="button"
                  onClick={() => selectDifficulty(diff)}
                  className={`p-2.5 rounded-xl border text-xs font-bold transition-all text-center ${
                    difficultyLevel === diff
                      ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                      : 'bg-peach-50 border-warmborder text-warmtext-700 hover:text-rust-500'
                  }`}
                >
                  {diff}
                </button>
              ))}
            </div>
          </div>

          {/* Selector 3: Preferred Language */}
          <div className="space-y-3 p-4 rounded-2xl bg-white border border-warmborder">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-warmtext-900 font-serif">3. Primary Coding Language</label>
              <span className="text-[10px] text-warmtext-500">DSA IDE Preset</span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              {['python', 'cpp', 'java'].map((lang) => (
                <button
                  key={lang}
                  type="button"
                  onClick={() => selectLanguage(lang)}
                  className={`p-2.5 rounded-xl border text-xs font-bold uppercase transition-all text-center ${
                    selectedLanguage === lang
                      ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                      : 'bg-peach-50 border-warmborder text-warmtext-700 hover:text-rust-500'
                  }`}
                >
                  {lang === 'cpp' ? 'C++' : lang}
                </button>
              ))}
            </div>
          </div>

          {/* Selector 4: Interview Mode */}
          <div className="space-y-3 p-4 rounded-2xl bg-white border border-warmborder md:col-span-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-warmtext-900 font-serif flex items-center gap-1">
                <MessageSquare className="w-3.5 h-3.5 text-rust-500" />
                <span>4. Mock Interview Response Mode</span>
              </label>
              <span className="text-[10px] text-warmtext-500">Applies to Mock Technical Round (Round 4)</span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {[
                {
                  id: 'Voice / Audio',
                  icon: '🎙️',
                  label: 'Voice / Audio (Recommended)',
                  sub: 'Speech-to-Text with Speech Pace Analytics',
                  desc: 'Speak answers out loud. Platform transcribes, measures WPM pace, filler words, and vocal confidence.'
                },
                {
                  id: 'Text Input',
                  icon: '✍️',
                  label: 'Text Input Mode',
                  sub: 'Traditional Written Answers',
                  desc: 'Type your responses in structured answer boxes. Best if microphone access is limited.'
                }
              ].map((mode) => {
                const isSel = (interviewMode || 'Voice / Audio') === mode.id;
                return (
                  <button
                    key={mode.id}
                    type="button"
                    onClick={() => selectInterviewMode(mode.id)}
                    className={`p-3.5 rounded-xl border text-xs font-bold transition-all flex flex-col gap-1.5 text-left ${
                      isSel
                        ? 'bg-rust-500 text-white border-rust-600 shadow-glow-rust'
                        : 'bg-peach-50 border-warmborder text-warmtext-700 hover:text-rust-500'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-base">{mode.icon}</span>
                      <div>
                        <div className="font-extrabold tracking-wide">{mode.label}</div>
                        <div className={`text-[9px] font-normal ${isSel ? 'text-white/80' : 'text-warmtext-500'}`}>{mode.sub}</div>
                      </div>
                    </div>
                    <p className={`text-[10px] font-normal leading-tight ${isSel ? 'text-white/90' : 'text-warmtext-500'}`}>{mode.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>

        </div>
      </div>

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
