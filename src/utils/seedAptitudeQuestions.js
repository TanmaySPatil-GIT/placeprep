import { collection, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase.js';

export const INITIAL_APTITUDE_QUESTIONS = [
  // ==========================================
  // QUANTITATIVE APTITUDE (20 QUESTIONS)
  // ==========================================
  {
    id: 'quant-1',
    question: 'If the price of an item increases by 20% and then decreases by 20%, what is the net percentage change in the item\'s price?',
    options: ['0% (No change)', '4% increase', '4% decrease', '2% decrease'],
    correctAnswerIndex: 2,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Let initial price = 100. After 20% increase: 100 * 1.20 = 120. After 20% decrease: 120 * 0.80 = 96. Net change = 96 - 100 = -4% (4% decrease).',
    topicTag: 'Percentages'
  },
  {
    id: 'quant-2',
    question: 'A train 180 meters long is traveling at a speed of 54 km/h. How many seconds will it take to pass a telegraph post?',
    options: ['10 seconds', '12 seconds', '15 seconds', '18 seconds'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Speed in m/s = 54 * (5/18) = 15 m/s. Time = Distance / Speed = 180 / 15 = 12 seconds.',
    topicTag: 'Time-Speed-Distance'
  },
  {
    id: 'quant-3',
    question: 'A seller marks an article at 40% above cost price and allows a discount of 15% on the marked price. What is the profit percentage?',
    options: ['19%', '22%', '25%', '28%'],
    correctAnswerIndex: 0,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Let Cost Price = 100. Marked Price = 140. Selling Price = 140 * (1 - 0.15) = 119. Profit = 119 - 100 = 19%.',
    topicTag: 'Profit and Loss'
  },
  {
    id: 'quant-4',
    question: 'Two numbers are in the ratio 3:5. If 9 is subtracted from each, the ratio becomes 12:23. What is the smaller number?',
    options: ['27', '33', '36', '45'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Let numbers be 3x and 5x. (3x - 9) / (5x - 9) = 12 / 23 => 23(3x - 9) = 12(5x - 9) => 69x - 207 = 60x - 108 => 9x = 99 => x = 11. Smaller number = 3 * 11 = 33.',
    topicTag: 'Ratios'
  },
  {
    id: 'quant-5',
    question: 'Two dice are rolled simultaneously. What is the probability that the sum of the numbers shown is equal to 8?',
    options: ['5/36', '1/6', '7/36', '1/9'],
    correctAnswerIndex: 0,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Total outcomes = 36. Favorable outcomes for sum = 8: (2,6), (3,5), (4,4), (5,3), (6,2) -> 5 outcomes. Probability = 5/36.',
    topicTag: 'Probability'
  },
  {
    id: 'quant-6',
    question: 'A and B together can complete a piece of work in 12 days, while A alone can do it in 20 days. In how many days can B alone complete the work?',
    options: ['25 days', '30 days', '35 days', '40 days'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'A\'s 1-day work = 1/20. (A+B)\'s 1-day work = 1/12. B\'s 1-day work = 1/12 - 1/20 = (5 - 3)/60 = 2/60 = 1/30. B alone takes 30 days.',
    topicTag: 'Time and Work'
  },
  {
    id: 'quant-7',
    question: 'What is the compound interest on $10,000 for 2 years at 10% per annum compounded annually?',
    options: ['2,000', '2,100', '2,200', '2,500'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Amount = 10000 * (1.10)^2 = 10000 * 1.21 = 12,100. CI = 12,100 - 10,000 = 2,100.',
    topicTag: 'Interest'
  },
  {
    id: 'quant-8',
    question: 'The average age of a group of 5 students is 22 years. If a new student aged 28 joins the group, what is the new average age?',
    options: ['23 years', '24 years', '25 years', '26 years'],
    correctAnswerIndex: 0,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Sum of ages of 5 students = 5 * 22 = 110. New sum = 110 + 28 = 138. New average = 138 / 6 = 23 years.',
    topicTag: 'Averages'
  },
  {
    id: 'quant-9',
    question: 'A car covers a distance of 300 km at a speed of 60 km/h and returns at a speed of 40 km/h. What is the average speed for the entire journey?',
    options: ['48 km/h', '50 km/h', '52 km/h', '54 km/h'],
    correctAnswerIndex: 0,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Average speed for equal distances = 2 * v1 * v2 / (v1 + v2) = 2 * 60 * 40 / (60 + 40) = 4800 / 100 = 48 km/h.',
    topicTag: 'Time-Speed-Distance'
  },
  {
    id: 'quant-10',
    question: 'If 15 men can build a wall in 8 days, how many men would be required to build the same wall in 6 days?',
    options: ['18 men', '20 men', '22 men', '24 men'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'M1 * D1 = M2 * D2 => 15 * 8 = M2 * 6 => 120 = 6 * M2 => M2 = 20 men.',
    topicTag: 'Proportions'
  },
  {
    id: 'quant-11',
    question: 'What is 35% of 80 plus 25% of 160?',
    options: ['64', '68', '72', '76'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: '35% of 80 = 0.35 * 80 = 28. 25% of 160 = 0.25 * 160 = 40. Total = 28 + 40 = 68.',
    topicTag: 'Percentages'
  },
  {
    id: 'quant-12',
    question: 'A jar contains red and blue marbles in ratio 4:7. If 6 red marbles are added, the ratio becomes 1:1. How many blue marbles are in the jar?',
    options: ['14', '21', '28', '35'],
    correctAnswerIndex: 0,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Red = 4x, Blue = 7x. (4x + 6) / 7x = 1/1 => 4x + 6 = 7x => 3x = 6 => x = 2. Blue marbles = 7 * 2 = 14.',
    topicTag: 'Ratios'
  },
  {
    id: 'quant-13',
    question: 'A card is drawn at random from a standard deck of 52 cards. What is the probability of drawing a King or a Heart?',
    options: ['4/13', '16/52 (4/13)', '17/52', '9/26'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Kings = 4, Hearts = 13, King of Hearts = 1. Total favorable = 4 + 13 - 1 = 16. Probability = 16/52 = 4/13.',
    topicTag: 'Probability'
  },
  {
    id: 'quant-14',
    question: 'By selling an article for $450, a trader loses 10%. At what price should he sell it to gain 20%?',
    options: ['540', '580', '600', '620'],
    correctAnswerIndex: 2,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Cost Price = 450 / 0.90 = 500. Selling Price for 20% gain = 500 * 1.20 = 600.',
    topicTag: 'Profit and Loss'
  },
  {
    id: 'quant-15',
    question: 'A pipe can fill a tank in 6 hours and another pipe can empty it in 8 hours. If both pipes are opened together, how long will it take to fill the tank?',
    options: ['18 hours', '24 hours', '28 hours', '32 hours'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Net rate = 1/6 - 1/8 = (4 - 3)/24 = 1/24 per hour. Time to fill = 24 hours.',
    topicTag: 'Time and Work'
  },
  {
    id: 'quant-16',
    question: 'The difference between simple interest and compound interest on a sum of money for 2 years at 5% per annum is $25. What is the sum?',
    options: ['8,000', '9,500', '10,000', '12,000'],
    correctAnswerIndex: 2,
    section: 'Quantitative',
    difficulty: 'Hard',
    explanation: 'Difference D = P * (R/100)^2 => 25 = P * (5/100)^2 => 25 = P * (1/400) => P = 25 * 400 = 10,000.',
    topicTag: 'Interest'
  },
  {
    id: 'quant-17',
    question: 'Find the greatest common divisor (GCD) of 144, 180, and 252.',
    options: ['12', '18', '24', '36'],
    correctAnswerIndex: 3,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Prime factors: 144 = 2^4 * 3^2, 180 = 2^2 * 3^2 * 5, 252 = 2^2 * 3^2 * 7. GCD = 2^2 * 3^2 = 36.',
    topicTag: 'Number Systems'
  },
  {
    id: 'quant-18',
    question: 'A solution contains 20% alcohol by volume. How much pure alcohol must be added to 40 liters of this solution to make it a 36% alcohol solution?',
    options: ['8 liters', '10 liters', '12 liters', '15 liters'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Hard',
    explanation: 'Initial alcohol = 0.20 * 40 = 8 liters. Let x liters of pure alcohol be added. (8 + x) / (40 + x) = 0.36 => 8 + x = 14.4 + 0.36x => 0.64x = 6.4 => x = 10 liters.',
    topicTag: 'Mixtures'
  },
  {
    id: 'quant-19',
    question: 'A boat travels 24 km downstream in 3 hours and returns upstream in 6 hours. What is the speed of the current?',
    options: ['1 km/h', '2 km/h', '3 km/h', '4 km/h'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Medium',
    explanation: 'Downstream speed = 24 / 3 = 8 km/h. Upstream speed = 24 / 6 = 4 km/h. Speed of current = (Downstream - Upstream) / 2 = (8 - 4) / 2 = 2 km/h.',
    topicTag: 'Time-Speed-Distance'
  },
  {
    id: 'quant-20',
    question: 'What is the sum of all interior angles of a regular hexagon (6-sided polygon)?',
    options: ['540 degrees', '720 degrees', '900 degrees', '1080 degrees'],
    correctAnswerIndex: 1,
    section: 'Quantitative',
    difficulty: 'Easy',
    explanation: 'Sum of interior angles = (n - 2) * 180 = (6 - 2) * 180 = 4 * 180 = 720 degrees.',
    topicTag: 'Geometry'
  },

  // ==========================================
  // LOGICAL REASONING (15 QUESTIONS)
  // ==========================================
  {
    id: 'logic-1',
    question: 'Statements: All cats are animals. All animals are mammals.\nConclusions:\nI. All cats are mammals.\nII. Some mammals are cats.',
    options: ['Only I follows', 'Only II follows', 'Neither I nor II follows', 'Both I and II follow'],
    correctAnswerIndex: 3,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Since cats ⊂ animals ⊂ mammals, all cats are mammals (I is true). Also, some mammals are cats (II is true). Both I and II follow.',
    topicTag: 'Syllogisms'
  },
  {
    id: 'logic-2',
    question: 'Pointing to a photograph, Mark said, "She is the daughter of my grandfather\'s only son." How is the woman in the photograph related to Mark?',
    options: ['Sister', 'Mother', 'Aunt', 'Cousin'],
    correctAnswerIndex: 0,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Mark\'s grandfather\'s only son is Mark\'s father. The daughter of Mark\'s father is Mark\'s sister.',
    topicTag: 'Blood Relations'
  },
  {
    id: 'logic-3',
    question: 'If in a certain code language, "PYTHON" is written as "QZUIPO", how is "JAVA" written in that same code?',
    options: ['KBWB', 'KCXB', 'KCYB', 'JWBW'],
    correctAnswerIndex: 0,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Each letter is shifted forward by +1 in the alphabet: P+1=Q, Y+1=Z, T+1=U, H+1=I, O+1=P, N+1=O. For JAVA: J+1=K, A+1=B, V+1=W, A+1=B -> KBWB.',
    topicTag: 'Coding-Decoding'
  },
  {
    id: 'logic-4',
    question: 'Complete the series: 3, 7, 15, 31, 63, ?',
    options: ['95', '115', '127', '128'],
    correctAnswerIndex: 2,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Pattern: Each term is (previous * 2) + 1. 3*2+1=7, 7*2+1=15, 15*2+1=31, 31*2+1=63, 63*2+1=127.',
    topicTag: 'Series Completion'
  },
  {
    id: 'logic-5',
    question: 'Statements: No apples are oranges. Some oranges are bananas.\nConclusions:\nI. Some bananas are not apples.\nII. All bananas are apples.',
    options: ['Only I follows', 'Only II follows', 'Either I or II follows', 'Neither follows'],
    correctAnswerIndex: 0,
    section: 'Logical Reasoning',
    difficulty: 'Medium',
    explanation: 'The bananas that are oranges cannot be apples (since no oranges are apples). Thus, those bananas are definitely not apples. Conclusion I follows.',
    topicTag: 'Syllogisms'
  },
  {
    id: 'logic-6',
    question: 'A is B\'s sister. C is B\'s mother. D is C\'s father. E is D\'s mother. How is A related to D?',
    options: ['Granddaughter', 'Grandmother', 'Daughter', 'Niece'],
    correctAnswerIndex: 0,
    section: 'Logical Reasoning',
    difficulty: 'Medium',
    explanation: 'A is B\'s sister, C is mother of A and B. D is father of C. Thus, A is the granddaughter of D.',
    topicTag: 'Blood Relations'
  },
  {
    id: 'logic-7',
    question: 'In a row of 35 students, Rahul is 12th from the left end. What is his position from the right end?',
    options: ['22nd', '23rd', '24th', '25th'],
    correctAnswerIndex: 2,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Position from right = (Total - Position from left) + 1 = (35 - 12) + 1 = 23 + 1 = 24th.',
    topicTag: 'Ranking and Order'
  },
  {
    id: 'logic-8',
    question: 'If "+" means multiplication, "-" means division, "*" means addition, and "/" means subtraction, what is the value of: 12 + 4 * 8 - 2 / 5?',
    options: ['47', '49', '51', '53'],
    correctAnswerIndex: 0,
    section: 'Logical Reasoning',
    difficulty: 'Medium',
    explanation: 'Replacing symbols: 12 * 4 + 8 / 2 - 5 = 48 + 4 - 5 = 47.',
    topicTag: 'Mathematical Reasoning'
  },
  {
    id: 'logic-9',
    question: 'Which word does NOT belong with the others?',
    options: ['Oracle', 'PostgreSQL', 'MongoDB', 'React'],
    correctAnswerIndex: 3,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Oracle, PostgreSQL, and MongoDB are database systems. React is a frontend UI library.',
    topicTag: 'Classification'
  },
  {
    id: 'logic-10',
    question: 'Complete the analogy: Algorithm : Code :: Blueprint : ?',
    options: ['Architect', 'Building', 'Design', 'Foundation'],
    correctAnswerIndex: 1,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'An algorithm is a conceptual plan realized as code; a blueprint is a conceptual plan realized as a physical building.',
    topicTag: 'Analogies'
  },
  {
    id: 'logic-11',
    question: 'Find the missing number in the grid:\n[ 4,  8, 12 ]\n[ 5, 10, 15 ]\n[ 7, 14,  ? ]',
    options: ['18', '21', '24', '28'],
    correctAnswerIndex: 1,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Each row follows the pattern: x, 2x, 3x. For row 3: 7, 7*2=14, 7*3=21.',
    topicTag: 'Matrix Reasoning'
  },
  {
    id: 'logic-12',
    question: 'Five colleagues A, B, C, D, E sit in a line facing North. C sits in the exact middle. A sits at the left end. E sits next to C on the right. Who sits between A and C?',
    options: ['B', 'D', 'E', 'Cannot be determined'],
    correctAnswerIndex: 3,
    section: 'Logical Reasoning',
    difficulty: 'Medium',
    explanation: 'Positions 1 to 5: Pos 1 = A, Pos 3 = C, Pos 4 = E. Position 2 could be either B or D (since no further info is given). Cannot be determined uniquely.',
    topicTag: 'Seating Arrangement'
  },
  {
    id: 'logic-13',
    question: 'Statements: All microservices are APIs. No APIs are monoliths.\nConclusions:\nI. No microservices are monoliths.\nII. Some APIs are microservices.',
    options: ['Only I follows', 'Only II follows', 'Neither follows', 'Both I and II follow'],
    correctAnswerIndex: 3,
    section: 'Logical Reasoning',
    difficulty: 'Easy',
    explanation: 'Microservices ⊂ APIs. APIs ∩ Monoliths = ∅. Thus Microservices ∩ Monoliths = ∅ (I is true). Since microservices exist within APIs, some APIs are microservices (II is true). Both follow.',
    topicTag: 'Syllogisms'
  },
  {
    id: 'logic-14',
    question: 'If South-East becomes North, North-East becomes West, and so on, what will West become?',
    options: ['North-East', 'South-East', 'South-West', 'North-West'],
    correctAnswerIndex: 1,
    section: 'Logical Reasoning',
    difficulty: 'Hard',
    explanation: 'South-East is rotated 135 degrees counter-clockwise to become North. Rotating West by 135 degrees counter-clockwise leads to South-East.',
    topicTag: 'Directions'
  },
  {
    id: 'logic-15',
    question: 'Complete the series: B2D, E3H, H5L, K7P, ?',
    options: ['N11T', 'N9T', 'M11T', 'N11U'],
    correctAnswerIndex: 0,
    section: 'Logical Reasoning',
    difficulty: 'Hard',
    explanation: 'First letters: B(+3)->E(+3)->H(+3)->K(+3)->N. Middle numbers are prime numbers: 2, 3, 5, 7, 11. Last letters: D(+4)->H(+4)->L(+4)->P(+4)->T. Result: N11T.',
    topicTag: 'Alphanumeric Series'
  },

  // ==========================================
  // VERBAL ABILITY (10 QUESTIONS)
  // ==========================================
  {
    id: 'verbal-1',
    question: 'Select the synonym for the word: EPHEMERAL',
    options: ['Permanent', 'Transient', 'Substantial', 'Perpetual'],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: '"Ephemeral" means lasting for a very short time; its synonym is "transient".',
    topicTag: 'Synonyms'
  },
  {
    id: 'verbal-2',
    question: 'Select the antonym for the word: SCARCE',
    options: ['Abundant', 'Rare', 'Deficient', 'Limited'],
    correctAnswerIndex: 0,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: '"Scarce" means insufficient or in short supply; its antonym is "abundant".',
    topicTag: 'Antonyms'
  },
  {
    id: 'verbal-3',
    question: 'Identify the grammatically correct sentence:',
    options: [
      'Neither of the candidate were selected for the final interview.',
      'Neither of the candidates was selected for the final interview.',
      'Neither of the candidates were selected for the final interview.',
      'Neither candidates was selected for the final interview.'
    ],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Medium',
    explanation: '"Neither of" takes a plural noun ("candidates") followed by a singular verb ("was").',
    topicTag: 'Sentence Correction'
  },
  {
    id: 'verbal-4',
    question: 'Fill in the blank: "The team agreed _______ the proposal after a lengthy architectural review."',
    options: ['with', 'to', 'on', 'about'],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: 'One agrees "to" a plan or proposal, agrees "with" a person, and agrees "on" a topic.',
    topicTag: 'Prepositions'
  },
  {
    id: 'verbal-5',
    question: 'Read the short passage: "Decentralized microservice architectures reduce blast radius during system failures, but increase operational complexity in distributed tracing." What is the main idea of this sentence?',
    options: [
      'Microservices completely prevent system failures.',
      'Microservices offer fault isolation at the cost of tracing complexity.',
      'Distributed tracing makes microservices obsolete.',
      'Monolithic applications have higher operational complexity.'
    ],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: 'The passage balances the benefit of reduced blast radius (fault isolation) against the drawback of increased tracing complexity.',
    topicTag: 'Reading Comprehension'
  },
  {
    id: 'verbal-6',
    question: 'Select the correctly spelt word:',
    options: ['Maintainance', 'Maintenance', 'Maintenence', 'Mainteinance'],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: 'The correct spelling is "Maintenance".',
    topicTag: 'Spelling'
  },
  {
    id: 'verbal-7',
    question: 'Choose the option that best expresses the meaning of the idiom: "To hit the nail on the head"',
    options: [
      'To make a physical mistake',
      'To describe exactly what is causing a situation or problem',
      'To build something rapidly',
      'To argue aggressively'
    ],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: '"To hit the nail on the head" means to be precisely accurate or state the exact truth.',
    topicTag: 'Idioms and Phrases'
  },
  {
    id: 'verbal-8',
    question: 'Rearrange the parts to form a coherent sentence:\n(P) scalable cloud solutions\n(Q) engineering teams must\n(R) to deliver reliable systems\n(S) prioritize defensive programming',
    options: ['Q - S - R - P', 'R - Q - S - P', 'Q - S - P - R', 'P - R - Q - S'],
    correctAnswerIndex: 0,
    section: 'Verbal Ability',
    difficulty: 'Medium',
    explanation: 'Coherent sentence: "Engineering teams must (Q) prioritize defensive programming (S) to deliver reliable systems (R) scalable cloud solutions (P)". Correct sequence: Q-S-R-P.',
    topicTag: 'Sentence Rearrangement'
  },
  {
    id: 'verbal-9',
    question: 'Select the word nearest in meaning to: MITIGATE',
    options: ['Aggravate', 'Alleviate', 'Enhance', 'Prolong'],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: '"Mitigate" means to make less severe, serious, or painful; "alleviate" is its synonym.',
    topicTag: 'Synonyms'
  },
  {
    id: 'verbal-10',
    question: 'Fill in the blank: "Despite facing unexpected latency bottlenecks, the engineering team remained _______ and successfully launched the product on schedule."',
    options: ['indifferent', 'resilient', 'hesitant', 'reluctant'],
    correctAnswerIndex: 1,
    section: 'Verbal Ability',
    difficulty: 'Easy',
    explanation: '"Resilient" means recovering quickly from difficult conditions, fitting the positive context of launching on schedule despite bottlenecks.',
    topicTag: 'Vocabulary in Context'
  },

  // ==========================================
  // GENERAL KNOWLEDGE & CURRENT AFFAIRS (15 QUESTIONS)
  // ==========================================
  {
    id: 'gk-1',
    question: 'Which global tech corporation acquired GitHub in 2018 for $7.5 billion in stock?',
    options: ['Google (Alphabet)', 'Microsoft', 'Amazon', 'IBM'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'Microsoft acquired GitHub in October 2018 for $7.5 billion.',
    topicTag: 'Current Affairs - Business'
  },
  {
    id: 'gk-2',
    question: 'What is the primary open-source container orchestration system originally designed by Google and now maintained by the Cloud Native Computing Foundation (CNCF)?',
    options: ['Docker Swarm', 'Kubernetes', 'Apache Mesos', 'OpenShift'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'Kubernetes (K8s) was designed by Google and donated to CNCF in 2015.',
    topicTag: 'Current Affairs - Tech'
  },
  {
    id: 'gk-3',
    question: 'Who is the current Chief Executive Officer (CEO) of Alphabet Inc. and Google?',
    options: ['Satya Nadella', 'Sundar Pichai', 'Shantanu Narayen', 'Arvind Krishna'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'Sundar Pichai has served as CEO of Google since 2015 and CEO of Alphabet since 2019.',
    topicTag: 'Current Affairs - Tech Leaders'
  },
  {
    id: 'gk-4',
    question: 'Which artificial intelligence research laboratory developed the Generative Pre-trained Transformer (GPT) series and ChatGPT?',
    options: ['DeepMind', 'OpenAI', 'Anthropic', 'Meta AI'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'OpenAI developed GPT-3, GPT-4, and ChatGPT.',
    topicTag: 'Current Affairs - Tech'
  },
  {
    id: 'gk-5',
    question: 'In computer networking, what does the acronym HTTP stand for?',
    options: [
      'Hypertext Transfer Protocol',
      'Hypertext Technical Program',
      'High Transfer Text Protocol',
      'Hyperlink Text Transfer Package'
    ],
    correctAnswerIndex: 0,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'HTTP stands for Hypertext Transfer Protocol.',
    topicTag: 'Tech Fundamentals'
  },
  {
    id: 'gk-6',
    question: 'Which Indian city is popularly known as the "Silicon Valley of India" due to its role as the nation\'s leading IT exporter?',
    options: ['Hyderabad', 'Pune', 'Bengaluru (Bangalore)', 'Chennai'],
    correctAnswerIndex: 2,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'Bengaluru (Bangalore) is widely recognized as the Silicon Valley of India.',
    topicTag: 'Indian IT Ecosystem'
  },
  {
    id: 'gk-7',
    question: 'What major government initiative in India launched "Digital India" to transform the country into a digitally empowered society and knowledge economy?',
    options: ['2012', '2015', '2018', '2020'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Medium',
    explanation: 'The Digital India campaign was launched by the Government of India on July 1, 2015.',
    topicTag: 'Government Policy'
  },
  {
    id: 'gk-8',
    question: 'Which semiconductor company became the first chipmaker to cross a $3 trillion market valuation in 2024, driven by high demand for AI GPUs?',
    options: ['Intel', 'TSMC', 'NVIDIA', 'AMD'],
    correctAnswerIndex: 2,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'NVIDIA crossed $3 trillion market cap in June 2024 due to surge in demand for AI accelerators.',
    topicTag: 'Current Affairs - Business'
  },
  {
    id: 'gk-9',
    question: 'What is the name of India\'s indigenous unified real-time payment system developed by the National Payments Corporation of India (NPCI)?',
    options: ['NEFT', 'IMPS', 'UPI (Unified Payments Interface)', 'RTGS'],
    correctAnswerIndex: 2,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'UPI (Unified Payments Interface) was launched by NPCI in 2016 for instant mobile bank transfers.',
    topicTag: 'FinTech & Policy'
  },
  {
    id: 'gk-10',
    question: 'Who is known as the "Father of Modern Computer Science" and the creator of the concept of the Turing Machine?',
    options: ['Charles Babbage', 'Alan Turing', 'John von Neumann', 'Claude Shannon'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'Alan Turing is widely considered the father of theoretical computer science and artificial intelligence.',
    topicTag: 'Tech History'
  },
  {
    id: 'gk-11',
    question: 'Which major cloud provider offers services under the brand name "AWS"?',
    options: ['Microsoft', 'Google', 'Amazon', 'IBM'],
    correctAnswerIndex: 2,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'AWS stands for Amazon Web Services.',
    topicTag: 'Cloud Computing'
  },
  {
    id: 'gk-12',
    question: 'What does "LLM" stand for in the context of modern artificial intelligence and machine learning?',
    options: ['Large Language Model', 'Low Latency Matrix', 'Linear Logic Model', 'Linked Logical Memory'],
    correctAnswerIndex: 0,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'LLM stands for Large Language Model.',
    topicTag: 'Current Affairs - Tech'
  },
  {
    id: 'gk-13',
    question: 'Which IT services company in India is the largest by market capitalization and workforce size?',
    options: ['Infosys', 'Tata Consultancy Services (TCS)', 'Wipro', 'HCLTech'],
    correctAnswerIndex: 1,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'TCS (Tata Consultancy Services) is India\'s largest IT services exporter by revenue and market cap.',
    topicTag: 'Indian IT Ecosystem'
  },
  {
    id: 'gk-14',
    question: 'What is the full form of the regulatory act "GDPR" enforced by the European Union for data privacy?',
    options: [
      'General Data Protection Regulation',
      'Global Digital Privacy Requirement',
      'General Device Protection Standard',
      'Government Data Processing Rules'
    ],
    correctAnswerIndex: 0,
    section: 'General Knowledge',
    difficulty: 'Medium',
    explanation: 'GDPR stands for General Data Protection Regulation, enacted in May 2018.',
    topicTag: 'Tech Policy & Security'
  },
  {
    id: 'gk-15',
    question: 'Which programming language was created by Guido van Rossum and released in 1991?',
    options: ['Java', 'C++', 'Python', 'Ruby'],
    correctAnswerIndex: 2,
    section: 'General Knowledge',
    difficulty: 'Easy',
    explanation: 'Python was created by Guido van Rossum and first released in 1991.',
    topicTag: 'Tech History'
  }
];

export async function seedAptitudeQuestionsInFirestore() {
  try {
    const colRef = collection(db, 'aptitudeQuestions');
    for (const q of INITIAL_APTITUDE_QUESTIONS) {
      const docRef = doc(colRef, q.id);
      await setDoc(docRef, q);
    }
    console.log('Successfully seeded 60 aptitude questions in Firestore!');
    return { success: true, count: INITIAL_APTITUDE_QUESTIONS.length };
  } catch (error) {
    console.error('Error seeding aptitude questions in Firestore:', error);
    return { success: false, error: error.message };
  }
}
