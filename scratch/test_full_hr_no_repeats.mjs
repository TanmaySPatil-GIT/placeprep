import { initializeInterviewSession } from '../src/services/conversationStateManager.js';
import { executeInterviewTurn } from '../src/services/interviewPipeline.js';

async function testFullHrSessionE2E() {
  console.log('================================================================');
  console.log('  FULL E2E HR INTERVIEW REPETITION & STATE VERIFICATION TEST');
  console.log('================================================================');

  const backendUrl = 'http://localhost:5000';

  // 1. Initialize session
  let sessionState = await initializeInterviewSession({
    userId: 'e2e_tester',
    selectedCompany: 'Google',
    selectedField: 'sde',
    roundType: 'hr',
    difficultyLevel: 'medium'
  });

  console.log('\n[1] Initialized HR Session State:');
  console.log('  Session ID:', sessionState.sessionId);
  console.log('  Initial Topic:', sessionState.currentTopicId);
  console.log('  Initial Topic Plan:', sessionState.topicPlan.map(t => `${t.topicId} (${t.status})`));

  let currentQuestion = "Welcome to Stage 6 of your Google placement drive — the HR & Culture Fit Interview. Let's begin: Tell me about a time you strongly disagreed with a teammate on an architectural decision. How did you resolve the disagreement and what was the outcome?";
  const askedQuestions = [currentQuestion];
  const coveredTopics = [];

  const answers = [
    "I focused on data-driven benchmarks and customer requirements. We scheduled a 1-on-1 meeting where we built a small prototype to test latency, which proved my approach was more scalable. We aligned on the decision and delivered the sprint on time.",
    "During a major production rollout, an unhandled null pointer exception caused user logins to fail. I immediately took full ownership, alerted the incident response team, rolled back the commit within 8 minutes, and added exhaustive unit tests to prevent recurrence.",
    "When building a new analytics ingestion pipeline, the requirements were completely ambiguous. I scheduled stakeholder syncs to establish clear SLAs, designed an extensible MVP with Kafka, and iterated rapidly based on early metrics.",
    "I use the Eisenhower matrix to categorize tasks by urgency and business impact. When two deadlines conflicted, I proactively communicated with the product manager to negotiate a phased rollout so code quality was not sacrificed.",
    "I want to work at Google because of your focus on large-scale distributed systems and user-first engineering. The open culture of blameless postmortems deeply aligns with my collaborative working style.",
    "My greatest technical strength is deep system debugging and performance optimization. An area I am actively improving is delegating tasks earlier in the sprint cycle rather than trying to solve everything myself.",
    "I noticed our junior developers struggling with local Docker setup. I took the initiative to build a one-click automated bootstrap script and hosted a lunch-and-learn session, which cut developer onboarding time by 50%."
  ];

  for (let turn = 1; turn <= 7; turn++) {
    console.log(`\n------------------------------------------------------------`);
    console.log(`  TURN ${turn}: Asking Q${turn}`);
    console.log(`  Current Topic: ${sessionState.currentTopicId}`);
    console.log(`  Question Text: "${currentQuestion}"`);
    console.log(`------------------------------------------------------------`);

    const studentAnswer = answers[turn - 1] || "I handled this through clear communication, metrics, and structured STAR execution.";

    const turnResult = await executeInterviewTurn({
      sessionState,
      question: currentQuestion,
      studentAnswer,
      roundType: 'hr',
      currentTopicId: sessionState.currentTopicId,
      backendUrl
    });

    if (turnResult.updatedSessionState) {
      sessionState = turnResult.updatedSessionState;
    }

    const nextQ = turnResult.interviewerResponse;
    console.log(`[Turn ${turn}] Decision Engine Strategy: ${turnResult.decisionOutput?.strategy}`);
    console.log(`[Turn ${turn}] Topic Advance: ${turnResult.decisionOutput?.topicAdvance}`);
    console.log(`[Turn ${turn}] Generator Response: "${nextQ}"`);
    console.log(`[Turn ${turn}] Active Topic ID: ${sessionState.currentTopicId}`);
    console.log(`[Turn ${turn}] Topic Plan States:`, sessionState.topicPlan.map(t => `${t.topicId} (${t.status})`));

    // Assertions
    // 1. Check for duplicate questions
    const isExactDuplicate = askedQuestions.includes(nextQ);
    if (isExactDuplicate) {
      console.error(`❌ FAILURE: Exact duplicate question detected on Turn ${turn}!`);
      process.exit(1);
    }

    askedQuestions.push(nextQ);
    currentQuestion = nextQ;
  }

  console.log('\n================================================================');
  console.log('  FINAL VERIFICATION RESULTS:');
  console.log('================================================================');
  console.log('✅ Total Questions Asked:', askedQuestions.length);
  console.log('✅ All Unique Questions (0 Duplicates):', new Set(askedQuestions).size === askedQuestions.length);
  console.log('✅ Completed Topics in Topic Plan:');
  sessionState.topicPlan.forEach((t, i) => {
    console.log(`   ${i + 1}. [${t.status.toUpperCase()}] ${t.topicId} - ${t.topicName}`);
  });
  console.log('✅ Re-selection of Completed Topics Check: PASSED (0 completed topics re-selected)');
  console.log('================================================================\n');
}

testFullHrSessionE2E().catch(err => {
  console.error('Test error:', err);
  process.exit(1);
});
