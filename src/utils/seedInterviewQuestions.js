import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const INITIAL_INTERVIEW_QUESTIONS = [
  // ==========================================
  // FRESHER-FOCUSED QUESTIONS (FUNDAMENTALS & ACADEMIC)
  // ==========================================
  {
    id: 'fresher-oop-fundamentals',
    category: 'Technical Fundamentals',
    focusArea: 'OOP & Core CS Concepts',
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'IBM', 'Capgemini', 'Google', 'Amazon', 'Microsoft'],
    experienceLevelTag: 'Fresher',
    question: 'Explain the four core principles of Object-Oriented Programming (Abstraction, Encapsulation, Inheritance, Polymorphism) and give a practical code example of how you used them in an academic or personal project.'
  },
  {
    id: 'fresher-dbms-indexing',
    category: 'Technical Fundamentals',
    focusArea: 'DBMS & Relational Data',
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'Flipkart', 'Swiggy', 'Adobe'],
    experienceLevelTag: 'Fresher',
    question: 'How do database indexes speed up query performance in SQL? Explain the difference between Clustered and Non-Clustered indexing.'
  },
  {
    id: 'fresher-os-memory-management',
    category: 'Technical Fundamentals',
    focusArea: 'Operating Systems & Threading',
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'IBM', 'Microsoft', 'Google'],
    experienceLevelTag: 'Fresher',
    question: 'Explain the difference between process and thread in Operating Systems, and walk me through how Virtual Memory prevents one application from crashing the entire system.'
  },
  {
    id: 'fresher-academic-project-challenge',
    category: 'Behavioral & Projects',
    focusArea: 'Project Execution & Debugging',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Meta', 'TCS', 'Infosys', 'Accenture'],
    experienceLevelTag: 'Fresher',
    question: 'Walk me through your main college project or internship work. What was the toughest technical bug or implementation hurdle you encountered, and how did you resolve it?'
  },

  // ==========================================
  // EXPERIENCED-FOCUSED QUESTIONS (SYSTEMS AT SCALE & LEADERSHIP)
  // ==========================================
  {
    id: 'experienced-scale-high-concurrency',
    category: 'Architecture at Scale',
    focusArea: 'Scalability & Concurrency',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Uber', 'Netflix', 'Flipkart', 'Swiggy'],
    experienceLevelTag: 'Experienced',
    question: 'Tell me about a high-concurrency system or service you worked on that experienced sudden traffic spikes. How did you handle connection pooling, caching strategies, and database read-replicas under scale?'
  },
  {
    id: 'experienced-production-outage',
    category: 'Production Reliability',
    focusArea: 'Incident Response & Post-Mortem',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Uber', 'Microsoft', 'Goldman Sachs'],
    experienceLevelTag: 'Experienced',
    question: 'Describe a severe production outage or data inconsistency incident that occurred in a system you owned. Walk me through your immediate mitigation steps and long-term architectural post-mortem.'
  },
  {
    id: 'experienced-microservices-tradeoffs',
    category: 'System Architecture',
    focusArea: 'Microservices & Distributed Systems',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Netflix', 'Uber', 'Swiggy', 'Adobe'],
    experienceLevelTag: 'Experienced',
    question: 'How did you handle distributed data consistency and saga patterns when decomposing monolithic services into microservices in your previous organization?'
  },
  {
    id: 'experienced-technical-debt-leadership',
    category: 'Engineering Leadership',
    focusArea: 'Technical Debt & Prioritization',
    targetCompanies: ['Amazon', 'Microsoft', 'Meta', 'Netflix', 'Apple'],
    experienceLevelTag: 'Experienced',
    question: 'How do you balance shipping customer features rapidly against refactoring critical technical debt? Give an example of how you convinced business stakeholders to dedicate sprint cycles to architecture health.'
  },

  // ==========================================
  // GENERAL & COMPANY-SPECIFIC QUESTIONS (BOTH)
  // ==========================================
  {
    id: 'amazon-leadership-1',
    category: 'Behavioral & Leadership',
    focusArea: 'Customer Obsession',
    targetCompanies: ['Amazon', 'Swiggy', 'Flipkart'],
    experienceLevelTag: 'Both',
    question: 'Tell me about a time when you had to advocate for a customer requirement that conflicted with internal engineering deadlines or resources.'
  },
  {
    id: 'amazon-leadership-2',
    category: 'Behavioral & Leadership',
    focusArea: 'Ownership',
    targetCompanies: ['Amazon', 'Meta', 'Swiggy', 'Uber'],
    experienceLevelTag: 'Both',
    question: 'Describe a situation where a critical issue arose outside your direct area of responsibility. How did you step in to own and resolve it?'
  },
  {
    id: 'googleyness-ambiguity',
    category: 'Googleyness & Culture',
    focusArea: 'Navigating Ambiguity',
    targetCompanies: ['Google', 'Microsoft', 'Apple'],
    experienceLevelTag: 'Both',
    question: 'Tell me about a project where the core technical requirements were extremely ambiguous or rapidly shifting. How did you structure your decision-making framework?'
  },
  {
    id: 'meta-move-fast',
    category: 'Behavioral & Impact',
    focusArea: 'Move Fast',
    targetCompanies: ['Meta', 'Uber', 'Swiggy', 'Flipkart'],
    experienceLevelTag: 'Both',
    question: 'Describe a time when you had to make a high-stakes technical tradeoff to ship a feature rapidly. How did you balance speed against technical debt?'
  },
  {
    id: 'microsoft-growth-mindset',
    category: 'Growth Mindset',
    focusArea: 'Growth Mindset',
    targetCompanies: ['Microsoft', 'Adobe', 'IBM'],
    experienceLevelTag: 'Both',
    question: 'Give an example of a technical failure or architectural mistake you made in a previous codebase. What did you learn and how did you change your design practices?'
  },
  {
    id: 'netflix-freedom-responsibility',
    category: 'Culture & Context',
    focusArea: 'Freedom & Responsibility',
    targetCompanies: ['Netflix', 'Meta', 'Apple'],
    experienceLevelTag: 'Both',
    question: 'Netflix values high autonomy and direct feedback over micromanagement. Tell me about a time you gave difficult, candid feedback to a peer or senior teammate.'
  },
  {
    id: 'goldman-quantitative-reasoning',
    category: 'Quantitative & Analytical',
    focusArea: 'Quantitative Reasoning',
    targetCompanies: ['Goldman Sachs', 'JP Morgan', 'Uber'],
    experienceLevelTag: 'Experienced',
    question: 'If you have a streaming dataset of 1 billion financial transactions coming in per second, how would you calculate the rolling 99th percentile latency with minimal memory overhead?'
  },
  {
    id: 'consulting-client-communication',
    category: 'Client Advisory',
    focusArea: 'Client Communication',
    targetCompanies: ['Accenture', 'Deloitte', 'Cognizant', 'Capgemini'],
    experienceLevelTag: 'Both',
    question: 'How do you explain a complex cloud migration architecture or database refactoring decision to non-technical business stakeholders?'
  },
  {
    id: 'system-design-lite',
    category: 'Architecture Lite',
    focusArea: 'System Design Lite',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Flipkart', 'Uber', 'Adobe'],
    experienceLevelTag: 'Both',
    question: 'Walk me through how you would design a rate limiter service to protect an e-commerce API from flash sale traffic spikes.'
  },

  // ==========================================
  // TRACK-SPECIFIC QUESTIONS (QA, DATA SCIENCE, DEVOPS, UI/UX, PM, SECURITY)
  // ==========================================
  {
    id: 'qa-interview-automation-strategy',
    fieldId: 'qa-testing',
    targetField: 'Software Testing / QA',
    category: 'Test Automation',
    focusArea: 'Automation Framework Design',
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Amazon', 'Microsoft', 'Accenture'],
    experienceLevelTag: 'Both',
    question: 'Walk me through how you structure a automated regression test suite using Cypress or Selenium. How do you handle flaky tests, dynamic DOM locators, and CI/CD test execution?'
  },
  {
    id: 'qa-interview-boundary-testing',
    fieldId: 'qa-testing',
    targetField: 'Software Testing / QA',
    category: 'Quality Engineering',
    focusArea: 'Defect Analysis & Boundary Testing',
    targetCompanies: ['TCS', 'Cognizant', 'Capgemini', 'IBM'],
    experienceLevelTag: 'Fresher',
    question: 'Explain Equivalence Partitioning and Boundary Value Analysis with a real-world form validation example. What negative edge cases would you test for a mobile payment checkout?'
  },
  {
    id: 'ds-interview-ml-overfitting',
    fieldId: 'data-science',
    targetField: 'Data Science & Analytics',
    category: 'Machine Learning',
    focusArea: 'Model Evaluation & Regularization',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Flipkart', 'Swiggy'],
    experienceLevelTag: 'Both',
    question: 'How do you detect and prevent overfitting when training a supervised machine learning model? Explain the trade-offs between L1 (Lasso) and L2 (Ridge) regularization.'
  },
  {
    id: 'ds-interview-sql-ab-testing',
    fieldId: 'data-science',
    targetField: 'Data Science & Analytics',
    category: 'Experimentation & SQL',
    focusArea: 'A/B Testing & Statistical Inference',
    targetCompanies: ['Uber', 'Netflix', 'Amazon', 'Goldman Sachs'],
    experienceLevelTag: 'Both',
    question: 'Walk me through how you design an A/B test for a new feature. How do you determine sample size, p-value significance thresholds, and guard against novel bias?'
  },
  {
    id: 'devops-interview-ci-cd-k8s',
    fieldId: 'devops',
    targetField: 'DevOps & Cloud Engineering',
    category: 'Infrastructure & CI/CD',
    focusArea: 'Kubernetes & Pipeline Automation',
    targetCompanies: ['Amazon', 'Microsoft', 'Google', 'IBM'],
    experienceLevelTag: 'Both',
    question: 'How do you architect a zero-downtime Blue-Green deployment pipeline using Kubernetes and Docker? How do you rollback automated releases upon elevated 5xx error rates?'
  },
  {
    id: 'uiux-interview-design-system',
    fieldId: 'uiux-design',
    targetField: 'UI/UX Design & Frontend',
    category: 'User Experience',
    focusArea: 'Design Systems & Usability',
    targetCompanies: ['Google', 'Adobe', 'Microsoft', 'Meta'],
    experienceLevelTag: 'Both',
    question: 'Walk me through your process for building a scalable design system in Figma. How do you ensure WCAG accessibility standards and smooth handoff to engineering teams?'
  },
  {
    id: 'pm-interview-prioritization',
    fieldId: 'product-management',
    targetField: 'Product Management',
    category: 'Product Strategy',
    focusArea: 'Feature Prioritization & Metrics',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Uber', 'Swiggy'],
    experienceLevelTag: 'Both',
    question: 'If you are the Product Manager for a major mobile app and engagement drops by 15% overnight, walk me through your step-by-step diagnostic framework.'
  },
  {
    id: 'sec-interview-owasp-jwt',
    fieldId: 'cybersecurity',
    targetField: 'Cybersecurity & InfoSec',
    category: 'Security Architecture',
    focusArea: 'OWASP Top 10 & API Security',
    targetCompanies: ['Goldman Sachs', 'Microsoft', 'Amazon', 'Google'],
    experienceLevelTag: 'Both',
    question: 'Explain how Cross-Site Scripting (XSS) and SQL Injection attacks work. What architectural defenses do you implement to secure OAuth2 JWT tokens in web applications?'
  }
];

export async function seedInterviewQuestionsInFirestore() {
  try {
    const colRef = collection(db, 'interviewQuestions');
    for (const q of INITIAL_INTERVIEW_QUESTIONS) {
      const docRef = doc(colRef, q.id);
      await setDoc(docRef, q);
    }
    console.log('Successfully seeded interview questions in Firestore!');
    return { success: true, count: INITIAL_INTERVIEW_QUESTIONS.length };
  } catch (error) {
    console.error('Error seeding interview questions in Firestore:', error);
    return { success: false, error: error.message };
  }
}
