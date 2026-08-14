/**
 * Gamification Helper Utilities
 * Computes deterministic Placement XP, Level, Badges, and Leaderboard rankings.
 */

export function calculateUserGamification(prepContext = {}, reportsHistory = [], userProfile = {}) {
  const {
    resumeData,
    aptitudeResult,
    technicalMcqResult,
    dsaResult,
    systemDesignResult,
    sessionResults,
    hrInterviewResult,
    technicalInterviewResult
  } = prepContext;

  // 1. Calculate XP from active prepContext session data
  let xp = 300; // Baseline candidate onboarded XP

  // Resume analysis XP
  if (resumeData) {
    xp += 150;
    const score = resumeData.atsScore || resumeData.overallScore || 0;
    if (score >= 80) xp += 100;
  }

  // Aptitude round XP
  if (aptitudeResult) {
    xp += 150;
    const score = aptitudeResult.percentage || aptitudeResult.overallScore || 0;
    if (score >= 80) xp += 100;
  }

  // Technical coding / DSA XP
  if (dsaResult || technicalMcqResult || systemDesignResult) {
    xp += 150;
    const dsaScore = dsaResult?.score || technicalMcqResult?.percentage || 0;
    if (dsaScore >= 80) xp += 100;
  }

  // Interview round XP
  if ((sessionResults && sessionResults.length > 0) || hrInterviewResult || technicalInterviewResult) {
    xp += 150;
    if (sessionResults && sessionResults.length > 0) xp += sessionResults.length * 30;
    if (hrInterviewResult?.score >= 80) xp += 100;
  }

  // XP from saved Firestore report history
  if (Array.isArray(reportsHistory) && reportsHistory.length > 0) {
    xp += reportsHistory.length * 250; // +250 XP per completed diagnostic report
  }

  // 2. Level Formula (Each level step is 300 XP)
  const level = Math.floor(xp / 300) + 1;
  const currentLevelXP = (level - 1) * 300;
  const nextLevelXP = level * 300;
  const xpInCurrentLevel = xp - currentLevelXP;
  const progressPercent = Math.min(100, Math.max(0, Math.round((xpInCurrentLevel / 300) * 100)));
  const xpToNextLevel = nextLevelXP - xp;

  // Level Titles
  const levelTitles = {
    1: 'Novice Candidate',
    2: 'Aptitude Explorer',
    3: 'Code Specialist',
    4: 'Interview Competent',
    5: 'Placement Ready',
    6: 'Placement Warrior',
    7: 'Enterprise Elite',
    8: 'Recruiter Favorite',
    9: 'FAANG Contender',
    10: 'Placement Master'
  };

  const levelTitle = levelTitles[level] || `Placement Specialist`;

  // 3. Badges Unlock Evaluation
  const resumeScore = resumeData?.atsScore || resumeData?.overallScore || 0;
  const aptitudeScore = aptitudeResult?.percentage || aptitudeResult?.overallScore || 0;
  const interviewCount = sessionResults?.length || (hrInterviewResult ? 1 : 0);

  const badges = [
    {
      id: 'aptitude-master',
      title: 'Aptitude Master',
      category: 'Quantitative & Logic',
      description: 'Achieved 80%+ score in Aptitude & Reasoning assessment',
      iconName: 'Brain',
      isUnlocked: aptitudeScore >= 80 || reportsHistory.some(r => (r.roundBreakdown || []).some(rb => rb.roundName?.includes('Aptitude') && rb.score >= 80)),
      requirementText: 'Score 80%+ in Aptitude Round'
    },
    {
      id: 'dsa-warrior',
      title: 'DSA Warrior',
      category: 'Algorithmic Coding',
      description: 'Successfully completed automated technical coding test cases',
      iconName: 'Code2',
      isUnlocked: Boolean(dsaResult) || technicalMcqResult !== null || reportsHistory.some(r => (r.roundBreakdown || []).some(rb => rb.roundName?.includes('Technical') || rb.roundName?.includes('DSA'))),
      requirementText: 'Complete a Technical DSA Challenge'
    },
    {
      id: 'interview-pro',
      title: 'Interview Pro',
      category: 'Voice Telemetry',
      description: 'Completed AI mock interview screen with structured vocal composure',
      iconName: 'Video',
      isUnlocked: interviewCount > 0 || hrInterviewResult !== null || reportsHistory.some(r => (r.roundBreakdown || []).some(rb => rb.roundName?.includes('Interview'))),
      requirementText: 'Complete an AI Voice Mock Interview'
    },
    {
      id: 'resume-expert',
      title: 'Resume Expert',
      category: 'ATS Optimization',
      description: 'Achieved 85%+ ATS keyword alignment for target recruiters',
      iconName: 'FileText',
      isUnlocked: resumeScore >= 85 || reportsHistory.some(r => (r.roundBreakdown || []).some(rb => rb.roundName?.includes('Resume') && rb.score >= 85)),
      requirementText: 'Achieve 85%+ Resume ATS Match'
    }
  ];

  return {
    totalXP: xp,
    level,
    levelTitle: `Level ${level} — ${levelTitle}`,
    currentLevelXP,
    nextLevelXP,
    xpToNextLevel,
    progressPercent,
    badges
  };
}
