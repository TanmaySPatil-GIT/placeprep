import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { INITIAL_FIELDS, seedFieldsInFirestore } from '../utils/seedFields';
import { 
  Code2, 
  CheckSquare, 
  BarChart3, 
  Cpu, 
  Server, 
  Shield, 
  Layout, 
  Target, 
  Smartphone, 
  FileText,
  Sparkles,
  ArrowRight,
  Zap,
  CheckCircle2,
  Star,
  Info
} from 'lucide-react';

const ICON_MAP = {
  Code2,
  CheckSquare,
  BarChart3,
  Cpu,
  Server,
  Shield,
  Layout,
  Target,
  Smartphone,
  FileText
};

export default function SelectFieldPage() {
  const navigate = useNavigate();
  const { selectedField, selectField, difficultyLevel, experienceLevel, experienceYears } = usePrep();
  const [fields, setFields] = useState(INITIAL_FIELDS);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchFields = async () => {
      setLoading(true);
      try {
        const snap = await getDocs(collection(db, 'fields'));
        if (!snap.empty) {
          const fetched = snap.docs.map(d => ({ fieldId: d.id, ...d.data() }));
          setFields(fetched);
        } else {
          setFields(INITIAL_FIELDS);
          seedFieldsInFirestore();
        }
      } catch (err) {
        console.warn('Fields fetch notice:', err.message);
        setFields(INITIAL_FIELDS);
      } finally {
        setLoading(false);
      }
    };

    fetchFields();
  }, []);

  const handleFieldSelect = (fieldItem, e) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    selectField(fieldItem);
    navigate('/companies');
  };

  return (
    <div className="space-y-8 py-2 max-w-7xl mx-auto">
      
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 rounded-3xl p-6 sm:p-8 bg-peach-50 border border-warmborder shadow-warm-md">
        <div className="space-y-1">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500 text-white text-xs font-semibold shadow-warm-sm">
            <Sparkles className="w-3.5 h-3.5 text-dustyrose-200" />
            <span>Step 1 of 4 • Career Track Calibration</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-serif text-warmtext-900">Select Your Target Engineering & Tech Field</h1>
          <p className="text-xs sm:text-sm text-warmtext-500 max-w-2xl">
            Choose your core domain. PlacePrep will dynamically customize your technical rounds, interview question style, and course recommendations specifically for this field.
          </p>
          <div className="flex items-center gap-1.5 text-[11px] text-warmtext-500 pt-1 italic font-sans">
            <Info className="w-3.5 h-3.5 text-rust-500 shrink-0" />
            <span>Based on publicly available interview experience reports.</span>
          </div>
        </div>

        <div className="flex flex-col items-end gap-2 text-xs font-mono shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-warmtext-500">Track: </span>
            <strong className="text-white bg-rust-500 px-3 py-1 rounded-full border border-rust-600 font-serif">
              {selectedField?.name || 'SDE'}
            </strong>
          </div>
          <button
            type="button"
            onClick={() => navigate('/companies')}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-rust-500 hover:bg-rust-600 text-white font-extrabold text-xs shadow-glow-rust transition-all cursor-pointer hover:scale-[1.02]"
          >
            <span>Proceed to Companies</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
          <div className="flex items-center gap-1.5 text-[10px]">
            <span className="px-2 py-0.5 rounded-full bg-dustyrose-100 text-dustyrose-700 border border-dustyrose-200 font-bold">
              {difficultyLevel || 'Medium'} Difficulty
            </span>
            <span className="px-2 py-0.5 rounded-full bg-peach-100 text-rust-700 border border-warmborder font-bold">
              {experienceLevel || 'Fresher'} {experienceLevel === 'Experienced' ? `(${experienceYears} yrs)` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Recommended Demo Path Banner */}
      <div className="rounded-2xl p-4 sm:p-5 bg-[#FDF4EC] border-2 border-rust-300 shadow-warm-sm flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-rust-500 text-white flex items-center justify-center shrink-0 shadow-warm-xs">
            <Star className="w-5 h-5 fill-current" />
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h3 className="text-xs sm:text-sm font-bold font-serif text-warmtext-900">Recommended Demo Paths</h3>
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rust-100 text-rust-700 border border-rust-300 font-mono">
                Most polished experience
              </span>
            </div>
            <p className="text-[11px] text-warmtext-600 mt-0.5">
              For live judging: select <strong>Software Development (SDE)</strong> (paired with Google) or <strong>QA / Software Testing</strong> (paired with Amazon) for our most complete rubrics, live coding, and rubric-anchored evaluations.
            </p>
          </div>
        </div>
        <span className="text-[11px] text-warmtext-500 font-mono shrink-0 italic">
          All 10 fields & 20 recruiters selectable
        </span>
      </div>

      {/* Grid of 10 Field Cards */}
      {loading ? (
        <div className="p-12 text-center text-warmtext-500 font-serif">Loading Career Tracks...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {fields.map((fieldItem) => {
            const IconComponent = ICON_MAP[fieldItem.icon] || Code2;
            const isSelected = selectedField?.fieldId === fieldItem.fieldId;
            const isRecommendedDemo = ['sde', 'qa-testing'].includes(fieldItem.fieldId);

            return (
              <div
                key={fieldItem.fieldId}
                onClick={() => handleFieldSelect(fieldItem)}
                className={`card-interactive rounded-2xl p-6 border flex flex-col justify-between space-y-4 relative group ${
                  isSelected
                    ? 'bg-[#FDF4EC] border-rust-500 border-l-4 border-l-rust-500 shadow-glow-rust'
                    : isRecommendedDemo
                    ? 'bg-[#FDF4EC] border-rust-300 border-l-4 border-l-rust-500 shadow-warm-sm ring-1 ring-rust-200'
                    : 'bg-[#FDF4EC] border-warmborder border-l-4 border-l-dustyrose-500 shadow-warm-sm'
                }`}
              >
                <div className="space-y-3">
                  
                  {/* Recommended Demo Badge */}
                  {isRecommendedDemo && (
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-rust-500 text-white text-[10px] font-extrabold shadow-warm-xs uppercase tracking-wide">
                      <Star className="w-3 h-3 fill-current" />
                      <span>Recommended Demo Path • Most polished experience</span>
                    </div>
                  )}

                  {/* Top Bar: Icon & Badges */}
                  <div className="flex items-center justify-between">
                    <div className={`icon-badge w-12 h-12 rounded-xl border ${
                      isSelected
                        ? 'bg-rust-500 text-white border-rust-600 shadow-warm-sm'
                        : 'bg-rust-100 text-rust-500 border-warmborder'
                    }`}>
                      <IconComponent className="w-6 h-6" />
                    </div>

                    <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase border ${
                      fieldItem.isDsaHeavy
                        ? 'bg-rust-100 text-rust-700 border-rust-200'
                        : 'bg-dustyrose-100 text-dustyrose-700 border-dustyrose-200'
                    }`}>
                      {fieldItem.isDsaHeavy ? 'DSA Heavy Round' : 'Role Technical Round'}
                    </span>
                  </div>

                  {/* Title & Description */}
                  <div className="space-y-1">
                    <h3 className="text-lg font-bold font-serif text-warmtext-900 group-hover:text-rust-500 transition-colors flex items-center gap-2">
                      <span>{fieldItem.name}</span>
                      {isSelected && <CheckCircle2 className="w-4 h-4 text-rust-500 shrink-0" />}
                    </h3>
                    <p className="text-xs text-warmtext-500 leading-relaxed font-sans">
                      {fieldItem.description}
                    </p>
                  </div>

                  {/* Round Structure Note */}
                  <div className="p-3 rounded-xl bg-peach-100 border border-warmborder text-[11px] text-warmtext-700 space-y-0.5">
                    <span className="font-bold text-rust-500 block font-serif text-[10px] uppercase">Format:</span>
                    <span>{fieldItem.roundStructureNote}</span>
                  </div>

                </div>

                {/* Skill Tags */}
                <div className="pt-2 border-t border-warmborder space-y-2">
                  <div className="flex flex-wrap gap-1.5">
                    {fieldItem.coreSkillTags?.slice(0, 5).map((tag, idx) => (
                      <span key={idx} className="px-2.5 py-0.5 rounded-full text-[10px] bg-white text-warmtext-700 border border-warmborder font-semibold">
                        {tag}
                      </span>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={(e) => handleFieldSelect(fieldItem, e)}
                    className={`w-full py-2.5 px-4 rounded-xl font-bold text-xs transition-all flex items-center justify-between cursor-pointer mt-1 ${
                      isSelected
                        ? 'bg-rust-500 text-white shadow-glow-rust hover:bg-rust-600'
                        : 'bg-rust-100 text-rust-700 hover:bg-rust-200 border border-rust-200 group-hover:bg-rust-500 group-hover:text-white'
                    }`}
                  >
                    <span>{isSelected ? '✓ Selected Track • Proceed to Companies' : 'Select Track'}</span>
                    <ArrowRight className="arrow-icon w-4 h-4 transition-transform group-hover:translate-x-1" />
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      )}

      {/* Sticky Bottom Proceed Bar */}
      {selectedField && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-2xl px-4 animate-in fade-in slide-in-from-bottom duration-300">
          <div className="bg-warmtext-900 text-white rounded-2xl p-4 shadow-warm-lg flex items-center justify-between gap-4 border border-rust-500/30 backdrop-blur-md">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rust-500 text-white flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="text-[11px] text-peach-300 font-mono uppercase tracking-wider">Current Selection</p>
                <p className="font-serif font-bold text-sm text-white">{selectedField.name}</p>
              </div>
            </div>
            <button
              onClick={() => navigate('/companies')}
              className="py-2.5 px-5 bg-rust-500 hover:bg-rust-600 text-white rounded-xl text-xs font-bold transition shadow-glow-rust flex items-center gap-2 cursor-pointer shrink-0 hover:scale-[1.02]"
            >
              <span>Proceed to Companies</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
