import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase';

export const INITIAL_TECHNICAL_MCQ_QUESTIONS = [
  // ==========================================
  // SOFTWARE DEVELOPMENT (SDE) MCQS: OOP, DBMS, OS, NETWORKS
  // ==========================================
  {
    id: 'sde-oop-polymorphism',
    fieldId: 'sde',
    topic: 'Object-Oriented Programming',
    question: 'Which of the following describes Method Overriding in Java/C++?',
    options: [
      'Defining multiple methods in the same class with identical names but different signatures.',
      'Providing a specific implementation in a derived class for a method declared in a base class.',
      'Hiding internal implementation details using access modifiers.',
      'Allocating dynamic memory at runtime using virtual functions.'
    ],
    correctAnswerIndex: 1,
    explanation: 'Method Overriding occurs when a child class provides a specific implementation of a method already defined in its parent class with the exact same method signature.'
  },
  {
    id: 'sde-dbms-acid',
    fieldId: 'sde',
    topic: 'Database Management Systems',
    question: 'In SQL transaction processing, which ACID property guarantees that executed transactions are permanently recorded even during power outages?',
    options: [
      'Atomicity',
      'Consistency',
      'Isolation',
      'Durability'
    ],
    correctAnswerIndex: 3,
    explanation: 'Durability ensures that once a transaction has committed, its changes survive system failure and crash events.'
  },
  {
    id: 'sde-os-deadlock',
    fieldId: 'sde',
    topic: 'Operating Systems',
    question: 'Which of the following is NOT one of Coffman’s four necessary conditions for OS Deadlock to occur?',
    options: [
      'Mutual Exclusion',
      'Hold and Wait',
      'Preemption Allowed',
      'Circular Wait'
    ],
    correctAnswerIndex: 2,
    explanation: 'Deadlock requires "No Preemption" (resources cannot be forcibly taken from a process). If preemption is allowed, deadlocks cannot persist.'
  },
  {
    id: 'sde-cn-tcp-udp',
    fieldId: 'sde',
    topic: 'Computer Networks',
    question: 'Why is UDP preferred over TCP for real-time video conferencing applications?',
    options: [
      'UDP guarantees packet delivery order and zero packet loss.',
      'UDP performs a 3-way handshake to establish reliable connections.',
      'UDP avoids retransmission delays and flow control overhead, prioritizing low latency.',
      'UDP encrypts network payloads at the Transport Layer automatically.'
    ],
    correctAnswerIndex: 2,
    explanation: 'UDP is connectionless and does not retransmit dropped packets, making it significantly faster and ideal for real-time audio/video streaming where low latency matters more than perfect delivery.'
  },
  {
    id: 'sde-dbms-indexing',
    fieldId: 'sde',
    topic: 'Database Management Systems',
    question: 'What is the primary difference between a Clustered Index and a Non-Clustered Index in SQL databases?',
    options: [
      'A table can have multiple Clustered Indexes but only one Non-Clustered Index.',
      'A Clustered Index physically reorders the rows in the table, so a table can have only one.',
      'Non-Clustered Indexes store table data directly on disk in contiguous blocks.',
      'Clustered Indexes require B-Tree pointers to secondary heap data.'
    ],
    correctAnswerIndex: 1,
    explanation: 'A Clustered Index determines the physical order of data rows on disk, meaning a database table can have only one Clustered Index.'
  },
  {
    id: 'sde-os-paging',
    fieldId: 'sde',
    topic: 'Operating Systems',
    question: 'In Virtual Memory management, what causes a Page Fault?',
    options: [
      'A thread attempts to write to a read-only memory location.',
      'The requested memory page is not currently loaded into physical RAM.',
      'The CPU cache experiences a cache miss.',
      'Multiple processes attempt to access a shared mutex simultaneously.'
    ],
    correctAnswerIndex: 1,
    explanation: 'A Page Fault occurs when a program attempts to access a page of virtual memory that is currently mapped to virtual address space but not loaded into physical RAM.'
  },
  {
    id: 'sde-oop-solid',
    fieldId: 'sde',
    topic: 'Object-Oriented Programming',
    question: 'The Single Responsibility Principle (SRP) in SOLID software design states that:',
    options: [
      'A class should have only one method.',
      'A class should have only one reason to change.',
      'A class should inherit from only one parent class.',
      'A module should expose only one public interface.'
    ],
    correctAnswerIndex: 1,
    explanation: 'Single Responsibility Principle states that a class or module should have one, and only one, reason to change, meaning it should perform a cohesive set of related duties.'
  },
  {
    id: 'sde-cn-http-status',
    fieldId: 'sde',
    topic: 'Computer Networks',
    question: 'In RESTful Web Services, which HTTP status code represents 401 Unauthorized vs 403 Forbidden?',
    options: [
      '401 means missing/invalid authentication credentials; 403 means authenticated but lacking permissions.',
      '401 means server error; 403 means client requested non-existent URL.',
      '401 means database timeout; 403 means payload validation error.',
      '401 and 403 are identical status codes used interchangeably in RFC specs.'
    ],
    correctAnswerIndex: 0,
    explanation: '401 Unauthorized indicates unauthenticated requests (missing/invalid credentials), while 403 Forbidden indicates the caller is authenticated but lacks required access rights.'
  },

  // ==========================================
  // DATA SCIENCE & ANALYTICS MCQS
  // ==========================================
  {
    id: 'ds-sql-window',
    fieldId: 'data-science',
    topic: 'SQL & Analytics',
    question: 'Which SQL window function assigns rank numbers without gaps when duplicate values occur?',
    options: [
      'RANK()',
      'DENSE_RANK()',
      'ROW_NUMBER()',
      'NTILE()'
    ],
    correctAnswerIndex: 1,
    explanation: 'DENSE_RANK() assigns consecutive ranks without skipping numbers when items have identical values, unlike RANK() which skips positions after ties.'
  },
  {
    id: 'ds-ml-overfitting',
    fieldId: 'data-science',
    topic: 'Machine Learning',
    question: 'Which technique is most effective at reducing overfitting in a Decision Tree model?',
    options: [
      'Increasing tree depth to maximum possible level',
      'Cost-Complexity Pruning (setting max_depth / min_samples_split)',
      'Removing L2 regularization penalties',
      'Increasing training epochs indefinitely'
    ],
    correctAnswerIndex: 1,
    explanation: 'Pruning limits maximum tree depth or minimum samples per leaf, stopping the decision tree from memorizing noisy training data.'
  },

  // ==========================================
  // QA & TESTING MCQS
  // ==========================================
  {
    id: 'qa-boundary-value',
    fieldId: 'qa-testing',
    topic: 'Software Testing',
    question: 'If a text field accepts inputs between 1 and 100 characters, which set of input lengths represents Boundary Value Analysis (BVA)?',
    options: [
      '0, 1, 100, 101',
      '-10, 50, 200',
      '10, 20, 30, 40',
      '50, 75, 99'
    ],
    correctAnswerIndex: 0,
    explanation: 'Boundary Value Analysis tests values on the exact boundaries and immediately adjacent to them: lower boundary (0, 1) and upper boundary (100, 101).'
  }
];

export async function seedTechnicalMcqQuestionsInFirestore() {
  try {
    const colRef = collection(db, 'technicalMcqQuestions');
    for (const q of INITIAL_TECHNICAL_MCQ_QUESTIONS) {
      const docRef = doc(colRef, q.id);
      await setDoc(docRef, q);
    }
    console.log('Successfully seeded technical MCQ questions in Firestore!');
    return { success: true, count: INITIAL_TECHNICAL_MCQ_QUESTIONS.length };
  } catch (error) {
    console.error('Error seeding technical MCQ questions in Firestore:', error);
    return { success: false, error: error.message };
  }
}
