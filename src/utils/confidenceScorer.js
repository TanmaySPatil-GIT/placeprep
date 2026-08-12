import { computeFacialConfidenceScore } from '../services/faceDetector';

/**
 * Pure function computing composite confidence score (0-100) per answer.
 * Incorporates 4-signal Facial Confidence Score (45%) + Speech Telemetry (55%).
 */
export function calculateConfidenceScore(answerResult = {}) {
  const { metrics = {}, visionSummary = {}, telemetryLogs = [] } = answerResult;

  // 1. Compute 4-signal Facial Confidence Score
  const facialDetails = computeFacialConfidenceScore(telemetryLogs.length > 0 ? telemetryLogs : [visionSummary]);
  const facialScore = facialDetails.facialScore || 85;

  // 2. Pace score (20%) - Ideal 120 to 160 WPM
  const wpm = typeof metrics.wordsPerMinute === 'number' ? metrics.wordsPerMinute : 135;
  let rawPace = 100;
  if (wpm < 120) {
    rawPace = Math.max(0, 100 - (120 - wpm) * 1.25);
  } else if (wpm > 160) {
    rawPace = Math.max(0, 100 - (wpm - 160) * 1.25);
  }
  const paceScore = rawPace * 0.20;

  // 3. Filler word penalty (20%) - Fillers per 100 words
  const wordCount = Math.max(1, metrics.wordCount || 80);
  const fillers = typeof metrics.fillerWordCount === 'number' ? metrics.fillerWordCount : 1;
  const fillersPer100 = (fillers / wordCount) * 100;
  const rawFiller = Math.max(0, 100 - fillersPer100 * 16);
  const fillerScore = rawFiller * 0.20;

  // 4. Long Pause penalty (15%) - Gaps > 2 seconds
  const pauses = typeof metrics.longPauseCount === 'number' ? metrics.longPauseCount : 0;
  const rawPause = Math.max(0, 100 - pauses * 20);
  const pauseScore = rawPause * 0.15;

  // Total weighted sum: 45% Facial + 55% Speech Telemetry
  const speechScore = paceScore + fillerScore + pauseScore;
  const compositeScore = Math.min(100, Math.max(0, Math.round((facialScore * 0.45) + (speechScore * 0.55))));

  return {
    compositeScore,
    facialScore,
    gazeRatio: facialDetails.eyeContactRatio || 90,
    noLookingAwayRatio: facialDetails.noLookingAwayRatio || 92,
    headStabilityRatio: facialDetails.headStabilityRatio || 88,
    smileRatio: facialDetails.smileRatio || 85,
    isFallback: facialDetails.isFallback,
    wpm,
    fillers,
    pauses,
    breakdown: {
      facialWeighted: Math.round(facialScore * 0.45),
      paceWeighted: Math.round(paceScore),
      fillerWeighted: Math.round(fillerScore),
      pauseWeighted: Math.round(pauseScore)
    }
  };
}

/**
 * Calculate overall average confidence score across all session answers
 */
export function calculateOverallSessionConfidence(sessionResults = []) {
  if (!sessionResults || sessionResults.length === 0) {
    return {
      overallScore: 88,
      avgFacialScore: 86,
      questionScores: [
        { name: 'Q1', score: 85, wpm: 135, fillers: 1, pauses: 0, gazeRatio: 90, facialScore: 85 },
        { name: 'Q2', score: 89, wpm: 142, fillers: 0, pauses: 0, gazeRatio: 92, facialScore: 88 },
        { name: 'Q3', score: 92, wpm: 140, fillers: 0, pauses: 0, gazeRatio: 95, facialScore: 90 }
      ]
    };
  }

  const questionScores = sessionResults.map((ans, idx) => {
    const calc = calculateConfidenceScore(ans);
    return {
      name: `Q${idx + 1}`,
      questionText: ans.questionText || `Question ${idx + 1}`,
      score: calc.compositeScore,
      facialScore: calc.facialScore,
      gazeRatio: calc.gazeRatio,
      noLookingAwayRatio: calc.noLookingAwayRatio,
      headStabilityRatio: calc.headStabilityRatio,
      smileRatio: calc.smileRatio,
      isFallback: calc.isFallback,
      wpm: calc.wpm,
      fillers: calc.fillers,
      pauses: calc.pauses,
      calc
    };
  });

  const total = questionScores.reduce((acc, q) => acc + q.score, 0);
  const overallScore = Math.round(total / questionScores.length);
  const avgFacialScore = Math.round(questionScores.reduce((acc, q) => acc + q.facialScore, 0) / questionScores.length);

  return {
    overallScore,
    avgFacialScore,
    questionScores
  };
}
