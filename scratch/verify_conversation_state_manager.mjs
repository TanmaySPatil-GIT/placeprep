import {
  initializeInterviewSession,
  getInterviewSession,
  updateStateAfterTurn,
  buildPromptContextFromState
} from '../src/services/conversationStateManager.js';

async function testConversationStateManager() {
  console.log("=== TESTING CONVERSATION STATE MANAGER ===");

  // 1. Test Initialization
  console.log("\n[Test 1] Initializing new interview session...");
  const session = await initializeInterviewSession({
    userId: 'test_student_123',
    selectedCompany: 'Amazon',
    selectedField: 'sde',
    roundType: 'technical',
    difficultyLevel: 'medium'
  });

  console.log("Session created:");
  console.log("- Session ID:", session.sessionId);
  console.log("- Topic Plan Count:", session.topicPlan.length);
  console.log("- Active Topic ID:", session.currentTopicId);
  console.log("- Topic Plan:", session.topicPlan);

  if (!session.sessionId || session.topicPlan.length < 3 || !session.currentTopicId) {
    console.error("FAILED: Session initialization failed criteria.");
    process.exit(1);
  }

  // 2. Test Turn 1 (Probing Turn)
  console.log("\n[Test 2] Processing Turn 1 (Probing answer on current topic)...");
  const turn1Question = "Explain the difference between Inheritance and Composition in OOP.";
  const turn1Answer = "Inheritance is an is-a relationship where a subclass reuses code from parent. Composition is a has-a relationship.";

  const evaluator1 = {
    score: 70,
    passed: true,
    keyConceptsCovered: ["Inheritance establishes is-a relationship", "Composition establishes has-a relationship"],
    keyConceptGaps: ["Fragile base class problem", "Flexibility of composition over inheritance"],
    misconceptionsTriggered: [],
    feedback: "Solid basic definitions of is-a vs has-a relationships, but missed trade-off nuances."
  };

  const decision1 = {
    interviewerResponse: "Good distinction between is-a and has-a. Can you explain why composition is often preferred to avoid the fragile base class problem?",
    moveToNewTopic: false,
    nextDifficulty: "medium"
  };

  const stateAfterTurn1 = await updateStateAfterTurn(session.sessionId, {
    sessionState: session,
    question: turn1Question,
    studentAnswer: turn1Answer,
    evaluatorOutput: evaluator1,
    decisionOutput: decision1
  });

  console.log("State after Turn 1:");
  console.log("- Current Depth:", stateAfterTurn1.currentDepth);
  console.log("- Recent Turns Count:", stateAfterTurn1.recentTurns.length);
  console.log("- Evaluation Log Count:", stateAfterTurn1.evaluationLog.length);
  console.log("- Strong Signals:", stateAfterTurn1.strongSignals);
  console.log("- Weak Signals:", stateAfterTurn1.weakSignals);

  if (stateAfterTurn1.currentDepth !== 1 || stateAfterTurn1.recentTurns.length !== 2) {
    console.error("FAILED: Turn 1 state update failed.");
    process.exit(1);
  }

  // 3. Test Turn 2 (Topic Completion & Transition)
  console.log("\n[Test 3] Processing Turn 2 (Completing current topic & transitioning)...");
  const turn2Question = "Can you explain why composition is preferred over inheritance to prevent fragile base class problems?";
  const turn2Answer = "Composition avoids coupling child classes to parent internal implementation details, preventing unexpected breakages when parent class methods change.";

  const evaluator2 = {
    score: 90,
    passed: true,
    keyConceptsCovered: ["Composition prevents tight coupling and fragile base class issues"],
    keyConceptGaps: [],
    misconceptionsTriggered: [],
    feedback: "Excellent explanation of encapsulation protection through composition."
  };

  const decision2 = {
    interviewerResponse: "Great explanation! Let's move on to relational database normalization.",
    moveToNewTopic: true,
    nextDifficulty: "medium"
  };

  const stateAfterTurn2 = await updateStateAfterTurn(session.sessionId, {
    sessionState: stateAfterTurn1,
    question: turn2Question,
    studentAnswer: turn2Answer,
    evaluatorOutput: evaluator2,
    decisionOutput: decision2
  });

  console.log("State after Turn 2 (Topic Completion):");
  console.log("- Active Topic ID:", stateAfterTurn2.currentTopicId);
  console.log("- Completed Topics in Plan:", stateAfterTurn2.topicPlan.filter(t => t.status === 'completed').length);
  console.log("- History Summary:\n", stateAfterTurn2.historySummary);

  if (stateAfterTurn2.topicPlan.filter(t => t.status === 'completed').length < 1 || !stateAfterTurn2.historySummary) {
    console.error("FAILED: Topic completion and history summary folding failed.");
    process.exit(1);
  }

  // 4. Test Prompt Context Generation
  console.log("\n[Test 4] Generating Prompt Context from Session State Document...");
  const promptContext = buildPromptContextFromState(stateAfterTurn2);
  console.log("Generated Prompt Context:\n", promptContext);

  if (!promptContext.includes("CONVERSATION SESSION STATE") || !promptContext.includes("HISTORY SUMMARY OF COMPLETED TOPICS")) {
    console.error("FAILED: Prompt context generation failed.");
    process.exit(1);
  }

  console.log("\nSUCCESS: All Conversation State Manager tests passed perfectly!");
}

testConversationStateManager().catch(err => {
  console.error("TEST FAILED WITH EXCEPTION:", err);
  process.exit(1);
});
