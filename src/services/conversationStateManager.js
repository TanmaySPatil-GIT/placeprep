import { doc, setDoc, getDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { INITIAL_INTERVIEW_RUBRICS } from '../utils/seedInterviewRubrics.js';
import { evaluateDecisionEngine } from './decisionEngine.js';

// ---------------------------------------------------------------------------
// Internal helper: fire-and-forget Firestore write (never blocks the caller)
// ---------------------------------------------------------------------------
function firestoreSaveAsync(collectionPath, docId, data, merge = false) {
  if (!db || !docId) return;
  try {
    const docRef = doc(db, collectionPath, docId);
    const promise = merge
      ? setDoc(docRef, data, { merge: true })
      : setDoc(docRef, data);
    promise
      .then(() => console.log(`[Firestore] Saved ${collectionPath}/${docId}`))
      .catch(err => console.warn(`[Firestore] Background save notice (${collectionPath}/${docId}):`, err.message));
  } catch (err) {
    console.warn(`[Firestore] Save setup error (${collectionPath}/${docId}):`, err.message);
  }
}

// ---------------------------------------------------------------------------
// Internal helper: build topicPlan synchronously from in-memory rubrics
// No Firestore reads. Always resolves immediately.
// ---------------------------------------------------------------------------
function buildTopicPlanSync(selectedField, roundType) {
  let rubrics = INITIAL_INTERVIEW_RUBRICS;

  const fieldFiltered = rubrics.filter(r => r.fieldIds && r.fieldIds.includes(selectedField));
  if (fieldFiltered.length >= 3) rubrics = fieldFiltered;

  let filtered = roundType === 'hr'
    ? rubrics.filter(r => r.topicId.startsWith('behavioral-'))
    : rubrics.filter(r => !r.topicId.startsWith('behavioral-'));

  if (filtered.length < 3) {
    filtered = roundType === 'hr'
      ? INITIAL_INTERVIEW_RUBRICS.filter(r => r.topicId.startsWith('behavioral-'))
      : INITIAL_INTERVIEW_RUBRICS.filter(r => !r.topicId.startsWith('behavioral-'));
  }
  if (filtered.length < 3) filtered = INITIAL_INTERVIEW_RUBRICS;

  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  // For HR rounds, provide up to 8 topics to cover full 8-turn interview sessions
  const maxTopics = roundType === 'hr' ? Math.min(8, shuffled.length) : Math.min(6, Math.max(4, shuffled.length));
  const selected = shuffled.slice(0, maxTopics);

  return selected.map((t, idx) => ({
    topicId: t.topicId,
    topicName: t.topicName,
    status: idx === 0 ? 'in_progress' : 'not_started',
    mastery: null
  }));
}

/**
 * 1. Initialize a new Interview Session — SYNCHRONOUS topic plan construction,
 *    fire-and-forget Firestore write. Returns immediately (< 1 ms, no Firestore reads).
 */
export async function initializeInterviewSession({
  sessionId,
  userId = 'anonymous_user',
  selectedCompany = 'Google',
  selectedField = 'sde',
  roundType = 'technical',
  difficultyLevel = 'medium'
}) {
  const finalSessionId = sessionId || `session_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  console.log('[ConversationStateManager] Building session synchronously for:', finalSessionId);

  const topicPlan = buildTopicPlanSync(selectedField, roundType);

  const initialSession = {
    sessionId: finalSessionId,
    userId,
    selectedCompany,
    selectedField,
    roundType: roundType.toLowerCase(),
    topicPlan,
    currentTopicId: topicPlan[0]?.topicId || (roundType === 'hr' ? 'behavioral-handling-conflict' : 'oop-inheritance'),
    currentDepth: 0,
    difficultyLevel: difficultyLevel.toLowerCase(),
    historySummary: '',
    recentTurns: [],
    askedQuestions: [],
    weakSignals: [],
    strongSignals: [],
    evaluationLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  // Background Firestore save (non-blocking)
  firestoreSaveAsync('interviewSessions', finalSessionId, initialSession);

  console.log('[ConversationStateManager] Session built. Topics:', topicPlan.map(t => `${t.topicId} (${t.status})`));
  return initialSession;
}

/**
 * 2. Get an Interview Session Document from Firestore.
 */
export async function getInterviewSession(sessionId) {
  if (!sessionId) return null;
  try {
    if (db) {
      const docRef = doc(db, 'interviewSessions', sessionId);
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error('getInterviewSession timeout')), 4000)
      );
      const snap = await Promise.race([
        getDoc(docRef),
        timeoutPromise
      ]);
      if (snap && snap.exists()) {
        return snap.data();
      }
    }
  } catch (err) {
    console.warn(`[ConversationStateManager] Error reading session ${sessionId}:`, err.message);
  }
  return null;
}

/**
 * 3. Update State After Each Turn (Single Source of Truth).
 * Appends recent turns, logs evaluation, updates signals, adjusts depth, and folds completed topics into historySummary.
 */
export async function updateStateAfterTurn(sessionId, {
  sessionState,
  question,
  studentAnswer,
  evaluatorOutput = {},
  decisionOutput = {}
}) {
  // Load session from Firestore if sessionState not passed directly
  let session = sessionState;
  if (!session && sessionId) {
    session = await getInterviewSession(sessionId);
  }

  if (!session) {
    console.warn('[ConversationStateManager] Cannot update state: Session not found.');
    return null;
  }

  // Deep clone session object
  const updatedSession = JSON.parse(JSON.stringify(session));

  // Initialize tracking collections if not present
  updatedSession.askedQuestions = updatedSession.askedQuestions || [];
  updatedSession.recentTurns = updatedSession.recentTurns || [];
  updatedSession.evaluationLog = updatedSession.evaluationLog || [];
  updatedSession.strongSignals = updatedSession.strongSignals || [];
  updatedSession.weakSignals = updatedSession.weakSignals || [];

  // A. Append to recentTurns and track in askedQuestions history
  if (question && question.trim()) {
    const trimmedQ = question.trim();
    updatedSession.recentTurns.push({ role: 'interviewer', text: trimmedQ });
    if (!updatedSession.askedQuestions.includes(trimmedQ)) {
      updatedSession.askedQuestions.push(trimmedQ);
    }
  }
  if (studentAnswer && studentAnswer.trim()) {
    updatedSession.recentTurns.push({ role: 'student', text: studentAnswer.trim() });
  }

  // B. Append evaluator output to evaluationLog
  const turnIndex = updatedSession.evaluationLog.length + 1;
  const evalLogEntry = {
    turnIndex,
    topicId: updatedSession.currentTopicId,
    question: question || '',
    studentAnswer: studentAnswer || '',
    score: evaluatorOutput.score ?? 75,
    passed: evaluatorOutput.passed ?? true,
    keyConceptsCovered: evaluatorOutput.keyConceptsCovered || [],
    keyConceptGaps: evaluatorOutput.keyConceptGaps || [],
    misconceptionsTriggered: evaluatorOutput.misconceptionsTriggered || [],
    feedback: evaluatorOutput.feedback || '',
    timestamp: new Date().toISOString()
  };
  updatedSession.evaluationLog.push(evalLogEntry);

  // C. Update strongSignals and weakSignals
  const newStrongs = evaluatorOutput.keyConceptsCovered || evaluatorOutput.strongSignals || [];
  const newWeaks = [
    ...(evaluatorOutput.keyConceptGaps || []),
    ...(evaluatorOutput.misconceptionsTriggered || []),
    ...(evaluatorOutput.weakSignals || [])
  ];

  newStrongs.forEach(sig => {
    if (sig && !updatedSession.strongSignals.includes(sig)) {
      updatedSession.strongSignals.push(sig);
    }
  });

  newWeaks.forEach(sig => {
    if (sig && !updatedSession.weakSignals.includes(sig)) {
      updatedSession.weakSignals.push(sig);
    }
  });

  // D. Evaluate Pedagogical Strategy via Decision Engine (Prompt 4)
  let decision = decisionOutput;
  if (!decision || !decision.strategy) {
    decision = evaluateDecisionEngine(evaluatorOutput, updatedSession, studentAnswer);
  }

  // E. Apply Strategy Results to Topic Plan, Depth, & Difficulty Level
  if (decision.topicAdvance) {
    // Find current topic in topicPlan and mark strictly completed
    const currentTopicObj = updatedSession.topicPlan.find(t => t.topicId === updatedSession.currentTopicId);
    if (currentTopicObj) {
      currentTopicObj.status = 'completed';
      currentTopicObj.mastery = evaluatorOutput.score ?? (evaluatorOutput.verdict === 'correct' ? 95 : 75);

      // Collect turn evaluation entries for this completed topic
      const topicName = currentTopicObj.topicName || updatedSession.currentTopicId;
      const topicLogs = (updatedSession.evaluationLog || []).filter(e => e.topicId === updatedSession.currentTopicId);
      const depthCount = topicLogs.length > 0 ? topicLogs.length : Math.max(1, updatedSession.currentDepth || 1);

      const allCorrect = Array.from(new Set([
        ...(evaluatorOutput.conceptsCorrect || []),
        ...(evaluatorOutput.keyConceptsCovered || []),
        ...topicLogs.flatMap(l => l.keyConceptsCovered || [])
      ])).filter(Boolean);

      const allGaps = Array.from(new Set([
        ...(evaluatorOutput.conceptsWrong || []),
        ...(evaluatorOutput.conceptsMissing || []),
        ...(evaluatorOutput.keyConceptGaps || []),
        ...(evaluatorOutput.misconceptionsTriggered || []),
        ...topicLogs.flatMap(l => l.keyConceptGaps || []),
        ...topicLogs.flatMap(l => l.misconceptionsTriggered || [])
      ])).filter(Boolean);

      const correctStr = allCorrect.length > 0 ? allCorrect.slice(0, 2).join(', ') : 'core fundamentals';
      const gapsStr = allGaps.length > 0 ? `confused/missed ${allGaps.slice(0, 2).join(', ')}` : 'demonstrated solid accuracy';

      const summaryLine = `Covered ${topicName}: correctly explained ${correctStr}, but ${gapsStr} after ${depthCount} follow-up${depthCount > 1 ? 's' : ''}.\n`;
      updatedSession.historySummary = (updatedSession.historySummary || '') + summaryLine;
    }

    // Clear raw turns from recentTurns for completed topic to keep token count bounded
    updatedSession.recentTurns = [];

    // Find next untouched topic — STRICTLY filter OUT completed topics
    let nextTopic = updatedSession.topicPlan.find(t => t.status === 'not_started');

    if (!nextTopic) {
      // Dynamic topic pool expansion if all initially planned topics have been completed
      const existingIds = updatedSession.topicPlan.map(t => t.topicId);
      const isHr = updatedSession.roundType === 'hr';
      const candidateRubrics = INITIAL_INTERVIEW_RUBRICS.filter(r => 
        (isHr ? r.topicId.startsWith('behavioral-') : !r.topicId.startsWith('behavioral-')) &&
        !existingIds.includes(r.topicId)
      );

      if (candidateRubrics.length > 0) {
        const extraRubric = candidateRubrics[0];
        nextTopic = {
          topicId: extraRubric.topicId,
          topicName: extraRubric.topicName,
          status: 'in_progress',
          mastery: null
        };
        updatedSession.topicPlan.push(nextTopic);
        console.log(`[ConversationStateManager: Dynamic Topic Expansion] Appended unvisited rubric: ${extraRubric.topicId}`);
      }
    }

    if (nextTopic) {
      nextTopic.status = 'in_progress';
      updatedSession.currentTopicId = nextTopic.topicId;
      updatedSession.currentDepth = 0;
      console.log(`[ConversationStateManager: Topic Advancement] Switched to new topic: ${nextTopic.topicId} (${nextTopic.topicName})`);
    } else {
      console.log('[ConversationStateManager: Topic Advancement] All available topics in rubric bank completed for this session!');
    }

    console.log('[Decision Engine: Topic Plan State]', {
      currentTopicId: updatedSession.currentTopicId,
      completedTopics: updatedSession.topicPlan.filter(t => t.status === 'completed').map(t => t.topicId),
      remainingTopics: updatedSession.topicPlan.filter(t => t.status === 'not_started').map(t => t.topicId),
      totalAskedQuestionsCount: updatedSession.askedQuestions.length,
      topicPlan: updatedSession.topicPlan.map(t => `${t.topicId} (${t.status})`)
    });

  } else if (!decision.isNavigation) {
    // Increment depth on current topic unless it was a navigation intent
    updatedSession.currentDepth = (updatedSession.currentDepth || 0) + 1;
  }

  if (decision.newDifficultyLevel) {
    updatedSession.difficultyLevel = decision.newDifficultyLevel.toLowerCase();
  }

  // Prune recentTurns to last 4-6 turns verbatim to keep prompt context window lean
  if (updatedSession.recentTurns.length > 6) {
    updatedSession.recentTurns = updatedSession.recentTurns.slice(-6);
  }

  updatedSession.updatedAt = new Date().toISOString();

  // F. Fire-and-forget Firestore write — never blocks the caller
  firestoreSaveAsync('interviewSessions', updatedSession.sessionId, updatedSession, true);

  return updatedSession;
}

/**
 * 4. Format prompt context string from state document (Single Source of Truth for Evaluator & Generator).
 */
export function buildPromptContextFromState(session) {
  if (!session) return '';

  const activeTopic = session.topicPlan?.find(t => t.topicId === session.currentTopicId);
  const completedTopics = session.topicPlan?.filter(t => t.status === 'completed').map(t => `${t.topicName} (${t.mastery}%)`).join(', ') || 'None yet';
  const remainingTopics = session.topicPlan?.filter(t => t.status === 'not_started').map(t => t.topicName).join(', ') || 'None';

  const recentTurnsFormatted = (session.recentTurns || [])
    .map(t => `${t.role === 'interviewer' ? 'Interviewer' : 'Student'}: "${t.text}"`)
    .join('\n');

  return `
=== CONVERSATION SESSION STATE (SINGLE SOURCE OF TRUTH) ===
- Session ID: ${session.sessionId}
- Target: ${session.selectedCompany} | Track: ${session.selectedField} | Round: ${session.roundType.toUpperCase()} | Difficulty: ${session.difficultyLevel}
- Active Topic: ${activeTopic?.topicName || 'General'} (Current Probing Depth: ${session.currentDepth}/3)
- Completed Topics: ${completedTopics}
- Upcoming Topics Plan: ${remainingTopics}

- Cumulative Strong Signals: ${session.strongSignals?.slice(-6).join('; ') || 'None recorded yet'}
- Cumulative Weak Signals / Gaps: ${session.weakSignals?.slice(-6).join('; ') || 'None recorded yet'}

=== HISTORY SUMMARY OF COMPLETED TOPICS ===
${session.historySummary || 'No topics completed yet.'}

=== RECENT VERBATIM TURNS (LAST 4-6 TURNS ONLY) ===
${recentTurnsFormatted || 'Session started.'}
===========================================================
`;
}
