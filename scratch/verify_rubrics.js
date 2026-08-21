const fs = require('fs');
const path = require('path');

// Read seedInterviewRubrics.js content
const filePath = path.join(__dirname, '../src/utils/seedInterviewRubrics.js');
const fileContent = fs.readFileSync(filePath, 'utf8');

// Basic validation checks on topics
console.log("Analyzing seedInterviewRubrics.js...");

// Extract INITIAL_INTERVIEW_RUBRICS array block
const rubricMatch = fileContent.match(/export const INITIAL_INTERVIEW_RUBRICS = (\[[\s\S]*?\]);/);
if (!rubricMatch) {
  console.error("FAILED: Could not locate INITIAL_INTERVIEW_RUBRICS in seedInterviewRubrics.js");
  process.exit(1);
}

let rubrics;
try {
  // Use Function to evaluate JS object array
  rubrics = new Function(`return ${rubricMatch[1]}`)();
} catch (e) {
  console.error("FAILED: Parsing INITIAL_INTERVIEW_RUBRICS:", e.message);
  process.exit(1);
}

console.log(`Successfully parsed ${rubrics.length} rubric topics.`);

if (rubrics.length < 15) {
  console.error(`FAILED: Expected at least 15-20 rubric topics, got ${rubrics.length}`);
  process.exit(1);
}

const requiredKeys = [
  'topicId',
  'topicName',
  'fieldIds',
  'keyConcepts',
  'commonMisconceptions',
  'difficultyLevel',
  'sampleQuestion'
];

let errors = 0;
const fieldCounts = {};

rubrics.forEach((r, idx) => {
  requiredKeys.forEach(k => {
    if (!(k in r)) {
      console.error(`Topic [${idx}] (${r.topicId || 'unknown'}) missing required property: '${k}'`);
      errors++;
    }
  });

  if (!Array.isArray(r.fieldIds) || r.fieldIds.length === 0) {
    console.error(`Topic [${r.topicId}] has invalid or empty fieldIds array`);
    errors++;
  } else {
    r.fieldIds.forEach(fid => {
      fieldCounts[fid] = (fieldCounts[fid] || 0) + 1;
    });
  }

  if (!Array.isArray(r.keyConcepts) || r.keyConcepts.length < 3) {
    console.error(`Topic [${r.topicId}] keyConcepts should be specific (at least 3 items)`);
    errors++;
  }

  if (!Array.isArray(r.commonMisconceptions) || r.commonMisconceptions.length < 2) {
    console.error(`Topic [${r.topicId}] commonMisconceptions should be specific (at least 2 items)`);
    errors++;
  }

  if (!['Easy', 'Medium', 'Hard'].includes(r.difficultyLevel)) {
    console.error(`Topic [${r.topicId}] has invalid difficultyLevel '${r.difficultyLevel}'`);
    errors++;
  }
});

console.log("\nField ID Distribution across Rubric Topics:");
console.table(fieldCounts);

if (errors === 0) {
  console.log(`\nSUCCESS: All ${rubrics.length} rubric topics strictly follow the Firestore schema!`);
} else {
  console.error(`\nFAILED: Found ${errors} validation errors in rubric topics.`);
  process.exit(1);
}
