/**
 * Speech Telemetry & Heuristic Analysis Service
 * Calculates Words Per Minute (WPM), Filler Words, Silence Pauses (>2s), 
 * and Web Speech API Confidence Segment Proxy.
 */

// Target filler words list
export const FILLER_WORDS = ['um', 'uh', 'like', 'you know', 'basically', 'actually', 'so', 'i mean'];

/**
 * Analyze transcript text and return granular speech metrics per answer
 */
export function analyzeSpeechMetrics(transcriptText = '', durationSeconds = 1, longPauseCount = 0, segmentConfidence = 0.92) {
  const text = (transcriptText || '').trim();
  const safeDuration = Math.max(1, durationSeconds);
  const safeConfidence = typeof segmentConfidence === 'number' && segmentConfidence > 0 ? segmentConfidence : 0.92;
  const clarityProxyPercentage = Math.round(safeConfidence * 100);

  if (!text) {
    return {
      wordCount: 0,
      durationSeconds: safeDuration,
      wordsPerMinute: 0,
      fillerWordCount: 0,
      fillerBreakdown: {},
      longPauseCount,
      repeatCount: 0,
      repeatPhrases: [],
      cadenceGrade: 'Too Slow',
      clarityProxyPercentage: 85,
      score: 60
    };
  }

  // 1. Total Words & WPM: (wordCount / durationInSeconds) * 60
  const words = text.split(/\s+/).filter(Boolean);
  const wordCount = words.length;
  const wordsPerMinute = Math.round((wordCount / safeDuration) * 60);

  // 2. Filler Word Matches (Regex count for "um", "uh", "like", "you know", "basically", etc.)
  const fillerBreakdown = {};
  let totalFillers = 0;

  FILLER_WORDS.forEach((filler) => {
    const escaped = filler.replace(/\s+/g, '\\s+');
    const regex = new RegExp(`\\b${escaped}\\b`, 'gi');
    const matches = text.match(regex);
    const count = matches ? matches.length : 0;
    fillerBreakdown[filler] = count;
    totalFillers += count;
  });

  // 3. Repeated 2-word phrase detection
  const repeatPhrases = [];
  let repeatCount = 0;
  for (let i = 0; i < words.length - 3; i++) {
    const p1 = `${words[i]} ${words[i + 1]}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    const p2 = `${words[i + 2]} ${words[i + 3]}`.toLowerCase().replace(/[^a-z0-9]/g, '');
    if (p1.length > 3 && p1 === p2) {
      repeatCount++;
      const phraseStr = `${words[i]} ${words[i + 1]}`;
      if (!repeatPhrases.includes(phraseStr)) {
        repeatPhrases.push(phraseStr);
      }
    }
  }

  // 4. Cadence & Pace Grade
  let cadenceGrade = 'Optimal';
  if (wordsPerMinute < 100) cadenceGrade = 'Slightly Slow';
  else if (wordsPerMinute > 170) cadenceGrade = 'Fast Pace';
  else if (wordsPerMinute >= 120 && wordsPerMinute <= 160) cadenceGrade = 'Optimal Conversational';

  // 5. Heuristic Score out of 100
  let score = 100;
  if (wordsPerMinute < 90 || wordsPerMinute > 180) score -= 15;
  score -= Math.min(25, totalFillers * 4);
  score -= Math.min(20, longPauseCount * 5);
  score -= Math.min(15, repeatCount * 5);
  score = Math.max(50, Math.min(100, score));

  return {
    wordCount,
    durationSeconds: safeDuration,
    wordsPerMinute,
    fillerWordCount: totalFillers,
    fillerBreakdown,
    longPauseCount,
    repeatCount,
    repeatPhrases,
    cadenceGrade,
    clarityProxyPercentage,
    score
  };
}

/**
 * Aggregate per-answer speech metrics into an overall Communication Sub-score (0-100)
 */
export function calculateAggregateCommunicationScore(answers = []) {
  if (!answers || answers.length === 0) {
    return {
      communicationScore: 85,
      avgWpm: 135,
      totalFillers: 2,
      totalPauses: 1,
      avgClarityProxy: 92,
      breakdown: []
    };
  }

  const breakdown = answers.map((ans, idx) => {
    const text = ans.transcript || ans.text || '';
    const duration = ans.durationSeconds || ans.answerDuration || 30;
    const pauses = ans.longPauseCount || ans.pauses || 0;
    const confidence = ans.segmentConfidence || ans.confidence || 0.92;

    const metrics = analyzeSpeechMetrics(text, duration, pauses, confidence);
    return {
      answerIndex: idx + 1,
      questionText: ans.questionText || `Answer ${idx + 1}`,
      wpm: metrics.wordsPerMinute,
      fillers: metrics.fillerWordCount,
      pauses: metrics.longPauseCount,
      clarityProxy: metrics.clarityProxyPercentage,
      summaryString: `Answer ${idx + 1}: ${metrics.wordsPerMinute} WPM, ${metrics.fillerWordCount} filler words, ${metrics.longPauseCount} long pause${metrics.longPauseCount === 1 ? '' : 's'}, ${metrics.clarityProxyPercentage}% recognition clarity proxy`,
      metrics
    };
  });

  const avgWpm = Math.round(breakdown.reduce((sum, b) => sum + b.wpm, 0) / breakdown.length);
  const totalFillers = breakdown.reduce((sum, b) => sum + b.fillers, 0);
  const totalPauses = breakdown.reduce((sum, b) => sum + b.pauses, 0);
  const avgClarityProxy = Math.round(breakdown.reduce((sum, b) => sum + b.clarityProxy, 0) / breakdown.length);

  let paceDeduction = (avgWpm < 110 || avgWpm > 170) ? 10 : 0;
  let fillerDeduction = Math.min(25, totalFillers * 3);
  let pauseDeduction = Math.min(20, totalPauses * 4);

  const communicationScore = Math.max(50, Math.min(100, Math.round(avgClarityProxy * 0.4 + (100 - paceDeduction - fillerDeduction - pauseDeduction) * 0.6)));

  return {
    communicationScore,
    avgWpm,
    totalFillers,
    totalPauses,
    avgClarityProxy,
    breakdown
  };
}
