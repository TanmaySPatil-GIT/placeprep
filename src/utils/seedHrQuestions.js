import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const INITIAL_HR_QUESTIONS = [
  // ==========================================
  // CATEGORY 1: TELL ME ABOUT YOURSELF & BACKGROUND
  // ==========================================
  {
    id: 'hr-tell-me-about-yourself',
    category: 'Background & Elevator Pitch',
    focusArea: 'Background & Core Highlights',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Meta', 'TCS', 'Infosys', 'Accenture', 'Flipkart'],
    question: 'Please introduce yourself. Walk me through your academic and technical background, key project highlights, and what brings you here today.'
  },
  {
    id: 'hr-background-journey',
    category: 'Background & Elevator Pitch',
    focusArea: 'Career Journey & Decision Making',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Uber', 'Swiggy'],
    question: 'Looking back at your technical journey so far, what pivotal project or experience defined your passion for technology and engineering?'
  },
  {
    id: 'hr-background-recent-learning',
    category: 'Background & Elevator Pitch',
    focusArea: 'Continuous Learning & Curiosity',
    targetCompanies: ['Google', 'Meta', 'Netflix', 'Microsoft', 'Adobe'],
    question: 'What is a new technology, framework, or skill you independently learned in the past 6 months, and how did you apply it?'
  },

  // ==========================================
  // CATEGORY 2: WHY THIS COMPANY & ROLE ALIGNMENT
  // ==========================================
  {
    id: 'hr-why-this-company-role',
    category: 'Motivation & Company Alignment',
    focusArea: 'Motivation & Role Alignment',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Meta', 'Netflix', 'Flipkart', 'Swiggy', 'Uber'],
    question: 'Why do you specifically want to work at our company in this target role, and what unique value will you bring to our team?'
  },
  {
    id: 'hr-company-culture-fit',
    category: 'Motivation & Company Alignment',
    focusArea: 'Company Values & Vision',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys'],
    question: 'Which of our core engineering values or public products resonates most with you, and why do you think you would thrive in our work culture?'
  },
  {
    id: 'hr-role-expectations',
    category: 'Motivation & Company Alignment',
    focusArea: 'Role Clarity & Expectations',
    targetCompanies: ['Amazon', 'Microsoft', 'Meta', 'Flipkart'],
    question: 'What specific responsibilities do you expect in your first 90 days in this role, and how will you measure your own success?'
  },

  // ==========================================
  // CATEGORY 3: STRENGTHS & WEAKNESSES
  // ==========================================
  {
    id: 'hr-strengths-and-weaknesses',
    category: 'Self-Awareness & Growth',
    focusArea: 'Self-Awareness & Growth Mindset',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Adobe', 'TCS', 'Infosys'],
    question: 'What do you consider your greatest professional strength, and what is one real area of weakness or growth you are actively working to improve?'
  },
  {
    id: 'hr-overcoming-limitation',
    category: 'Self-Awareness & Growth',
    focusArea: 'Skill Gap Overcoming',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Uber'],
    question: 'Describe a situation where you lacked technical expertise or context needed for a task. How did you overcome that knowledge gap?'
  },
  {
    id: 'hr-superpower-and-blindspot',
    category: 'Self-Awareness & Growth',
    focusArea: 'Personal Reflection & Feedback',
    targetCompanies: ['Microsoft', 'Netflix', 'Swiggy', 'Flipkart'],
    question: 'If I were to ask your previous teammates or project collaborators, what would they say is your biggest technical asset and your primary area for improvement?'
  },

  // ==========================================
  // CATEGORY 4: CONFLICT RESOLUTION & COLLABORATION
  // ==========================================
  {
    id: 'hr-star-team-conflict',
    category: 'Conflict & Teamwork (STAR)',
    focusArea: 'Interpersonal Conflict & Resolution',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Microsoft', 'Apple', 'Swiggy'],
    question: 'Tell me about a time when you had a disagreement with a teammate or project lead on an implementation choice. Walk me through the Situation, Task, your specific Action, and the final Result (STAR format).'
  },
  {
    id: 'hr-handling-difficult-teammate',
    category: 'Conflict & Teamwork (STAR)',
    focusArea: 'Team Synergy & Empathy',
    targetCompanies: ['Amazon', 'Google', 'Microsoft', 'TCS', 'Accenture'],
    question: 'Have you ever worked with a teammate who was underperforming or difficult to communicate with? How did you handle that relationship to keep the project on track?'
  },
  {
    id: 'hr-cross-functional-collaboration',
    category: 'Conflict & Teamwork (STAR)',
    focusArea: 'Stakeholder & Cross-Functional Alignment',
    targetCompanies: ['Google', 'Amazon', 'Flipkart', 'Uber'],
    question: 'Describe a time when you had to work closely with non-technical stakeholders (such as designers or product managers) to deliver a feature. How did you ensure smooth collaboration?'
  },

  // ==========================================
  // CATEGORY 5: FAILURE, RESILIENCE & LEARNING
  // ==========================================
  {
    id: 'hr-star-handling-failure',
    category: 'Resilience & Failure (STAR)',
    focusArea: 'Resilience & Learning from Failure',
    targetCompanies: ['Amazon', 'Microsoft', 'Meta', 'Netflix', 'Uber'],
    question: 'Tell me about a time when a project or deliverable failed to meet expectations or deadlines. How did you handle the situation and what was the outcome?'
  },
  {
    id: 'hr-mistake-in-production',
    category: 'Resilience & Failure (STAR)',
    focusArea: 'Accountability & Post-Mortem',
    targetCompanies: ['Google', 'Amazon', 'Netflix', 'Swiggy'],
    question: 'Have you ever made a critical mistake in code or design that caused an issue? How did you take ownership and prevent it from happening again?'
  },
  {
    id: 'hr-handling-rejection-or-criticism',
    category: 'Resilience & Failure (STAR)',
    focusArea: 'Constructive Criticism Acceptance',
    targetCompanies: ['Microsoft', 'Meta', 'Adobe', 'TCS'],
    question: 'Describe a time when your proposal or pull request was heavily criticized or rejected. How did you process the feedback and adjust your approach?'
  },

  // ==========================================
  // CATEGORY 6: LEADERSHIP & OWNERSHIP
  // ==========================================
  {
    id: 'hr-taking-ownership',
    category: 'Leadership & Initiative',
    focusArea: 'Ownership & Proactivity',
    targetCompanies: ['Amazon', 'Google', 'Microsoft', 'Uber', 'Flipkart'],
    question: 'Tell me about a time when you took initiative beyond your defined scope or role to fix a broken process or improve a shared codebase.'
  },
  {
    id: 'hr-mentoring-or-guiding',
    category: 'Leadership & Initiative',
    focusArea: 'Mentorship & Knowledge Sharing',
    targetCompanies: ['Google', 'Microsoft', 'Infosys', 'TCS'],
    question: 'Describe a situation where you helped a junior student or peer overcome a technical roadblock or onboard onto a complex project.'
  },
  {
    id: 'hr-decision-making-unpopular',
    category: 'Leadership & Initiative',
    focusArea: 'Decisiveness & Conviction',
    targetCompanies: ['Amazon', 'Netflix', 'Meta'],
    question: 'Share an instance where you had to make a tough or unpopular decision for the long-term health of a project. How did you justify it to your team?'
  },

  // ==========================================
  // CATEGORY 7: ADAPTABILITY & CAREER GOALS
  // ==========================================
  {
    id: 'hr-career-goals-5year-plan',
    category: 'Adaptability & Long-Term Goals',
    focusArea: 'Long-Term Growth Roadmap',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys', 'Accenture', 'Flipkart'],
    question: 'Where do you see yourself professionally in 3 to 5 years, and how does this role fit into your long-term career plan?'
  },
  {
    id: 'hr-adapting-to-change',
    category: 'Adaptability & Long-Term Goals',
    focusArea: 'Flexibility & Pivot Capability',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Swiggy'],
    question: 'Tell me about a time when project requirements changed drastically midway through development. How did you adapt your plan and priorities?'
  },
  {
    id: 'hr-ambition-and-drive',
    category: 'Adaptability & Long-Term Goals',
    focusArea: 'Ambition & Drive',
    targetCompanies: ['Google', 'Uber', 'Flipkart', 'Netflix'],
    question: 'What is the most ambitious personal or technical goal you have set for yourself so far, and how are you tracking toward achieving it?'
  },

  // ==========================================
  // CATEGORY 8: PRESSURE, TIME MANAGEMENT & PRIORITIES
  // ==========================================
  {
    id: 'hr-managing-tight-deadlines',
    category: 'Pressure & Time Management',
    focusArea: 'Prioritization & Stress Management',
    targetCompanies: ['Amazon', 'Microsoft', 'Flipkart', 'Uber', 'Swiggy'],
    question: 'Describe a time when you were facing multiple tight deadlines simultaneously. How did you prioritize your workload and manage stress?'
  },
  {
    id: 'hr-working-under-ambiguity',
    category: 'Pressure & Time Management',
    focusArea: 'Ambiguity Handling',
    targetCompanies: ['Google', 'Amazon', 'Meta', 'Netflix'],
    question: 'Tell me about a project where the problem statement was vague or poorly specified. How did you gather clarity and execute under ambiguity?'
  },
  {
    id: 'hr-tradeoffs-quality-vs-speed',
    category: 'Pressure & Time Management',
    focusArea: 'Pragmatism & Engineering Trade-offs',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'Swiggy'],
    question: 'How do you strike the balance between writing perfect, fully clean code and delivering features fast when deadlines are pressing?'
  },

  // ==========================================
  // CATEGORY 9: LOGISTICS & WORKPLACE CULTURE
  // ==========================================
  {
    id: 'hr-salary-relocation-notice',
    category: 'Logistics & Expectations',
    focusArea: 'Relocation & Availability',
    targetCompanies: ['TCS', 'Infosys', 'Wipro', 'Accenture', 'Cognizant', 'IBM', 'Capgemini'],
    question: 'Regarding logistics: What are your salary expectations, notice period or availability to join, and are you open to relocation or hybrid work setups?'
  },
  {
    id: 'hr-work-environment-preference',
    category: 'Logistics & Expectations',
    focusArea: 'Work Style & Team Preference',
    targetCompanies: ['Google', 'Microsoft', 'Adobe', 'TCS'],
    question: 'In what type of team environment do you perform best—highly structured with clear hierarchy, or fast-paced and autonomous?'
  },
  {
    id: 'hr-integrity-and-ethics',
    category: 'Logistics & Expectations',
    focusArea: 'Integrity & Ethics',
    targetCompanies: ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys'],
    question: 'Have you ever noticed a shortcut or ethical compromise being taken in a project? How did you handle the situation?'
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
