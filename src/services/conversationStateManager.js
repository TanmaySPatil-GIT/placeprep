import { collection, doc, setDoc, getDoc, getDocs, updateDoc } from 'firebase/firestore';
import { db } from '../firebase.js';
import { fetchInterviewRubricsByField, INITIAL_INTERVIEW_RUBRICS } from '../utils/seedInterviewRubrics.js';
import { evaluateDecisionEngine } from './decisionEngine.js';

/**
 * 1. Initialize a new Interview Session Document in Firestore (`interviewSessions` collection).
 * Picks 3-5 matching topics from interviewRubrics for topicPlan.
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

  // Fetch rubrics matching the selected field
  let availableRubrics = [];
  try {
    availableRubrics = await fetchInterviewRubricsByField(selectedField);
  } catch (e) {
    console.warn('[ConversationStateManager] Error fetching rubrics, using fallback:', e.message);
  }

  if (!availableRubrics || availableRubrics.length === 0) {
    availableRubrics = INITIAL_INTERVIEW_RUBRICS;
  }

  // Filter rubrics based on roundType
  let filtered = [];
  if (roundType === 'hr') {
    filtered = availableRubrics.filter(r => r.topicId.startsWith('behavioral-'));
    if (filtered.length < 3) {
      filtered = INITIAL_INTERVIEW_RUBRICS.filter(r => r.topicId.startsWith('behavioral-'));
    }
  } else {
    filtered = availableRubrics.filter(r => !r.topicId.startsWith('behavioral-'));
    if (filtered.length < 3) {
      filtered = availableRubrics;
    }
  }

  // Shuffle and pick 3 to 5 topics
  const shuffled = [...filtered].sort(() => 0.5 - Math.random());
  const selectedTopics = shuffled.slice(0, Math.min(5, Math.max(3, shuffled.length)));

  const topicPlan = selectedTopics.map((t, idx) => ({
    topicId: t.topicId,
    topicName: t.topicName,
    status: idx === 0 ? 'in_progress' : 'not_started',
    mastery: null
  }));

  const initialSession = {
    sessionId: finalSessionId,
    userId,
    selectedCompany,
    selectedField,
    roundType: roundType.toLowerCase(),
    topicPlan,
    currentTopicId: topicPlan[0]?.topicId || 'oop-inheritance',
    currentDepth: 0,
    difficultyLevel: difficultyLevel.toLowerCase(),
    historySummary: '',
    recentTurns: [],
    weakSignals: [],
    strongSignals: [],
    evaluationLog: [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    if (db) {
      const docRef = doc(db, 'interviewSessions', finalSessionId);
      await setDoc(docRef, initialSession);
      console.log(`[ConversationStateManager] Session ${finalSessionId} initialized in Firestore.`);
    }
  } catch (err) {
    console.warn('[ConversationStateManager] Firestore save notice (offline fallback):', err.message);
  }

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
      const snap = await getDoc(docRef);
      if (snap.exists()) {
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

  // A. Append to recentTurns
  if (question) {
    updatedSession.recentTurns.push({ role: 'interviewer', text: question });
  }
  if (studentAnswer) {
    updatedSession.recentTurns.push({ role: 'student', text: studentAnswer });
  }

  // B. Append evaluator output to evaluationLog
  const turnIndex = updatedSession.evaluationLog.length + 1;
  const evalLogEntry = {
    turnIndex,
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
    // Find current topic in topicPlan and mark completed
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

    // Clear raw turns from recentTurns for completed topic to keep token count and latency bounded
    updatedSession.recentTurns = [];

    // Find next untouched topic
    const nextTopic = updatedSession.topicPlan.find(t => t.status === 'not_started');
    if (nextTopic) {
      nextTopic.status = 'in_progress';
      updatedSession.currentTopicId = nextTopic.topicId;
      updatedSession.currentDepth = 0;
    } else {
      console.log('[ConversationStateManager] All topics in plan completed!');
    }
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

  // F. Save to Firestore `interviewSessions` collection
  try {
    if (db && updatedSession.sessionId) {
      const docRef = doc(db, 'interviewSessions', updatedSession.sessionId);
      await setDoc(docRef, updatedSession, { merge: true });
      console.log(`[ConversationStateManager] Session ${updatedSession.sessionId} updated in Firestore.`);
    }
  } catch (err) {
    console.warn('[ConversationStateManager] Firestore update notice:', err.message);
  }

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
