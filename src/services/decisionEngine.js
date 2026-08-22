/**
 * Decision Engine (Prompt 4)
 * Pure, rule-based, deterministic engine mapping Evaluator outputs & session state
 * to the exact pedagogical interviewing strategy.
 */

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
 * - sessionState: { currentDepth, difficultyLevel, evaluationLog, ... }
 * - studentAnswer: raw text (optional, for navigation intent check)
 * 
 * Returns:
 * { strategy: string, topicAdvance: boolean, newDifficultyLevel: string | null }
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
      newDifficultyLevel: navIntent.newDifficultyLevel
    };
  }

  const currentDepth = safeSession.currentDepth || 0;
  const currentDiff = (safeSession.difficultyLevel || 'medium').toLowerCase();
  const verdict = (evaluatorOutput.verdict || 'partially_correct').toLowerCase();
  const confidence = (evaluatorOutput.confidenceOfStudent || 'medium').toLowerCase();
  const conceptsMissing = evaluatorOutput.conceptsMissing || [];

  // 2. HARD RULE: Cap cross-questioning at 3 turns per topic
  if (currentDepth >= 3) {
    return {
      strategy: 'move_to_next_topic',
      topicAdvance: true,
      newDifficultyLevel: null
    };
  }

  // 3. CONSECUTIVE WEAK VERDICTS RULE (2 consecutive "incorrect" or "dont_know" on same topic)
  const evalLog = sessionState.evaluationLog || [];
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
        newDifficultyLevel: lowerDiff
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
        newDifficultyLevel: null
      };
    }
    const nextDiff = currentDiff === 'medium' ? 'hard' : null;
    return {
      strategy: 'increase_difficulty_or_new_topic',
      topicAdvance: currentDepth >= 1,
      newDifficultyLevel: nextDiff
    };
  }

  // Case B: Correct (Medium/Low Confidence or Nuance Omitted)
  if (verdict === 'correct') {
    if (conceptsMissing.length > 0) {
      return {
        strategy: 'probe_missing_nuance',
        topicAdvance: false,
        newDifficultyLevel: null
      };
    }
    return {
      strategy: 'increase_difficulty_or_new_topic',
      topicAdvance: currentDepth >= 1,
      newDifficultyLevel: null
    };
  }

  // Case C: Partially Correct
  if (verdict === 'partially_correct') {
    return {
      strategy: 'affirm_correct_part_and_crossquestion_wrong_part',
      topicAdvance: false,
      newDifficultyLevel: null
    };
  }

  // Case D: Incorrect
  if (verdict === 'incorrect') {
    if (currentDepth <= 1) {
      return {
        strategy: 'guiding_question_no_reveal',
        topicAdvance: false,
        newDifficultyLevel: null
      };
    } else {
      return {
        strategy: 'gentle_correct_then_retest',
        topicAdvance: false,
        newDifficultyLevel: null
      };
    }
  }

  // Case E: Vague or Off-Topic
  if (verdict === 'vague' || verdict === 'off_topic') {
    return {
      strategy: 'ask_narrower_version',
      topicAdvance: false,
      newDifficultyLevel: null
    };
  }

  // Case F: Don't Know
  if (verdict === 'dont_know') {
    return {
      strategy: 'simplify_or_hint',
      topicAdvance: false,
      newDifficultyLevel: null
    };
  }

  // Fallback default
  return {
    strategy: 'affirm_correct_part_and_crossquestion_wrong_part',
    topicAdvance: false,
    newDifficultyLevel: null
  };
}

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
    }

    const nextTopicObj = updated.topicPlan.find(t => t.status === 'not_started');
    if (nextTopicObj) {
      nextTopicObj.status = 'in_progress';
      updated.currentTopicId = nextTopicObj.topicId;
    }
    updated.currentDepth = 0;
  } else {
    // If not advancing, increment probing depth
    if (!decisionResult.isNavigation) {
      updated.currentDepth = (updated.currentDepth || 0) + 1;
    }
  }

  // Handle difficulty level update
  if (decisionResult.newDifficultyLevel) {
    updated.difficultyLevel = decisionResult.newDifficultyLevel.toLowerCase();
  }

  return updated;
}
