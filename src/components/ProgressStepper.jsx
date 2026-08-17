import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import { usePrep } from '../context/PrepContext';
import { 
  FileText, 
  Brain, 
  Layers, 
  Code2, 
  Video, 
  Users, 
  Award, 
  CheckCircle2, 
  Building2, 
  ChevronRight,
  Slash
} from 'lucide-react';

export default function ProgressStepper() {
  const location = useLocation();
  const { 
    selectedCompany, 
    selectedField, 
    difficultyLevel, 
    experienceLevel, 
    experienceYears,
    resumeData,
    aptitudeResult,
    technicalMcqResult,
    dsaResult,
    systemDesignResult,
    sessionResults,
    hrInterviewResult
  } = usePrep();

  const hasAptitude = true;
  const isSystemDesignActive = true;

  const allStages = [
    {
      stageNum: 1,
      id: 'resume',
      path: '/resume',
      title: '1. Resume Gate',
      sub: resumeData ? `ATS ${resumeData.atsScore ?? 0}%` : 'Screening',
      icon: FileText,
      isCompleted: !!resumeData,
      isSkipped: false
    },
    {
      stageNum: 2,
      id: 'aptitude',
      path: '/round/aptitude',
      title: '2. Aptitude Test',
      sub: aptitudeResult ? `${aptitudeResult.percentage}% Score` : 'Quant & Logic',
      icon: Brain,
      isCompleted: !!aptitudeResult,
      isSkipped: false
    },
    {
      stageNum: 3,
      id: 'tech-mcq',
      path: '/round/tech-mcq',
      title: '3. Technical MCQs',
      sub: technicalMcqResult ? `${technicalMcqResult.percentage}% Score` : 'OOP, DBMS, OS',
      icon: Layers,
      isCompleted: !!technicalMcqResult,
      isSkipped: false
    },
    {
      stageNum: 4,
      id: 'dsa',
      path: '/round/dsa',
      title: '4. Coding Round',
      sub: dsaResult ? `${dsaResult.score}% Score` : 'DSA / Tech Challenge',
      icon: Code2,
      isCompleted: !!dsaResult,
      isSkipped: false
    },
    {
      stageNum: 5,
      id: 'system-design',
      path: '/round/system-design',
      title: '5. System Design',
      sub: systemDesignResult ? `${systemDesignResult.evaluation?.score}% Score` : 'Architecture Studio',
      icon: Layers,
      isCompleted: !!systemDesignResult,
      isSkipped: false
    },
    {
      stageNum: 6,
      id: 'interview',
      path: '/round/interview',
      title: '6. Tech Interview',
      sub: sessionResults && sessionResults.length > 0 ? `${sessionResults.length} Qs Done` : 'Voice Technical',
      icon: Video,
      isCompleted: sessionResults && sessionResults.length > 0,
      isSkipped: false
    },
    {
      stageNum: 7,
      id: 'hr-interview',
      path: '/round/hr-interview',
      title: '7. HR Interview',
      sub: hrInterviewResult ? `${hrInterviewResult.score}% Fit` : 'Culture & Behaviors',
      icon: Users,
      isCompleted: !!hrInterviewResult,
      isSkipped: false
    },
    {
      stageNum: 7,
      id: 'final-report',
      path: '/final-report',
      title: '7. Final Report',
      sub: 'Diagnostic Summary',
      icon: Award,
      isCompleted: false,
      isSkipped: false
    }
  ];

  return (
    <div className="rounded-[28px] bg-white p-6 border border-warmborder mb-6 shadow-warm-sm space-y-5">
      
      {/* Top Company Context Line */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-warmborder pb-4 text-xs">
        <div className="flex items-center gap-2.5 flex-wrap">
          <div className="w-7 h-7 rounded-lg bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center font-bold text-xs font-serif shadow-warm-sm">
            {selectedCompany?.logoText || 'G'}
          </div>
          <span className="font-semibold text-warmtext-900">Placement Pipeline:</span>
          <span className="text-rust-500 font-bold font-serif">{selectedCompany?.name || 'Google'}</span>
          <span className="text-[11px] px-3 py-0.5 rounded-full bg-dustyrose-100 text-dustyrose-600 border border-dustyrose-200 font-extrabold">
            {difficultyLevel || 'Medium'} Difficulty
          </span>
          <span className="text-[11px] px-3 py-0.5 rounded-full bg-peach-100 text-rust-700 border border-warmborder font-bold">
            {experienceLevel || 'Fresher'} {experienceLevel === 'Experienced' ? `(${experienceYears} yrs)` : ''}
          </span>
        </div>

        <Link
          to="/companies"
          className="text-xs text-rust-500 hover:text-rust-600 flex items-center gap-1 font-bold transition-colors"
        >
          <Building2 className="w-3.5 h-3.5" />
          <span>Switch Recruiter</span>
          <ChevronRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 7-Stage Horizontal Pipeline Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2.5">
        {allStages.map((stage) => {
          const Icon = stage.icon;
          const isActive = location.pathname === stage.path || (stage.id === 'final-report' && (location.pathname === '/results' || location.pathname === '/final-report'));

          if (stage.isSkipped) {
            return (
              <div
                key={stage.id}
                className="flex items-center gap-2.5 p-3 rounded-xl border border-warmborder bg-peach-100 text-warmtext-500 opacity-60 cursor-not-allowed text-left"
              >
                <div className="w-6 h-6 rounded-full bg-peach-200 flex items-center justify-center text-[10px] font-bold shrink-0 text-warmtext-500">
                  <Slash className="w-3 h-3" />
                </div>
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold truncate font-serif">{stage.title}</div>
                  <div className="text-[9px] text-warmtext-500 truncate">Skipped</div>
                </div>
              </div>
            );
          }

          return (
            <Link
              key={stage.id}
              to={stage.path}
              className={`flex items-center gap-2.5 p-3 rounded-xl border text-left transition-all ${
                isActive
                  ? 'bg-rust-500 text-white font-extrabold border-rust-600 shadow-glow-rust'
                  : stage.isCompleted
                  ? 'bg-dustyrose-100 border-dustyrose-200 text-warmtext-900 hover:border-dustyrose-500'
                  : 'bg-white border-warmborder text-warmtext-700 hover:border-rust-400 hover:bg-rust-50'
              }`}
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                  isActive
                    ? 'bg-white text-rust-500 font-mono shadow-warm-sm'
                    : stage.isCompleted
                    ? 'bg-dustyrose-500 text-white'
                    : 'bg-rust-100 border border-warmborder text-warmtext-500 font-mono'
                }`}
              >
                {stage.isCompleted && !isActive ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Icon className="w-3.5 h-3.5" />}
              </div>

              <div className="min-w-0">
                <div className={`text-[11px] font-bold truncate ${isActive ? 'text-white font-serif' : 'text-warmtext-900 font-serif'}`}>
                  {stage.title}
                </div>
                <div className={`text-[9px] truncate ${isActive ? 'text-white/90 font-medium' : stage.isCompleted ? 'text-dustyrose-700 font-medium' : 'text-warmtext-500'}`}>
                  {stage.sub}
                </div>
              </div>
            </Link>
          );
        })}
      </div>

    </div>
  );
}
