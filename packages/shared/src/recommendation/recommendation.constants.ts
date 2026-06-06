import { SkillRecommendationRule } from "./recommendation-rules";

export const RECOMMENDATION_MATRIX: Record<string, SkillRecommendationRule> = {
  React: {
    critical: [
      "Master React Hooks",
      "State Management Fundamentals",
      "Component Lifecycle Patterns",
    ],
    high: ["Advanced React Patterns", "Performance Optimization in React"],
    medium: [
      "React Testing Library & Jest",
      "Styling in React (CSS Modules, CSS-in-JS)",
    ],
    low: ["Server Components & Next.js Integration", "Custom Hook Design"],
    resourceUrl: "https://react.dev",
  },
  JavaScript: {
    critical: [
      "ES6+ Syntax Fundamentals",
      "Asynchronous JavaScript (Promises & Async/Await)",
      "Closures & Scope Chain",
    ],
    high: [
      "Event Loop & Concurrency Model",
      "Prototypal Inheritance & Prototypes",
    ],
    medium: ["DOM Manipulation & Event Handling", "Modules (ESM & CommonJS)"],
    low: [
      "Memory Management & Garbage Collection",
      "Strict Mode & Modern Best Practices",
    ],
    resourceUrl: "https://developer.mozilla.org/en-US/docs/Web/JavaScript",
  },
  TypeScript: {
    critical: [
      "Basic Types & Interface Declaration",
      "Type Inference & Type Annotations",
      "Generics Fundamentals",
    ],
    high: ["Union & Intersection Types", "Type Guards & Type Assertions"],
    medium: [
      "Utility Types (Partial, Pick, Omit)",
      "Advanced Type Manipulation (Conditional Types)",
    ],
    low: [
      "TypeScript Compilation & tsconfig Configuration",
      "Declaration Files & Module Resolution",
    ],
    resourceUrl: "https://www.typescriptlang.org/docs/",
  },
  "Node.js": {
    critical: [
      "Event Emitter & Core API Fundamentals",
      "File System Operations",
      "Streams & Buffer Handling",
    ],
    high: [
      "Express/Http Core Modules",
      "Error Handling & Global Exception Catching",
    ],
    medium: [
      "npm & Package Management Dependencies",
      "Environment Configuration & Process Object",
    ],
    low: ["Cluster Module & Child Processes", "Memory Profiling & Debugging"],
    resourceUrl: "https://nodejs.org/docs/latest/api/",
  },
  NestJS: {
    critical: [
      "Dependency Injection & Providers",
      "Modules & Controller Routing",
      "Pipes & Validation (class-validator)",
    ],
    high: [
      "Guards & Authentication Middleware",
      "Interceptors & Exception Filters",
    ],
    medium: [
      "Configuration & Custom Config Modules",
      "Database Integration (TypeORM/Prisma)",
    ],
    low: [
      "Microservices & Monorepo Architecture in NestJS",
      "Custom Decorators & Dynamic Modules",
    ],
    resourceUrl: "https://docs.nestjs.com",
  },
  SQL: {
    critical: [
      "Basic SELECT Queries & Filtering",
      "JOIN Operations (INNER, LEFT, RIGHT)",
      "Group By & Aggregate Functions",
    ],
    high: [
      "Subqueries & CTEs (Common Table Expressions)",
      "Database Normalization & Keys",
    ],
    medium: [
      "Index Optimization & Query Plans",
      "Transactions & ACID Properties",
    ],
    low: [
      "Window Functions & Analytical Queries",
      "Database Constraints & Schema Migrations",
    ],
    resourceUrl: "https://www.postgresql.org/docs/",
  },
  DSA: {
    critical: [
      "Time & Space Complexity (Big O)",
      "Basic Arrays & Strings Manipulation",
      "Recursion Fundamentals",
    ],
    high: [
      "Sorting & Searching Algorithms (Binary Search)",
      "Stacks & Queues Implementation",
    ],
    medium: [
      "Tree & Graph Traversal (BFS/DFS)",
      "Hash Tables & Collision Resolution",
    ],
    low: [
      "Dynamic Programming & Greedy Algorithms",
      "Trie & Advanced Data Structures",
    ],
    resourceUrl: "https://en.wikipedia.org/wiki/Data_structure",
  },
};

export const FALLBACK_RULE: SkillRecommendationRule = {
  critical: ["Review general software engineering best practices."],
  high: ["Review basic programming design patterns and system analysis."],
  medium: ["Learn software development lifecycles and clean code strategies."],
  low: ["Explore advanced architectural paradigms and coding style standards."],
  resourceUrl: "https://google.github.io/styleguide/",
};
