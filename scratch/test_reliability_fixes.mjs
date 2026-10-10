import { computeFacialConfidenceScore, generateSessionEmotionTimeline } from '../src/services/faceDetector.js';
import { calculateConfidenceScore, calculateOverallSessionConfidence } from '../src/utils/confidenceScorer.js';

console.log('--- 1. Testing computeFacialConfidenceScore ---');
const sampleTelemetry = [
  { faceDetected: true, gazeCentered: true, lookingAway: false, noseX: 100, noseY: 150 },
  { faceDetected: true, gazeCentered: true, lookingAway: false, noseX: 102, noseY: 151 },
  { faceDetected: true, gazeCentered: false, lookingAway: true, noseX: 105, noseY: 150 },
  { faceDetected: true, gazeCentered: true, lookingAway: false, noseX: 101, noseY: 150 }
];

const facialRes = computeFacialConfidenceScore(sampleTelemetry);
console.log('facialRes:', facialRes);
if (facialRes.smileRatio !== undefined) {
  console.error('FAIL: smileRatio should not be in facialRes');
  process.exit(1);
}
if (typeof facialRes.eyeContactRatio !== 'number' || typeof facialRes.presenceRatio !== 'number') {
  console.error('FAIL: eyeContactRatio and presenceRatio must be numbers');
  process.exit(1);
}
console.log('PASS: computeFacialConfidenceScore uses physical metrics only.');

console.log('\n--- 2. Testing generateSessionEmotionTimeline (Session Attentiveness Timeline) ---');
const timelineRes = generateSessionEmotionTimeline(sampleTelemetry);
console.log('timeline summaryLabel:', timelineRes.summaryLabel);
console.log('bucket percentages:', timelineRes.bucketPercentages);
if (timelineRes.summaryLabel.toLowerCase().includes('nervous') || timelineRes.summaryLabel.toLowerCase().includes('stressed')) {
  console.error('FAIL: summaryLabel should not contain nervous/stressed emotions');
  process.exit(1);
}
console.log('PASS: Timeline generates descriptive gaze and presence metrics without emotion labeling.');

console.log('\n--- 3. Testing calculateConfidenceScore (Communication Composure) ---');
const answerResult = {
  metrics: {
    wordsPerMinute: 135,
    wordCount: 100,
    fillerWordCount: 2,
    longPauseCount: 1
  },
  telemetryLogs: sampleTelemetry
};

const compRes = calculateConfidenceScore(answerResult);
console.log('compRes composureScore:', compRes.composureScore);
console.log('compRes breakdown:', compRes.breakdown);
if (typeof compRes.composureScore !== 'number' || compRes.composureScore < 0 || compRes.composureScore > 100) {
  console.error('FAIL: composureScore invalid');
  process.exit(1);
}
console.log('PASS: Communication Composure computed from acoustic and gaze presence signals.');

console.log('\n--- 4. Testing calculateOverallSessionConfidence ---');
const sessionResults = [
  answerResult,
  {
    metrics: { wordsPerMinute: 140, wordCount: 80, fillerWordCount: 1, longPauseCount: 0 },
    telemetryLogs: sampleTelemetry
  }
];
const overallRes = calculateOverallSessionConfidence(sessionResults);
console.log('overallRes:', overallRes);
if (typeof overallRes.composureScore !== 'number' || typeof overallRes.overallScore !== 'number') {
  console.error('FAIL: overallScore and composureScore must be numbers');
  process.exit(1);
}
console.log('PASS: calculateOverallSessionConfidence outputs valid backward-compatible composure metrics.');

console.log('\nALL RELIABILITY CHECKS PASSED SUCCESSFULLY!');
