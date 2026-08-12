import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const INITIAL_HR_QUESTIONS = [
  // ==========================================
  // CATEGORY 1: TELL ME ABOUT YOURSELF
  // ==========================================
  {
    id: 'hr-tell-me-about-yourself',
    category: 'Tell Me About Yourself',
    focusArea: 'Background & Elevator Pitch',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Meta', 'TCS', 'Infosys', 'Accenture', 'Flipkart'],
    question: 'Please introduce yourself. Walk me through your academic and technical background, key project highlights, and what brings you here today.'
  },

  // ==========================================
  // CATEGORY 2: WHY THIS COMPANY / WHY THIS ROLE
  // ==========================================
  {
    id: 'hr-why-this-company-role',
    category: 'Why This Company / Role',
    focusArea: 'Motivation & Role Alignment',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 'Flipkart', 'Swiggy', 'Uber'],
    question: 'Why do you specifically want to work at our company in this target role, and what unique value will you bring to our team?'
  },

  // ==========================================
  // CATEGORY 3: STRENGTHS & WEAKNESSES
  // ==========================================
  {
    id: 'hr-strengths-and-weaknesses',
    category: 'Strengths & Weaknesses',
    focusArea: 'Self-Awareness & Growth Mindset',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Adobe', 'TCS', 'Infosys'],
    question: 'What do you consider your greatest professional strength, and what is one real area of weakness or growth you are actively working to improve?'
  },

  // ==========================================
  // CATEGORY 4: CONFLICT & TEAMWORK (STAR METHOD)
  // ==========================================
  {
    id: 'hr-star-team-conflict',
    category: 'Conflict & Teamwork (STAR)',
    focusArea: 'Interpersonal Conflict & Resolution',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Swiggy'],
    question: 'Tell me about a time when you had a disagreement with a teammate or project lead on an implementation choice. Walk me through the Situation, Task, your specific Action, and the final Result (STAR format).'
  },
  {
    id: 'hr-star-handling-failure',
    category: 'Conflict & Teamwork (STAR)',
    focusArea: 'Resilience & Learning from Failure',
    targetCompanies: ['Amazon', 'Microsoft', 'Meta', 'Netflix', 'Uber'],
    question: 'Tell me about a time when a project or deliverable failed to meet expectations or deadlines. How did you handle the situation and what was the outcome?'
  },

  // ==========================================
  // CATEGORY 5: SALARY, RELOCATION & NOTICE PERIOD
  // ==========================================
  {
    id: 'hr-salary-relocation-notice',
    category: 'Logistics & Expectations',
    focusArea: 'Relocation & Availability',
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'IBM', 'Capgemini'],
    question: 'Regarding logistics: What are your salary expectations, notice period or availability to join, and are you open to relocation or hybrid work setups?'
  },

  // ==========================================
  // CATEGORY 6: CAREER GOALS (5-YEAR PLAN)
  // ==========================================
  {
    id: 'hr-career-goals-5year-plan',
    category: 'Career Goals (5-Year Plan)',
    focusArea: 'Long-Term Growth Roadmap',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'Accenture', 'Flipkart'],
    question: 'Where do you see yourself professionally in 3 to 5 years, and how does this role fit into your long-term career plan?'
  }
];

export async function seedHrQuestionsInFirestore() {
  try {
    const colRef = collection(db, 'hrQuestions');
    for (const q of INITIAL_HR_QUESTIONS) {
      const docRef = doc(colRef, q.id);
      await setDoc(docRef, q);
    }
    console.log('Successfully seeded HR questions in Firestore!');
    return { success: true, count: INITIAL_HR_QUESTIONS.length };
  } catch (error) {
    console.error('Error seeding HR questions in Firestore:', error);
    return { success: false, error: error.message };
  }
}
