/**
 * Curated Recruiter Insights Dataset ("What [Company] Actually Looks For")
 * Keyed by company name.
 */
export const COMPANY_INSIGHTS = {
  Google: {
    company: 'Google',
    summary: 'Google evaluates candidates on Googliness, system architecture trade-offs, and algorithmic efficiency. Interviewers expect candidates to speak out loud while solving problems and actively discuss Big-O space and time complexity before writing code.',
    typicalRounds: [
      'Stage 1: Resume Screening & Keyword Match',
      'Stage 3: Technical Domain MCQs (OS, Networking, Distributed Systems)',
      'Stage 4: Algorithmic Coding (Hard DSA & Dynamic Programming)',
      'Stage 5: Technical Voice Interview (System Design & Scalability)',
      'Stage 6: HR & Googliness Behavioral Round (STAR Method)'
    ],
    commonMistakes: [
      'Writing code immediately without clarifying constraints or discussing time complexity trade-offs first.',
      'Failing to test edge cases such as empty input arrays, duplicates, or large numerical bounds.'
    ],
    proTip: 'Always state your brute-force approach first, then explain how you will optimize it using hash maps or two-pointer techniques.'
  },

  Amazon: {
    company: 'Amazon',
    summary: 'Amazon heavily emphasizes their 16 Leadership Principles (LPs) alongside core Data Structures & Algorithms. Expect deep behavioral probing using the STAR method (Situation, Task, Action, Result) with specific data metrics.',
    typicalRounds: [
      'Stage 1: Resume ATS Screening',
      'Stage 2: Aptitude & Logical Speed Test',
      'Stage 3: Core CS MCQs (OOP, DBMS, OS)',
      'Stage 4: DSA Coding Round (Trees, Graphs, Hash Tables)',
      'Stage 5: Technical Architecture Interview',
      'Stage 6: HR & Bar Raiser LP Interview (Customer Obsession, Ownership)'
    ],
    commonMistakes: [
      'Giving vague behavioral answers without quantifying the final business result or personal contribution.',
      'Ignoring space complexity optimization in sliding window and graph traversal questions.'
    ],
    proTip: 'Format every behavioral answer strictly as: Situation (20%), Task (10%), Action (50%), Result (20%).'
  },

  Microsoft: {
    company: 'Microsoft',
    summary: 'Microsoft looks for growth mindset, clean production-ready code, and clear explanation of object-oriented design patterns. They value candidates who write modular, maintainable code rather than clever one-liners.',
    typicalRounds: [
      'Stage 1: Resume Screening',
      'Stage 2: Quantitative Aptitude Test',
      'Stage 3: Technical MCQs (OOP, System Architecture)',
      'Stage 4: Coding Round (Binary Trees, Strings, Arrays)',
      'Stage 5: Technical Deep-Dive & Low-Level Design',
      'Stage 6: HR & Culture Fit Interview'
    ],
    commonMistakes: [
      'Over-engineering simple problem statements instead of building modular, clean classes.',
      'Not asking clarifying questions about boundary inputs or memory constraints.'
    ],
    proTip: 'Focus on readable variable naming and modular helper functions during live coding.'
  },

  'TCS Digital': {
    company: 'TCS Digital',
    summary: 'TCS Digital evaluates speed and accuracy in quantitative aptitude, core CS fundamentals (DBMS, SQL, Operating Systems), and practical coding skills in Python, Java, or C++.',
    typicalRounds: [
      'Stage 1: Resume Screening',
      'Stage 2: High-Speed Aptitude & Logical Reasoning',
      'Stage 3: Technical MCQs (SQL, DBMS, OS, Networks)',
      'Stage 4: Hands-on Coding Round (Arrays, Strings, Recursion)',
      'Stage 5: Technical Voice Interview',
      'Stage 6: HR & Behavioral Round'
    ],
    commonMistakes: [
      'Spending too much time on hard aptitude questions instead of securing quick easy marks.',
      'Weak SQL query writing (JOINs, GROUP BY, subqueries).'
    ],
    proTip: 'Prioritize speed in Stage 2 Aptitude and ensure 100% test case pass rate in Stage 4 Coding.'
  },

  Meta: {
    company: 'Meta',
    summary: 'Meta values rapid problem solving, speed in DSA coding, and direct communication. Interviewers expect candidates to complete 2 medium-to-hard coding problems within 45 minutes with flawless execution.',
    typicalRounds: [
      'Stage 1: Resume ATS Screening',
      'Stage 3: Technical MCQs (Distributed Systems, Performance)',
      'Stage 4: High-Speed DSA Coding (Strings, Heaps, Graph BFS/DFS)',
      'Stage 5: Technical System Design & Product Architecture',
      'Stage 6: HR & Meta Culture Fit Round'
    ],
    commonMistakes: [
      'Taking longer than 15-20 minutes per coding problem.',
      'Not communicating out loud during execution.'
    ],
    proTip: 'Practice speed-coding standard LeetCode Medium problems with a strict 15-minute timer.'
  },

  Apple: {
    company: 'Apple',
    summary: 'Apple focuses deeply on hardware-software optimization, OS internals, memory management, and attention to perfection in code implementation.',
    typicalRounds: [
      'Stage 1: Resume Screening',
      'Stage 3: Technical MCQs (C/C++, OS Memory, Threads)',
      'Stage 4: DSA Coding Round (Pointers, Memory Allocation, Arrays)',
      'Stage 5: Technical Interview (Concurrency & System Internals)',
      'Stage 6: HR & Passion Alignment Round'
    ],
    commonMistakes: [
      'Failing to account for thread safety, race conditions, or memory leaks.',
      'Lack of domain-specific depth in operating systems and pointers.'
    ],
    proTip: 'Review C++ memory management, pointers, concurrency primitives, and OS virtual memory.'
  },

  Infosys: {
    company: 'Infosys',
    summary: 'Infosys (Power Programmer / HackWithInfy tracks) tests foundational problem-solving, logical reasoning, and structured software development practices.',
    typicalRounds: [
      'Stage 1: Resume Screening',
      'Stage 2: Quantitative Aptitude & Analytical Ability',
      'Stage 3: Core CS MCQs (Data Structures, OOP, DBMS)',
      'Stage 4: Coding Test (Strings, Dynamic Programming, Arrays)',
      'Stage 5: Technical Interview',
      'Stage 6: HR Interview'
    ],
    commonMistakes: [
      'Submitting code with unhandled null/empty pointer checks.',
      'Incomplete coverage of edge test cases.'
    ],
    proTip: 'Ensure your code handles zero inputs, negative values, and maximum integer constraints.'
  },

  Accenture: {
    company: 'Accenture',
    summary: 'Accenture assesses cognitive ability, pseudo-code analysis, core CS fundamentals, and professional communication skills.',
    typicalRounds: [
      'Stage 1: Resume Screening',
      'Stage 2: Cognitive & Critical Reasoning Test',
      'Stage 3: Technical & Pseudo-Code MCQs',
      'Stage 4: Coding Round',
      'Stage 5: Communication & Technical Interview',
      'Stage 6: HR Interview'
    ],
    commonMistakes: [
      'Misinterpreting pseudo-code loop boundary conditions during MCQs.',
      'Hesitant spoken communication during the interview round.'
    ],
    proTip: 'Double-check loop increment conditions and practice clear, confident vocal responses.'
  }
};

/**
 * Fallback insight generator for any company not explicitly listed above
 */
export function getCompanyInsight(companyName = 'Google') {
  if (COMPANY_INSIGHTS[companyName]) {
    return COMPANY_INSIGHTS[companyName];
  }

  return {
    company: companyName,
    summary: `${companyName} evaluates candidates on core technical competence, domain fundamentals, clean code readability, and clear structured communication.`,
    typicalRounds: [
      'Stage 1: Resume ATS Screening',
      'Stage 2: Aptitude & Logical Test',
      'Stage 3: Technical Domain MCQs',
      'Stage 4: Live Coding Round',
      'Stage 5: Technical Voice Interview',
      'Stage 6: HR & Cultural Alignment'
    ],
    commonMistakes: [
      'Writing code without explaining time and space complexity upfront.',
      'Providing unstructured answers to behavioral questions.'
    ],
    proTip: 'Focus on clear step-by-step problem breakdown and articulate your trade-offs out loud.'
  };
}
