/**
 * Utility to aggregate structured Final Performance Report directly from
 * the `evaluationLog` stored in an `interviewSessions` document (Prompt 2).
 * 
 * Derives topic-wise mastery scores, consolidated misconceptions across session,
 * and suggested revision areas without extra LLM calls.
 */

export function aggregateInterviewReport(sessionState) {
  if (!sessionState) {
    return {
      overallScore: 0,
      readinessScore: 0,
      readinessLabel: 'Diagnostic Incomplete',
      totalTurnsEvaluated: 0,
      topicMastery: [],
      consolidatedMisconceptions: [],
      suggestedRevisionAreas: [],
      verdictCounts: { correct: 0, partially_correct: 0, incorrect: 0, vague: 0, dont_know: 0 },
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
    dont_know: 0
  };

  const topicMastery = Object.values(topicMap).map(t => {
    const totalTurns = t.turns.length;
    let successfulTurns = 0;
    let totalScoreSum = 0;

    t.turns.forEach(turn => {
      const v = turn.verdict || (turn.passed ? 'correct' : 'incorrect');
      if (verdictCounts[v] !== undefined) {
        verdictCounts[v]++;
      } else {
        verdictCounts.incorrect++;
      }

      if (v === 'correct' || v === 'partially_correct' || turn.passed) {
        successfulTurns++;
      }
      totalScoreSum += (turn.score ?? (v === 'correct' ? 100 : v === 'partially_correct' ? 70 : 30));
    });

    const successRatePct = totalTurns > 0
      ? Math.round((successfulTurns / totalTurns) * 100)
      : (t.mastery ?? 50);

    const masteryScore = totalTurns > 0 
      ? Math.round(totalScoreSum / totalTurns)
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
      successfulTurns,
      conceptsCovered: Array.from(t.conceptsCovered),
      conceptsWrong: Array.from(t.conceptsWrong),
      conceptsMissing: Array.from(t.conceptsMissing)
    };
  });

  // 3. Consolidated List of Misconceptions Across Session
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
        consolidatedMisconceptions.push({
          misconception: m,
          topicId: entry.topicId || 'general',
          topicName,
          turnIndex: entry.turnIndex || 1,
          remediation: `Review reference definitions for ${topicName} to address misconception: "${m}".`
        });
      }
    });
  });

  // 4. Suggested Revision Areas
  const suggestedRevisionAreas = [];
  const seenRevisions = new Set();

  topicMastery.forEach(tm => {
    tm.conceptsMissing.forEach(gap => {
      if (gap && !seenRevisions.has(gap)) {
        seenRevisions.add(gap);
        suggestedRevisionAreas.push({
          topicId: tm.topicId,
          topicName: tm.topicName,
          conceptGap: gap,
          priority: tm.masteryScore < 60 ? 'High' : 'Medium',
          recommendation: `Study "${gap}" under ${tm.topicName}.`
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
        recommendation: `Review depth follow-ups for ${tm.topicName}.`
      });
    });
  }

  // 5. Compute Overall Score & Summary
  const overallScore = topicMastery.length > 0
    ? Math.round(topicMastery.reduce((sum, t) => sum + t.masteryScore, 0) / topicMastery.length)
    : 75;

  let readinessLabel = 'Placement Ready Candidate';
  if (overallScore < 60) readinessLabel = 'Requires Focused Revision';
  else if (overallScore < 80) readinessLabel = 'Developing Candidate';

  const execSummary = historySummary.trim()
    ? historySummary.trim()
    : `Candidate completed interview evaluation across ${topicMastery.length} topic areas for ${companyName} (${fieldName}), achieving an overall evaluation score of ${overallScore}%.`;

  return {
    overallScore,
    readinessScore: overallScore,
    readinessLabel,
    totalTurnsEvaluated: evalLog.length,
    verdictCounts,
    topicMastery,
    consolidatedMisconceptions,
    suggestedRevisionAreas,
    executiveSummary: execSummary,
    selectedCompany: companyName,
    selectedField: fieldName,
    roundType: sessionState.roundType || 'technical'
  };
}
