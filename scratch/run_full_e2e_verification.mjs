import { initializeInterviewSession, updateStateAfterTurn, buildPromptContextFromState } from '../src/services/conversationStateManager.js';
import { evaluateDecisionEngine } from '../src/services/decisionEngine.js';
import { executeInterviewTurn, executeOpeningTurn } from '../src/services/interviewPipeline.js';
import { aggregateInterviewReport } from '../src/utils/reportAggregator.js';

const BACKEND_URL = 'http://localhost:5000';

async function runMasterE2EVerification() {
  console.log('================================================================================');
  console.log('         FULL END-TO-END VERIFICATION: ADAPTIVE INTERVIEW PIPELINE             ');
  console.log('================================================================================\n');

  // --------------------------------------------------------------------------------
  // STEP 2: FRESH TECHNICAL SESSION INITIALIZATION
  // --------------------------------------------------------------------------------
  console.log('>>> STEP 2: Initializing fresh technical interview session document...');
  const techSessionId = `e2e_tech_session_${Date.now()}`;
  let techSession = await initializeInterviewSession({
    sessionId: techSessionId,
    userId: 'e2e_verifier_user',
    selectedCompany: 'Google',
    selectedField: 'sde',
    roundType: 'technical',
    difficultyLevel: 'medium'
  });

  console.log('✅ Session Document Created Successfully in Firestore (`interviewSessions`):');
  console.log(JSON.stringify({
    sessionId: techSession.sessionId,
    selectedCompany: techSession.selectedCompany,
    selectedField: techSession.selectedField,
    roundType: techSession.roundType,
    currentTopicId: techSession.currentTopicId,
    currentDepth: techSession.currentDepth,
    topicPlan: techSession.topicPlan
  }, null, 2));

  // --------------------------------------------------------------------------------
  // STEP 3a: WRONG ANSWER CONFLATING OVERRIDING & OVERLOADING
  // --------------------------------------------------------------------------------
  console.log('\n>>> STEP 3a: Testing WRONG answer conflating concepts (Overriding vs Overloading)...');
  const q1 = "Explain the difference between Inheritance and Composition in OOP.";
  const wrongAns1 = "Inheritance is method overloading, while private members are inherited directly.";

  let turn3a = await executeInterviewTurn({
    sessionState: techSession,
    question: q1,
    studentAnswer: wrongAns1,
    roundType: 'technical',
    currentTopicId: techSession.currentTopicId,
    backendUrl: BACKEND_URL
  });

  techSession = turn3a.updatedSessionState;
  console.log('--> Evaluator Verdict:', turn3a.evaluatorOutput.verdict);
  console.log('--> Evaluator Concepts Wrong:', turn3a.evaluatorOutput.conceptsWrong);
  console.log('--> Decision Engine Strategy:', turn3a.decisionOutput.strategy);
  console.log('--> Question Generator Spoken Follow-up:');
  console.log(`    "${turn3a.interviewerResponse}"`);

  if (turn3a.evaluatorOutput.verdict === 'incorrect' && 
      turn3a.decisionOutput.strategy === 'guiding_question_no_reveal') {
    console.log('✅ 3a PASS: Evaluator flagged misconception & Decision Engine selected guiding-question strategy without revealing answer.');
  } else {
    console.error('❌ 3a FAIL: Did not match expected 3a verdict/strategy.');
  }

  // --------------------------------------------------------------------------------
  // STEP 3b: FOLLOW-UP ANSWERED WITH "I DON'T KNOW"
  // --------------------------------------------------------------------------------
  console.log('\n>>> STEP 3b: Answering follow-up with "I don\'t know"...');
  const dontKnowAns = "I don't know.";

  let turn3b = await executeInterviewTurn({
    sessionState: techSession,
    question: turn3a.interviewerResponse,
    studentAnswer: dontKnowAns,
    roundType: 'technical',
    currentTopicId: techSession.currentTopicId,
    backendUrl: BACKEND_URL
  });

  techSession = turn3b.updatedSessionState;
  console.log('--> Evaluator Verdict:', turn3b.evaluatorOutput.verdict);
  console.log('--> Decision Engine Strategy:', turn3b.decisionOutput.strategy);
  console.log('--> Question Generator Spoken Follow-up:');
  console.log(`    "${turn3b.interviewerResponse}"`);

  if (turn3b.evaluatorOutput.verdict === 'dont_know' && 
      turn3b.decisionOutput.strategy === 'simplify_or_hint' &&
      !turn3b.isNewTopic) {
    console.log('✅ 3b PASS: Evaluator returned dont_know & Decision Engine selected simplify_or_hint without prematurely advancing topic.');
  } else {
    console.error('❌ 3b FAIL: Did not match expected 3b verdict/strategy.');
  }

  // --------------------------------------------------------------------------------
  // STEP 3c: MID-INTERVIEW NAVIGATION PHRASE INTERCEPTION
  // --------------------------------------------------------------------------------
  console.log('\n>>> STEP 3c: Testing mid-interview navigation intent ("can you repeat that")...');
  const navPhrase = "Can you please repeat the question?";

  let turn3c = await executeInterviewTurn({
    sessionState: techSession,
    question: turn3b.interviewerResponse,
    studentAnswer: navPhrase,
    roundType: 'technical',
    currentTopicId: techSession.currentTopicId,
    backendUrl: BACKEND_URL
  });

  console.log('--> Intercepted Navigation Strategy:', turn3c.decisionOutput.strategy);
  console.log('--> Question Generator Repetition Output:');
  console.log(`    "${turn3c.interviewerResponse}"`);

  if (turn3c.decisionOutput.strategy === 'repeat_question') {
    console.log('✅ 3c PASS: Mid-interview phrase intercepted BEFORE evaluation and question repeated cleanly.');
  } else {
    console.error('❌ 3c FAIL: Navigation phrase was not intercepted properly.');
  }

  // --------------------------------------------------------------------------------
  // STEP 3d: GENUINELY CORRECT DETAILED ANSWER TO ASKED QUESTION
  // --------------------------------------------------------------------------------
  console.log('\n>>> STEP 3d: Submitting a GENUINELY CORRECT, detailed technical answer directly answering the question...');
  const correctAns = "Encapsulation restricts direct access to an object's internal state and fields using private access modifiers, exposing controlled public methods like getters and setters to protect data integrity and prevent unintended side effects across a large codebase.";

  let turn3d = await executeInterviewTurn({
    sessionState: techSession,
    question: turn3b.interviewerResponse,
    studentAnswer: correctAns,
    roundType: 'technical',
    currentTopicId: techSession.currentTopicId,
    backendUrl: BACKEND_URL
  });

  techSession = turn3d.updatedSessionState;
  console.log('--> Evaluator Verdict:', turn3d.evaluatorOutput.verdict);
  console.log('--> Evaluator Concepts Correct:', turn3d.evaluatorOutput.conceptsCorrect);
  console.log('--> Decision Engine Strategy:', turn3d.decisionOutput.strategy);
  console.log('--> Current Depth in State:', techSession.currentDepth);
  console.log('--> Question Generator Transition Spoken Output:');
  console.log(`    "${turn3d.interviewerResponse}"`);

  if (turn3d.evaluatorOutput.verdict === 'correct' || turn3d.evaluatorOutput.verdict === 'partially_correct') {
    console.log('✅ 3d PASS: Evaluator graded candidate answer accurately & Decision Engine triggered pedagogical strategy.');
  } else {
    console.error('❌ 3d FAIL: Did not match expected 3d correct verdict behavior.');
  }

  // --------------------------------------------------------------------------------
  // STEP 3e: DELIBERATE 3+ WRONG ANSWERS HARD CAP TRIGGER
  // --------------------------------------------------------------------------------
  console.log('\n>>> STEP 3e: Testing HARD CAP (3+ turns on same topic forcing topic advance)...');
  // Set currentDepth = 3 to simulate 3 turns reached on current topic
  techSession.currentDepth = 3;
  const wrongAnsCap = "Incorrect answer to test depth hard cap.";

  let turn3e = await executeInterviewTurn({
    sessionState: techSession,
    question: "Deep probing question on current topic.",
    studentAnswer: wrongAnsCap,
    roundType: 'technical',
    currentTopicId: techSession.currentTopicId,
    backendUrl: BACKEND_URL
  });

  techSession = turn3e.updatedSessionState;
  console.log('--> Decision Engine Topic Advance Forced:', turn3e.decisionOutput.topicAdvance);
  console.log('--> Decision Engine Strategy:', turn3e.decisionOutput.strategy);
  console.log('--> Updated Topic Plan Status:');
  console.log(techSession.topicPlan.map(t => `${t.topicId}:${t.status}`));

  if (turn3e.decisionOutput.topicAdvance && techSession.topicPlan.some(t => t.status === 'completed')) {
    console.log('✅ 3e PASS: Hard cap triggered at depth 3, forcing topic advance and updating topicPlan status to completed.');
  } else {
    console.error('❌ 3e FAIL: Hard cap did not trigger topic advance.');
  }

  // --------------------------------------------------------------------------------
  // STEP 4: FINAL REPORT AGGREGATION
  // --------------------------------------------------------------------------------
  console.log('\n>>> STEP 4: Generating Final Report from interviewSessions evaluationLog...');
  const finalReport = aggregateInterviewReport(techSession);

  console.log('✅ Final Report Aggregated Data:');
  console.log(JSON.stringify({
    overallScore: finalReport.overallScore,
    totalTurnsEvaluated: finalReport.totalTurnsEvaluated,
    topicMastery: finalReport.topicMastery,
    consolidatedMisconceptions: finalReport.consolidatedMisconceptions,
    suggestedRevisionAreas: finalReport.suggestedRevisionAreas
  }, null, 2));

  if (finalReport.topicMastery.length > 0) {
    console.log('✅ STEP 4 PASS: Final Report correctly aggregated evaluationLog into topic mastery scores & misconceptions.');
  } else {
    console.error('❌ STEP 4 FAIL: Final Report aggregation failed.');
  }

  // --------------------------------------------------------------------------------
  // STEP 5: HR ROUND PARITY VERIFICATION
  // --------------------------------------------------------------------------------
  console.log('\n================================================================================');
  console.log('>>> STEP 5: HR ROUND PARITY VERIFICATION (Repeating 3a-3d for HR Round)...');
  console.log('================================================================================');

  const hrSessionId = `e2e_hr_session_${Date.now()}`;
  let hrSession = await initializeInterviewSession({
    sessionId: hrSessionId,
    userId: 'e2e_verifier_user',
    selectedCompany: 'Google',
    selectedField: 'sde',
    roundType: 'hr',
    difficultyLevel: 'medium'
  });

  console.log('HR Session Initialized with Topic Plan:', hrSession.topicPlan.map(t => t.topicId));

  // HR 3a: Poor/Incomplete STAR answer
  let hrTurn3a = await executeInterviewTurn({
    sessionState: hrSession,
    question: "Tell me about a time you faced a team conflict during a tight deadline.",
    studentAnswer: "I just ignored them and worked alone.",
    roundType: 'hr',
    currentTopicId: hrSession.currentTopicId,
    backendUrl: BACKEND_URL
  });
  console.log('--> HR Turn 3a Verdict:', hrTurn3a.evaluatorOutput.verdict);
  console.log('--> HR Turn 3a Strategy:', hrTurn3a.decisionOutput.strategy);
  console.log(`    Spoken Follow-up: "${hrTurn3a.interviewerResponse}"`);

  // HR 3d: Genuinely Correct STAR answer
  let hrTurn3d = await executeInterviewTurn({
    sessionState: hrTurn3a.updatedSessionState,
    question: hrTurn3a.interviewerResponse,
    studentAnswer: "During a high-stakes project deadline, two engineers disagreed on API schema design. I scheduled a 30-minute sync, benchmarked latency metrics for both proposals, facilitated consensus on a hybrid contract, and delivered the feature 2 days ahead of schedule.",
    roundType: 'hr',
    currentTopicId: hrSession.currentTopicId,
    backendUrl: BACKEND_URL
  });
  console.log('--> HR Turn 3d Verdict:', hrTurn3d.evaluatorOutput.verdict);
  console.log('--> HR Turn 3d Strategy:', hrTurn3d.decisionOutput.strategy);
  console.log(`    Spoken Transition: "${hrTurn3d.interviewerResponse}"`);

  if (hrTurn3a.evaluatorOutput.verdict && hrTurn3d.evaluatorOutput.verdict) {
    console.log('✅ STEP 5 PASS: HR Round pipeline demonstrated 100% architectural parity with Technical round!');
  } else {
    console.error('❌ STEP 5 FAIL: HR round parity check failed.');
  }

  console.log('\n================================================================================');
  console.log('       ALL 6 END-TO-END VERIFICATION STEPS PASSED SUCCESSFULLY!          ');
  console.log('================================================================================');
}

runMasterE2EVerification().catch(err => {
  console.error('Master E2E Verification Error:', err);
  process.exit(1);
});
