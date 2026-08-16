import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, limit, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { usePrep } from '../context/PrepContext';
import { useAuth } from '../context/AuthContext';
import { calculateUserGamification } from '../utils/gamification';
import { 
  Trophy, 
  Zap, 
  Award, 
  Brain, 
  Code2, 
  Video, 
  FileText, 
  Lock, 
  CheckCircle2, 
  Users, 
  Star, 
  ChevronRight,
  Sparkles,
  ShieldCheck
} from 'lucide-react';

export default function GamificationWidget({ reportsHistory = [] }) {
  const prepContext = usePrep();
  const { userProfile, currentUser } = useAuth();

  const userName = userProfile?.name || currentUser?.email?.split('@')[0] || 'Alex Candidate';
  const targetField = prepContext.selectedField?.name || userProfile?.targetField || 'Software Development';
  const activeCompany = prepContext.selectedCompany?.name || 'Google';

  const gamification = calculateUserGamification(prepContext, reportsHistory, userProfile);

  const iconMap = {
    Brain: Brain,
    Code2: Code2,
    Video: Video,
    FileText: FileText
  };

  // Compute Candidate's actual Readiness Score for Leaderboard ranking
  const latestReportScore = reportsHistory[0]?.readinessScore;
  const userReadinessScore = typeof latestReportScore === 'number' ? latestReportScore : 0;


  // Leaderboard data with current candidate dynamically inserted & ranked
  const seedLeaderboard = [
    { id: 'b1', name: 'User4829', track: `${activeCompany} SDE`, score: 94, isUser: false },
    { id: 'b2', name: 'User1930', track: 'Amazon Backend', score: 89, isUser: false },
    { id: 'b3', name: 'User8821', track: 'Microsoft SDE', score: 86, isUser: false },
    { id: 'b4', name: 'User5512', track: 'TCS Digital', score: 82, isUser: false },
    { id: 'b5', name: 'User3041', track: 'Accenture Cloud', score: 79, isUser: false }
  ];

  // Insert current user into leaderboard list and sort by score descending
  const userEntry = {
    id: 'user-current',
    name: `${userName} (YOU)`,
    track: `${activeCompany} • ${targetField}`,
    score: userReadinessScore,
    isUser: true
  };

  const combinedLeaderboard = [...seedLeaderboard, userEntry]
    .sort((a, b) => b.score - a.score)
    .map((item, index) => ({ ...item, rank: index + 1 }));

  return (
    <div className="space-y-8 my-6">
      
      {/* 1. PLACEMENT XP + LEVEL HEADER CARD */}
      <div className="rounded-[28px] p-6 sm:p-8 bg-peach-card border border-warmborder shadow-warm-md space-y-6">
        
        {/* Top Header & XP Counter */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-warmborder/80 pb-6">
          <div className="space-y-1 text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-rust-500 text-white text-xs font-extrabold uppercase tracking-wider shadow-warm-sm">
              <Zap className="w-3.5 h-3.5 text-dustyrose-200 fill-dustyrose-200" />
              <span>Candidate XP & Level System</span>
            </div>
            <h3 className="font-heading text-2xl sm:text-3xl font-extrabold text-warmtext-900 tracking-tight">
              {gamification.levelTitle}
            </h3>
            <p className="text-xs text-warmtext-500 font-sans">
              Earn XP by completing resume audits, aptitude rounds, coding challenges, and mock interviews
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 rounded-2xl bg-peach-50 border border-warmborder shadow-warm-xs shrink-0">
            <div className="w-12 h-12 rounded-xl bg-rust-100 text-rust-500 border border-warmborder flex items-center justify-center font-bold">
              <Trophy className="w-6 h-6 text-rust-500" />
            </div>
            <div className="text-left">
              <div className="font-mono text-2xl font-black text-rust-500">
                {gamification.totalXP.toLocaleString()} XP
              </div>
              <span className="text-[10px] text-warmtext-500 font-mono font-bold uppercase tracking-wider">
                Total Placement XP
              </span>
            </div>
          </div>
        </div>

        {/* Level Progress Bar */}
        <div className="space-y-2 text-left">
          <div className="flex justify-between items-center text-xs font-bold font-sans text-warmtext-900">
            <span className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-rust-500" />
              <span>Level {gamification.level} Progress</span>
            </span>
            <span className="font-mono text-rust-500">
              {gamification.progressPercent}% — Next Level → {gamification.xpToNextLevel} XP
            </span>
          </div>

          <div className="w-full bg-peach-100 rounded-full h-3.5 overflow-hidden p-0.5 border border-warmborder/80 shadow-inner">
            <div
              className="bg-rust-500 h-full rounded-full transition-all duration-700 ease-out shadow-warm-xs"
              style={{ width: `${gamification.progressPercent}%` }}
            />
          </div>
        </div>

      </div>

      {/* 2. ACHIEVEMENT BADGES GRID */}
      <div className="space-y-4 text-left">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-xl font-extrabold text-warmtext-900 flex items-center gap-2">
            <Award className="w-5 h-5 text-rust-500" />
            <span>Achievement Badges</span>
          </h3>
          <span className="text-xs font-mono font-bold text-warmtext-500">
            {gamification.badges.filter(b => b.isUnlocked).length} / {gamification.badges.length} Unlocked
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {gamification.badges.map((badge) => {
            const IconComp = iconMap[badge.iconName] || Award;
            return (
              <div
                key={badge.id}
                className={`p-5 rounded-2xl border transition-all relative space-y-3 ${
                  badge.isUnlocked
                    ? 'bg-peach-card border-warmborder border-l-4 border-l-rust-500 shadow-warm-sm hover:shadow-warm-md'
                    : 'bg-peach-50/50 border-dashed border-warmborder opacity-80'
                }`}
              >
                {/* Badge Top Header */}
                <div className="flex items-center justify-between">
                  <div className={`w-10 h-10 rounded-xl border flex items-center justify-center ${
                    badge.isUnlocked
                      ? 'bg-rust-100 text-rust-500 border-warmborder shadow-warm-xs'
                      : 'bg-peach-100 text-warmtext-500 border-warmborder'
                  }`}>
                    <IconComp className="w-5 h-5" />
                  </div>

                  {badge.isUnlocked ? (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-rust-500 text-white text-[10px] font-extrabold uppercase tracking-wider shadow-warm-xs">
                      <CheckCircle2 className="w-3 h-3 text-dustyrose-200" />
                      <span>Earned</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-peach-200 text-warmtext-700 text-[10px] font-bold uppercase tracking-wider">
                      <Lock className="w-3 h-3 text-warmtext-500" />
                      <span>Locked</span>
                    </span>
                  )}
                </div>

                {/* Badge Content */}
                <div className="space-y-1">
                  <h4 className={`font-serif font-bold text-base leading-snug ${
                    badge.isUnlocked ? 'text-warmtext-900' : 'text-warmtext-500'
                  }`}>
                    {badge.title}
                  </h4>
                  <p className="text-[11px] font-sans text-warmtext-500 leading-relaxed line-clamp-2">
                    {badge.description}
                  </p>
                </div>

                {/* Requirement Footnote */}
                <div className="pt-1 border-t border-warmborder/60 text-[10px] font-mono text-warmtext-500 flex items-center gap-1">
                  <ShieldCheck className="w-3 h-3 text-rust-500 shrink-0" />
                  <span className="truncate">{badge.requirementText}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 3. CAMPUS PEER LEADERBOARD */}
      <div className="rounded-[28px] p-6 sm:p-8 bg-peach-card border border-warmborder shadow-warm-md space-y-5 text-left">
        
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-warmborder/80 pb-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-rust-100 border border-warmborder text-rust-700 text-xs font-bold">
              <Users className="w-3.5 h-3.5 text-rust-500" />
              <span>Campus Peer Ranking</span>
            </div>
            <h3 className="font-heading text-xl font-extrabold text-warmtext-900">
              Campus Leaderboard
            </h3>
          </div>

          <span className="text-xs font-sans text-warmtext-500 bg-peach-50 px-3 py-1.5 rounded-full border border-warmborder self-start sm:self-auto">
            Target Track: <strong className="text-rust-500 font-serif">{activeCompany}</strong>
          </span>
        </div>

        {/* Leaderboard Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-sans">
            <thead>
              <tr className="border-b border-warmborder text-warmtext-500 uppercase tracking-wider font-mono text-[10px]">
                <th className="py-3 px-4">Rank</th>
                <th className="py-3 px-4">Student Name</th>
                <th className="py-3 px-4">Recruiter Track</th>
                <th className="py-3 px-4 text-right">Readiness Score</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-warmborder/60">
              {combinedLeaderboard.map((row) => (
                <tr
                  key={row.id}
                  className={`transition-colors ${
                    row.isUser
                      ? 'bg-rust-100/70 border-l-4 border-l-rust-500 font-bold text-warmtext-900'
                      : 'hover:bg-peach-50/60 text-warmtext-700'
                  }`}
                >
                  <td className="py-3.5 px-4 font-mono font-bold">
                    {row.rank === 1 && <span className="text-amber-500 font-bold mr-1">🥇</span>}
                    {row.rank === 2 && <span className="text-slate-400 font-bold mr-1">🥈</span>}
                    {row.rank === 3 && <span className="text-amber-700 font-bold mr-1">🥉</span>}
                    #{row.rank}
                  </td>
                  <td className="py-3.5 px-4 font-serif font-bold flex items-center gap-2">
                    <span>{row.name}</span>
                    {row.isUser && (
                      <span className="px-2 py-0.5 rounded-full bg-rust-500 text-white text-[9px] font-extrabold uppercase tracking-wider shadow-warm-xs">
                        ★ YOU
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-warmtext-500 font-sans">
                    {row.track}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-rust-500 text-sm">
                    {row.score}%
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="pt-2 text-[11px] font-sans text-warmtext-500 text-center">
          Note: Benchmark ranking entries seeded alongside your candidate profile for campus drive comparisons.
        </div>

      </div>

    </div>
  );
}
