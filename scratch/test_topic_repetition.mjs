import { initializeInterviewSession, updateStateAfterTurn } from '../src/services/conversationStateManager.js';
import { evaluateDecisionEngine } from '../src/services/decisionEngine.js';

async function testHrInterviewSession() {
  console.log('--- STARTING HR INTERVIEW SESSION SIMULATION ---');
  let session = await initializeInterviewSession({
    userId: 'test_user',
    selectedCompany: 'Google',
    selectedField: 'sde',
    roundType: 'hr',
    difficultyLevel: 'medium'
  });

  console.log('\n[Initial Session]');
  console.log('Current Topic ID:', session.currentTopicId);
  console.log('Topic Plan:', session.topicPlan.map(t => `${t.topicId}: ${t.status}`));

  for (let turn = 1; turn <= 8; turn++) {
    console.log(`\n================== TURN ${turn} ==================`);
    const evaluatorOutput = {
      verdict: 'correct',
      score: 90,
      confidenceOfStudent: 'high',
      keyConceptsCovered: ['STAR method', 'Communication'],
      keyConceptGaps: [],
      misconceptionsTriggered: []
    };

    const decisionOutput = evaluateDecisionEngine(evaluatorOutput, session, "I used the STAR method to resolve the team disagreement.");
    console.log(`[Turn ${turn}] Decision Engine Output:`, decisionOutput);

    session = await updateStateAfterTurn(session.sessionId, {
      sessionState: session,
      question: `Question ${turn} about ${session.currentTopicId}`,
      studentAnswer: "Answer for turn " + turn,
      evaluatorOutput,
      decisionOutput
    });

    console.log(`[Turn ${turn}] State After Update:`);
    console.log('  Current Topic ID:', session.currentTopicId);
    console.log('  Topic Plan:', session.topicPlan.map(t => `${t.topicId}: ${t.status}`));
    console.log('  Recent Turns Count:', session.recentTurns.length);
    console.log('  Evaluation Log Count:', session.evaluationLog.length);
  }
}

testHrInterviewSession();
