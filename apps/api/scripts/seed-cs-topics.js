require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const data = [
  {
    topicName: 'Programming Fundamentals',
    questions: [
      {
        conceptName: 'Data Types & Operators',
        difficulty: 'EASY',
        questionText: 'Which of the following is not a valid C variable name?',
        options: ['int number;', 'float rate;', 'int 2count;', 'char _name;'],
        answer: 'int 2count;'
      },
      {
        conceptName: 'Control Flow & Loops',
        difficulty: 'MEDIUM',
        questionText: 'What is the output of the following C code snippet?\n\nint x = 5;\nif (x = 10) {\n  printf("True");\n} else {\n  printf("False");\n}',
        options: ['True', 'False', 'Compilation Error', 'Runtime Error'],
        answer: 'True'
      },
      {
        conceptName: 'Pointers & Memory',
        difficulty: 'HARD',
        questionText: 'What is a dangling pointer in programming?',
        options: [
          'A pointer that is uninitialized',
          'A pointer pointing to a memory location that has been freed or deleted',
          'A pointer pointing to a null value',
          'A pointer that points to another pointer'
        ],
        answer: 'A pointer pointing to a memory location that has been freed or deleted'
      }
    ]
  },
  {
    topicName: 'Arrays & Strings',
    questions: [
      {
        conceptName: 'Array Indexing & Properties',
        difficulty: 'EASY',
        questionText: 'In a zero-indexed array of size N, what is the index of the last element?',
        options: ['N', 'N - 1', 'N + 1', '0'],
        answer: 'N - 1'
      },
      {
        conceptName: 'String Manipulation',
        difficulty: 'MEDIUM',
        questionText: 'In C programming, which character is automatically appended to the end of a string?',
        options: ['\\n (newline)', '\\t (tab)', '\\0 (null character)', 'Space'],
        answer: '\\0 (null character)'
      },
      {
        conceptName: 'Multidimensional Arrays',
        difficulty: 'HARD',
        questionText: 'For a 2D array A[M][N] stored in row-major order, what is the formula to calculate the address of A[i][j]? (Assume Base Address = B, size of element = W)',
        options: [
          'B + W * (i * N + j)',
          'B + W * (j * M + i)',
          'B + W * (i * M + j)',
          'B + W * (i + j)'
        ],
        answer: 'B + W * (i * N + j)'
      }
    ]
  },
  {
    topicName: 'Sorting & Searching',
    questions: [
      {
        conceptName: 'Basic Searching',
        difficulty: 'EASY',
        questionText: 'What is the worst-case time complexity of Linear Search?',
        options: ['O(1)', 'O(log n)', 'O(n)', 'O(n log n)'],
        answer: 'O(n)'
      },
      {
        conceptName: 'Sorting Complexities',
        difficulty: 'MEDIUM',
        questionText: 'Which sorting algorithm has a worst-case time complexity of O(n log n)?',
        options: ['Bubble Sort', 'Insertion Sort', 'Merge Sort', 'Quick Sort'],
        answer: 'Merge Sort'
      },
      {
        conceptName: 'Advanced Sorting Algorithms',
        difficulty: 'HARD',
        questionText: 'In which scenario does Quick Sort degrade to its worst-case O(n^2) time complexity?',
        options: [
          'When the array is already sorted and the pivot is the first or last element',
          'When all elements are randomly distributed',
          'When the pivot is always the median element',
          'Quick Sort never degrades to O(n^2)'
        ],
        answer: 'When the array is already sorted and the pivot is the first or last element'
      }
    ]
  },
  {
    topicName: 'Hashing',
    questions: [
      {
        conceptName: 'Hash Functions',
        difficulty: 'EASY',
        questionText: 'What is the primary purpose of a hash function in a hash table?',
        options: [
          'To sort the elements in ascending order',
          'To map a key to a specific index in the array',
          'To encrypt the data securely',
          'To compress the size of the data'
        ],
        answer: 'To map a key to a specific index in the array'
      },
      {
        conceptName: 'Collision Resolution',
        difficulty: 'MEDIUM',
        questionText: 'Which of the following is a technique used to handle hash collisions by storing elements in a linked list at the hashed index?',
        options: ['Linear Probing', 'Quadratic Probing', 'Double Hashing', 'Separate Chaining'],
        answer: 'Separate Chaining'
      },
      {
        conceptName: 'Load Factor & Rehashing',
        difficulty: 'HARD',
        questionText: 'If the load factor of a hash table becomes too high, what is the standard operation performed to maintain O(1) average time complexity?',
        options: [
          'Delete half of the elements',
          'Change the hash function without resizing',
          'Rehashing (Resize the table and re-insert elements)',
          'Switch to a binary search tree'
        ],
        answer: 'Rehashing (Resize the table and re-insert elements)'
      }
    ]
  },
  {
    topicName: 'Recursion',
    questions: [
      {
        conceptName: 'Base Conditions',
        difficulty: 'EASY',
        questionText: 'What happens if a recursive function is written without a base case?',
        options: [
          'It executes faster',
          'It throws a syntax error at compile time',
          'It results in infinite recursion causing a Stack Overflow',
          'It defaults to returning 0'
        ],
        answer: 'It results in infinite recursion causing a Stack Overflow'
      },
      {
        conceptName: 'Recursive Tracing',
        difficulty: 'MEDIUM',
        questionText: 'Consider the function:\nint f(int n) {\n  if(n <= 1) return 1;\n  return n * f(n-1);\n}\nWhat is the value of f(4)?',
        options: ['12', '24', '16', '10'],
        answer: '24'
      },
      {
        conceptName: 'Tail Recursion',
        difficulty: 'HARD',
        questionText: 'Why is tail recursion often preferred and optimized by modern compilers over non-tail recursion?',
        options: [
          'It uses less CPU time',
          'It eliminates the need to push a new frame to the call stack for every recursive call',
          'It automatically sorts the output',
          'It is easier to read'
        ],
        answer: 'It eliminates the need to push a new frame to the call stack for every recursive call'
      }
    ]
  },
  {
    topicName: 'Basic Data Structures',
    questions: [
      {
        conceptName: 'Stacks & Queues',
        difficulty: 'EASY',
        questionText: 'Which data structure follows the Last-In-First-Out (LIFO) principle?',
        options: ['Queue', 'Linked List', 'Stack', 'Tree'],
        answer: 'Stack'
      },
      {
        conceptName: 'Linked Lists',
        difficulty: 'MEDIUM',
        questionText: 'What is the time complexity of inserting a new node at the very beginning (head) of a Singly Linked List?',
        options: ['O(1)', 'O(n)', 'O(log n)', 'O(n^2)'],
        answer: 'O(1)'
      },
      {
        conceptName: 'Trees & Graphs',
        difficulty: 'HARD',
        questionText: 'What is the maximum number of nodes possible at level \'L\' of a binary tree? (Assume the root is at level 0)',
        options: ['L^2', '2^L', '2^(L-1)', '2L'],
        answer: '2^L'
      }
    ]
  },
  {
    topicName: 'SQL',
    questions: [
      {
        conceptName: 'Basic Queries',
        difficulty: 'EASY',
        questionText: 'Which SQL keyword is used to retrieve data from a database?',
        options: ['GET', 'EXTRACT', 'SELECT', 'FETCH'],
        answer: 'SELECT'
      },
      {
        conceptName: 'Joins & Aggregations',
        difficulty: 'MEDIUM',
        questionText: 'Which type of JOIN returns all records when there is a match in either the left or right table?',
        options: ['INNER JOIN', 'LEFT JOIN', 'RIGHT JOIN', 'FULL OUTER JOIN'],
        answer: 'FULL OUTER JOIN'
      },
      {
        conceptName: 'Normalization & Transactions',
        difficulty: 'HARD',
        questionText: 'Which Normal Form specifically addresses and removes Multi-Valued Dependencies?',
        options: ['First Normal Form (1NF)', 'Second Normal Form (2NF)', 'Third Normal Form (3NF)', 'Fourth Normal Form (4NF)'],
        answer: 'Fourth Normal Form (4NF)'
      }
    ]
  }
];

async function seed() {
  console.log('Starting seed...');
  let totalInserted = 0;

  for (const item of data) {
    // 1. Ensure Topic exists
    let topic = await prisma.topic.findFirst({ where: { name: item.topicName } });
    if (!topic) {
      topic = await prisma.topic.create({
        data: {
          name: item.topicName,
          code: item.topicName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
        }
      });
      console.log(`Created Topic: ${topic.name}`);
    } else {
      console.log(`Found Topic: ${topic.name}`);
    }

    // 2. Insert Concepts and Questions
    for (const q of item.questions) {
      // Create concept if not exists
      let concept = await prisma.concept.findFirst({
        where: { name: q.conceptName, topicId: topic.id }
      });
      if (!concept) {
        concept = await prisma.concept.create({
          data: {
            name: q.conceptName,
            topicId: topic.id,
            description: `Core concept: ${q.conceptName}`,
            code: q.conceptName.toUpperCase().replace(/[^A-Z0-9]/g, '_')
          }
        });
      }

      // Check if this exact question already exists to avoid duplicates during retries
      const existingQ = await prisma.question.findFirst({
        where: {
          topicId: topic.id,
          questionText: q.questionText
        }
      });

      if (!existingQ) {
        await prisma.question.create({
          data: {
            topicId: topic.id,
            conceptId: concept.id,
            questionText: q.questionText,
            questionStatement: q.questionText, // Using text as statement for MCQ
            answer: q.answer,
            explanation: `Correct answer is ${q.answer}`,
            difficulty: q.difficulty,
            difficultyScore: q.difficulty === 'EASY' ? 20 : (q.difficulty === 'MEDIUM' ? 50 : 80),
            source: 'Manual Seed',
            questionSource: 'MANUAL',
            questionType: 'MCQ',
            estimatedTime: q.difficulty === 'EASY' ? 30 : (q.difficulty === 'MEDIUM' ? 60 : 90),
            mcqData: {
              options: q.options
            }
          }
        });
        totalInserted++;
      }
    }
  }

  console.log(`Seed complete! Inserted ${totalInserted} new questions.`);
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
