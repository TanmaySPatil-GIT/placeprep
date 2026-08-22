import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const INITIAL_COURSE_CATALOG = [
  // ==========================================
  // SOFTWARE DEVELOPMENT (SDE)
  // ==========================================
  {
    catalogId: 'cat-sde-1',
    title: 'freeCodeCamp Data Structures & Algorithms',
    provider: 'freeCodeCamp',
    type: 'free_resource',
    fieldIds: ['sde', 'ml-ai', 'mobile-dev'],
    skillTags: ['DSA', 'Arrays', 'Strings', 'Algorithms', 'JavaScript'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '300 hours',
    link: 'https://www.freecodecamp.org/learn/javascript-algorithms-and-data-structures-v8/',
    whyItHelps: 'Master foundational data structures and algorithm problem-solving with hands-on coding challenges.'
  },
  {
    catalogId: 'cat-sde-2',
    title: 'Google Tech Dev Guide: Foundational Programming',
    provider: 'Google',
    type: 'free_resource',
    fieldIds: ['sde'],
    skillTags: ['DSA', 'Trees', 'Graphs', 'System Design', 'Interview Prep'],
    level: 'Intermediate',
    cost: 'Free',
    estimatedDuration: '40 hours',
    link: 'https://techdevguide.withgoogle.com/',
    whyItHelps: 'Curated by Google engineers to build algorithmic efficiency and clean software engineering habits.'
  },
  {
    catalogId: 'cat-sde-3',
    title: 'AWS Certified Developer – Associate',
    provider: 'Amazon Web Services',
    type: 'certification',
    fieldIds: ['sde', 'devops-cloud'],
    skillTags: ['AWS', 'Cloud', 'Microservices', 'Serverless', 'CI/CD'],
    level: 'Intermediate',
    cost: 'Paid',
    estimatedDuration: '6 weeks',
    link: 'https://aws.amazon.com/certification/certified-developer-associate/',
    whyItHelps: 'Validates production cloud architecture and AWS SDK deployment skills for enterprise roles.'
  },
  {
    catalogId: 'cat-sde-4',
    title: 'System Design Primer (GitHub Repository)',
    provider: 'GitHub / Donne Martin',
    type: 'free_resource',
    fieldIds: ['sde', 'devops-cloud'],
    skillTags: ['System Design', 'Scalability', 'Caching', 'Load Balancing', 'Databases'],
    level: 'Advanced',
    cost: 'Free',
    estimatedDuration: '50 hours',
    link: 'https://github.com/donnemartin/system-design-primer',
    whyItHelps: 'The gold-standard reference for designing large-scale distributed systems for FAANG-level interviews.'
  },
  {
    catalogId: 'cat-sde-5',
    title: 'Coursera: Software Design and Architecture Specialization',
    provider: 'Coursera / University of Alberta',
    type: 'course',
    fieldIds: ['sde'],
    skillTags: ['OOP', 'Design Patterns', 'Software Architecture', 'Clean Code'],
    level: 'Intermediate',
    cost: 'Freemium',
    estimatedDuration: '4 months',
    link: 'https://www.coursera.org/specializations/software-design-architecture',
    whyItHelps: 'Teaches object-oriented design patterns, UML diagramming, and maintainable software patterns.'
  },
  {
    catalogId: 'cat-sde-6',
    title: 'NeetCode 150: Blind LeetCode Practice Guide',
    provider: 'NeetCode.io',
    type: 'youtube_playlist',
    fieldIds: ['sde', 'ml-ai', 'mobile-dev'],
    skillTags: ['DSA', 'Dynamic Programming', 'Binary Trees', 'Sliding Window', 'Two Pointers'],
    level: 'Intermediate',
    cost: 'Free',
    estimatedDuration: '60 hours',
    link: 'https://neetcode.io/practice',
    whyItHelps: 'Categorized pattern-based video walkthroughs of top 150 interview coding challenges.'
  },

  // ==========================================
  // QA / SOFTWARE TESTING
  // ==========================================
  {
    catalogId: 'cat-qa-1',
    title: 'ISTQB Certified Tester Foundation Level (CTFL)',
    provider: 'ISTQB',
    type: 'certification',
    fieldIds: ['qa-testing'],
    skillTags: ['STLC', 'Test Case Design', 'Bug Lifecycle', 'Static Testing', 'Test Management'],
    level: 'Beginner',
    cost: 'Paid',
    estimatedDuration: '3 weeks',
    link: 'https://www.istqb.org/certifications/certified-tester-foundation-level',
    whyItHelps: 'The globally recognized standard certification for software quality assurance engineers.'
  },
  {
    catalogId: 'cat-qa-2',
    title: 'Selenium WebDriver with Java & TestNG',
    provider: 'Udemy / Rahul Shetty',
    type: 'course',
    fieldIds: ['qa-testing'],
    skillTags: ['Selenium', 'Java', 'TestNG', 'Automation Testing', 'Framework Design'],
    level: 'Intermediate',
    cost: 'Paid',
    estimatedDuration: '45 hours',
    link: 'https://www.udemy.com/course/selenium-real-time-examples-interview-questions/',
    whyItHelps: 'Hands-on automation framework creation with Java, Selenium, Page Object Model, and TestNG.'
  },
  {
    catalogId: 'cat-qa-3',
    title: 'Postman API Testing Learning Center',
    provider: 'Postman',
    type: 'free_resource',
    fieldIds: ['qa-testing', 'sde'],
    skillTags: ['API Testing', 'Postman', 'REST APIs', 'JSON', 'Automation'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '15 hours',
    link: 'https://learning.postman.com/docs/writing-scripts/intro-to-scripts/',
    whyItHelps: 'Learn REST API test assertion scripting, Newman CLI integration, and automated regression suites.'
  },
  {
    catalogId: 'cat-qa-4',
    title: 'Coursera: Software Testing and Automation Specialization',
    provider: 'Coursera / University of Minnesota',
    type: 'course',
    fieldIds: ['qa-testing'],
    skillTags: ['Unit Testing', 'Integration Testing', 'Code Coverage', 'Mutation Testing'],
    level: 'Intermediate',
    cost: 'Freemium',
    estimatedDuration: '3 months',
    link: 'https://www.coursera.org/specializations/software-testing-automation',
    whyItHelps: 'Covers automated black-box and white-box testing strategies, coverage metrics, and defect tracking.'
  },

  // ==========================================
  // DATA SCIENCE / ANALYTICS
  // ==========================================
  {
    catalogId: 'cat-ds-1',
    title: 'Google Data Analytics Professional Certificate',
    provider: 'Google / Coursera',
    type: 'certification',
    fieldIds: ['data-science', 'business-analyst'],
    skillTags: ['Data Analysis', 'R', 'SQL', 'Tableau', 'Data Cleaning', 'Spreadsheets'],
    level: 'Beginner',
    cost: 'Freemium',
    estimatedDuration: '6 months',
    link: 'https://www.coursera.org/professional-certificates/google-data-analytics',
    whyItHelps: 'Industry-standard entry certification covering end-to-end data cleaning, SQL analysis, and Tableau dashboards.'
  },
  {
    catalogId: 'cat-ds-2',
    title: 'Kaggle Learn: Python, SQL & Pandas Micro-Courses',
    provider: 'Kaggle',
    type: 'free_resource',
    fieldIds: ['data-science', 'ml-ai', 'business-analyst'],
    skillTags: ['Python', 'Pandas', 'SQL', 'Data Visualization', 'Exploratory Analysis'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '20 hours',
    link: 'https://www.kaggle.com/learn',
    whyItHelps: 'Bite-sized browser-based interactive coding labs for mastering Pandas, Data Wrangling, and SQL.'
  },
  {
    catalogId: 'cat-ds-3',
    title: 'IBM Data Science Professional Certificate',
    provider: 'IBM / Coursera',
    type: 'certification',
    fieldIds: ['data-science', 'ml-ai'],
    skillTags: ['Python', 'SQL', 'Machine Learning', 'Data Visualization', 'Jupyter'],
    level: 'Intermediate',
    cost: 'Freemium',
    estimatedDuration: '5 months',
    link: 'https://www.coursera.org/professional-certificates/ibm-data-science',
    whyItHelps: 'Comprehensive practical training in Python data science libraries, machine learning models, and SQL.'
  },

  // ==========================================
  // MACHINE LEARNING / AI ENGINEERING
  // ==========================================
  {
    catalogId: 'cat-ml-1',
    title: 'Machine Learning Specialization by Andrew Ng',
    provider: 'DeepLearning.AI / Stanford',
    type: 'course',
    fieldIds: ['ml-ai', 'data-science'],
    skillTags: ['Machine Learning', 'Supervised Learning', 'Neural Networks', 'Scikit-Learn', 'Python'],
    level: 'Beginner',
    cost: 'Freemium',
    estimatedDuration: '3 months',
    link: 'https://www.coursera.org/specializations/machine-learning-introduction',
    whyItHelps: 'The world-famous foundational course explaining mathematical intuition and code implementations of ML algorithms.'
  },
  {
    catalogId: 'cat-ml-2',
    title: 'Fast.ai: Practical Deep Learning for Coders',
    provider: 'Fast.ai',
    type: 'free_resource',
    fieldIds: ['ml-ai'],
    skillTags: ['Deep Learning', 'PyTorch', 'Computer Vision', 'NLP', 'Model Tuning'],
    level: 'Intermediate',
    cost: 'Free',
    estimatedDuration: '50 hours',
    link: 'https://course.fast.ai/',
    whyItHelps: 'Top-down code-first approach to building state-of-the-art neural networks with PyTorch.'
  },

  // ==========================================
  // DEVOPS / CLOUD ENGINEERING
  // ==========================================
  {
    catalogId: 'cat-devops-1',
    title: 'AWS Certified Cloud Practitioner',
    provider: 'Amazon Web Services',
    type: 'certification',
    fieldIds: ['devops-cloud', 'sde'],
    skillTags: ['AWS', 'Cloud', 'EC2', 'S3', 'IAM', 'Cloud Security'],
    level: 'Beginner',
    cost: 'Paid',
    estimatedDuration: '4 weeks',
    link: 'https://aws.amazon.com/certification/certified-cloud-practitioner/',
    whyItHelps: 'Foundational cloud certification establishing mastery over AWS infrastructure services and security models.'
  },
  {
    catalogId: 'cat-devops-2',
    title: 'Docker Official Getting Started Guide & Lab',
    provider: 'Docker',
    type: 'free_resource',
    fieldIds: ['devops-cloud', 'sde'],
    skillTags: ['Docker', 'Containers', 'Dockerfile', 'Docker Compose', 'CI/CD'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '10 hours',
    link: 'https://docs.docker.com/get-started/',
    whyItHelps: 'Official hands-on guide for containerizing applications, writing Dockerfiles, and multi-container orchestration.'
  },
  {
    catalogId: 'cat-devops-3',
    title: 'Kubernetes Basics & Interactive Tutorials',
    provider: 'Kubernetes / CNCF',
    type: 'free_resource',
    fieldIds: ['devops-cloud'],
    skillTags: ['Kubernetes', 'K8s', 'Pods', 'Deployments', 'Services', 'Cloud Native'],
    level: 'Intermediate',
    cost: 'Free',
    estimatedDuration: '15 hours',
    link: 'https://kubernetes.io/docs/tutorials/kubernetes-basics/',
    whyItHelps: 'Interactive browser terminal labs teaching deployment, scaling, rolling updates, and cluster debugging.'
  },

  // ==========================================
  // CYBERSECURITY
  // ==========================================
  {
    catalogId: 'cat-sec-1',
    title: 'Google Cybersecurity Professional Certificate',
    provider: 'Google / Coursera',
    type: 'certification',
    fieldIds: ['cybersecurity'],
    skillTags: ['Cybersecurity', 'SIEM', 'Linux', 'SQL', 'Python Security', 'Network Security'],
    level: 'Beginner',
    cost: 'Freemium',
    estimatedDuration: '6 months',
    link: 'https://www.coursera.org/professional-certificates/google-cybersecurity',
    whyItHelps: 'Industry certificate preparing candidates for Security Analyst roles with Python, Linux, and incident response.'
  },
  {
    catalogId: 'cat-sec-2',
    title: 'CompTIA Security+ Certification',
    provider: 'CompTIA',
    type: 'certification',
    fieldIds: ['cybersecurity'],
    skillTags: ['Threat Analysis', 'Cryptography', 'Risk Management', 'Identity Access', 'Network Security'],
    level: 'Intermediate',
    cost: 'Paid',
    estimatedDuration: '2 months',
    link: 'https://www.comptia.org/certifications/security',
    whyItHelps: 'Benchmark global security credential covering threats, vulnerabilities, and operational security controls.'
  },
  {
    catalogId: 'cat-sec-3',
    title: 'TryHackMe: Pre-Security & Complete Beginner Path',
    provider: 'TryHackMe',
    type: 'free_resource',
    fieldIds: ['cybersecurity'],
    skillTags: ['Ethical Hacking', 'OWASP', 'Penetration Testing', 'Web Security'],
    level: 'Beginner',
    cost: 'Freemium',
    estimatedDuration: '30 hours',
    link: 'https://tryhackme.com/path/outline/presecurity',
    whyItHelps: 'Gamified hands-on virtual lab rooms for practicing web vulnerability exploitation and defensive security.'
  },

  // ==========================================
  // UI/UX & PRODUCT DESIGN
  // ==========================================
  {
    catalogId: 'cat-uiux-1',
    title: 'Google UX Design Professional Certificate',
    provider: 'Google / Coursera',
    type: 'certification',
    fieldIds: ['ui-ux'],
    skillTags: ['Figma', 'User Research', 'Wireframing', 'Prototyping', 'Usability Testing'],
    level: 'Beginner',
    cost: 'Freemium',
    estimatedDuration: '6 months',
    link: 'https://www.coursera.org/professional-certificates/google-ux-design',
    whyItHelps: 'Step-by-step UX methodology training resulting in 3 complete portfolio projects in Figma.'
  },
  {
    catalogId: 'cat-uiux-2',
    title: 'Figma Official Learn Design Course',
    provider: 'Figma',
    type: 'free_resource',
    fieldIds: ['ui-ux'],
    skillTags: ['Figma', 'UI Design', 'Auto Layout', 'Design Systems', 'Micro-interactions'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '12 hours',
    link: 'https://help.figma.com/hc/en-us/categories/360002051613-Figma-design',
    whyItHelps: 'Official Figma masterclass covering components, auto-layout, interactive prototypes, and design tokens.'
  },

  // ==========================================
  // PRODUCT MANAGEMENT
  // ==========================================
  {
    catalogId: 'cat-pm-1',
    title: 'Google Project Management Professional Certificate',
    provider: 'Google / Coursera',
    type: 'certification',
    fieldIds: ['pm', 'business-analyst'],
    skillTags: ['Product Strategy', 'Agile', 'Scrum', 'Documentation', 'Risk Management'],
    level: 'Beginner',
    cost: 'Freemium',
    estimatedDuration: '6 months',
    link: 'https://www.coursera.org/professional-certificates/google-project-management',
    whyItHelps: 'Covers Agile/Scrum ceremonies, project documentation, stakeholder management, and product delivery.'
  },
  {
    catalogId: 'cat-pm-2',
    title: 'Product School Free PM Guides & Resources',
    provider: 'Product School',
    type: 'free_resource',
    fieldIds: ['pm'],
    skillTags: ['Product Strategy', 'PRD Writing', 'RICE Framework', 'User Stories'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '15 hours',
    link: 'https://productschool.com/resources',
    whyItHelps: 'Templates and framework guides for writing PRDs, prioritization models, and interview case studies.'
  },

  // ==========================================
  // MOBILE DEVELOPMENT
  // ==========================================
  {
    catalogId: 'cat-mob-1',
    title: 'Android Basics with Compose (Official Google Course)',
    provider: 'Google / Android Developers',
    type: 'free_resource',
    fieldIds: ['mobile-dev'],
    skillTags: ['Kotlin', 'Android', 'Jetpack Compose', 'REST APIs', 'Mobile Architecture'],
    level: 'Beginner',
    cost: 'Free',
    estimatedDuration: '60 hours',
    link: 'https://developer.android.com/courses/android-basics-compose/course',
    whyItHelps: 'Google\'s official curriculum for building modern native Android apps with Kotlin and Jetpack Compose.'
  },

  // ==========================================
  // BUSINESS ANALYST
  // ==========================================
  {
    catalogId: 'cat-ba-1',
    title: 'Google Business Intelligence Professional Certificate',
    provider: 'Google / Coursera',
    type: 'certification',
    fieldIds: ['business-analyst', 'data-science'],
    skillTags: ['SQL', 'Tableau', 'Business Analytics', 'Data Dashboards', 'Process Mapping'],
    level: 'Intermediate',
    cost: 'Freemium',
    estimatedDuration: '5 months',
    link: 'https://www.coursera.org/professional-certificates/google-business-intelligence',
    whyItHelps: 'Teaches how to transform raw business requirements into SQL queries and executive Tableau dashboards.'
  }
];

export async function seedCourseCatalogInFirestore() {
  try {
    const colRef = collection(db, 'courseCatalog');
    for (const item of INITIAL_COURSE_CATALOG) {
      const docRef = doc(colRef, item.catalogId);
      await setDoc(docRef, item);
    }
    console.log('Successfully seeded 30+ course catalog items in Firestore!');
    return { success: true, count: INITIAL_COURSE_CATALOG.length };
  } catch (error) {
    console.error('Error seeding course catalog in Firestore:', error);
    return { success: false, error: error.message };
  }
}
