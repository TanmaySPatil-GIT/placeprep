import { initializeInterviewSession, updateStateAfterTurn, buildPromptContextFromState } from '../src/services/conversationStateManager.js';

async function runTests() {
  console.log('=== TEST 1: Initialize Session ===');
  let session = await initializeInterviewSession({
    sessionId: 'test_sum_sess_101',
    selectedCompany: 'Google',
    selectedField: 'sde',
    roundType: 'technical',
    difficultyLevel: 'medium'
  });

  console.log('Initial Topic Plan:', session.topicPlan.map(t => `${t.topicId}:${t.status}`));
  console.log('Initial currentTopicId:', session.currentTopicId);
  console.log('Initial historySummary length:', session.historySummary.length);
  console.log('Initial recentTurns length:', session.recentTurns.length);

  console.log('\n=== TEST 2: Turn 1 (Probing - topic not completed) ===');
  session = await updateStateAfterTurn('test_sum_sess_101', {
    sessionState: session,
    question: 'Explain inheritance in OOP.',
    studentAnswer: 'Inheritance allows code reuse via superclasses.',
    evaluatorOutput: {
      verdict: 'partially_correct',
      score: 75,
      keyConceptsCovered: ['Code reuse via superclasses'],
      keyConceptGaps: ['Composition fragile base class problem']
    },
    decisionOutput: {
      strategy: 'probe_missing_nuance',
      topicAdvance: false
    }
  });

  console.log('Depth after Turn 1:', session.currentDepth);
  console.log('recentTurns count after Turn 1:', session.recentTurns.length);
  console.log('historySummary length after Turn 1:', session.historySummary.length);

  console.log('\n=== TEST 3: Turn 2 (Topic Completed -> Automatic Summarization & Pruning) ===');
  session = await updateStateAfterTurn('test_sum_sess_101', {
    sessionState: session,
    question: 'How does composition avoid fragile base class coupling?',
    studentAnswer: 'Composition uses HAS-A relationships so class internals are not exposed.',
    evaluatorOutput: {
      verdict: 'correct',
      score: 95,
      keyConceptsCovered: ['Composition HAS-A relationship', 'Decoupling base class'],
      keyConceptGaps: []
    },
    decisionOutput: {
      strategy: 'increase_difficulty_or_new_topic',
      topicAdvance: true
    }
  });

  console.log('New active topic after Turn 2:', session.currentTopicId);
  console.log('Completed topic plan status:', session.topicPlan.map(t => `${t.topicId}:${t.status}`));
  console.log('\n--- AUTOMATIC GENERATED HISTORY SUMMARY ---');
  console.log(session.historySummary);
  console.log('recentTurns count after Topic Completion (should be 0/cleared):', session.recentTurns.length);

  console.log('\n=== TEST 4: Build Prompt Context Window ===');
  const contextStr = buildPromptContextFromState(session);
  console.log(contextStr);

  if (session.historySummary.includes('Covered') && session.recentTurns.length === 0) {
    console.log('\n✅ SUCCESS: Automatic topic summarization and recent turn clearing verified 100%!');
  } else {
    console.error('\n❌ FAILED: Context summarization check failed.');
    process.exit(1);
  }
}

runTests().catch(err => {
  console.error('Test execution error:', err);
  process.exit(1);
});
