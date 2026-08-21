import { aggregateInterviewReport } from '../src/utils/reportAggregator.js';

function runTest() {
  const sessionState = {
    sessionId: 'session_report_test_999',
    selectedCompany: 'Google',
    selectedField: 'sde',
    roundType: 'technical',
    historySummary: 'Covered OOP - Inheritance: correctly explained code reuse via superclasses, but confused overriding with overloading after 2 follow-ups.\n',
    topicPlan: [
      { topicId: 'oop-inheritance', topicName: 'OOP - Inheritance', status: 'completed', mastery: 85 },
      { topicId: 'dbms-normalization', topicName: 'DBMS - Normalization', status: 'in_progress', mastery: 65 },
      { topicId: 'ds-hash-tables', topicName: 'Data Structures - Hash Tables', status: 'not_started', mastery: null }
    ],
    evaluationLog: [
      {
        turnIndex: 1,
        topicId: 'oop-inheritance',
        topicName: 'OOP - Inheritance',
        score: 70,
        verdict: 'partially_correct',
        conceptsCorrect: ['Code reuse via inheritance'],
        conceptsWrong: ['Confused method overriding with method overloading'],
        conceptsMissing: ['Runtime polymorphism']
      },
      {
        turnIndex: 2,
        topicId: 'oop-inheritance',
        topicName: 'OOP - Inheritance',
        score: 95,
        verdict: 'correct',
        conceptsCorrect: ['Runtime polymorphism via method overriding', 'Composition fragile base class problem'],
        conceptsWrong: [],
        conceptsMissing: []
      },
      {
        turnIndex: 3,
        topicId: 'dbms-normalization',
        topicName: 'DBMS - Normalization',
        score: 40,
        verdict: 'incorrect',
        conceptsCorrect: [],
        conceptsWrong: ['Thinking 3NF eliminates all redundancy without lossy joins'],
        conceptsMissing: ['BCNF determinant rule']
      }
    ]
  };

  const report = aggregateInterviewReport(sessionState);

  console.log('=== AGGREGATED REPORT RESULT ===');
  console.log(JSON.stringify(report, null, 2));

  console.log('\n--- VERIFICATION CHECKS ---');
  console.log('Overall Score:', report.overallScore);
  console.log('Topic Mastery Count:', report.topicMastery.length);
  console.log('Consolidated Misconceptions Count:', report.consolidatedMisconceptions.length);
  console.log('Suggested Revision Areas Count:', report.suggestedRevisionAreas.length);

  if (report.topicMastery.length >= 3 && report.consolidatedMisconceptions.length === 2 && report.suggestedRevisionAreas.length >= 2) {
    console.log('\n✅ SUCCESS: Report Aggregation from evaluationLog verified 100%!');
  } else {
    console.error('\n❌ FAILED: Aggregation count mismatch.');
    process.exit(1);
  }
}

runTest();
