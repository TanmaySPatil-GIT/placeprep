import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const INITIAL_FIELDS = [
  {
    fieldId: 'sde',
    name: 'Software Development (SDE)',
    icon: 'Code2',
    description: 'Full-stack, backend, or frontend engineering roles focusing on scalable software architecture.',
    isDsaHeavy: true,
    roundStructureNote: 'Coding-focused: DSA Algorithms + System Design + Behavioral',
    coreSkillTags: ['DSA', 'Arrays & Strings', 'System Design', 'OOP', 'SQL', 'Git']
  },
  {
    fieldId: 'qa-testing',
    name: 'QA / Software Testing',
    icon: 'CheckSquare',
    description: 'Manual & automation testing, test plan creation, bug lifecycle, and SDLC/STLC methodologies.',
    isDsaHeavy: false,
    roundStructureNote: 'Testing-focused: Automation & Test Scenarios + Basic SQL + Technical Screen',
    coreSkillTags: ['Selenium', 'TestNG', 'STLC', 'Bug Lifecycle', 'API Testing', 'Postman', 'SQL']
  },
  {
    fieldId: 'data-science',
    name: 'Data Science / Analytics',
    icon: 'BarChart3',
    description: 'Statistical modeling, SQL data extraction, Python pandas/numpy, and analytical case studies.',
    isDsaHeavy: false,
    roundStructureNote: 'Data-focused: SQL Queries + Data Analysis + Statistics + ML Fundamentals',
    coreSkillTags: ['Python', 'SQL', 'Pandas', 'Statistics', 'A/B Testing', 'Tableau', 'Data Modeling']
  },
  {
    fieldId: 'ml-ai',
    name: 'Machine Learning / AI Engineering',
    icon: 'Cpu',
    description: 'Model building, deep learning, PyTorch/TensorFlow, evaluation metrics, and AI system design.',
    isDsaHeavy: true,
    roundStructureNote: 'ML-focused: Applied ML Concepts + Data Prep Coding + ML System Design',
    coreSkillTags: ['PyTorch', 'TensorFlow', 'Scikit-Learn', 'LLMs', 'Model Optimization', 'NLP', 'Computer Vision']
  },
  {
    fieldId: 'devops-cloud',
    name: 'DevOps / Cloud Engineering',
    icon: 'Server',
    description: 'CI/CD pipelines, Docker/Kubernetes containerization, cloud infrastructure (AWS/Azure), and scripting.',
    isDsaHeavy: false,
    roundStructureNote: 'Ops-focused: Cloud Architecture + Bash/Python Scripting + Infrastructure Scenarios',
    coreSkillTags: ['Docker', 'Kubernetes', 'AWS', 'Terraform', 'CI/CD', 'Linux', 'Bash', 'Prometheus']
  },
  {
    fieldId: 'cybersecurity',
    name: 'Cybersecurity & InfoSec',
    icon: 'Shield',
    description: 'Network security, penetration testing, OWASP Top 10 vulnerabilities, cryptography, and incident response.',
    isDsaHeavy: false,
    roundStructureNote: 'Security-focused: Threat Modeling + Vulnerability Assessment + Security Protocols',
    coreSkillTags: ['OWASP', 'Penetration Testing', 'Network Security', 'Cryptography', 'SIEM', 'Ethical Hacking']
  },
  {
    fieldId: 'ui-ux',
    name: 'UI/UX & Product Design',
    icon: 'Layout',
    description: 'User research, wireframing, Figma prototyping, design systems, and usability evaluation.',
    isDsaHeavy: false,
    roundStructureNote: 'Design-focused: Portfolio Critique + App Redesign Challenge + Product Design Critique',
    coreSkillTags: ['Figma', 'Wireframing', 'User Research', 'Design Systems', 'Micro-interactions', 'Information Architecture']
  },
  {
    fieldId: 'pm',
    name: 'Product Management',
    icon: 'Target',
    description: 'Product vision, feature prioritization, metrics-driven decisions, user stories, and execution case studies.',
    isDsaHeavy: false,
    roundStructureNote: 'Strategy-focused: Product Design Case + Prioritization & Metrics + Behavioral Leadership',
    coreSkillTags: ['Product Strategy', 'Prioritization (RICE)', 'User Stories', 'Metrics & KPIs', 'Market Research', 'Agile']
  },
  {
    fieldId: 'mobile-dev',
    name: 'Mobile App Development',
    icon: 'Smartphone',
    description: 'Android (Kotlin/Java) & iOS (Swift/Flutter) development, mobile architecture, and state management.',
    isDsaHeavy: true,
    roundStructureNote: 'Mobile-focused: Mobile SDK Fundamentals + App Architecture + Light DSA',
    coreSkillTags: ['Kotlin', 'Swift', 'Flutter', 'React Native', 'Mobile UI', 'REST APIs', 'Offline Caching']
  },
  {
    fieldId: 'business-analyst',
    name: 'Business Analyst',
    icon: 'FileText',
    description: 'Requirement gathering, process mapping, SQL data analysis, financial/business modeling, and dashboards.',
    isDsaHeavy: false,
    roundStructureNote: 'Business-focused: Business Scenarios + SQL & Excel Data + Stakeholder Communication',
    coreSkillTags: ['SQL', 'Excel', 'Requirements Gathering', 'Process Mapping', 'PowerBI', 'BRD/FRD', 'Agile/Scrum']
  }
];

export async function seedFieldsInFirestore() {
  try {
    const colRef = collection(db, 'fields');
    for (const f of INITIAL_FIELDS) {
      const docRef = doc(colRef, f.fieldId);
      await setDoc(docRef, f);
    }
    console.log('Successfully seeded 10 fields in Firestore!');
    return { success: true, count: INITIAL_FIELDS.length };
  } catch (error) {
    console.error('Error seeding fields in Firestore:', error);
    return { success: false, error: error.message };
  }
}
