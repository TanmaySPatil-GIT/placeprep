/**
 * Decision Engine (Prompt 4 & AI Playbook Hardening)
 * Pure, rule-based, deterministic engine mapping Evaluator outputs & session state
 * to the exact pedagogical interviewing strategy.
 */

export const INTERVIEW_STATES = {
  PLAN: 'PLAN',
  ASK: 'ASK',
  ANALYZE: 'ANALYZE',
  DECIDE: 'DECIDE',
  PROBE: 'PROBE',
  CLARIFY: 'CLARIFY',
  ADVANCE: 'ADVANCE',
  CLOSE_TOPIC: 'CLOSE_TOPIC',
  NEXT: 'NEXT',
  FINISH: 'FINISH'
};

// Configurable hard probe cap per topic (default 2 for time-boxed demo rounds, max 3)
export const MAX_PROBES_PER_TOPIC = 2;

/**
 * Early navigation intent detection (bypasses Evaluator/Decision strategy table).
 */
export function checkNavigationIntent(studentAnswer = '') {
  if (!studentAnswer || typeof studentAnswer !== 'string') return null;
  const ans = studentAnswer.trim().toLowerCase();

  // Repeat Question Intent
  const repeatPhrases = [
    'repeat the question',
    'repeat question',
    'can you repeat',
    'please repeat',
    'say that again',
    'pardon',
    'didnt hear you',
    'didn\'t hear',
    'what was the question',
    'could you repeat'
  ];
  if (repeatPhrases.some(p => ans.includes(p))) {
    return {
      strategy: 'repeat_question',
      topicAdvance: false,
      newDifficultyLevel: null,
      decisionState: INTERVIEW_STATES.CLARIFY,
      isNavigation: true
    };
  }

  // Simplify Question Intent
  const simplifyPhrases = [
    'simplify the question',
    'simplify question',
    'can you simplify',
    'make it simpler',
    'explain in simpler terms',
    'make it easier',
    'too complicated',
    'rephrase question',
    'rephrase'
  ];
  if (simplifyPhrases.some(p => ans.includes(p))) {
    return {
      strategy: 'simplify_question',
      topicAdvance: false,
      newDifficultyLevel: null,
      decisionState: INTERVIEW_STATES.CLARIFY,
      isNavigation: true
    };
  }

  return null;
}

/**
 * Main Decision Engine Evaluator
 * 
 * Inputs:
 * - evaluatorOutput: { verdict, conceptsCorrect, conceptsWrong, conceptsMissing, confidenceOfStudent, followUpWorthy, reason }
 * - sessionState: { currentDepth, probeCount, difficultyLevel, evaluationLog, ... }
 * - studentAnswer: raw text (optional, for navigation intent check)
 * 
 * Returns:
 * { strategy: string, topicAdvance: boolean, newDifficultyLevel: string | null, decisionState: string, probeCount: number }
 */
export function evaluateDecisionEngine(evaluatorOutput = {}, sessionState = {}, studentAnswer = '') {
  // Null guard — sessionState may not yet be populated on the first turn
  const safeSession = sessionState || {};

  // 1. Early Check: Conversational Navigation Intent
  const navIntent = checkNavigationIntent(studentAnswer);
  if (navIntent) {
    return {
      strategy: navIntent.strategy,
      topicAdvance: navIntent.topicAdvance,
      newDifficultyLevel: navIntent.newDifficultyLevel,
      decisionState: INTERVIEW_STATES.CLARIFY,
      isNavigation: true
    };
  }

  const currentTopicObj = safeSession.topicPlan?.find(t => t.topicId === safeSession.currentTopicId);
  const currentDepth = safeSession.currentDepth || 0;
  const probeCount = currentTopicObj?.probeCount ?? safeSession.probeCount;
  const effectiveProbes = (probeCount !== undefined) ? probeCount : currentDepth;
  const isCapped = (probeCount !== undefined) ? (probeCount >= MAX_PROBES_PER_TOPIC) : (currentDepth >= 3);
  const currentDiff = (safeSession.difficultyLevel || 'medium').toLowerCase();
  const verdict = (evaluatorOutput.verdict || 'partially_correct').toLowerCase();
  const confidence = (evaluatorOutput.confidenceOfStudent || 'medium').toLowerCase();
  const conceptsMissing = evaluatorOutput.conceptsMissing || [];

  // 2. HARD PROBE CAP RULE: Force ADVANCE / CLOSE_TOPIC once cap is hit
  // Never let the model's own judgment override this limit
  if (isCapped) {
    console.log(`[DecisionEngine] Hard probe cap reached (${effectiveProbes}/${MAX_PROBES_PER_TOPIC}) for topic ${safeSession.currentTopicId}. Forcing CLOSE_TOPIC / ADVANCE.`);
    return {
      strategy: 'move_to_next_topic',
      topicAdvance: true,
      newDifficultyLevel: null,
      decisionState: INTERVIEW_STATES.CLOSE_TOPIC,
      capped: true,
      probeCount: effectiveProbes,
      reason: `Hard probe cap reached (${effectiveProbes}/${MAX_PROBES_PER_TOPIC} follow-ups). Moving to next topic.`
    };
  }

  // 3. CONSECUTIVE WEAK VERDICTS RULE (2 consecutive "incorrect" or "dont_know" on same topic)
  const evalLog = safeSession.evaluationLog || [];
  if (evalLog.length >= 1) {
    const lastTurnEval = evalLog[evalLog.length - 1];
    const lastVerdict = (lastTurnEval.verdict || '').toLowerCase();
    if (
      ['incorrect', 'dont_know'].includes(verdict) &&
      ['incorrect', 'dont_know'].includes(lastVerdict)
    ) {
      const lowerDiff = currentDiff === 'hard' ? 'medium' : 'easy';
      return {
        strategy: 'drop_difficulty_offer_easier_related',
        topicAdvance: true,
        newDifficultyLevel: lowerDiff,
        decisionState: INTERVIEW_STATES.ADVANCE,
        probeCount
      };
    }
  }

  // 4. STRATEGY TABLE RULES

  // Case A: Correct + High Confidence
  if (verdict === 'correct' && confidence === 'high') {
    if (conceptsMissing.length > 0) {
      return {
        strategy: 'probe_missing_nuance',
        topicAdvance: false,
        newDifficultyLevel: null,
        decisionState: INTERVIEW_STATES.PROBE,
        probeCount
      };
    }
    const nextDiff = currentDiff === 'medium' ? 'hard' : null;
    const shouldAdvance = currentDepth >= 1;
    return {
      strategy: 'increase_difficulty_or_new_topic',
      topicAdvance: shouldAdvance,
      newDifficultyLevel: nextDiff,
      decisionState: shouldAdvance ? INTERVIEW_STATES.ADVANCE : INTERVIEW_STATES.PROBE,
      probeCount
    };
  }

  // Case B: Correct (Medium/Low Confidence or Nuance Omitted)
  if (verdict === 'correct') {
    if (conceptsMissing.length > 0) {
      return {
        strategy: 'probe_missing_nuance',
        topicAdvance: false,
        newDifficultyLevel: null,
        decisionState: INTERVIEW_STATES.PROBE,
        probeCount
      };
    }
    const shouldAdvance = currentDepth >= 1;
    return {
      strategy: 'increase_difficulty_or_new_topic',
      topicAdvance: shouldAdvance,
      newDifficultyLevel: null,
      decisionState: shouldAdvance ? INTERVIEW_STATES.ADVANCE : INTERVIEW_STATES.PROBE,
      probeCount
    };
  }

  // Case C: Partially Correct
  if (verdict === 'partially_correct') {
    return {
      strategy: 'affirm_correct_part_and_crossquestion_wrong_part',
      topicAdvance: false,
      newDifficultyLevel: null,
      decisionState: INTERVIEW_STATES.PROBE,
      probeCount
    };
  }

  // Case D: Incorrect
  if (verdict === 'incorrect') {
    if (currentDepth <= 1) {
      return {
        strategy: 'guiding_question_no_reveal',
        topicAdvance: false,
        newDifficultyLevel: null,
        decisionState: INTERVIEW_STATES.PROBE,
        probeCount
      };
    } else {
      return {
        strategy: 'gentle_correct_then_retest',
        topicAdvance: false,
        newDifficultyLevel: null,
        decisionState: INTERVIEW_STATES.PROBE,
        probeCount
      };
    }
  }

  // Case E: Vague or Off-Topic
  if (verdict === 'vague' || verdict === 'off_topic') {
    return {
      strategy: 'ask_narrower_version',
      topicAdvance: false,
      newDifficultyLevel: null,
      decisionState: INTERVIEW_STATES.PROBE,
      probeCount
    };
  }

  // Case F: Don't Know
  if (verdict === 'dont_know') {
    return {
      strategy: 'simplify_or_hint',
      topicAdvance: false,
      newDifficultyLevel: null,
      decisionState: INTERVIEW_STATES.CLARIFY,
      probeCount
    };
  }

  // Fallback default
  return {
    strategy: 'affirm_correct_part_and_crossquestion_wrong_part',
    topicAdvance: false,
    newDifficultyLevel: null,
    decisionState: INTERVIEW_STATES.PROBE,
    probeCount
  };
}

import { INITIAL_INTERVIEW_RUBRICS } from '../utils/seedInterviewRubrics.js';

/**
 * State Updater based on Decision Engine output
 */
export function applyDecisionToState(sessionState, decisionResult) {
  if (!sessionState) return null;
  const updated = JSON.parse(JSON.stringify(sessionState));

  // Handle topic plan advancement
  if (decisionResult.topicAdvance) {
    const currentTopicObj = updated.topicPlan.find(t => t.topicId === updated.currentTopicId);
    if (currentTopicObj) {
      currentTopicObj.status = 'completed';
      currentTopicObj.probeCount = currentTopicObj.probeCount || 0;
    }

    // STRICTLY filter OUT topics with status 'completed'
    let nextTopicObj = updated.topicPlan.find(t => t.status === 'not_started');

    if (!nextTopicObj) {
      // Dynamic topic pool expansion if all initially planned topics have been completed
      const existingIds = updated.topicPlan.map(t => t.topicId);
      const isHr = updated.roundType === 'hr';
      const candidateRubrics = INITIAL_INTERVIEW_RUBRICS.filter(r => 
        (isHr ? r.topicId.startsWith('behavioral-') : !r.topicId.startsWith('behavioral-')) &&
        !existingIds.includes(r.topicId)
      );

      if (candidateRubrics.length > 0) {
        const extraRubric = candidateRubrics[0];
        nextTopicObj = {
          topicId: extraRubric.topicId,
          topicName: extraRubric.topicName,
          status: 'in_progress',
          mastery: null,
          probeCount: 0
        };
        updated.topicPlan.push(nextTopicObj);
      }
    }

    if (nextTopicObj) {
      nextTopicObj.status = 'in_progress';
      nextTopicObj.probeCount = 0;
      updated.currentTopicId = nextTopicObj.topicId;
    }
    updated.currentDepth = 0;
    updated.probeCount = 0;

    console.log('[DecisionEngine: Topic Advancement Evaluated]', {
      currentTopicId: updated.currentTopicId,
      completedTopics: updated.topicPlan.filter(t => t.status === 'completed').map(t => t.topicId),
      remainingTopics: updated.topicPlan.filter(t => t.status === 'not_started').map(t => t.topicId),
      topicPlan: updated.topicPlan.map(t => `${t.topicId}:${t.status}`)
    });

  } else {
    // If not advancing, increment probing depth & probe count
    if (!decisionResult.isNavigation) {
      updated.currentDepth = (updated.currentDepth || 0) + 1;
      updated.probeCount = (updated.probeCount || 0) + 1;
      const currentTopicObj = updated.topicPlan.find(t => t.topicId === updated.currentTopicId);
      if (currentTopicObj) {
        currentTopicObj.probeCount = (currentTopicObj.probeCount || 0) + 1;
      }
    }
  }

  // Handle difficulty level update
  if (decisionResult.newDifficultyLevel) {
    updated.difficultyLevel = decisionResult.newDifficultyLevel.toLowerCase();
  }

  return updated;
}
