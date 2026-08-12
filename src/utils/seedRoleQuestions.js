import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const INITIAL_ROLE_QUESTIONS = [
  // ==========================================
  // QA / SOFTWARE TESTING (10 QUESTIONS)
  // ==========================================
  {
    id: 'role-qa-1',
    fieldId: 'qa-testing',
    title: 'Design Test Cases for E-Commerce Payment Gateway',
    category: 'Test Case Design',
    difficulty: 'Medium',
    question: 'Write comprehensive positive, negative, and boundary test cases for a checkout payment processing flow accepting Credit Card, UPI, and NetBanking.',
    starterCode: `// QA Test Suite Outline for Payment Gateway
describe('Payment Gateway Test Suite', () => {
  it('Positive: Process valid Credit Card transaction', () => {
    // Write test steps & assertions
  });

  it('Negative: Reject expired Credit Card with correct error banner', () => {
    // Write test steps & assertions
  });

  it('Boundary: Verify behavior when payment API times out (>30s)', () => {
    // Write test steps & assertions
  });
});`,
    sampleSolution: `// Sample Comprehensive Test Cases:
// 1. Positive: Valid card payment updates order status to 'SUCCESS' and triggers receipt email.
// 2. Negative: Invalid CVV returns 400 Bad Request with "Security code mismatch" error.
// 3. Boundary: Card expiry date on exact current month/year processes successfully until last day 23:59:59.
// 4. Edge: Concurrent payment attempts with same session ID are idempotent (prevent double charge).`,
    expectedTimeMinutes: 15
  },
  {
    id: 'role-qa-2',
    fieldId: 'qa-testing',
    title: 'Bug Report Writing & Severity vs Priority Analysis',
    category: 'Defect Lifecycle',
    difficulty: 'Easy',
    question: 'Identify the Bug Severity and Priority for the following scenario: "Clicking the Privacy Policy link on the landing page footer crashes the entire web application with a 500 Internal Server Error."',
    starterCode: `// Bug Report Template
{
  "bugTitle": "",
  "severity": "Blocker | Critical | Major | Minor",
  "priority": "P0 | P1 | P2 | P3",
  "stepsToReproduce": [],
  "expectedBehavior": "",
  "actualBehavior": ""
}`,
    sampleSolution: `Severity: Critical / Blocker (Crash / 500 Error affecting whole app).
Priority: P0 / P1 (Requires immediate hotfix before production release).`,
    expectedTimeMinutes: 10
  },

  // ==========================================
  // DATA SCIENCE / ANALYTICS (10 QUESTIONS)
  // ==========================================
  {
    id: 'role-ds-1',
    fieldId: 'data-science',
    title: 'SQL Query: Calculate Monthly Active User Retention Rate',
    category: 'SQL & Analytics',
    difficulty: 'Medium',
    question: 'Given a `user_events` table (user_id, event_timestamp, event_type), write a SQL query to find the 30-day retention rate of users who signed up in January 2026.',
    starterCode: `-- SQL Query for 30-Day User Retention
WITH jan_signups AS (
    SELECT user_id, MIN(event_timestamp) AS signup_date
    FROM user_events
    WHERE event_type = 'signup'
      AND event_timestamp >= '2026-01-01' AND event_timestamp < '2026-02-01'
    GROUP BY user_id
)
SELECT 
    COUNT(DISTINCT j.user_id) AS total_jan_users,
    -- Add count of users active 30 days after signup
    -- Calculate retention ratio
FROM jan_signups j
-- JOIN user_events for subsequent activity
;`,
    sampleSolution: `WITH jan_signups AS (
    SELECT user_id, MIN(event_timestamp) AS signup_date
    FROM user_events
    WHERE event_type = 'signup'
      AND event_timestamp >= '2026-01-01' AND event_timestamp < '2026-02-01'
    GROUP BY user_id
),
returned_users AS (
    SELECT DISTINCT j.user_id
    FROM jan_signups j
    JOIN user_events e ON j.user_id = e.user_id
    WHERE e.event_timestamp >= j.signup_date + INTERVAL '30 days'
      AND e.event_timestamp < j.signup_date + INTERVAL '60 days'
)
SELECT 
    COUNT(j.user_id) AS total_signups,
    COUNT(r.user_id) AS retained_users,
    ROUND((COUNT(r.user_id)::DECIMAL / COUNT(j.user_id)) * 100, 2) AS retention_percentage
FROM jan_signups j
LEFT JOIN returned_users r ON j.user_id = r.user_id;`,
    expectedTimeMinutes: 15
  },
  {
    id: 'role-ds-2',
    fieldId: 'data-science',
    title: 'Handling Class Imbalance & Feature Engineering',
    category: 'Machine Learning Data Prep',
    difficulty: 'Medium',
    question: 'You are training a Fraud Detection model where only 0.5% of transactions are fraudulent. How would you handle class imbalance and evaluate model performance beyond Accuracy?',
    starterCode: `# Python / Scikit-Learn Data Prep Outline
import pandas as pd
from sklearn.metrics import classification_report, roc_auc_score

def evaluate_fraud_model(y_true, y_pred, y_prob):
    # 1. Why is Accuracy misleading here?
    # 2. What techniques would you use (SMOTE, Class Weighting, Undersampling)?
    # 3. Which metrics matter (Precision-Recall AUC, F1-Score)?
    pass`,
    sampleSolution: `1. Accuracy is misleading because a naive model predicting all 'legitimate' achieves 99.5% accuracy but detects 0% fraud.
2. Techniques: Synthetic Minority Over-sampling (SMOTE), scale_pos_weight in XGBoost, or focal loss.
3. Key metrics: Precision-Recall AUC (PR-AUC), Recall at fixed Precision (e.g. 90% precision), and F1-Score on the fraud class.`,
    expectedTimeMinutes: 12
  },

  // ==========================================
  // DEVOPS / CLOUD ENGINEERING (10 QUESTIONS)
  // ==========================================
  {
    id: 'role-devops-1',
    fieldId: 'devops-cloud',
    title: 'Kubernetes Pod CrashLoopBackOff Troubleshooting',
    category: 'Troubleshooting & Containerization',
    difficulty: 'Medium',
    question: 'A critical microservice deployment in Kubernetes is stuck in `CrashLoopBackOff`. Outline the exact kubectl commands and diagnostic steps to isolate the root cause.',
    starterCode: `# Kubernetes Troubleshooting Runbook
# Step 1: Inspect pod status & restart count
kubectl get pods -n production

# Step 2: Describe pod events
# kubectl describe pod <pod-name> -n production

# Step 3: Fetch application logs (including previous crashed container logs)
# kubectl logs <pod-name> -p -n production

# Explain 3 common root causes for CrashLoopBackOff:
# Cause 1: 
# Cause 2: 
# Cause 3: `,
    sampleSolution: `Common Causes:
1. Missing environment variables / secret keys.
2. Failed liveness/readiness probe due to slow application startup.
3. Out Of Memory (OOMKilled) due to insufficient container memory limits.
Diagnostic Commands:
kubectl describe pod <name> (check Last State: Terminated & Exit Code)
kubectl logs <name> --previous (check stacktrace before crash)`,
    expectedTimeMinutes: 10
  },

  // ==========================================
  // UI/UX & PRODUCT DESIGN (10 QUESTIONS)
  // ==========================================
  {
    id: 'role-uiux-1',
    fieldId: 'ui-ux',
    title: 'Mobile Onboarding Redesign for Higher Completion Rate',
    category: 'UX Architecture & Wireframing',
    difficulty: 'Easy',
    question: 'A mobile banking app has a 45% drop-off rate during user registration. Propose a UX redesign framework to streamline the 6-step onboarding process.',
    starterCode: `/* UX Redesign Proposal
1. Information Architecture (Progressive Disclosure vs Upfront Input):
2. Visual Hierarchy & Micro-interactions:
3. Accessibility & Error Prevention:
4. Key Conversion Metrics to Track:
*/`,
    sampleSolution: `1. Implement Progressive Disclosure: Split long forms into 3 bite-sized steps with a visual progress bar.
2. Use Social Auth & Auto-fill: Enable OTP auto-read and biometric login.
3. Micro-interactions: Inline validation on input focus out to eliminate submission errors.
4. Metric: Measure Completion Time, Step-by-Step Funnel Conversion Rate.`,
    expectedTimeMinutes: 15
  },

  // ==========================================
  // PRODUCT MANAGEMENT (10 QUESTIONS)
  // ==========================================
  {
    id: 'role-pm-1',
    fieldId: 'pm',
    title: 'Prioritize Roadmap Features Using RICE Framework',
    category: 'Product Strategy & Prioritization',
    difficulty: 'Medium',
    question: 'You have 3 feature proposals: A) Dark Mode, B) One-click Checkout, C) AI Recommendation Engine. Use the RICE framework (Reach, Impact, Confidence, Effort) to determine the rollout priority.',
    starterCode: `// RICE Prioritization Score = (Reach * Impact * Confidence) / Effort

Feature A (Dark Mode):
- Reach: 100k users/mo | Impact: 1 (Low) | Confidence: 90% | Effort: 2 person-months

Feature B (One-click Checkout):
- Reach: 60k users/mo | Impact: 3 (High conversion lift) | Confidence: 80% | Effort: 3 person-months

Feature C (AI Recommendation Engine):
- Reach: 80k users/mo | Impact: 2 (Medium) | Confidence: 50% | Effort: 6 person-months

Calculate RICE Scores & state recommendation:`,
    sampleSolution: `Feature A RICE = (100,000 * 1 * 0.90) / 2 = 45,000
Feature B RICE = (60,000 * 3 * 0.80) / 3 = 48,000  <-- HIGHEST PRIORITY
Feature C RICE = (80,000 * 2 * 0.50) / 6 = 13,333

Recommendation: Roll out Feature B (One-click Checkout) first due to high conversion impact and high confidence relative to effort.`,
    expectedTimeMinutes: 15
  },

  // ==========================================
  // BUSINESS ANALYST (10 QUESTIONS)
  // ==========================================
  {
    id: 'role-ba-1',
    fieldId: 'business-analyst',
    title: 'Gather Business Requirements (BRD) for Supply Chain Automation',
    category: 'Requirements Gathering & Process Mapping',
    difficulty: 'Easy',
    question: 'A retail client wants to automate warehouse stock reordering when inventory drops below safety stock levels. Outline the Functional Requirements (FR) and Non-Functional Requirements (NFR).',
    starterCode: `/* Business Requirements Document (BRD) Outline
Functional Requirements (FR):
1. 
2. 

Non-Functional Requirements (NFR):
1. 
2. 
*/`,
    sampleSolution: `FR1: System must send automatic REST API purchase order to supplier when SKU stock <= Reorder Level.
FR2: Warehouse manager must receive real-time SMS/email alerts for purchase order status changes.
NFR1: Inventory count sync latency between POS and warehouse database must be < 2 seconds.
NFR2: High availability (99.9% uptime) during festive peak sales events.`,
    expectedTimeMinutes: 12
  }
];

export async function seedRoleQuestionsInFirestore() {
  try {
    const colRef = collection(db, 'roleQuestions');
    for (const q of INITIAL_ROLE_QUESTIONS) {
      const docRef = doc(colRef, q.id);
      await setDoc(docRef, q);
    }
    console.log('Successfully seeded role questions in Firestore!');
    return { success: true, count: INITIAL_ROLE_QUESTIONS.length };
  } catch (error) {
    console.error('Error seeding role questions in Firestore:', error);
    return { success: false, error: error.message };
  }
}
