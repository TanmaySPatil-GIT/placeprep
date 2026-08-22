import { collection, doc, setDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '../firebase.js';

export const INITIAL_INTERVIEW_RUBRICS = [
  // ==========================================
  // OBJECT-ORIENTED PROGRAMMING (OOP)
  // ==========================================
  {
    topicId: 'oop-inheritance',
    topicName: 'OOP - Inheritance',
    fieldIds: ['sde', 'mobile-dev', 'ml-ai', 'qa-testing'],
    companiesRelevant: ['Google', 'Amazon', 'Microsoft', 'TCS', 'Infosys'],
    keyConcepts: [
      'Inheritance allows a subclass to derive attributes and methods from a superclass to enable code reuse',
      'Establishes a strict "is-a" subtype relationship between parent and child classes',
      'Supports runtime polymorphism via method overriding (subclass re-implementing superclass methods)',
      'Composition ("has-a") is often preferred over inheritance to avoid tight coupling and the fragile base class problem'
    ],
    commonMisconceptions: [
      'Confusing method overriding (same signature, runtime) with method overloading (different signature, compile-time)',
      'Thinking private members of a parent class are directly accessible in child classes',
      'Assuming inheritance is always the best mechanism for reusing code across unrelated classes'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Explain the concept of Inheritance in OOP, contrast it with Composition, and describe a scenario where inheriting from a class would be an anti-pattern.'
  },
  {
    topicId: 'oop-polymorphism',
    topicName: 'OOP - Polymorphism',
    fieldIds: ['sde', 'mobile-dev', 'qa-testing'],
    companiesRelevant: ['Microsoft', 'Amazon', 'Google', 'Cognizant'],
    keyConcepts: [
      'Polymorphism allows objects of different classes to be treated as objects of a common superclass or interface',
      'Compile-time (static) polymorphism is achieved via method overloading and operator overloading',
      'Runtime (dynamic) polymorphism is achieved via method overriding using virtual methods or dynamic dispatch',
      'Interfaces and abstract classes define dynamic contracts without tying callers to concrete implementations'
    ],
    commonMisconceptions: [
      'Believing runtime polymorphism can be resolved at compile time by the compiler',
      'Thinking static methods or private methods can be overridden polymorphically in child classes',
      'Confusing interface implementation with abstract class inheritance'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'What is Polymorphism in object-oriented design? Differentiate between compile-time and runtime polymorphism with concrete code examples.'
  },
  {
    topicId: 'oop-encapsulation-abstraction',
    topicName: 'OOP - Encapsulation & Abstraction',
    fieldIds: ['sde', 'mobile-dev', 'qa-testing', 'business-analyst'],
    companiesRelevant: ['TCS', 'Infosys', 'Wipro', 'Accenture'],
    keyConcepts: [
      'Encapsulation bundles data (attributes) and methods that operate on that data into a single unit (class) while restricting direct access using access modifiers',
      'Abstraction hides background implementation details and reveals only essential interfaces/features to the consumer',
      'Encapsulation protects object internal state integrity through data hiding and invariant validation',
      'Abstraction reduces cognitive complexity by exposing high-level contracts (interfaces/abstract classes)'
    ],
    commonMisconceptions: [
      'Thinking Encapsulation and Abstraction are the exact same concept',
      'Assuming encapsulation is just making all class fields private with public getters and setters without any domain validation',
      'Believing abstraction can only be achieved through interfaces and never through concrete classes or modules'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Explain the difference between Encapsulation and Abstraction in OOP, and show how getter/setter validation protects class invariants.'
  },

  // ==========================================
  // DATABASE MANAGEMENT SYSTEMS (DBMS) & SQL
  // ==========================================
  {
    topicId: 'dbms-normalization',
    topicName: 'DBMS - Normalization',
    fieldIds: ['sde', 'data-science', 'business-analyst'],
    companiesRelevant: ['Amazon', 'TCS', 'Infosys', 'Flipkart', 'Swiggy'],
    keyConcepts: [
      'Normalization structures relational database tables to reduce data redundancy and eliminate update, insertion, and deletion anomalies',
      '1NF requires atomic values and unique tuple identification (no multivalued or composite attributes)',
      '2NF requires 1NF and no partial key dependencies (every non-prime attribute fully depends on the whole primary key)',
      '3NF requires 2NF and no transitive dependencies (non-prime attributes depend ONLY on candidate keys)',
      'Denormalization is intentionally used in read-heavy analytics/OLAP systems to improve query speed by reducing expensive SQL joins'
    ],
    commonMisconceptions: [
      'Believing higher normal forms (e.g. 3NF or BCNF) always guarantee faster SQL query execution',
      'Thinking primary keys must always be single auto-incrementing integers rather than composite or natural keys',
      'Confusing 2NF (eliminating partial key dependence) with 3NF (eliminating transitive non-key dependence)'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Walk through 1NF, 2NF, and 3NF database normalization rules using an e-commerce Order-Item schema example, and explain when denormalization is justified.'
  },
  {
    topicId: 'dbms-transactions-acid',
    topicName: 'DBMS - Transactions & ACID Properties',
    fieldIds: ['sde', 'devops-cloud', 'business-analyst'],
    companiesRelevant: ['Google', 'Amazon', 'Paytm', 'Uber', 'Razorpay'],
    keyConcepts: [
      'Atomicity ensures all operations in a database transaction complete successfully, or all are rolled back (all-or-nothing execution)',
      'Consistency ensures a transaction transitions the database from one valid state to another, maintaining all invariants and constraints',
      'Isolation controls how concurrent transactions interact (Isolation levels: Read Uncommitted, Read Committed, Repeatable Read, Serializable)',
      'Durability guarantees committed transaction changes persist permanently even in the event of system crash or power outage',
      'Read phenomena: Dirty Read, Non-Repeatable Read, and Phantom Read depend on configured transaction isolation level'
    ],
    commonMisconceptions: [
      'Assuming Repeatable Read isolation level prevents Phantom Reads in standard relational databases',
      'Believing Atomicity means concurrent transactions cannot see intermediate changes (that is Isolation)',
      'Thinking database backups provide Durability without write-ahead logging (WAL) or persistent disk sync'
    ],
    difficultyLevel: 'Hard',
    sampleQuestion: 'Explain ACID properties in relational databases. How do isolation levels (Read Committed vs Serializable) handle dirty reads and phantom reads during concurrent bank account transfers?'
  },
  {
    topicId: 'dbms-indexing-b-trees',
    topicName: 'DBMS - Database Indexing & B-Trees',
    fieldIds: ['sde', 'data-science', 'devops-cloud'],
    companiesRelevant: ['Google', 'Amazon', 'Flipkart', 'Microsoft'],
    keyConcepts: [
      'Database indexes use B-Tree / B+Tree structures to reduce search time complexity from O(N) sequential scan to O(log N)',
      'Clustered Index determines the physical storage order of data rows on disk (only 1 clustered index per table)',
      'Non-Clustered Index maintains a separate structure pointing back to data row pointers (multiple allowed per table)',
      'Composite indexes require adherence to the Leftmost Prefix Rule to be utilized effectively by the query optimizer',
      'Indexing accelerates READ queries but adds overhead to INSERT, UPDATE, and DELETE operations due to index tree maintenance'
    ],
    commonMisconceptions: [
      'Believing adding indexes to every column will make all SQL queries faster',
      'Thinking a table can have multiple Clustered Indexes',
      'Assuming a query with WHERE age = 25 AND city = "NYC" can use a composite index on (city, age) if queried in reverse order without optimizer intelligence'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'How do B+Tree database indexes work? Compare Clustered and Non-Clustered indexes and explain why indexing low-cardinality boolean columns is inefficient.'
  },

  // ==========================================
  // DATA STRUCTURES BASICS
  // ==========================================
  {
    topicId: 'ds-arrays-linkedlists',
    topicName: 'Data Structures - Arrays vs Linked Lists',
    fieldIds: ['sde', 'mobile-dev', 'qa-testing'],
    companiesRelevant: ['TCS', 'Infosys', 'Wipro', 'Amazon', 'Microsoft'],
    keyConcepts: [
      'Arrays store elements in contiguous memory blocks, enabling O(1) random access by index',
      'Linked Lists store nodes with data and pointers scattered in memory, requiring O(N) sequential traversal for random access',
      'Inserting or deleting at the beginning or middle of an Array requires O(N) shifting of elements',
      'Singly and Doubly Linked Lists support O(1) insertion/deletion at a known node pointer without element shifting',
      'Arrays benefit heavily from CPU cache locality; Linked Lists suffer from cache misses due to pointer chasing'
    ],
    commonMisconceptions: [
      'Thinking searching for a value in an unsorted Array is O(1) time',
      'Believing Linked List insertion at an arbitrary position is O(1) without accounting for the O(N) traversal time to reach that position',
      'Assuming Linked Lists use less memory than Arrays (pointers add 4-8 bytes overhead per node)'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Compare Arrays and Linked Lists regarding memory layout, cache performance, and time complexity for random access vs insertion.'
  },
  {
    topicId: 'ds-hash-tables',
    topicName: 'Data Structures - Hash Tables & Collision Resolution',
    fieldIds: ['sde', 'mobile-dev', 'ml-ai'],
    companiesRelevant: ['Google', 'Amazon', 'Meta', 'Microsoft'],
    keyConcepts: [
      'Hash Tables map key-value pairs using a hash function to compute array bucket indices for expected O(1) lookup, insertion, and deletion',
      'Collision resolution techniques: Separate Chaining (linked lists/trees at buckets) and Open Addressing (Linear Probing, Quadratic Probing, Double Hashing)',
      'Hash functions must distribute keys uniformly to avoid clustering and bucket collisions',
      'Load factor (N/K) triggers table resizing (rehashing) when exceeded to maintain O(1) average performance',
      'Worst-case lookup degrades to O(N) when all keys hash to the same bucket'
    ],
    commonMisconceptions: [
      'Believing Hash Table lookups are strictly O(1) in the worst-case scenario',
      'Thinking Open Addressing dynamically grows bucket lists like Separate Chaining',
      'Assuming Hash Tables maintain element insertion order by default'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Explain how a Hash Table works under the hood. Compare Separate Chaining and Open Addressing for collision resolution and explain why rehashing is necessary.'
  },
  {
    topicId: 'ds-trees-bst',
    topicName: 'Data Structures - Binary Trees & BST Traversal',
    fieldIds: ['sde', 'mobile-dev', 'ml-ai'],
    companiesRelevant: ['Google', 'Amazon', 'Microsoft', 'Meta'],
    keyConcepts: [
      'Binary Search Tree (BST) property: left child node values < root value < right child node values',
      'BST operations (search, insert, delete) run in O(H) time where H is tree height',
      'Unbalanced BST degrades to a skewed linear chain with O(N) worst-case time complexity',
      'Self-balancing BSTs (AVL, Red-Black Trees) guarantee O(log N) operations by enforcing height balance constraints',
      'Tree Traversals: In-Order (Left-Root-Right, yields sorted values in BST), Pre-Order (Root-Left-Right), Post-Order (Left-Right-Root), Level-Order (BFS)'
    ],
    commonMisconceptions: [
      'Assuming searching a Binary Search Tree is always O(log N) without height balance guarantees',
      'Confusing Binary Trees (max 2 children per node) with Binary Search Trees (ordered key property)',
      'Thinking In-Order traversal yields sorted values for any binary tree, not just BSTs'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'What is a Binary Search Tree? How does In-Order traversal work, and why do self-balancing trees like Red-Black Trees matter?'
  },

  // ==========================================
  // SYSTEM DESIGN FUNDAMENTALS
  // ==========================================
  {
    topicId: 'sysdesign-caching',
    topicName: 'System Design - Caching Strategies & Eviction Policies',
    fieldIds: ['sde', 'devops-cloud', 'mobile-dev'],
    companiesRelevant: ['Google', 'Amazon', 'Netflix', 'Uber', 'Swiggy'],
    keyConcepts: [
      'Caching stores frequently accessed data in fast memory (RAM) to reduce latency and database workload',
      'Cache Placement: Client cache, CDN, API Gateway, Application In-Memory (Redis/Memcached), Database Query Cache',
      'Caching Strategies: Cache-Aside (Lazy Loading), Write-Through, Write-Around, Write-Back (Write-Behind)',
      'Cache Eviction Policies: LRU (Least Recently Used), LFU (Least Frequently Used), FIFO, TTL (Time-To-Live expiration)',
      'Cache invalidation challenges: Cache Stampede (Thundering Herd), Cache Penetration, Cache Breakdown'
    ],
    commonMisconceptions: [
      'Believing Write-Back caching guarantees immediate data durability during sudden system crashes',
      'Thinking Redis is purely an in-memory key-value store without persistence options (RDB/AOF)',
      'Assuming Cache-Aside automatically keeps database and cache in lockstep sync without invalidation logic'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Explain Cache-Aside vs Write-Through caching patterns. How does an LRU cache eviction policy work, and how do you handle cache invalidation?'
  },
  {
    topicId: 'sysdesign-load-balancing',
    topicName: 'System Design - Load Balancing & Scalability',
    fieldIds: ['sde', 'devops-cloud', 'cybersecurity'],
    companiesRelevant: ['Google', 'Amazon', 'Microsoft', 'Netflix', 'Uber'],
    keyConcepts: [
      'Load balancers distribute incoming network traffic across multiple backend servers to ensure high availability and fault tolerance',
      'Layer 4 (Transport) load balancing routes based on IP and TCP/UDP ports; Layer 7 (Application) routes based on HTTP headers, URLs, and cookies',
      'Load balancing algorithms: Round Robin, Weighted Round Robin, Least Connections, IP Hash, Consistent Hashing',
      'Horizontal Scaling (scaling out - adding nodes) vs Vertical Scaling (scaling up - adding CPU/RAM to a single node)',
      'Health checks automatically route traffic away from degraded or crashed server instances'
    ],
    commonMisconceptions: [
      'Believing load balancing alone prevents database bottlenecks without database read-replicas or sharding',
      'Confusing Layer 4 (packet level) routing with Layer 7 (content-aware) routing',
      'Assuming Round Robin algorithm handles servers with unequal compute hardware effectively'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Compare Layer 4 and Layer 7 Load Balancing. How does Consistent Hashing prevent massive key redistribution when backend nodes join or leave a cluster?'
  },
  {
    topicId: 'sysdesign-cap-theorem',
    topicName: 'System Design - CAP Theorem & Distributed Consistency',
    fieldIds: ['sde', 'devops-cloud'],
    companiesRelevant: ['Google', 'Amazon', 'Meta', 'Netflix'],
    keyConcepts: [
      'CAP Theorem states a distributed data store can simultaneously provide at most 2 out of 3 guarantees: Consistency, Availability, Partition Tolerance',
      'Partition Tolerance (P) is non-negotiable in distributed networks due to inevitable network splits and delays',
      'CP Systems (Consistency + Partition Tolerance): Choose data correctness over availability; reject writes if nodes cannot synchronize (e.g. MongoDB, HBase)',
      'AP Systems (Availability + Partition Tolerance): Choose availability over strict consistency; return stale data during partitions and resolve eventual consistency later (e.g. Cassandra, DynamoDB)',
      'PACELC Theorem extends CAP by adding Latency vs Consistency trade-offs during normal non-partitioned operation'
    ],
    commonMisconceptions: [
      'Believing a database can pick C and A and completely drop P in a distributed multi-node network',
      'Thinking Eventual Consistency implies data may remain inconsistent forever',
      'Confusing CAP Consistency (linearizability/strong consistency) with ACID Consistency (valid database state constraints)'
    ],
    difficultyLevel: 'Hard',
    sampleQuestion: 'Explain the CAP Theorem. Why is Partition Tolerance mandatory in distributed systems, and how do CP vs AP databases handle network splits?'
  },

  // ==========================================
  // QA / SOFTWARE TESTING CONCEPTS
  // ==========================================
  {
    topicId: 'qa-stlc-test-pyramid',
    topicName: 'QA - Software Testing Life Cycle & Test Pyramid',
    fieldIds: ['qa-testing', 'sde'],
    companiesRelevant: ['TCS', 'Infosys', 'Wipro', 'Cognizant', 'Accenture'],
    keyConcepts: [
      'Software Testing Life Cycle (STLC) phases: Requirement Analysis, Test Planning, Test Case Development, Test Environment Setup, Test Execution, Test Cycle Closure',
      'Test Pyramid levels: Unit Tests (large base, fast, cheap), Integration Tests (middle layer), UI / End-to-End Tests (top apex, slow, expensive, flaky)',
      'Verification (Are we building the product right?) vs Validation (Are we building the right product?)',
      'Shift-Left Testing pushes quality assurance activities early into the development lifecycle',
      'Defect Lifecycle states: New, Assigned, Open, Fixed, Pending Retest, Retested, Verified, Closed (or Rejected/Deferred)'
    ],
    commonMisconceptions: [
      'Thinking STLC only begins after software coding is 100% complete',
      'Inverting the Test Pyramid by having 80% E2E UI automation tests and 10% unit tests',
      'Confusing Severity (impact on system functionality) with Priority (urgency to fix for business)'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Explain the Software Testing Life Cycle (STLC) phases. Describe the Test Pyramid and explain why over-relying on UI automation tests is an anti-pattern.'
  },
  {
    topicId: 'qa-bva-equivalence',
    topicName: 'QA - Boundary Value Analysis & Equivalence Partitioning',
    fieldIds: ['qa-testing'],
    companiesRelevant: ['TCS', 'Infosys', 'Cognizant', 'Capgemini'],
    keyConcepts: [
      'Equivalence Partitioning (EP) divides input data into valid and invalid partitions where test cases execute one representative value per partition',
      'Boundary Value Analysis (BVA) tests boundary values between partitions (Minimum, Min-1, Min+1, Maximum, Max-1, Max+1)',
      'Defects occur disproportionately at boundary limits of input domains due to off-by-one coding errors',
      'Combinatorial testing techniques: Decision Table Testing, State Transition Testing, Pairwise (All-Pairs) Testing',
      'Positive testing verifies system accepts valid inputs; Negative testing verifies system gracefully handles invalid inputs without crashing'
    ],
    commonMisconceptions: [
      'Thinking testing every single integer value in a range [1..100] is necessary instead of partitioning',
      'Believing Boundary Value Analysis is only applicable to numeric fields and not strings or date ranges',
      'Confusing boundary values with internal array index pointers'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Given an input field accepting password lengths between 8 and 16 characters, derive exact test cases using Boundary Value Analysis and Equivalence Partitioning.'
  },
  {
    topicId: 'qa-selenium-pom',
    topicName: 'QA - Test Automation Frameworks & Page Object Model',
    fieldIds: ['qa-testing'],
    companiesRelevant: ['TCS', 'Infosys', 'Cognizant', 'Wipro', 'Amazon'],
    keyConcepts: [
      'Page Object Model (POM) design pattern creates an object repository for web page UI elements to reduce code duplication and improve test maintenance',
      'Separates UI element locators and action methods from actual test assertions',
      'Explicit Waits (Wait until condition met) are preferred over Implicit Waits or Thread.sleep() to eliminate test flakiness',
      'Locator strategies: ID, CSS Selectors, XPath (Relative XPath preferred over absolute XPath)',
      'Data-Driven Testing framework executes identical test scripts against multiple external data rows (CSV/Excel/JSON)'
    ],
    commonMisconceptions: [
      'Placing test assertions directly inside Page Object classes instead of test script files',
      'Using hardcoded Thread.sleep() calls to resolve async element loading in automation scripts',
      'Believing absolute XPath (/html/body/div[2]/form/input[1]) is resilient to application UI updates'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Explain the Page Object Model (POM) architecture in web test automation. Why are Explicit Waits superior to Thread.sleep(), and how do you organize page classes?'
  },

  // ==========================================
  // DATA SCIENCE, STATISTICS & ML
  // ==========================================
  {
    topicId: 'ds-sql-aggregations-joins',
    topicName: 'SQL - Joins, Aggregations & Window Functions',
    fieldIds: ['data-science', 'business-analyst', 'sde'],
    companiesRelevant: ['Amazon', 'Google', 'Flipkart', 'Zomato', 'Infosys'],
    keyConcepts: [
      'SQL Join types: INNER JOIN (matching rows in both), LEFT JOIN (all left rows + matched right), RIGHT JOIN, FULL OUTER JOIN, CROSS JOIN (Cartesian product)',
      'GROUP BY aggregates rows sharing criteria; HAVING filters aggregated groups (evaluated AFTER GROUP BY); WHERE filters individual rows (evaluated BEFORE GROUP BY)',
      'Window Functions (ROW_NUMBER(), RANK(), DENSE_RANK(), LAG(), LEAD()) compute values across row sets without collapsing rows',
      'Difference between RANK() (gaps in rank sequence on ties) and DENSE_RANK() (no rank sequence gaps on ties)',
      'Subqueries vs Common Table Expressions (CTEs - WITH clause) for readable, maintainable complex analytical queries'
    ],
    commonMisconceptions: [
      'Using aggregate functions (SUM, COUNT) in a WHERE clause instead of a HAVING clause',
      'Confusing ROW_NUMBER() (unique sequential integers) with RANK() and DENSE_RANK() during tie-breaking',
      'Thinking LEFT JOIN excludes unmatched right table rows when filtering right table columns in the WHERE clause without NULL checks'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Compare INNER JOIN vs LEFT JOIN. Explain the difference between ROW_NUMBER(), RANK(), and DENSE_RANK() using an employee salary ranking dataset.'
  },
  {
    topicId: 'ds-stats-hypothesis-testing',
    topicName: 'Statistics - Hypothesis Testing & P-Values',
    fieldIds: ['data-science', 'ml-ai', 'pm'],
    companiesRelevant: ['Google', 'Meta', 'Amazon', 'Uber', 'Netflix'],
    keyConcepts: [
      'Null Hypothesis (H0) assumes no effect or difference; Alternative Hypothesis (H1) assumes a statistically significant effect exists',
      'P-value is the probability of obtaining test results at least as extreme as observed, assuming H0 is true',
      'Type I Error (Alpha, false positive) is rejecting H0 when H0 is true; Type II Error (Beta, false negative) is failing to reject H0 when H1 is true',
      'Statistical Power (1 - Beta) is the probability of correctly detecting a true effect when H1 is true',
      'Confidence Intervals (e.g. 95% CI) estimate the range of plausible values for a population parameter'
    ],
    commonMisconceptions: [
      'Believing the p-value represents the probability that the Null Hypothesis is true',
      'Confusing statistical significance (p < 0.05) with practical or commercial effect size',
      'Assuming failing to reject H0 proves that H0 is true (it only means insufficient evidence to reject)'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Explain Hypothesis Testing in A/B testing. Define P-value, Type I vs Type II errors, and statistical power to a non-technical stakeholder.'
  },
  {
    topicId: 'ds-ml-bias-variance',
    topicName: 'ML - Overfitting, Bias-Variance Tradeoff & Regularization',
    fieldIds: ['data-science', 'ml-ai'],
    companiesRelevant: ['Google', 'Amazon', 'Meta', 'Microsoft'],
    keyConcepts: [
      'Bias Error stems from overly simplistic model assumptions (underfitting - high train & test error)',
      'Variance Error stems from model sensitivity to small fluctuations in training data (overfitting - low train error, high test error)',
      'Irreducible Error represents natural noise in the data',
      'Regularization techniques penalize model complexity: L1 (Lasso - absolute weights penalty, drives feature coefficients to zero for feature selection) and L2 (Ridge - squared weights penalty, shrinks coefficients)',
      'Cross-validation (k-fold CV) evaluates model generalization performance across unseen data splits'
    ],
    commonMisconceptions: [
      'Believing a model with 99.9% training accuracy is automatically a great production model',
      'Thinking L1 and L2 regularization decrease model bias',
      'Confusing Underfitting (high bias) with Overfitting (high variance)'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Explain the Bias-Variance Tradeoff. How do you detect Overfitting, and how do L1 (Lasso) and L2 (Ridge) regularization mitigate it?'
  },
  {
    topicId: 'ds-ml-evaluation-metrics',
    topicName: 'ML - Classification Evaluation Metrics',
    fieldIds: ['data-science', 'ml-ai'],
    companiesRelevant: ['Google', 'Amazon', 'Flipkart', 'Uber'],
    keyConcepts: [
      'Confusion Matrix elements: True Positive (TP), True Negative (TN), False Positive (FP), False Negative (FN)',
      'Accuracy = (TP+TN)/(TP+TN+FP+FN); highly misleading on imbalanced datasets',
      'Precision = TP / (TP + FP); measures exactness (minimizes false alarms, e.g. Spam detection)',
      'Recall (Sensitivity) = TP / (TP + FN); measures completeness (minimizes missed positives, e.g. Cancer / Fraud detection)',
      'F1-Score is the harmonic mean of Precision and Recall; ROC-AUC measures true positive rate vs false positive rate across classification thresholds'
    ],
    commonMisconceptions: [
      'Using Accuracy to evaluate models on severely imbalanced datasets (e.g. 99.9% negative fraud cases)',
      'Thinking Precision and Recall can both be maximized simultaneously without threshold trade-offs',
      'Confusing Precision (denominator TP+FP) with Recall (denominator TP+FN)'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Why is Accuracy a misleading metric for imbalanced fraud detection? Compare Precision, Recall, and F1-Score, and state which metric you would optimize.'
  },

  // ==========================================
  // BEHAVIORAL & HR TOPICS (ALL FIELDS)
  // ==========================================
  {
    topicId: 'behavioral-handling-conflict',
    topicName: 'Behavioral - Handling Team Conflict & Technical Disagreements',
    fieldIds: ['sde', 'qa-testing', 'data-science', 'ml-ai', 'devops-cloud', 'cybersecurity', 'ui-ux', 'pm', 'mobile-dev', 'business-analyst'],
    companiesRelevant: ['Amazon', 'Google', 'Microsoft', 'Meta', 'TCS', 'Infosys'],
    keyConcepts: [
      'Focusing on objective data, benchmarks, and customer impact rather than personal opinions or ego',
      'Actively listening to the peer\'s technical perspectives and seeking to understand their underlying concerns',
      'Adopting Amazon\'s "Have Backbone; Disagree and Commit" principle - advocating strongly during debate, but executing fully once a decision is finalized',
      'De-escalating tension through 1-on-1 dialogue, prototyping proof-of-concepts (PoC), or consulting senior technical architects',
      'Using the STAR method (Situation, Task, Action, Result) to structure the behavioral answer'
    ],
    commonMisconceptions: [
      'Claiming you have never had a conflict or disagreement with a teammate',
      'Describing a situation where you simply surrendered your position without technical justification just to keep peace',
      'Blaming the other person or framing the conflict as a personal argument rather than a professional difference in technical direction'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Describe a time when you strongly disagreed with a teammate or lead on a technical approach. How did you resolve the conflict and what was the outcome?'
  },
  {
    topicId: 'behavioral-ownership-failure',
    topicName: 'Behavioral - Ownership & Taking Accountability for Failure',
    fieldIds: ['sde', 'qa-testing', 'data-science', 'ml-ai', 'devops-cloud', 'cybersecurity', 'ui-ux', 'pm', 'mobile-dev', 'business-analyst'],
    companiesRelevant: ['Amazon', 'Google', 'Microsoft', 'Uber', 'Flipkart'],
    keyConcepts: [
      'Explicitly taking responsibility for mistakes without deflecting blame onto team members, legacy code, or vendors',
      'Conducting a blameless root-cause analysis (e.g. 5 Whys) to diagnose why the failure occurred',
      'Proactively implementing long-term safeguards, automated tests, monitoring, or process improvements to ensure the bug never recurs',
      'Transparently communicating with stakeholders regarding incident timeline, business impact, and remediation',
      'Demonstrating personal growth and lessons learned from the setback'
    ],
    commonMisconceptions: [
      'Downplaying the severity of the mistake or saying "it wasn\'t really my fault because requirements were vague"',
      'Focusing 90% of the response on describing the failure and 10% on the action taken and lessons learned',
      'Thinking ownership means resolving critical production bugs in total isolation without notifying the team'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'Tell me about a time when you made a mistake or owned a feature rollout that failed. What went wrong, how did you handle it, and what did you learn?'
  },
  {
    topicId: 'behavioral-ambiguity-adaptability',
    topicName: 'Behavioral - Navigating Ambiguity & Rapid Adaptability',
    fieldIds: ['sde', 'qa-testing', 'data-science', 'ml-ai', 'devops-cloud', 'cybersecurity', 'ui-ux', 'pm', 'mobile-dev', 'business-analyst'],
    companiesRelevant: ['Google', 'Amazon', 'Meta', 'Apple', 'Microsoft'],
    keyConcepts: [
      'Breaking down vague or underspecified problems into actionable, testable sub-problems',
      'Formulating reasonable assumptions, validating them with stakeholders, and documenting trade-offs',
      'Delivering MVP (Minimum Viable Product) iterations quickly to gather early feedback and iterate',
      'Demonstrating resilience and composure when project requirements or business goals shift unexpectedly',
      'Communicating proactively with cross-functional teams to align expectations under uncertainty'
    ],
    commonMisconceptions: [
      'Waiting passively for someone else to give explicit step-by-step instructions before taking action',
      'Expressing frustration about shifting requirements or lack of complete specifications',
      'Making unverified assumptions without documenting or validating them with domain experts'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Tell me about a project where you were given ambiguous requirements or minimal guidance. How did you define the scope and deliver results?'
  },
  {
    topicId: 'behavioral-prioritization',
    topicName: 'Behavioral - Managing Competing Priorities & Deadlines',
    fieldIds: ['sde', 'qa-testing', 'data-science', 'ml-ai', 'devops-cloud', 'cybersecurity', 'ui-ux', 'pm', 'mobile-dev', 'business-analyst'],
    companiesRelevant: ['Amazon', 'Google', 'Microsoft', 'TCS', 'Infosys'],
    keyConcepts: [
      'Evaluating urgency vs business impact using frameworks like the Eisenhower Matrix or RICE scoring',
      'Communicating early and transparently with stakeholders when deadlines are at risk',
      'Negotiating scope reductions or phase rollouts rather than sacrificing code quality or test coverage',
      'Managing personal bandwidth through focus blocks, task delegation, and clear sprint commitments',
      'Delivering critical high-priority paths on time while scheduling technical debt refactoring'
    ],
    commonMisconceptions: [
      'Saying yes to every request and working unsustainable hours leading to burnout and buggy code',
      'Silently missing a deadline without alerting stakeholders until the final day',
      'Arbitrarily dropping tasks without aligning with product managers or engineering leads'
    ],
    difficultyLevel: 'Easy',
    sampleQuestion: 'How do you prioritize your work when faced with multiple urgent tasks and tight deadlines? Give a specific real-world example.'
  },

  // ==========================================
  // DEVOPS & CYBERSECURITY
  // ==========================================
  {
    topicId: 'devops-cicd-iac',
    topicName: 'DevOps - CI/CD Pipelines & Infrastructure as Code',
    fieldIds: ['devops-cloud', 'sde'],
    companiesRelevant: ['Amazon', 'Google', 'Microsoft', 'Netflix'],
    keyConcepts: [
      'Continuous Integration (CI) automatically builds and runs unit/integration tests on every code commit',
      'Continuous Deployment (CD) automatically deploys verified build artifacts to staging/production environments',
      'Infrastructure as Code (IaC) tools (Terraform, CloudFormation) provision and manage cloud infrastructure declaratively using version-controlled code',
      'Deployment strategies: Blue/Green deployment, Canary releases, Rolling updates to minimize downtime and risk',
      'Idempotency in IaC ensures running code multiple times produces the exact same infrastructure state'
    ],
    commonMisconceptions: [
      'Thinking CI/CD means pushing untested code straight to production automatically',
      'Manually modifying cloud infrastructure resources via Web UI console while using Terraform',
      'Confusing Continuous Delivery (manual final approval gate to prod) with Continuous Deployment (automated prod release)'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Explain CI/CD pipeline stages. Compare Blue/Green and Canary deployment strategies and explain why Infrastructure as Code (IaC) is essential for cloud reliability.'
  },
  {
    topicId: 'cybersecurity-owasp-auth',
    topicName: 'Cybersecurity - OWASP Top 10 & AuthN vs AuthZ',
    fieldIds: ['cybersecurity', 'sde', 'devops-cloud'],
    companiesRelevant: ['Google', 'Amazon', 'Microsoft', 'Goldman Sachs'],
    keyConcepts: [
      'Authentication (AuthN) verifies WHO a user is (e.g. passwords, MFA, JWT, OAuth); Authorization (AuthZ) verifies WHAT a user can access (e.g. RBAC, ABAC)',
      'OWASP Top 10 vulnerabilities: Broken Access Control, Cryptographic Failures, Injection (SQLi, XSS), Insecure Design, Security Misconfiguration',
      'Preventing SQL Injection using parameterized queries / prepared statements instead of string concatenation',
      'Preventing Cross-Site Scripting (XSS) by encoding output and implementing Content Security Policy (CSP)',
      'Principle of Least Privilege grants users/services only the minimum access permissions necessary to perform their role'
    ],
    commonMisconceptions: [
      'Confusing Authentication (identity verification) with Authorization (permission check)',
      'Believing sanitizing input strings with regex completely eliminates SQL Injection without prepared statements',
      'Thinking storing passwords using simple MD5 or SHA-256 hashes is secure (salt + bcrypt/Argon2 required)'
    ],
    difficultyLevel: 'Medium',
    sampleQuestion: 'Distinguish between Authentication and Authorization. Explain SQL Injection and Cross-Site Scripting (XSS) from OWASP Top 10 and how to prevent them in web applications.'
  }
];

/**
 * Seeds the `interviewRubrics` Firestore collection with initial rubric topics.
 */
export async function seedInterviewRubricsInFirestore() {
  try {
    const colRef = collection(db, 'interviewRubrics');
    let seededCount = 0;
    for (const rubric of INITIAL_INTERVIEW_RUBRICS) {
      const docRef = doc(colRef, rubric.topicId);
      await setDoc(docRef, rubric);
      seededCount++;
    }
    console.log(`Successfully seeded ${seededCount} interview rubrics in Firestore!`);
    return { success: true, count: seededCount };
  } catch (error) {
    console.error('Error seeding interview rubrics in Firestore:', error);
    return { success: false, error: error.message };
  }
}

/**
 * Fetches all interview rubrics from Firestore.
 * Falls back to INITIAL_INTERVIEW_RUBRICS if collection is empty or fetch fails.
 */
export async function fetchInterviewRubricsFromFirestore() {
  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('interviewRubrics fetch timeout')), 4000)
    );
    const snap = await Promise.race([
      getDocs(collection(db, 'interviewRubrics')),
      timeoutPromise
    ]);
    if (!snap.empty) {
      return snap.docs.map(docSnap => ({
        topicId: docSnap.id,
        ...docSnap.data()
      }));
    } else {
      console.log('interviewRubrics collection empty in Firestore, auto-seeding...');
      seedInterviewRubricsInFirestore().catch(() => {});
      return INITIAL_INTERVIEW_RUBRICS;
    }
  } catch (error) {
    console.warn('Error fetching interviewRubrics from Firestore, using initial fallback:', error.message);
    return INITIAL_INTERVIEW_RUBRICS;
  }
}

/**
 * Fetches rubrics applicable to a specific fieldId (e.g. 'sde', 'qa-testing', 'data-science').
 */
export async function fetchInterviewRubricsByField(fieldId) {
  try {
    const allRubrics = await fetchInterviewRubricsFromFirestore();
    return allRubrics.filter(r => r.fieldIds && r.fieldIds.includes(fieldId));
  } catch (error) {
    console.warn(`Error filtering rubrics for fieldId ${fieldId}:`, error.message);
    return INITIAL_INTERVIEW_RUBRICS.filter(r => r.fieldIds && r.fieldIds.includes(fieldId));
  }
}
