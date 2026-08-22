import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, doc, setDoc } from 'firebase/firestore';
import fs from 'fs';
import path from 'path';

// Parse .env manually
const envPath = path.resolve(process.cwd(), '.env');
const envContent = fs.readFileSync(envPath, 'utf8');
const envConfig = {};
envContent.split('\n').forEach(line => {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith('#')) {
    const idx = trimmed.indexOf('=');
    if (idx !== -1) {
      const key = trimmed.substring(0, idx).trim();
      let val = trimmed.substring(idx + 1).trim();
      if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
        val = val.slice(1, -1);
      }
      envConfig[key] = val;
    }
  }
});

const firebaseConfig = {
  apiKey: envConfig.VITE_FIREBASE_API_KEY,
  authDomain: envConfig.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: envConfig.VITE_FIREBASE_PROJECT_ID,
  storageBucket: envConfig.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: envConfig.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: envConfig.VITE_FIREBASE_APP_ID,
};

console.log('------------------------------------------------------------');
console.log('  FIRESTORE ENVIRONMENT & COLLECTION DIAGNOSTIC TOOL');
console.log('------------------------------------------------------------');
console.log('Configured Project ID:', firebaseConfig.projectId);
console.log('Auth Domain:          ', firebaseConfig.authDomain);
console.log('App ID:               ', firebaseConfig.appId);
console.log('------------------------------------------------------------\n');

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Import Seed Data
import { INITIAL_COURSE_CATALOG } from '../src/utils/seedCourseCatalog.js';
import { INITIAL_INTERVIEW_RUBRICS } from '../src/utils/seedInterviewRubrics.js';
import { INITIAL_APTITUDE_QUESTIONS } from '../src/utils/seedAptitudeQuestions.js';
import { INITIAL_TECHNICAL_MCQ_QUESTIONS } from '../src/utils/seedTechnicalMcqQuestions.js';
import { INITIAL_ROLE_QUESTIONS } from '../src/utils/seedRoleQuestions.js';
import { INITIAL_QUESTIONS } from '../src/utils/seedQuestions.js';
import { INITIAL_COMPANIES } from '../src/utils/seedCompanies.js';
import { COMPANY_INSIGHTS } from '../src/utils/seedCompanyInsights.js';
import { INITIAL_FIELDS } from '../src/utils/seedFields.js';
import { INITIAL_INTERVIEW_QUESTIONS } from '../src/utils/seedInterviewQuestions.js';
import { INITIAL_HR_QUESTIONS } from '../src/utils/seedHrQuestions.js';

const companyInsightsArray = Object.keys(COMPANY_INSIGHTS).map(k => ({
  company: k,
  ...COMPANY_INSIGHTS[k]
}));

const SEED_CONFIGS = [
  { name: 'courseCatalog', data: INITIAL_COURSE_CATALOG, idKey: 'catalogId', file: 'src/utils/seedCourseCatalog.js' },
  { name: 'interviewRubrics', data: INITIAL_INTERVIEW_RUBRICS, idKey: 'topicId', file: 'src/utils/seedInterviewRubrics.js' },
  { name: 'aptitudeQuestions', data: INITIAL_APTITUDE_QUESTIONS, idKey: 'id', file: 'src/utils/seedAptitudeQuestions.js' },
  { name: 'technicalMcqQuestions', data: INITIAL_TECHNICAL_MCQ_QUESTIONS, idKey: 'id', file: 'src/utils/seedTechnicalMcqQuestions.js' },
  { name: 'roleQuestions', data: INITIAL_ROLE_QUESTIONS, idKey: 'id', file: 'src/utils/seedRoleQuestions.js' },
  { name: 'questions', data: INITIAL_QUESTIONS, idKey: 'id', file: 'src/utils/seedQuestions.js' },
  { name: 'companies', data: INITIAL_COMPANIES, idKey: 'id', file: 'src/utils/seedCompanies.js' },
  { name: 'companyInsights', data: companyInsightsArray, idKey: 'company', file: 'src/utils/seedCompanyInsights.js' },
  { name: 'fields', data: INITIAL_FIELDS, idKey: 'fieldId', file: 'src/utils/seedFields.js' },
  { name: 'interviewQuestions', data: INITIAL_INTERVIEW_QUESTIONS, idKey: 'id', file: 'src/utils/seedInterviewQuestions.js' },
  { name: 'hrQuestions', data: INITIAL_HR_QUESTIONS, idKey: 'id', file: 'src/utils/seedHrQuestions.js' }
];

async function checkCounts() {
  console.log('Checking Current Firestore Document Counts vs Expected Seed Counts...\n');
  const results = [];

  for (const item of SEED_CONFIGS) {
    try {
      const snap = await getDocs(collection(db, item.name));
      const count = snap.size;
      results.push({
        collection: item.name,
        actualCount: count,
        expectedCount: item.data.length,
        status: count >= item.data.length ? 'OK' : (count === 0 ? 'EMPTY ❌' : 'PARTIAL ⚠️'),
        seedFile: item.file
      });
    } catch (err) {
      results.push({
        collection: item.name,
        actualCount: 'ERROR',
        expectedCount: item.data.length,
        status: 'FETCH_ERROR: ' + err.message,
        seedFile: item.file
      });
    }
  }

  console.table(results);
  return results;
}

async function seedAll() {
  console.log('\n============================================================');
  console.log(`  SEEDING ALL COLLECTIONS TO FIREBASE PROJECT: "${firebaseConfig.projectId}"`);
  console.log('============================================================\n');

  for (const item of SEED_CONFIGS) {
    console.log(`[Seeding] Collection: "${item.name}" (Total items to write: ${item.data.length})...`);
    let written = 0;
    const colRef = collection(db, item.name);
    for (const docData of item.data) {
      const docId = String(docData[item.idKey] || docData.id || docData.catalogId || docData.topicId || docData.companyId || docData.fieldId);
      const docRef = doc(colRef, docId);
      await setDoc(docRef, docData);
      written++;
    }
    console.log(`  ✅ Successfully wrote ${written}/${item.data.length} documents into "${item.name}".`);
  }

  console.log('\n============================================================');
  console.log('  ALL SEEDING COMPLETED. RE-VERIFYING DOCUMENT COUNTS:');
  console.log('============================================================\n');
  await checkCounts();
}

async function main() {
  const isSeedMode = process.argv.includes('--seed');
  if (isSeedMode) {
    await seedAll();
  } else {
    await checkCounts();
    console.log('\nTo seed missing data into this Firebase project, run:');
    console.log('node scratch/check_and_seed_firestore.mjs --seed');
  }
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
