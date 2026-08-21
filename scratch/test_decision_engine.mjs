import { evaluateDecisionEngine, applyDecisionToState } from '../src/services/decisionEngine.js';

console.log('=== TESTING DECISION ENGINE (PROMPT 4) ===\n');

let passedCount = 0;
let totalCount = 0;

function assert(condition, message) {
  totalCount++;
  if (condition) {
    console.log(`✓ PASS: ${message}`);
    passedCount++;
  } else {
    console.error(`✗ FAIL: ${message}`);
  }
}

// Test 1: Repeat Navigation Intent
const res1 = evaluateDecisionEngine({}, {}, 'can you repeat the question please?');
assert(res1.strategy === 'repeat_question' && res1.topicAdvance === false, 'Test 1: Repeat Question Intent');

// Test 2: Simplify Navigation Intent
const res2 = evaluateDecisionEngine({}, {}, 'can you simplify the question?');
assert(res2.strategy === 'simplify_question' && res2.topicAdvance === false, 'Test 2: Simplify Question Intent');

// Test 3: Hard Rule (currentDepth >= 3 forces topic advance)
const res3 = evaluateDecisionEngine(
  { verdict: 'partially_correct' },
  { currentDepth: 3, difficultyLevel: 'medium' },
  'some student response'
);
assert(res3.strategy === 'move_to_next_topic' && res3.topicAdvance === true, 'Test 3: Hard Rule (Depth >= 3)');

// Test 4: Consecutive Weak Verdicts (2 consecutive incorrect/dont_know)
const res4 = evaluateDecisionEngine(
  { verdict: 'incorrect' },
  {
    currentDepth: 1,
    difficultyLevel: 'hard',
    evaluationLog: [{ verdict: 'dont_know' }]
  },
  'wrong answer'
);
assert(
  res4.strategy === 'drop_difficulty_offer_easier_related' &&
  res4.topicAdvance === true &&
  res4.newDifficultyLevel === 'medium',
  'Test 4: Consecutive Weak Verdicts'
);

// Test 5: Correct + High Confidence (New Topic or Increase Difficulty)
const res5 = evaluateDecisionEngine(
  { verdict: 'correct', confidenceOfStudent: 'high', conceptsMissing: [] },
  { currentDepth: 1, difficultyLevel: 'medium' },
  'perfect answer'
);
assert(
  res5.strategy === 'increase_difficulty_or_new_topic' &&
  res5.topicAdvance === true &&
  res5.newDifficultyLevel === 'hard',
  'Test 5: Correct + High Confidence'
);

// Test 6: Correct but Missing Nuance
const res6 = evaluateDecisionEngine(
  { verdict: 'correct', confidenceOfStudent: 'high', conceptsMissing: ['runtime polymorphism'] },
  { currentDepth: 1, difficultyLevel: 'medium' },
  'good answer missing nuance'
);
assert(
  res6.strategy === 'probe_missing_nuance' && res6.topicAdvance === false,
  'Test 6: Correct but Missing Nuance'
);

// Test 7: Partially Correct
const res7 = evaluateDecisionEngine(
  { verdict: 'partially_correct' },
  { currentDepth: 1, difficultyLevel: 'medium' },
  'partially correct answer'
);
assert(
  res7.strategy === 'affirm_correct_part_and_crossquestion_wrong_part' && res7.topicAdvance === false,
  'Test 7: Partially Correct'
);

// Test 8: Incorrect at Depth 1 (Guiding Question No Reveal)
const res8 = evaluateDecisionEngine(
  { verdict: 'incorrect' },
  { currentDepth: 1, difficultyLevel: 'medium' },
  'wrong answer depth 1'
);
assert(
  res8.strategy === 'guiding_question_no_reveal' && res8.topicAdvance === false,
  'Test 8: Incorrect Depth 1'
);

// Test 9: Incorrect at Depth 2 (Gentle Correct Then Retest)
const res9 = evaluateDecisionEngine(
  { verdict: 'incorrect' },
  { currentDepth: 2, difficultyLevel: 'medium', evaluationLog: [{ verdict: 'partially_correct' }] },
  'wrong answer depth 2'
);
assert(
  res9.strategy === 'gentle_correct_then_retest' && res9.topicAdvance === false,
  'Test 9: Incorrect Depth 2'
);

// Test 10: Vague / Off Topic
const res10 = evaluateDecisionEngine(
  { verdict: 'vague' },
  { currentDepth: 0, difficultyLevel: 'medium' },
  'hand wavy answer'
);
assert(
  res10.strategy === 'ask_narrower_version' && res10.topicAdvance === false,
  'Test 10: Vague / Off Topic'
);

// Test 11: Don't Know
const res11 = evaluateDecisionEngine(
  { verdict: 'dont_know' },
  { currentDepth: 0, difficultyLevel: 'medium' },
  'i don\'t know'
);
assert(
  res11.strategy === 'simplify_or_hint' && res11.topicAdvance === false,
  'Test 11: Don\'t Know'
);

// Test 12: State Advancement Application
const mockSession = {
  sessionId: 'test_sess_123',
  currentTopicId: 'topic-1',
  currentDepth: 2,
  difficultyLevel: 'medium',
  topicPlan: [
    { topicId: 'topic-1', topicName: 'Topic 1', status: 'in_progress' },
    { topicId: 'topic-2', topicName: 'Topic 2', status: 'not_started' }
  ]
};

const updatedState = applyDecisionToState(mockSession, {
  strategy: 'move_to_next_topic',
  topicAdvance: true,
  newDifficultyLevel: 'hard'
});

assert(
  updatedState.topicPlan[0].status === 'completed' &&
  updatedState.topicPlan[1].status === 'in_progress' &&
  updatedState.currentTopicId === 'topic-2' &&
  updatedState.currentDepth === 0 &&
  updatedState.difficultyLevel === 'hard',
  'Test 12: State Advancement & Firestore Document Transformation'
);

console.log(`\nResults: ${passedCount}/${totalCount} tests passed.`);
if (passedCount === totalCount) {
  console.log('SUCCESS: Decision Engine fully verified!');
  process.exit(0);
} else {
  console.error('FAILURE: Some tests failed.');
  process.exit(1);
}
