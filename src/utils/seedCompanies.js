export function getCompanyTier(companyObjOrName) {
  const companyName = typeof companyObjOrName === 'string' 
    ? companyObjOrName 
    : companyObjOrName?.name || '';
  
  const nameLower = companyName.toLowerCase();

  // Tier 3: FAANG / MAMAA & Top Tier Product
  if (/google|amazon|netflix|meta|apple|microsoft|uber|atlassian/i.test(nameLower)) {
    return {
      tier: 3,
      label: 'Tier 3 — FAANG / Top-Tier Product',
      badgeBg: 'bg-purple-100 text-purple-800 border-purple-200',
      expectations: 'High Expectations: Demands optimal time/space complexity O(N)/O(log N), complete edge-case coverage, and deep architectural trade-off articulation.'
    };
  }

  // Tier 2: Product / Mid-Tier Enterprise
  if (/flipkart|swiggy|paytm|adobe|zomato|razorpay|stripe|salesforce|intuit|oracle/i.test(nameLower)) {
    return {
      tier: 2,
      label: 'Tier 2 — Product / Mid-Tier Enterprise',
      badgeBg: 'bg-blue-100 text-blue-800 border-blue-200',
      expectations: 'Moderate Expectations: Demands clean code modularity, near-optimal complexity, and structured communication.'
    };
  }

  // Tier 1: Mass Recruiters / IT Services Baseline
  return {
    tier: 1,
    label: 'Tier 1 — Mass Recruiters / IT Services',
    badgeBg: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    expectations: 'Baseline Expectations: Focuses on working logic, basic test case pass rates, and fundamental CS concepts.'
  };
}

export const INITIAL_COMPANIES = [
  {
    id: 'google',
    name: 'Google',
    logoText: 'G',
    difficulty: 'Hard',
    category: 'FAANG / MAMAA',
    description: 'Tier-1 global tech leader evaluating algorithm efficiency, clean code abstractions, and Googleyness.',
    rounds: ['Online Assessment (OA)', 'DSA Round 1 (Algorithms)', 'DSA Round 2 (System Design & Coding)', 'Googleyness & Leadership Committee'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Google skips standalone aptitude tests and goes straight to DSA algorithmic screens.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Hash Maps', 'Trees & Graphs', 'Dynamic Programming', 'Sliding Window'],
      difficultyDistribution: { easy: 10, medium: 50, hard: 40 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Emphasizes optimal time & space complexity (O(N) / O(log N)), clean abstractions, and articulating trade-offs out loud.'
    },
    interviewProfile: {
      questionStyle: 'Technical Depth + Googleyness (Navigating Ambiguity)',
      focusAreas: ['Googleyness & Culture', 'System Design Lite', 'Navigating Ambiguity', 'Analytical Rigor'],
      typicalQuestionCount: 4,
      notes: 'Evaluates how you handle vague requirements, adapt to follow-up constraints, and demonstrate inclusive leadership.'
    }
  },
  {
    id: 'amazon',
    name: 'Amazon',
    logoText: 'A',
    difficulty: 'Medium',
    category: 'FAANG / MAMAA',
    description: 'Global e-commerce & cloud giant heavily evaluating Leadership Principles and scalable system thinking.',
    rounds: ['Work Style & Coding OA', 'DSA Technical Screening', 'System Architecture', 'Leadership Principles Onsite (Bar Raiser)'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Amazon skips pure aptitude tests and evaluates work style simulation in the OA.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Strings', 'Trees & Binary Search', 'Hash Maps & Two Pointers', 'Graph Traversal'],
      difficultyDistribution: { easy: 20, medium: 65, hard: 15 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Focuses on practical data structures, array manipulation, and edge case validation.'
    },
    interviewProfile: {
      questionStyle: 'Behavioral STAR Format strictly mapped to 16 Leadership Principles',
      focusAreas: ['Customer Obsession', 'Ownership', 'Bias for Action', 'Deliver Results', 'Dive Deep'],
      typicalQuestionCount: 4,
      notes: 'Mandatory STAR format (Situation, Task, Action, Result). Must quantify metrics and outcomes.'
    }
  },
  {
    id: 'microsoft',
    name: 'Microsoft',
    logoText: 'MS',
    difficulty: 'Medium',
    category: 'FAANG / MAMAA',
    description: 'Enterprise software & cloud platform emphasizing collaborative engineering, OOP principles, and growth mindset.',
    rounds: ['Aptitude Assessment', 'Codility OA (DSA)', 'Low-Level System Design', 'Technical Managerial'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'secondary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability'],
      questionCountPerSection: 2,
      timeLimitMinutes: 10,
      notes: 'Lighter screening: focus on logical reasoning and quantitative problem-solving.'
    },
    dsaProfile: {
      topicsFocus: ['Linked Lists', 'Trees & Graphs', 'Arrays & Strings', 'Recursion & Backtracking'],
      difficultyDistribution: { easy: 25, medium: 60, hard: 15 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Evaluates clean modular code, boundary condition checks, and memory management.'
    },
    interviewProfile: {
      questionStyle: 'Technical + Growth Mindset Framing',
      focusAreas: ['Growth Mindset', 'Collaborative Problem Solving', 'Object-Oriented Design', 'Customer Impact'],
      typicalQuestionCount: 4,
      notes: 'Focuses on how you learn from mistakes, receive constructive feedback, and architect maintainable code.'
    }
  },
  {
    id: 'meta',
    name: 'Meta',
    logoText: 'M',
    difficulty: 'Hard',
    category: 'FAANG / MAMAA',
    description: 'Social networking & AI pioneer evaluating high-velocity problem solving (2 problems in 45 min) and scale.',
    rounds: ['Online Coding Screen', 'Technical Screen (2 Problems / 45m)', 'System Design Onsite', 'Behavioral & Impact Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Meta skips standalone aptitude tests.'
    },
    dsaProfile: {
      topicsFocus: ['Binary Trees', 'Graph BFS/DFS', 'Two Pointers & Sliding Window', 'Hash Maps'],
      difficultyDistribution: { easy: 15, medium: 60, hard: 25 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Extremely high execution speed required. Expects bug-free code written within 20 minutes per question.'
    },
    interviewProfile: {
      questionStyle: 'Fast-paced Behavioral tied to "Move Fast" & High Impact',
      focusAreas: ['Move Fast', 'Be Bold', 'Cross-Functional Impact', 'Conflict Resolution'],
      typicalQuestionCount: 4,
      notes: 'Looks for direct communication, accountability under pressure, and prioritizing high-leverage work.'
    }
  },
  {
    id: 'apple',
    name: 'Apple',
    logoText: 'AP',
    difficulty: 'Medium',
    category: 'FAANG / MAMAA',
    description: 'Hardware-software ecosystem leader evaluating craftsmanship, extreme attention to detail, and API hygiene.',
    rounds: ['Recruiter Screen', 'Technical Phone Screen', 'Domain-Specific Onsite (DSA & Code Review)', 'Director Fit Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Apple skips standalone aptitude tests.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Pointers', 'String Manipulation', 'Bitwise Operations', 'Trees'],
      difficultyDistribution: { easy: 20, medium: 65, hard: 15 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Prioritizes elegant syntax, optimal memory layout, and edge case resilience.'
    },
    interviewProfile: {
      questionStyle: 'Craftsmanship, Attention to Detail & Product Passion',
      focusAreas: ['Attention to Detail', 'User Experience Mindset', 'Deep Domain Expertise', 'Cross-Team Collaboration'],
      typicalQuestionCount: 4,
      notes: 'Expects passion for product quality, defensive coding practices, and pride in engineering craftsmanship.'
    }
  },
  {
    id: 'netflix',
    name: 'Netflix',
    logoText: 'NF',
    difficulty: 'Hard',
    category: 'FAANG / MAMAA',
    description: 'Streaming & entertainment engine evaluating top-tier senior talent, autonomy, and high performance culture.',
    rounds: ['Technical Phone Screen', 'Deep System Architecture', 'Live System Coding', 'Culture & Context Onsite'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Netflix skips standalone aptitude tests.'
    },
    dsaProfile: {
      topicsFocus: ['System Simulation & Concurrency', 'Advanced Dynamic Programming', 'Graphs', 'Trees'],
      difficultyDistribution: { easy: 0, medium: 50, hard: 50 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 60,
      notes: 'Fewer but significantly deeper architectural and algorithmic challenges. Requires production-grade code.'
    },
    interviewProfile: {
      questionStyle: 'Freedom and Responsibility Culture Assessment',
      focusAreas: ['Freedom & Responsibility', 'Stunning Colleagues', 'Direct Feedback', 'Selflessness & Context'],
      typicalQuestionCount: 4,
      notes: 'Evaluates alignment with Netflix Culture Memo. Demands candid communication and high self-driven autonomy.'
    }
  },
  {
    id: 'adobe',
    name: 'Adobe',
    logoText: 'AD',
    difficulty: 'Medium',
    category: 'Product & Enterprise',
    description: 'Digital media & document cloud pioneer evaluating creative problem solving and robust C++/Java fundamentals.',
    rounds: ['Aptitude Assessment', 'DSA Technical Round 1', 'Object Oriented & System Design', 'HR & Culture Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'secondary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability'],
      questionCountPerSection: 2,
      timeLimitMinutes: 10,
      notes: 'Lighter screening: focus on logical reasoning and quantitative problem-solving.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Matrices', 'Trees & Recursion', 'Strings & Parsing', 'Hash Maps'],
      difficultyDistribution: { easy: 25, medium: 60, hard: 15 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Balancing algorithmic logic with object-oriented modular design.'
    },
    interviewProfile: {
      questionStyle: 'Creativity, CS Fundamentals & Problem Solving',
      focusAreas: ['Creative Problem Solving', 'CS Fundamentals', 'Project Ownership', 'Team Dynamics'],
      typicalQuestionCount: 3,
      notes: 'Asks about past engineering trade-offs, object-oriented patterns, and user-centric features.'
    }
  },
  {
    id: 'tcs',
    name: 'TCS',
    logoText: 'TCS',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Global IT service powerhouse hiring thousands of engineering graduates via NQT cognitive & technical screens.',
    rounds: ['NQT Cognitive & Aptitude Test', 'NQT Hands-on Coding (DSA)', 'Technical Interview', 'HR Communication Assessment'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'TCS NQT-style: heavy on quant + logical + verbal, moderate GK on current tech/business affairs.'
    },
    dsaProfile: {
      topicsFocus: ['Basic Arrays & Math', 'String Operations', 'Simple Loops & Pattern Matching', 'Conditionals'],
      difficultyDistribution: { easy: 60, medium: 35, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Focuses on basic logic, string reversals, array frequency counts, and syntax correctness.'
    },
    interviewProfile: {
      questionStyle: 'Core Fundamentals + HR & Communication Skills',
      focusAreas: ['CS Fundamentals (DBMS, OS, OOP)', 'Project Explanation', 'Communication & Adaptability', 'Career Motivation'],
      typicalQuestionCount: 3,
      notes: 'Assesses spoken English fluency, flexibility with relocation/technologies, and core CS definitions.'
    }
  },
  {
    id: 'infosys',
    name: 'Infosys',
    logoText: 'INF',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Leading digital services innovator selecting talent through HackWithInfy and InfyTQ technical assessments.',
    rounds: ['InfyTQ Aptitude Round', 'DSA Coding Challenge', 'Technical Fundamentals Screen', 'HR & Behavioral Interview'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'InfyTQ-style: primary elimination filter testing quantitative speed and logical puzzle solving.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Searching', 'Strings & Palindromes', 'Basic Recursion', 'Sorting'],
      difficultyDistribution: { easy: 65, medium: 30, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Tests fundamentals: array filtering, binary search, basic string operations.'
    },
    interviewProfile: {
      questionStyle: 'Behavioral & Core Technical Foundations',
      focusAreas: ['Academic Project Overview', 'SQL & Database Basics', 'Teamwork & Learning Agility', 'Workplace Ethics'],
      typicalQuestionCount: 3,
      notes: 'Expects clear explanation of final-year engineering projects and basic SQL queries.'
    }
  },
  {
    id: 'wipro',
    name: 'Wipro',
    logoText: 'WIP',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Multinational technology services leader conducting Elite NTH and Turbo national talent hunts.',
    rounds: ['NLTH Aptitude & Reasoning Test', 'DSA Coding Arena', 'Technical Discussion', 'HR Interview'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'NLTH-style: quantitative speed, series completion, and general IT knowledge.'
    },
    dsaProfile: {
      topicsFocus: ['Basic Data Structures', 'String Manipulation', 'Array Iteration', 'Logic Puzzles'],
      difficultyDistribution: { easy: 70, medium: 25, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Straightforward coding problems focusing on input validation and control flow.'
    },
    interviewProfile: {
      questionStyle: 'Fundamental Knowledge & HR Compatibility',
      focusAreas: ['C/Java/Python Basics', 'Data Structures Intro', 'Adaptability', 'Shift Willingness'],
      typicalQuestionCount: 3,
      notes: 'Friendly conversation testing foundational programming concepts and positive attitude.'
    }
  },
  {
    id: 'accenture',
    name: 'Accenture',
    logoText: 'ACC',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Global professional services & consulting giant assessing cognitive speed, coding basics, and communication.',
    rounds: ['Cognitive & Aptitude Test', 'Hands-on DSA Coding', 'Communication Assessment', 'One-on-One Technical HR'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'Primary screening: logical reasoning, mathematical speed, and tech business awareness.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Bit Operations', 'Strings', 'Math & Logic', 'Sorting Algorithms'],
      difficultyDistribution: { easy: 60, medium: 35, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Tests analytical reasoning and basic algorithmic implementations.'
    },
    interviewProfile: {
      questionStyle: 'Consulting Mindset, Soft Skills & Tech Basics',
      focusAreas: ['Client Communication', 'Problem Solving Approach', 'Agile & SDLC Basics', 'Team Collaboration'],
      typicalQuestionCount: 3,
      notes: 'Evaluates articulate verbal responses, client-facing posture, and general technology awareness.'
    }
  },
  {
    id: 'cognizant',
    name: 'Cognizant',
    logoText: 'CTS',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Global IT service leader selecting engineering graduates via GenC, GenC Elevate, and GenC Pro drives.',
    rounds: ['GenC Aptitude & Reasoning', 'GenC Technical Coding', 'Technical Discussion', 'HR Onboarding Screen'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'GenC primary filter: pseudo-code logic, verbal ability, and logical reasoning.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays', 'Strings', 'Basic Hash Maps', 'Loops'],
      difficultyDistribution: { easy: 65, medium: 30, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Standard coding tasks checking string parsing, frequency arrays, and basic loops.'
    },
    interviewProfile: {
      questionStyle: 'Technical Fundamentals + HR Behavioral',
      focusAreas: ['OOPs Concepts', 'DBMS & SQL Joins', 'Project Contribution', 'Willingness to Learn'],
      typicalQuestionCount: 3,
      notes: 'Tests clarity on OOP inheritance/polymorphism and basic database schema design.'
    }
  },
  {
    id: 'flipkart',
    name: 'Flipkart',
    logoText: 'FK',
    difficulty: 'Hard',
    category: 'Product & Enterprise',
    description: 'Indian e-commerce pioneer evaluating high-throughput machine coding, object-oriented design, and scale.',
    rounds: ['Online Aptitude Screen', 'Machine Coding Round (90 Min)', 'DSA & Problem Solving', 'Engineering Director / HM Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'secondary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability'],
      questionCountPerSection: 2,
      timeLimitMinutes: 10,
      notes: 'Lighter screening: focus on logical reasoning and quantitative problem-solving.'
    },
    dsaProfile: {
      topicsFocus: ['System Simulation & OOP', 'Graphs & Trees', 'Dynamic Programming', 'Heaps & Priority Queues'],
      difficultyDistribution: { easy: 10, medium: 50, hard: 40 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 60,
      notes: 'Machine coding round requires fully working, clean, object-oriented code handling real-world e-commerce scenarios.'
    },
    interviewProfile: {
      questionStyle: 'Machine Coding Defense + Low-Level System Design',
      focusAreas: ['Extensible Code Design', 'Concurrency & Locks', 'Ownership & Hustle', 'Scale Engineering'],
      typicalQuestionCount: 4,
      notes: 'Defending code choices, explaining class diagrams, and proving system scalability.'
    }
  },
  {
    id: 'swiggy',
    name: 'Swiggy',
    logoText: 'SW',
    difficulty: 'Medium',
    category: 'Product & Enterprise',
    description: 'Hyperlocal delivery & logistics platform evaluating real-time dispatch algorithms and fast startup execution.',
    rounds: ['Aptitude & Technical Screen', 'Machine Coding / LLD', 'DSA & Algorithms', 'Engineering Manager Culture Fit'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'secondary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability'],
      questionCountPerSection: 2,
      timeLimitMinutes: 10,
      notes: 'Secondary filter: logical reasoning and mathematical problem solving.'
    },
    dsaProfile: {
      topicsFocus: ['Graphs & Shortest Path', 'Arrays & Two Pointers', 'Hash Maps', 'Greedy Algorithms'],
      difficultyDistribution: { easy: 15, medium: 65, hard: 20 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Emphasizes practical graph traversal (Dijkstra/BFS), distance calculations, and real-time routing logic.'
    },
    interviewProfile: {
      questionStyle: 'Real-world Logistics Scenarios + Startup Culture Fit',
      focusAreas: ['Bias for Action', 'Real-world Trade-offs', 'High Ownership', 'Debugging Under Pressure'],
      typicalQuestionCount: 3,
      notes: 'Focuses on solving practical food/grocery delivery challenges under high peak-load conditions.'
    }
  },
  {
    id: 'uber',
    name: 'Uber',
    logoText: 'UB',
    difficulty: 'Hard',
    category: 'Product & Enterprise',
    description: 'Global mobility & dispatch giant evaluating complex graph algorithms, concurrency, and heavy optimization.',
    rounds: ['Coding Screening', 'DSA & Optimization Round 1', 'Low/High Level Architecture', 'Bar Raiser Onsite'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Uber skips standalone aptitude tests.'
    },
    dsaProfile: {
      topicsFocus: ['Graphs & Geo Spatial Indexes', 'Advanced DP & Bitmask', 'Heaps & Queues', 'Concurrency'],
      difficultyDistribution: { easy: 5, medium: 45, hard: 50 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Extremely rigorous algorithmic optimization. Time complexity must be mathematically proven.'
    },
    interviewProfile: {
      questionStyle: 'Technical Depth + Large Scale Resilience',
      focusAreas: ['Distributed Systems Thinking', 'Algorithmic Depth', 'Handling Outages', 'Cross-Functional Leadership'],
      typicalQuestionCount: 4,
      notes: 'Tests ability to design fault-tolerant systems handling millions of concurrent ride requests.'
    }
  },
  {
    id: 'goldman-sachs',
    name: 'Goldman Sachs',
    logoText: 'GS',
    difficulty: 'Hard',
    category: 'Finance & FinTech',
    description: 'Premier global investment bank assessing mathematical rigor, CS core fundamentals, and composure under pressure.',
    rounds: ['DSA & Math Screening', 'DSA & CS Fundamentals Round 1', 'DSA & System Design Round 2', 'Senior Partner / HR Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'minimal',
      sections: [],
      questionCountPerSection: 0,
      timeLimitMinutes: 0,
      notes: 'Goldman Sachs includes math & probability directly inside the DSA coding assessment.'
    },
    dsaProfile: {
      topicsFocus: ['Math & Probability', 'Arrays & Dynamic Programming', 'Trees & Binary Search', 'Hash Maps'],
      difficultyDistribution: { easy: 10, medium: 50, hard: 40 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Expects rigorous mathematical proofs, optimal memory usage, and deep understanding of CS core concepts.'
    },
    interviewProfile: {
      questionStyle: 'Technical Depth + Quantitative & Analytical Aptitude',
      focusAreas: ['Quantitative Reasoning', 'CS Core (OS/Networks)', 'Poise Under Pressure', 'Integrity & Excellence'],
      typicalQuestionCount: 4,
      notes: 'Evaluates logical clarity when solving complex math puzzles, thread safety, and financial domain interest.'
    }
  },
  {
    id: 'jpmorgan',
    name: 'JP Morgan',
    logoText: 'JPM',
    difficulty: 'Medium',
    category: 'Finance & FinTech',
    description: 'Global financial services leader assessing CodeVue OA performance, clean OOP code, and collaborative drive.',
    rounds: ['Aptitude & CodeVue OA', 'Super Day Technical Round 1', 'Super Day Technical Round 2', 'HR & Leadership Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'secondary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability'],
      questionCountPerSection: 2,
      timeLimitMinutes: 10,
      notes: 'Lighter quantitative & logical screening in CodeVue OA.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays & Hash Maps', 'Linked Lists & Stacks', 'Trees & BSTs', 'Basic DP'],
      difficultyDistribution: { easy: 20, medium: 65, hard: 15 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 45,
      notes: 'Focuses on clean object-oriented architecture, data structure choices, and input validation.'
    },
    interviewProfile: {
      questionStyle: 'Technical + Behavioral (Super Day format)',
      focusAreas: ['Object-Oriented Design', 'Ethical Decision Making', 'Team Collaboration', 'Financial Innovation'],
      typicalQuestionCount: 4,
      notes: 'Evaluates clear communication during the intensive Super Day interview rounds.'
    }
  },
  {
    id: 'ibm',
    name: 'IBM',
    logoText: 'IBM',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Enterprise hybrid cloud & AI pioneer evaluating foundational programming, problem-solving, and team alignment.',
    rounds: ['Cognitive & Aptitude Test', 'Coding Assessment', 'Technical Interview', 'Behavioral HR'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'Primary cognitive ability assessment testing spatial, logical, and numerical speed.'
    },
    dsaProfile: {
      topicsFocus: ['Arrays', 'Strings & Regex', 'Sorting & Searching', 'Hash Tables'],
      difficultyDistribution: { easy: 55, medium: 40, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Standard algorithmic problems evaluating data structure basics and clean code.'
    },
    interviewProfile: {
      questionStyle: 'Technical Fundamentals & Innovation Culture',
      focusAreas: ['Core CS Concepts', 'Problem Solving Logic', 'Adaptability to Cloud/AI', 'Team Dynamics'],
      typicalQuestionCount: 3,
      notes: 'Focuses on understanding OS memory, database queries, and interest in enterprise AI platforms.'
    }
  },
  {
    id: 'deloitte',
    name: 'Deloitte',
    logoText: 'DEL',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Global consulting giant evaluating business tech advisory skills, case study analysis, and structured thinking.',
    rounds: ['Aptitude & GK Test', 'Coding / Tech Assessment', 'Case Study & Tech Interview', 'Partner HR Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'Primary screening: logical reasoning, business GK, and verbal communication.'
    },
    dsaProfile: {
      topicsFocus: ['Basic Math & Arrays', 'String Formatting', 'Logical Conditions', 'Searching'],
      difficultyDistribution: { easy: 70, medium: 25, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 25,
      notes: 'Focuses on rapid logical problem solving and basic code syntax.'
    },
    interviewProfile: {
      questionStyle: 'Case Study Presentation & Business Tech Advisory',
      focusAreas: ['Business Problem Solving', 'Structured Communication', 'Client Relationship Building', 'Leadership Potential'],
      typicalQuestionCount: 3,
      notes: 'Presents business scenario case studies testing how tech solutions drive business value.'
    }
  },
  {
    id: 'capgemini',
    name: 'Capgemini',
    logoText: 'CAP',
    difficulty: 'Easy',
    category: 'IT Services & Consulting',
    description: 'Global leader in consulting & engineering services evaluating pseudo-code logic, basic coding, and soft skills.',
    rounds: ['Pseudo-Code & Aptitude Test', 'Hands-on Coding Test', 'Spoken English Assessment', 'Technical HR Round'],
    aptitudeProfile: {
      hasAptitudeRound: true,
      weightage: 'primary',
      sections: ['Quantitative', 'Logical Reasoning', 'Verbal Ability', 'General Knowledge'],
      questionCountPerSection: 3,
      timeLimitMinutes: 15,
      notes: 'Primary filter: pseudo-code, quantitative speed, and general tech awareness.'
    },
    dsaProfile: {
      topicsFocus: ['Pseudo-code Tracing', 'Arrays & Strings', 'Control Structures', 'Basic Math'],
      difficultyDistribution: { easy: 65, medium: 30, hard: 5 },
      typicalQuestionCount: 2,
      timeLimitMinutes: 30,
      notes: 'Tests logic execution, output prediction, and basic array manipulation.'
    },
    interviewProfile: {
      questionStyle: 'Fundamentals + Soft Skills & Communication',
      focusAreas: ['Programming Basics', 'Database Concepts', 'Communication Skills', 'Relocation & Learning'],
      typicalQuestionCount: 3,
      notes: 'Assesses spoken English clarity, positive learning attitude, and core programming knowledge.'
    }
  }
];

export async function seedCompaniesInFirestore() {
  try {
    const colRef = collection(db, 'companies');
    for (const company of INITIAL_COMPANIES) {
      const docRef = doc(colRef, company.id);
      await setDoc(docRef, company);
    }
    console.log('Successfully seeded 20 recruiters in Firestore!');
    return { success: true, count: INITIAL_COMPANIES.length };
  } catch (error) {
    console.error('Error seeding companies in Firestore:', error);
    return { success: false, error: error.message };
  }
}
