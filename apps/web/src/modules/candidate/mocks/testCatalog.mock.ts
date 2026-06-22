import { Test } from '../types/Test';

const BASE_TESTS: Test[] = [
  {
    id: 'tcs-nqt-001',
    company: 'Tata Consultancy Services',
    title: 'TCS NQT Cognitive Assessment',
    description:
      'The National Qualifier Test (NQT) assesses cognitive skills, including numerical, verbal, and reasoning abilities. This test is a prerequisite for all TCS hiring processes.',
    durationMinutes: 90,
    totalQuestions: 60,
    difficulty: 'Medium',
    sections: [
      { id: 'sec-1', name: 'Numerical Ability', questionCount: 20, durationMinutes: 30 },
      { id: 'sec-2', name: 'Verbal Ability', questionCount: 20, durationMinutes: 30 },
      { id: 'sec-3', name: 'Reasoning Ability', questionCount: 20, durationMinutes: 30 },
    ],
    syllabus: [
      'Arithmetic, Algebra, Geometry, and Mensuration',
      'Reading Comprehension, Cloze Test, and Sentence Correction',
      'Data Interpretation, Syllogisms, and Coding-Decoding',
    ],
    eligibility: [
      'Pre-final or final year students of BE/B.Tech/ME/M.Tech/MCA/M.Sc',
      'Minimum 60% or 6 CGPA throughout academics',
      'No active backlogs at the time of appearing',
    ],
  },
  {
    id: 'react-core-002',
    company: 'Meta Inc.',
    title: 'React & Frontend Core Assessment',
    description:
      'A comprehensive evaluation of React framework fundamentals, component lifecycle, state management, hooks, and performance tuning techniques.',
    durationMinutes: 60,
    totalQuestions: 40,
    difficulty: 'Hard',
    sections: [
      { id: 'sec-1', name: 'React Hooks & State', questionCount: 15, durationMinutes: 20 },
      { id: 'sec-2', name: 'Performance Optimization', questionCount: 10, durationMinutes: 15 },
      { id: 'sec-3', name: 'Web Core & DOM', questionCount: 15, durationMinutes: 25 },
    ],
    syllabus: [
      'React Fiber architecture, Reconciliation, and Virtual DOM',
      'State management (Zustand, Redux, Context API)',
      'Custom Hooks, memoization (useMemo, useCallback), and code splitting',
    ],
    eligibility: [
      'Basic familiarity with JavaScript ES6+ syntax',
      'Understanding of component architecture and basic styling',
      'Prior hands-on project experience with React',
    ],
  },
  {
    id: 'python-dsa-003',
    company: 'Google LLC',
    title: 'Python DSA & Algorithm Bootcamp',
    description:
      'Evaluate your problem-solving capabilities using Python. Covers tree traversal, graph algorithms, dynamic programming, and complexity analysis.',
    durationMinutes: 120,
    totalQuestions: 3,
    difficulty: 'Hard',
    sections: [
      { id: 'sec-1', name: 'Arrays & Strings', questionCount: 1, durationMinutes: 30 },
      { id: 'sec-2', name: 'Trees & Graphs', questionCount: 1, durationMinutes: 45 },
      { id: 'sec-3', name: 'Dynamic Programming', questionCount: 1, durationMinutes: 45 },
    ],
    syllabus: [
      'Big O notation, sorting, and binary search',
      'Trees, BST, AVL tree, Graphs (BFS, DFS, Dijkstra)',
      'Dynamic Programming: Memoization vs Tabulation',
    ],
    eligibility: [
      'Proficiency in Python programming language',
      'Strong mathematical and logical reasoning skills',
      'Understanding of basic computer science data structures',
    ],
  },
  {
    id: 'js-fundamentals-004',
    company: 'Amazon Web Services',
    title: 'JavaScript Core Foundations',
    description:
      'Test your understanding of JavaScript engine internals, Event Loop, prototype chain, closures, scope, async/await, and promises.',
    durationMinutes: 45,
    totalQuestions: 30,
    difficulty: 'Easy',
    sections: [
      { id: 'sec-1', name: 'Scope & Closures', questionCount: 10, durationMinutes: 15 },
      { id: 'sec-2', name: 'Asynchronous JS', questionCount: 10, durationMinutes: 15 },
      { id: 'sec-3', name: 'Prototypes & Objects', questionCount: 10, durationMinutes: 15 },
    ],
    syllabus: [
      'Variable hoisting, lexical scope, closure execution context',
      'Promises, microtask queue, macrotask queue, event loop phases',
      'Prototype chain inheritance, Object.create, class syntax',
    ],
    eligibility: [
      'Basic web development knowledge (HTML/CSS)',
      'Familiarity with writing simple JavaScript scripts',
      'Modern web browser usage',
    ],
  },
  {
    id: 'sys-design-005',
    company: 'Netflix',
    title: 'High-Level System Design Challenge',
    description:
      'Assess architectural design patterns, microservices design, caching strategies, horizontal/vertical scaling, database replication, and load balancing.',
    durationMinutes: 90,
    totalQuestions: 15,
    difficulty: 'Hard',
    sections: [
      { id: 'sec-1', name: 'System Architecture', questionCount: 5, durationMinutes: 30 },
      { id: 'sec-2', name: 'Database & Caching', questionCount: 5, durationMinutes: 30 },
      { id: 'sec-3', name: 'Scale & Reliability', questionCount: 5, durationMinutes: 30 },
    ],
    syllabus: [
      'Monolithic vs Microservices architecture, API gateways',
      'Sharding, Master-Slave replication, CAP Theorem, Redis caching',
      'CDN integration, rate limiting, circuit breaker patterns',
    ],
    eligibility: [
      'Prior backend application development experience recommended',
      'Understanding of client-server request-response protocols',
      'Familiarity with SQL vs NoSQL database architectures',
    ],
  },
];

const COMPANIES = [
  'Microsoft',
  'Apple',
  'Adobe',
  'Uber',
  'Salesforce',
  'Atlassian',
  'Cisco',
  'Intel',
  'Dell',
  'HP',
];

const TOPICS = [
  'Machine Learning',
  'Cloud Architecture',
  'Kubernetes & DevOps',
  'Cybersecurity Fundamentals',
  'SQL Database Administration',
  'Node.js Backend Engineering',
  'UX/UI Design Principles',
  'Product Management Basics',
  'Data Science with Pandas',
  'Java Spring Boot Services',
];

const DIFFICULTIES: ('Easy' | 'Medium' | 'Hard')[] = ['Easy', 'Medium', 'Hard'];

// Generate 100 mock assessments
export const mockTestCatalog: Test[] = [...BASE_TESTS];

for (let i = BASE_TESTS.length + 1; i <= 100; i++) {
  const company = COMPANIES[i % COMPANIES.length];
  const topic = TOPICS[i % TOPICS.length];
  const difficulty = DIFFICULTIES[i % DIFFICULTIES.length];
  const duration = 30 + (i % 7) * 15;
  const questions = 20 + (i % 5) * 10;

  mockTestCatalog.push({
    id: `generated-test-${i}`,
    company,
    title: `${company} ${topic} Prep ${i}`,
    description: `Evaluate your competency in ${topic} with this mock test compiled in collaboration with engineering teams at ${company}. Great for interview preparation.`,
    durationMinutes: duration,
    totalQuestions: questions,
    difficulty,
    sections: [
      {
        id: `sec-g-1-${i}`,
        name: 'Foundational Knowledge',
        questionCount: Math.floor(questions / 2),
        durationMinutes: Math.floor(duration / 2),
      },
      {
        id: `sec-g-2-${i}`,
        name: 'Practical Applications',
        questionCount: Math.ceil(questions / 2),
        durationMinutes: Math.ceil(duration / 2),
      },
    ],
    syllabus: [
      `Introduction to ${topic} core standards`,
      `Practical case studies in ${topic} workflows`,
      `Advanced troubleshooting and optimization patterns`,
    ],
    eligibility: [
      `Familiarity with basic ${topic} topics`,
      `Completion of introductory coursework or equivalent work`,
      `High-speed internet and standard camera/microphone setup`,
    ],
  });
}
