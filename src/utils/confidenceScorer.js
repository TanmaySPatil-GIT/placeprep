import { computeFacialConfidenceScore } from '../services/faceDetector.js';

/**
 * Pure function computing Communication Composure (0-100) per answer.
 * Computed strictly from measurable, objective acoustic and physical signals:
 * 1. Speech Pace Consistency (25% weight) — Ideal 120 to 160 WPM
 * 2. Filler Word Frequency (25% weight) — Penalizes frequent filler patterns per 100 words
 * 3. Latency & Long Pause Control (25% weight) — Penalizes gaps > 2 seconds
 * 4. Eye Contact & Presence Telemetry (25% weight) — Verifiable camera gaze & face presence
 *
 * NOTE: Facial emotion/expression classification is strictly EXCLUDED from all evaluations.
 */
export function calculateConfidenceScore(answerResult = {}) {
  const { metrics = {}, visionSummary = {}, telemetryLogs = [] } = answerResult;

  // 1. Measurable Physical Telemetry: Eye Contact & Camera Presence (25% weight)
  const facialDetails = computeFacialConfidenceScore(telemetryLogs.length > 0 ? telemetryLogs : [visionSummary]);
  const eyeContactScore = facialDetails.eyeContactRatio ?? 90;
  const gazeScore = Math.min(100, Math.max(0, eyeContactScore)) * 0.25;

  // 2. Pace Score (25% weight) - Ideal 120 to 160 WPM
  const wpm = typeof metrics.wordsPerMinute === 'number' ? metrics.wordsPerMinute : 135;
  let rawPace = 100;
  if (wpm < 120) {
    rawPace = Math.max(0, 100 - (120 - wpm) * 1.25);
  } else if (wpm > 160) {
    rawPace = Math.max(0, 100 - (wpm - 160) * 1.25);
  }
  const paceScore = rawPace * 0.25;

  // 3. Filler Word Penalty (25% weight) - Fillers per 100 words
  const wordCount = Math.max(1, metrics.wordCount || 80);
  const fillers = typeof metrics.fillerWordCount === 'number' ? metrics.fillerWordCount : 1;
  const fillersPer100 = (fillers / wordCount) * 100;
  const rawFiller = Math.max(0, 100 - fillersPer100 * 16);
  const fillerScore = rawFiller * 0.25;

  // 4. Long Pause & Response Latency Penalty (25% weight) - Gaps > 2 seconds
  const pauses = typeof metrics.longPauseCount === 'number' ? metrics.longPauseCount : 0;
  const rawPause = Math.max(0, 100 - pauses * 20);
  const pauseScore = rawPause * 0.25;

  // Composite Communication Composure Score (0-100)
  const composureScore = Math.min(100, Math.max(0, Math.round(gazeScore + paceScore + fillerScore + pauseScore)));

  return {
    compositeScore: composureScore, // backward-compatible alias
    composureScore,
    attentivenessScore: facialDetails.attentivenessScore || 88,
    facialScore: facialDetails.facialScore || 88, // backward-compat alias
    eyeContactRatio: facialDetails.eyeContactRatio || 90,
    gazeRatio: facialDetails.eyeContactRatio || 90, // backward-compat alias
    presenceRatio: facialDetails.presenceRatio || 95,
    noLookingAwayRatio: facialDetails.noLookingAwayRatio || 92,
    headStabilityRatio: facialDetails.headStabilityRatio || 88,
    isFallback: facialDetails.isFallback,
    wpm,
    fillers,
    pauses,
    breakdown: {
      paceWeighted: Math.round(paceScore),
      fillerWeighted: Math.round(fillerScore),
      pauseWeighted: Math.round(pauseScore),
      gazeWeighted: Math.round(gazeScore)
    }
  };
}

export const calculateCommunicationComposure = calculateConfidenceScore;

/**
 * Calculate overall average composure score across all session answers.
 */
export function calculateOverallSessionConfidence(sessionResults = []) {
  if (!sessionResults || !Array.isArray(sessionResults) || sessionResults.length === 0) {
    return {
      overallScore: null,
      composureScore: null,
      avgFacialScore: null,
      avgEyeContactRatio: null,
      avgPresenceRatio: null,
      questionScores: [],
      hasInterviewData: false
    };
  }

  const questionScores = sessionResults.map((ans, idx) => {
    const calc = calculateConfidenceScore(ans);
    return {
      name: `Q${idx + 1}`,
      questionText: ans.questionText || `Question ${idx + 1}`,
      score: calc.compositeScore,
      composureScore: calc.composureScore,
      facialScore: calc.facialScore,
      gazeRatio: calc.gazeRatio,
      eyeContactRatio: calc.eyeContactRatio,
      presenceRatio: calc.presenceRatio,
      noLookingAwayRatio: calc.noLookingAwayRatio,
      headStabilityRatio: calc.headStabilityRatio,
      isFallback: calc.isFallback,
      wpm: calc.wpm,
      fillers: calc.fillers,
      pauses: calc.pauses,
      calc
    };
  });

  const total = questionScores.reduce((acc, q) => acc + q.score, 0);
  const overallScore = Math.round(total / questionScores.length);
  const avgEyeContactRatio = Math.round(questionScores.reduce((acc, q) => acc + (q.eyeContactRatio || 90), 0) / questionScores.length);
  const avgPresenceRatio = Math.round(questionScores.reduce((acc, q) => acc + (q.presenceRatio || 95), 0) / questionScores.length);

  return {
    overallScore, // backward-compatible alias
    composureScore: overallScore,
    avgFacialScore: avgEyeContactRatio, // backward-compatible alias
    avgEyeContactRatio,
    avgPresenceRatio,
    questionScores,
    hasInterviewData: true
  };
}
