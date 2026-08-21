import { evaluateDecisionEngine } from './decisionEngine.js';
import { updateStateAfterTurn } from './conversationStateManager.js';

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
  signal
}) {
  const finalTopicId = currentTopicId || sessionState?.currentTopicId || (roundType === 'hr' ? 'behavioral-handling-conflict' : 'oop-inheritance');

  // 1. Prompt 3: Call Evaluator Endpoint
  let evaluatorOutput = null;
  try {
    const evalResp = await fetch(`${backendUrl}/api/evaluate-answer`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionState?.sessionId,
        lastQuestionAsked: question,
        studentAnswer,
        currentTopicId: finalTopicId,
        sessionState
      }),
      signal
    });
    if (evalResp.ok) {
      evaluatorOutput = await evalResp.json();
    }
  } catch (err) {
    console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] Evaluator API notice:`, err.message);
  }

  if (!evaluatorOutput) {
    evaluatorOutput = {
      verdict: 'partially_correct',
      conceptsCorrect: [],
      conceptsWrong: [],
      conceptsMissing: [],
      confidenceOfStudent: 'medium',
      followUpWorthy: true,
      reason: 'Fallback evaluation response.'
    };
  }

  // 2. Prompt 4: Evaluate Decision Engine Strategy
  const decisionOutput = evaluateDecisionEngine(evaluatorOutput, sessionState, studentAnswer);

  // 3. Prompt 2: Update Session State & Automatic Topic Completion Summarization
  let updatedSessionState = sessionState;
  if (sessionState?.sessionId) {
    try {
      const savedState = await updateStateAfterTurn(sessionState.sessionId, {
        sessionState,
        question,
        studentAnswer,
        evaluatorOutput,
        decisionOutput
      });
      if (savedState) {
        updatedSessionState = savedState;
      }
    } catch (stErr) {
      console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] State update notice:`, stErr.message);
    }
  }

  // 4. Prompt 5: Call Question Generator Endpoint
  let interviewerResponse = null;
  try {
    const genResp = await fetch(`${backendUrl}/api/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: updatedSessionState?.sessionId || sessionState?.sessionId,
        strategy: decisionOutput.strategy,
        evaluatorOutput,
        currentTopicId: updatedSessionState?.currentTopicId || finalTopicId,
        sessionState: updatedSessionState
      }),
      signal
    });

    if (genResp.ok) {
      const genData = await genResp.json();
      interviewerResponse = genData.interviewerResponse;
    }
  } catch (genErr) {
    console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] Generator API notice:`, genErr.message);
  }

  if (!interviewerResponse) {
    interviewerResponse = "Thank you for your explanation. Let's move to our next question.";
  }

  return {
    evaluatorOutput,
    decisionOutput,
    updatedSessionState,
    interviewerResponse,
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
    const response = await fetch(`${backendUrl}/api/generate-question`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sessionId: sessionState?.sessionId,
        currentTopicId: topicId,
        isOpening: true,
        sessionState
      })
    });
    if (response.ok) {
      const data = await response.json();
      return data.interviewerResponse || null;
    }
  } catch (e) {
    console.warn(`[InterviewPipeline:${roundType.toUpperCase()}] Opening turn notice:`, e);
  }
  return null;
}
