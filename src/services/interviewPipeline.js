import { evaluateDecisionEngine, INTERVIEW_STATES } from './decisionEngine.js';
import { updateStateAfterTurn, recordStateTransition, hashQuestion } from './conversationStateManager.js';

/**
 * Unified Turn Execution Pipeline for BOTH Tech and HR interview rounds.
 * Prompt 3 (Evaluator) -> Prompt 4 (Decision Engine) -> Prompt 2 (State Update & Summarization) -> Prompt 5 (Question Generator).
 */
export async function executeInterviewTurn({
  sessionState,
  question,
  studentAnswer,
  roundType = 'technical',
  currentTopicId,
  backendUrl,
  signal,
  isFallbackQuestion = false
}) {
  // Null guard — sessionState may be null on first turn if React state hasn't propagated
  const safeSession = sessionState || {};
  const finalTopicId = currentTopicId || safeSession.currentTopicId || (roundType === 'hr' ? 'behavioral-handling-conflict' : 'oop-inheritance');

  // Transition to ANALYZE state
  recordStateTransition(safeSession, INTERVIEW_STATES.ANALYZE, 'Calling evaluator endpoint to analyze student answer');

  // 1. Prompt 3: Call Evaluator Endpoint
  let evaluatorOutput = null;
  try {
    const evalPayload = {
      sessionId: safeSession.sessionId,
      lastQuestionAsked: question,
      studentAnswer,
      currentTopicId: finalTopicId,
      sessionState: safeSession
    };
    console.log(`[interviewPipeline:${roundType.toUpperCase()}] [API 1: /api/evaluate-answer CALLING] Payload:`, evalPayload);
    const evalResp = await fetch(`${backendUrl}/api/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(evalPayload),
      signal
    });
    if (evalResp.ok) {
      evaluatorOutput = await evalResp.json();
      console.log(`[interviewPipeline:${roundType.toUpperCase()}] [API 1: /api/evaluate-answer RESOLVED 200] Response Data:`, evaluatorOutput);
    } else {
      console.warn(`[interviewPipeline:${roundType.toUpperCase()}] [API 1: /api/evaluate-answer ERROR] Status:`, evalResp.status, evalResp.statusText);
    }
  } catch (err) {
    console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] Evaluator API notice:`, err.message);
  }

  if (!evaluatorOutput) {
    evaluatorOutput = {
      verdict: 'evaluation_unavailable',
      score: null,
      passed: null,
      conceptsCorrect: [],
      conceptsWrong: [],
      conceptsMissing: [],
      evidenceQuote: null,
      rubricVersion: 'v1.0-interviewRubrics',
      modelUsed: 'pipeline-fallback',
      uncertainty: 'high',
      confidenceOfStudent: 'medium',
      followUpWorthy: false,
      degraded: true,
      fallbackUsed: true,
      reason: 'Evaluation unavailable due to a temporary AI service issue.'
    };
    console.log(`[interviewPipeline:${roundType.toUpperCase()}] [API 1: Using Fallback Evaluator Output]`, evaluatorOutput);
  }

  // Transition to DECIDE state
  recordStateTransition(safeSession, INTERVIEW_STATES.DECIDE, 'Evaluating pedagogical strategy from decision engine');

  // 2. Prompt 4: Evaluate Decision Engine Strategy (Hard probe cap enforced here)
  const decisionOutput = evaluateDecisionEngine(evaluatorOutput, safeSession, studentAnswer);
  console.log(`[interviewPipeline:${roundType.toUpperCase()}] [Decision Engine Evaluated] Strategy:`, decisionOutput);

  // 3. Prompt 2: Update Session State & Automatic Topic Completion Summarization
  let updatedSessionState = safeSession;
  if (safeSession.sessionId) {
    try {
      const savedState = await updateStateAfterTurn(safeSession.sessionId, {
        sessionState: safeSession,
        question,
        studentAnswer,
        evaluatorOutput,
        decisionOutput,
        isFallbackQuestion
      });
      if (savedState) {
        updatedSessionState = savedState;
        console.log(`[interviewPipeline:${roundType.toUpperCase()}] [Session State Updated] State:`, updatedSessionState);
      }
    } catch (stErr) {
      console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] State update notice:`, stErr.message);
    }
  }

  // Transition to NEXT state
  recordStateTransition(updatedSessionState, INTERVIEW_STATES.NEXT, 'Requesting next turn question from generator');

  // 4. Prompt 5: Call Question Generator Endpoint
  let interviewerResponse = null;
  let nextIsFallbackQuestion = false;
  try {
    const genPayload = {
      sessionId: updatedSessionState?.sessionId || sessionState?.sessionId,
      strategy: decisionOutput.strategy,
      evaluatorOutput,
      currentTopicId: updatedSessionState?.currentTopicId || finalTopicId,
      sessionState: updatedSessionState,
      askedQuestionHashes: updatedSessionState?.askedQuestionHashes || []
    };
    console.log(`[interviewPipeline:${roundType.toUpperCase()}] [API 2: /api/generate-question CALLING] Payload:`, genPayload);
    const genResp = await fetch(`${backendUrl}/api/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(genPayload),
      signal
    });

    if (genResp.ok) {
      const genData = await genResp.json();
      interviewerResponse = genData.question || genData.interviewerResponse;
      if (genData.isFallback || genData.fallbackQuestion || genData.fallbackUsed || genData.degraded) {
        nextIsFallbackQuestion = true;
      }
      console.log(`[interviewPipeline:${roundType.toUpperCase()}] [API 2: /api/generate-question RESOLVED 200] Response Data:`, genData);
    } else {
      console.warn(`[interviewPipeline:${roundType.toUpperCase()}] [API 2: /api/generate-question ERROR] Status:`, genResp.status, genResp.statusText);
    }
  } catch (genErr) {
    console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] Generator API notice:`, genErr.message);
  }

  if (!interviewerResponse) {
    interviewerResponse = "Thank you for explaining that. Let's move to our next question.";
    nextIsFallbackQuestion = true;
    console.log(`[interviewPipeline:${roundType.toUpperCase()}] [API 2: Using Fallback Question Response]`, interviewerResponse);
  }

  // Duplicate Question Prevention before firing ASK state:
  // If the proposed question has already been asked, force Decision Engine to pick a different competency
  const proposedHash = hashQuestion(interviewerResponse);
  const isDuplicate = updatedSessionState.askedQuestionHashes?.includes(proposedHash);

  if (isDuplicate) {
    console.warn(`[interviewPipeline] Duplicate question detected (${proposedHash}). Forcing Decision Engine to pick a different competency/question.`);
    const nextTopic = updatedSessionState.topicPlan?.find(t => t.status === 'not_started');
    if (nextTopic) {
      nextTopic.status = 'in_progress';
      nextTopic.probeCount = 0;
      updatedSessionState.currentTopicId = nextTopic.topicId;
      updatedSessionState.currentDepth = 0;
      updatedSessionState.probeCount = 0;
      recordStateTransition(updatedSessionState, INTERVIEW_STATES.ADVANCE, `Duplicate prevented; forced advancement to ${nextTopic.topicId}`);

      try {
        const altResp = await fetch(`${backendUrl}/api/generate-question`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: updatedSessionState.sessionId,
            strategy: 'move_to_next_topic',
            evaluatorOutput: {},
            currentTopicId: nextTopic.topicId,
            sessionState: updatedSessionState,
            askedQuestionHashes: updatedSessionState.askedQuestionHashes || []
          }),
          signal
        });
        if (altResp.ok) {
          const altData = await altResp.json();
          if (altData.question || altData.interviewerResponse) {
            interviewerResponse = altData.question || altData.interviewerResponse;
            nextIsFallbackQuestion = Boolean(altData.isFallback || altData.fallbackQuestion || altData.fallbackUsed || altData.degraded);
          }
        }
      } catch (altErr) {
        console.warn('[interviewPipeline] Alternate question generation notice:', altErr.message);
      }
    }
  }

  // Transition to ASK state
  recordStateTransition(updatedSessionState, INTERVIEW_STATES.ASK, 'Ready with question for candidate', {
    questionHash: hashQuestion(interviewerResponse)
  });

  return {
    evaluatorOutput,
    decisionOutput,
    updatedSessionState,
    interviewerResponse,
    isFallbackQuestion: nextIsFallbackQuestion,
    isNewTopic: decisionOutput.topicAdvance
  };
}

/**
 * Unified Opening Question Generator for BOTH Tech and HR rounds.
 */
export async function executeOpeningTurn({
  sessionState,
  roundType = 'technical',
  backendUrl
}) {
  const defaultTopicId = roundType === 'hr' ? 'behavioral-handling-conflict' : 'oop-inheritance';
  const topicId = sessionState?.currentTopicId || defaultTopicId;

  try {
    const payload = {
      sessionId: sessionState?.sessionId,
      currentTopicId: topicId,
      isOpening: true,
      sessionState,
      askedQuestionHashes: sessionState?.askedQuestionHashes || []
    };
    console.log(`[executeOpeningTurn:${roundType.toUpperCase()}] [AWAIT 1 - START] Fetching ${backendUrl || ''}/api/generate-question with payload:`, payload);
    const response = await fetch(`${backendUrl}/api/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    console.log(`[executeOpeningTurn:${roundType.toUpperCase()}] [AWAIT 1 - END] Received response status:`, response.status, response.statusText);

    if (response.ok) {
      console.log(`[executeOpeningTurn:${roundType.toUpperCase()}] [AWAIT 2 - START] Parsing response.json()...`);
      const data = await response.json();
      console.log(`[executeOpeningTurn:${roundType.toUpperCase()}] [AWAIT 2 - END] Parsed JSON data:`, data);
      const text = data.question || data.interviewerResponse || null;
      const isFallback = Boolean(data.isFallback || data.fallbackQuestion || data.fallbackUsed || data.degraded);
      if (text) {
        if (sessionState) {
          recordStateTransition(sessionState, INTERVIEW_STATES.ASK, 'Opening question ready for candidate', {
            questionHash: hashQuestion(text)
          });
        }
        const resObj = new String(text);
        resObj.question = text;
        resObj.interviewerResponse = text;
        resObj.isFallbackQuestion = isFallback;
        resObj.isFallback = isFallback;
        return resObj;
      }
      return null;
    } else {
      console.warn(`[executeOpeningTurn:${roundType.toUpperCase()}] Non-ok response: ${response.status} ${response.statusText}`);
    }
  } catch (e) {
    console.warn(`[executeOpeningTurn:${roundType.toUpperCase()}] Opening turn notice/error:`, e);
  }
  return null;
}

