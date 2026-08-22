import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { usePrep } from '../context/PrepContext';
import { INITIAL_COURSE_CATALOG, seedCourseCatalogInFirestore } from '../utils/seedCourseCatalog';
import { getBackendUrl } from '../config/api';
import { 
  BookOpen, 
  Sparkles, 
  Award, 
  ExternalLink,
  Cpu,
  RotateCcw,
  LayoutDashboard,
  Briefcase,
  AlertCircle,
  GraduationCap,
  ListOrdered,
  Filter,
  CheckCircle2,
  Clock,
  Tag,
  DollarSign
} from 'lucide-react';

export default function RecommendationsPage() {
  const navigate = useNavigate();
  const { userProfile } = useAuth();
  const { 
    selectedField, 
    selectedCompany, 
    sessionResults, 
    dsaResult, 
    aptitudeResult, 
    resumeData, 
    setRoundIndex 
  } = usePrep();

  const fieldId = selectedField?.fieldId || 'sde';
  const targetField = selectedField?.name || userProfile?.targetField || 'Software Development';
  const companyName = selectedCompany?.name || 'Google';

  // Aggregate signals from ALL completed tools/rounds
  const aggregatedWeakAreas = [];
  if (aptitudeResult?.weakestSection) {
    aggregatedWeakAreas.push(`Aptitude: ${aptitudeResult.weakestSection}`);
  }
  if (dsaResult?.topic) {
    aggregatedWeakAreas.push(`Technical: ${dsaResult.topic}`);
  }
  if (sessionResults && sessionResults.length > 0) {
    const totalFillers = sessionResults.reduce((acc, r) => acc + (r.metrics?.fillerWordCount || 0), 0);
    if (totalFillers > 2) aggregatedWeakAreas.push('Vocal Filler Elimination');
  }

  const missingKeywords = resumeData?.missingKeywords || [];
  const resumeWeaknesses = resumeData?.weaknesses?.map(w => w.issue) || [];
  const allGaps = Array.from(new Set([...aggregatedWeakAreas, ...missingKeywords, ...resumeWeaknesses]));

  const [catalogItems, setCatalogItems] = useState([]);
  const [recommendations, setRecommendations] = useState([]);
  const [learningPath, setLearningPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorNotice, setErrorNotice] = useState('');

  // UI Filters
  const [activeTab, setActiveTab] = useState('All');
  const [freeOnly, setFreeOnly] = useState(false);
  const [selectedLevel, setSelectedLevel] = useState('All');

  // Fetch Catalog & Hybrid Gemini Recommendations
  const fetchRecommendations = async () => {
    setLoading(true);
    setErrorNotice('');

    try {
      // Step 1: Fetch Course Catalog from Firestore
      const snap = await getDocs(collection(db, 'courseCatalog'));
      let catalogPool = [];
      if (!snap.empty) {
        catalogPool = snap.docs.map(d => ({ catalogId: d.id, ...d.data() }));
      } else {
        catalogPool = INITIAL_COURSE_CATALOG;
        seedCourseCatalogInFirestore();
      }

      setCatalogItems(catalogPool);

      // Filter catalog by selectedField
      const fieldCatalog = catalogPool.filter(item => 
        !item.fieldIds || item.fieldIds.includes(fieldId) || item.fieldIds.length === 0
      );

      const candidateCatalog = fieldCatalog.length > 0 ? fieldCatalog : catalogPool;

      // Step 2: Call Flask Hybrid Recommendation Endpoint
      const FLASK_RECS_URL = `${getBackendUrl()}/api/recommendations`;

      const payload = {
        fieldId,
        targetField,
        companyName,
        weakAreas: allGaps.length > 0 ? allGaps : ['DSA & Algorithmic Patterns', 'System Design'],
        missingKeywords,
        catalogSubset: candidateCatalog
      };

      const controller = new AbortController();
      const fetchTimeout = setTimeout(() => controller.abort(), 15000);

      const response = await fetch(FLASK_RECS_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        signal: controller.signal
      });
      clearTimeout(fetchTimeout);

      if (!response.ok) {
        throw new Error(`Flask API response HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.recommendations && Array.isArray(data.recommendations)) {
        setRecommendations(data.recommendations);
        setLearningPath(data.learningPath || []);
      } else {
        throw new Error('Invalid recommendations array returned');
      }
    } catch (err) {
      console.warn('Hybrid recommendations notice:', err.message);
      setErrorNotice('Using verified catalog fallback recommendations.');
      
      // Verified local fallback
      const fallbackList = INITIAL_COURSE_CATALOG.filter(c => c.fieldIds?.includes(fieldId)).slice(0, 6);
      setRecommendations(fallbackList.map((item, idx) => ({
        ...item,
        whyItHelps: `Recommended for ${targetField} candidates at ${companyName} to build core technical proficiency.`,
        priorityRank: idx + 1
      })));

      setLearningPath([
        { step: 1, catalogId: fallbackList[0]?.catalogId, focus: `Fix primary gap in ${allGaps[0] || 'Technical Fundamentals'}` },
        { step: 2, catalogId: fallbackList[1]?.catalogId, focus: `Build cloud/DevOps keywords: ${missingKeywords[0] || 'CI/CD'}` }
      ]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, [fieldId, companyName]);

  // Filter recommendations by Tab, Free Only, and Level
  const filteredRecommendations = recommendations.filter(item => {
    const itemType = (item.type || 'course').toLowerCase();
    
    // Tab filter
    if (activeTab === 'Courses' && itemType !== 'course') return false;
    if (activeTab === 'Certifications' && itemType !== 'certification') return false;
    if (activeTab === 'Free Resources' && itemType !== 'free_resource' && itemType !== 'youtube_playlist') return false;

    // Free Only filter
    if (freeOnly && (item.cost || '').toLowerCase() !== 'free') return false;

    // Level filter
    if (selectedLevel !== 'All' && (item.level || '').toLowerCase() !== selectedLevel.toLowerCase()) return false;

    return true;
  });

  return (
    <div className="space-y-8 py-2 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-[32px] p-6 sm:p-8 bg-[#FDF4EC] border border-warmborder shadow-warm-sm">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-100 text-rust-500 border border-warmborder text-xs font-bold">
            <BookOpen className="w-3.5 h-3.5 text-rust-500" />
            <span>Placement Roadmap • Verified Skill Catalog</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-warmtext-900">Personalized Learning & Career Growth Path</h1>
          <p className="text-xs text-warmtext-500 max-w-2xl leading-relaxed font-sans">
            Tailored specifically for <strong className="text-rust-500">{targetField}</strong> candidates preparing for <strong className="text-warmtext-900">{companyName}</strong> based on your performance signals & resume audit.
          </p>
        </div>

        <button
          onClick={fetchRecommendations}
          disabled={loading}
          className="flex items-center gap-2 px-5 py-2.5 rounded-full bg-white hover:bg-dustyrose-100 text-rust-500 font-bold text-xs border border-warmborder transition-all shadow-warm-sm disabled:opacity-50 shrink-0"
        >
          <BookOpen className="w-4 h-4 text-rust-500" />
          <span>{loading ? 'Analyzing Signals...' : 'Refresh Recommendations'}</span>
        </button>
      </div>

      {/* Recommended Learning Path (1-2-3-4 Sequenced Steps) */}
      {learningPath.length > 0 && !loading && (
        <div className="rounded-3xl bg-[#FDF4EC] p-6 border border-warmborder space-y-4 shadow-warm-sm">
          <div className="flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-rust-500" />
            <h2 className="text-base font-bold font-serif text-warmtext-900">Recommended Learning Sequence (By Gap Severity)</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {learningPath.map((stepItem, idx) => {
              const matchedRec = recommendations.find(r => r.catalogId === stepItem.catalogId) || recommendations[idx];
              return (
                <div key={idx} className="p-4 rounded-2xl bg-white border border-warmborder space-y-2 relative shadow-warm-sm">
                  <div className="flex items-center justify-between">
                    <span className="w-7 h-7 rounded-full bg-rust-500 text-white font-extrabold text-xs flex items-center justify-center font-serif shadow-glow-rust">
                      #{stepItem.step || idx + 1}
                    </span>
                    <span className="text-[10px] text-warmtext-500 font-mono">Priority Step</span>
                  </div>

                  <div className="text-xs font-bold text-warmtext-900 font-serif line-clamp-2">
                    {matchedRec?.title || `Learning Step ${idx+1}`}
                  </div>
                  <p className="text-[11px] text-rust-500 font-sans leading-relaxed">
                    {stepItem.focus}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter Controls Bar */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-4 p-4 rounded-2xl bg-[#FDF4EC] border border-warmborder shadow-warm-sm">
        
        {/* Type Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 sm:pb-0">
          {['All', 'Courses', 'Certifications', 'Free Resources'].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                activeTab === tab
                  ? 'bg-rust-500 text-white font-extrabold shadow-glow-rust'
                  : 'bg-white text-warmtext-700 hover:text-warmtext-900 border border-warmborder'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Filters: Free Only Toggle & Level Dropdown */}
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-warmtext-900 cursor-pointer">
            <input
              type="checkbox"
              checked={freeOnly}
              onChange={(e) => setFreeOnly(e.target.checked)}
              className="rounded bg-white border-warmborder text-rust-500 focus:ring-0"
            />
            <span>Free Only</span>
          </label>

          <div className="flex items-center gap-1.5 text-xs text-warmtext-500">
            <Filter className="w-3.5 h-3.5 text-rust-500" />
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value)}
              className="bg-white text-xs text-warmtext-900 p-1.5 rounded-xl border border-warmborder focus:outline-none"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>
        </div>

      </div>

      {/* Recommendation Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-64 rounded-2xl bg-[#FDF4EC] animate-pulse p-6 space-y-4 border border-warmborder">
              <div className="h-4 bg-peach-200 rounded w-1/3" />
              <div className="h-6 bg-peach-200 rounded w-3/4" />
              <div className="h-20 bg-white rounded-xl" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredRecommendations.map((item, idx) => (
            <RecommendationCard key={idx} item={item} />
          ))}
        </div>
      )}

      {/* Fallback if empty filter */}
      {!loading && filteredRecommendations.length === 0 && (
        <div className="rounded-3xl bg-[#FDF4EC] p-12 text-center space-y-3 border border-warmborder shadow-warm-sm">
          <BookOpen className="w-8 h-8 text-warmtext-500 mx-auto" />
          <h3 className="text-base font-bold font-serif text-warmtext-900">No resources match the selected filters</h3>
          <button 
            onClick={() => { setActiveTab('All'); setFreeOnly(false); setSelectedLevel('All'); }}
            className="text-xs text-rust-500 underline font-bold"
          >
            Reset Filters
          </button>
        </div>
      )}

    </div>
  );
}

// Recommendation Card Sub-component
function RecommendationCard({ item }) {
  const cost = item.cost || 'Free';
  const level = item.level || 'Intermediate';
  const duration = item.estimatedDuration || '4 weeks';

  const costColor = cost.toLowerCase() === 'free' 
    ? 'bg-dustyrose-100 text-dustyrose-700 border-dustyrose-200'
    : cost.toLowerCase() === 'freemium'
    ? 'bg-peach-100 text-rust-700 border-warmborder'
    : 'bg-rust-100 text-rust-700 border-rust-200';

  return (
    <div className="rounded-2xl bg-[#FDF4EC] p-6 flex flex-col justify-between space-y-4 border border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-sm hover:shadow-warm-hover hover:border-rust-400 hover:-translate-y-1.5 transition-all duration-200 ease-out cursor-pointer group">
      
      <div className="space-y-3">
        
        {/* Badges Bar: Provider, Level, Cost, Duration */}
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warmborder pb-2">
          <span className="text-xs font-bold text-warmtext-900 font-serif truncate max-w-[130px]">
            {item.provider}
          </span>

          <div className="flex items-center gap-1.5">
            <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${costColor}`}>
              {cost}
            </span>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-semibold bg-white text-warmtext-700 border border-warmborder">
              {level}
            </span>
          </div>
        </div>

        {/* Title */}
        <h3 className="text-base font-bold font-serif text-warmtext-900 group-hover:text-rust-500 transition-colors leading-snug">
          {item.title}
        </h3>

        {/* Duration */}
        <div className="flex items-center gap-1.5 text-[11px] text-warmtext-500">
          <Clock className="w-3.5 h-3.5 text-rust-500 transition-transform duration-200 group-hover:scale-110" />
          <span>Estimated Duration: {duration}</span>
        </div>

        {/* Personalized "Why It Helps" Callout Box */}
        <div className="p-3.5 rounded-2xl bg-white border border-warmborder text-xs text-warmtext-900 space-y-1 shadow-warm-sm">
          <div className="text-[10px] font-bold text-rust-500 uppercase tracking-wider flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-rust-500" /> Personalized Reasoning:
          </div>
          <p className="leading-relaxed text-warmtext-700">{item.whyItHelps || item.reason}</p>
        </div>

      </div>

      {/* Verified Link CTA Button */}
      <div className="pt-2">
        <a
          href={item.link || 'https://coursera.org'}
          target="_blank"
          rel="noopener noreferrer"
          className="w-full py-3 rounded-full bg-rust-500 hover:bg-rust-600 text-white text-xs font-extrabold flex items-center justify-center gap-2 shadow-glow-rust transition-all"
        >
          <span className="group-hover:underline">Open Verified Resource</span>
          <ExternalLink className="w-3.5 h-3.5 transition-transform duration-200 group-hover:translate-x-1" />
        </a>
      </div>

    </div>
  );
}
