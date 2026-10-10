/**
 * Utility to aggregate structured Final Performance Report directly from
 * the `evaluationLog` stored in an `interviewSessions` document (Prompt 2).
 * 
 * Derives topic-wise mastery scores, consolidated misconceptions across session,
 * and suggested revision areas without extra LLM calls.
 */

export const SCORING_FORMULA_NAME = 'deterministic-composite-readiness';
export const SCORING_FORMULA_VERSION = 'v1.0-scoring';

export function aggregateInterviewReport(sessionState) {
  if (!sessionState) {
    return {
      overallScore: 0,
      readinessScore: 0,
      scoringFormulaName: SCORING_FORMULA_NAME,
      scoringFormulaVersion: SCORING_FORMULA_VERSION,
      dimensionScores: {},
      readinessLabel: 'Diagnostic Incomplete',
      totalTurnsEvaluated: 0,
      topicMastery: [],
      consolidatedMisconceptions: [],
      suggestedRevisionAreas: [],
      verdictCounts: { correct: 0, partially_correct: 0, incorrect: 0, vague: 0, off_topic: 0, dont_know: 0 },
      executiveSummary: 'No interview state evaluation log available.'
    };
  }

  const topicPlan = sessionState.topicPlan || [];
  const evalLog = sessionState.evaluationLog || [];
  const historySummary = sessionState.historySummary || '';
  const companyName = sessionState.selectedCompany || 'Target Company';
  const fieldName = sessionState.selectedField || 'Software Development';

  // 1. Map evaluationLog entries by topicId
  const topicMap = {};

  // Initialize from topicPlan
  topicPlan.forEach(t => {
    topicMap[t.topicId] = {
      topicId: t.topicId,
      topicName: t.topicName,
      status: t.status,
      mastery: t.mastery ?? null,
      turns: [],
      conceptsCovered: new Set(),
      conceptsWrong: new Set(),
      conceptsMissing: new Set()
    };
  });

  // Populate from evaluationLog
  evalLog.forEach(entry => {
    const tid = entry.topicId || sessionState.currentTopicId || 'general-topic';
    if (!topicMap[tid]) {
      topicMap[tid] = {
        topicId: tid,
        topicName: entry.topicName || tid,
        status: 'completed',
        mastery: entry.score || 75,
        turns: [],
        conceptsCovered: new Set(),
        conceptsWrong: new Set(),
        conceptsMissing: new Set()
      };
    }

    const tObj = topicMap[tid];
    tObj.turns.push(entry);

    (entry.conceptsCorrect || entry.keyConceptsCovered || []).forEach(c => c && tObj.conceptsCovered.add(c));
    (entry.conceptsWrong || entry.misconceptionsTriggered || []).forEach(c => c && tObj.conceptsWrong.add(c));
    (entry.conceptsMissing || entry.keyConceptGaps || []).forEach(c => c && tObj.conceptsMissing.add(c));
  });

  // 2. Compute Topic-wise Mastery Scores
  const verdictCounts = {
    correct: 0,
    partially_correct: 0,
    incorrect: 0,
    vague: 0,
    off_topic: 0,
    dont_know: 0,
    evaluation_unavailable: 0
  };

  const validEvalTurns = evalLog.filter(e => e.verdict !== 'evaluation_unavailable');
  const excludedTurns = evalLog.filter(e => e.verdict === 'evaluation_unavailable');
  const excludedTurnsCount = excludedTurns.length;
  const fallbackQuestionsCount = evalLog.filter(e => e.isFallbackQuestion || e.isFallback || e.fallbackQuestion).length;

  const topicMastery = Object.values(topicMap).map(t => {
    const totalTurns = t.turns.length;
    const validTopicTurns = t.turns.filter(turn => turn.verdict !== 'evaluation_unavailable');
    const totalValidTurns = validTopicTurns.length;
    let successfulTurns = 0;
    let totalScoreSum = 0;

    t.turns.forEach(turn => {
      const v = turn.verdict || (turn.passed ? 'correct' : 'incorrect');
      if (verdictCounts[v] !== undefined) {
        verdictCounts[v]++;
      } else {
        verdictCounts.incorrect++;
      }

      if (v !== 'evaluation_unavailable') {
        if (v === 'correct' || v === 'partially_correct' || turn.passed) {
          successfulTurns++;
        }
        totalScoreSum += (turn.score ?? (v === 'correct' ? 100 : v === 'partially_correct' ? 70 : 30));
      }
    });

    const successRatePct = totalValidTurns > 0
      ? Math.round((successfulTurns / totalValidTurns) * 100)
      : (t.mastery ?? 50);

    const masteryScore = totalValidTurns > 0 
      ? Math.round(totalScoreSum / totalValidTurns)
      : (t.mastery ?? successRatePct);

    let status = 'Mastered';
    if (masteryScore < 60 || successRatePct < 50) status = 'Weak';
    else if (masteryScore < 80 || successRatePct < 75) status = 'Needs Improvement';

    return {
      topicId: t.topicId,
      topicName: t.topicName,
      status,
      masteryScore,
      successRatePct,
      totalTurns,
      validTurns: totalValidTurns,
      successfulTurns,
      conceptsCovered: Array.from(t.conceptsCovered),
      conceptsWrong: Array.from(t.conceptsWrong),
      conceptsMissing: Array.from(t.conceptsMissing)
    };
  });

  // 3. Consolidated List of Misconceptions Across Session with Evidence Quote Attribution
  const consolidatedMisconceptions = [];
  const seenMisconceptions = new Set();

  evalLog.forEach(entry => {
    const wrongList = [
      ...(entry.conceptsWrong || []),
      ...(entry.misconceptionsTriggered || [])
    ];
    wrongList.forEach(m => {
      if (m && !seenMisconceptions.has(m)) {
        seenMisconceptions.add(m);
        const topicName = entry.topicName || topicMap[entry.topicId]?.topicName || 'Technical Topic';
        const quote = (entry.evidenceQuote || '').trim();
        const remediation = quote
          ? `You said: "${quote}" — this reflects a gap in ${m}.`
          : `Review reference definitions for ${topicName} to address misconception: "${m}".`;

        consolidatedMisconceptions.push({
          misconception: m,
          topicId: entry.topicId || 'general',
          topicName,
          turnIndex: entry.turnIndex || 1,
          evidenceQuote: quote,
          remediation
        });
      }
    });
  });

  // 4. Suggested Revision Areas with Evidence Quote Attribution
  const suggestedRevisionAreas = [];
  const seenRevisions = new Set();

  topicMastery.forEach(tm => {
    tm.conceptsMissing.forEach(gap => {
      if (gap && !seenRevisions.has(gap)) {
        seenRevisions.add(gap);
        const matchingTurn = evalLog.find(e => (e.conceptsMissing || []).includes(gap) || (e.keyConceptGaps || []).includes(gap));
        const quote = (matchingTurn?.evidenceQuote || '').trim();
        const recommendation = quote
          ? `You said: "${quote}" — this reflects a gap in ${gap}.`
          : `Study "${gap}" under ${tm.topicName}.`;

        suggestedRevisionAreas.push({
          topicId: tm.topicId,
          topicName: tm.topicName,
          conceptGap: gap,
          priority: tm.masteryScore < 60 ? 'High' : 'Medium',
          evidenceQuote: quote,
          recommendation
        });
      }
    });
  });

  if (suggestedRevisionAreas.length === 0) {
    topicMastery.filter(t => t.masteryScore < 80).forEach(tm => {
      suggestedRevisionAreas.push({
        topicId: tm.topicId,
        topicName: tm.topicName,
        conceptGap: `Core nuances of ${tm.topicName}`,
        priority: tm.masteryScore < 60 ? 'High' : 'Medium',
        evidenceQuote: '',
        recommendation: `Review depth follow-ups for ${tm.topicName}.`
      });
    });
  }

  // 5. Deterministic Composite Placement Readiness Score (v1.0-scoring)
  // Technical answer correctness: 35% (from Evaluator verdicts across turns)
  const verdictScoreMap = {
    correct: 100,
    partially_correct: 70,
    vague: 40,
    dont_know: 20,
    incorrect: 10,
    off_topic: 0
  };

  const techScore = validEvalTurns.length > 0
    ? Math.round(validEvalTurns.reduce((sum, e) => sum + (verdictScoreMap[e.verdict] ?? 10), 0) / validEvalTurns.length)
    : (topicMastery.length > 0 ? Math.round(topicMastery.reduce((s, t) => s + t.masteryScore, 0) / topicMastery.length) : 75);
  
  const techHasLowerConf = validEvalTurns.some(e => e.uncertainty === 'medium' || e.uncertainty === 'high');

  // Problem-solving / reasoning: 25% (from conceptsCorrect vs conceptsMissing ratio)
  const allCorrectSet = new Set();
  const allMissingSet = new Set();
  validEvalTurns.forEach(e => {
    (e.conceptsCorrect || e.keyConceptsCovered || []).forEach(c => c && allCorrectSet.add(c));
    (e.conceptsMissing || e.keyConceptGaps || []).forEach(c => c && allMissingSet.add(c));
  });
  const totalConcepts = allCorrectSet.size + allMissingSet.size;
  const psScore = totalConcepts > 0
    ? Math.round((allCorrectSet.size / totalConcepts) * 100)
    : 70;
  const psHasLowerConf = techHasLowerConf;

  // Coding correctness & complexity: 25% (from DSA round pass/fail + complexity analysis)
  const dsaRes = sessionState.dsaResult;
  let codingScore = 75;
  if (dsaRes && typeof dsaRes.score === 'number') {
    const isOptimal = dsaRes.isOptimal !== false && dsaRes.codeEfficiency?.isOptimal !== false;
    codingScore = isOptimal ? dsaRes.score : Math.max(20, Math.round(dsaRes.score * 0.75));
  }

  // Communication clarity: 15% (from filler words, pace, structure — NOT facial/gaze data)
  let commScore = 75;
  const hrRes = sessionState.hrInterviewResult;
  if (hrRes && typeof hrRes.score === 'number') {
    commScore = hrRes.score;
  }

  const compositeScore = Math.min(100, Math.max(0, Math.round(
    0.35 * techScore +
    0.25 * psScore +
    0.25 * codingScore +
    0.15 * commScore
  )));

  const dimensionScores = {
    technicalCorrectness: {
      dimensionName: 'Technical Answer Correctness',
      score: techScore,
      weightPct: 35,
      weight: 0.35,
      uncertainty: techHasLowerConf ? 'medium' : 'low',
      hasLowerConfidence: techHasLowerConf,
      source: 'Evaluator verdicts across interview turns'
    },
    problemSolving: {
      dimensionName: 'Problem-Solving & Reasoning',
      score: psScore,
      weightPct: 25,
      weight: 0.25,
      uncertainty: psHasLowerConf ? 'medium' : 'low',
      hasLowerConfidence: psHasLowerConf,
      source: 'Ratio of concepts correctly explained vs missed'
    },
    codingCorrectnessComplexity: {
      dimensionName: 'Coding Correctness & Complexity',
      score: codingScore,
      weightPct: 25,
      weight: 0.25,
      uncertainty: 'low',
      hasLowerConfidence: false,
      source: 'DSA test execution and Big-O complexity analysis'
    },
    communicationClarity: {
      dimensionName: 'Communication Clarity',
      score: commScore,
      weightPct: 15,
      weight: 0.15,
      uncertainty: 'low',
      hasLowerConfidence: false,
      source: 'Speech telemetry (pace, fillers, STAR structure; facial/gaze excluded)'
    }
  };

  let readinessLabel = 'Placement Ready Candidate';
  if (compositeScore < 60) readinessLabel = 'Requires Focused Revision';
  else if (compositeScore < 80) readinessLabel = 'Developing Candidate';

  const execSummary = historySummary.trim()
    ? historySummary.trim()
    : `Candidate completed interview evaluation across ${topicMastery.length} topic areas for ${companyName} (${fieldName}), achieving a deterministic placement readiness score of ${compositeScore}/100.`;

  return {
    overallScore: compositeScore,
    readinessScore: compositeScore,
    scoringFormulaName: SCORING_FORMULA_NAME,
    scoringFormulaVersion: SCORING_FORMULA_VERSION,
    dimensionScores,
    readinessLabel,
    totalTurnsEvaluated: evalLog.length,
    verdictCounts,
    excludedTurnsCount,
    fallbackQuestionsCount,
    degradedEvaluationsNotice: excludedTurnsCount > 0
      ? `${excludedTurnsCount} response(s) could not be evaluated due to a temporary issue and were excluded from scoring.`
      : null,
    fallbackQuestionsNotice: fallbackQuestionsCount > 0
      ? `Note: ${fallbackQuestionsCount} question(s) in this session used a fallback due to a temporary AI service issue and were not fully personalized.`
      : null,
    topicMastery,
    consolidatedMisconceptions,
    suggestedRevisionAreas,
    executiveSummary: execSummary,
    selectedCompany: companyName,
    selectedField: fieldName,
    roundType: sessionState.roundType || 'technical'
  };
}
