import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function fixTwoSumAndPrime() {
  console.log("Fixing Two Sum and Prime Number coding questions...");

  // 1. Two Sum (cms4j5jyl002a42qyrycjo42d)
  const twoSumCodingData = {
    problemTitle: "Two Sum",
    functionName: "twoSum",
    starterCode: {
      python: "def twoSum(nums, target):\n    # Implement your solution here\n    pass\n",
      javascript: "function twoSum(nums, target) {\n    // Implement your solution here\n    return [];\n}\n",
      typescript: "function twoSum(nums: number[], target: number): number[] {\n    // Implement your solution here\n    return [];\n}\n",
      java: "class Solution {\n    public int[] twoSum(int[] nums, int target) {\n        // Implement your solution here\n        return new int[0];\n    }\n}\n",
      cpp: "#include <vector>\nusing namespace std;\n\nclass Solution {\npublic:\n    vector<int> twoSum(vector<int>& nums, int target) {\n        // Implement your solution here\n        return {};\n    }\n};\n"
    },
    publicTests: [
      {
        input: { nums: [2, 7, 11, 15], target: 9 },
        expectedOutput: { result: [0, 1] },
        isPublic: true,
        isStress: false,
        isBoundary: false,
        explanation: "nums[0] + nums[1] == 2 + 7 == 9"
      },
      {
        input: { nums: [3, 2, 4], target: 6 },
        expectedOutput: { result: [1, 2] },
        isPublic: true,
        isStress: false,
        isBoundary: false,
        explanation: "nums[1] + nums[2] == 2 + 4 == 6"
      }
    ],
    hiddenTests: [
      {
        input: { nums: [3, 3], target: 6 },
        expectedOutput: { result: [0, 1] },
        isPublic: false,
        isStress: false,
        isBoundary: false,
        explanation: "Hidden test #1"
      },
      {
        input: { nums: [1, 5, 8, 12, 17], target: 20 },
        expectedOutput: { result: [1, 4] },
        isPublic: false,
        isStress: false,
        isBoundary: false,
        explanation: "Hidden test #2"
      }
    ],
    boundaryTests: [
      {
        input: { nums: [-3, 4, 3, 90], target: 0 },
        expectedOutput: { result: [0, 2] },
        isPublic: false,
        isStress: false,
        isBoundary: true,
        explanation: "Negative values"
      }
    ],
    stressTests: [
      {
        input: { nums: Array.from({ length: 1000 }, (_, i) => i + 1), target: 1999 },
        expectedOutput: { result: [998, 999] },
        isPublic: false,
        isStress: true,
        isBoundary: false,
        explanation: "Stress load test"
      }
    ]
  };

  await prisma.question.update({
    where: { id: "cms4j5jyl002a42qyrycjo42d" },
    data: {
      questionType: "CODING",
      codingData: twoSumCodingData
    }
  });

  // 2. Prime Number (cms4ja465002n42qyajlvjcnr)
  const primeCodingData = {
    problemTitle: "Prime Number Check",
    functionName: "isPrime",
    starterCode: {
      python: "def isPrime(n):\n    # Implement your solution here\n    pass\n",
      javascript: "function isPrime(n) {\n    // Implement your solution here\n    return false;\n}\n",
      typescript: "function isPrime(n: number): boolean {\n    // Implement your solution here\n    return false;\n}\n",
      java: "class Solution {\n    public boolean isPrime(int n) {\n        // Implement your solution here\n        return false;\n    }\n}\n",
      cpp: "class Solution {\npublic:\n    bool isPrime(int n) {\n        // Implement your solution here\n        return false;\n    }\n};\n"
    },
    publicTests: [
      {
        input: { n: 7 },
        expectedOutput: { result: true },
        isPublic: true,
        isStress: false,
        isBoundary: false,
        explanation: "7 has no divisors other than 1 and 7"
      },
      {
        input: { n: 4 },
        expectedOutput: { result: false },
        isPublic: true,
        isStress: false,
        isBoundary: false,
        explanation: "4 is divisible by 2"
      }
    ],
    hiddenTests: [
      {
        input: { n: 13 },
        expectedOutput: { result: true },
        isPublic: false,
        isStress: false,
        isBoundary: false,
        explanation: "Hidden test #1"
      },
      {
        input: { n: 1 },
        expectedOutput: { result: false },
        isPublic: false,
        isStress: false,
        isBoundary: false,
        explanation: "1 is not prime"
      }
    ],
    boundaryTests: [
      {
        input: { n: 2 },
        expectedOutput: { result: true },
        isPublic: false,
        isStress: false,
        isBoundary: true,
        explanation: "Smallest prime number"
      }
    ],
    stressTests: [
      {
        input: { n: 1000003 },
        expectedOutput: { result: true },
        isPublic: false,
        isStress: true,
        isBoundary: false,
        explanation: "Large prime test"
      }
    ]
  };

  await prisma.question.update({
    where: { id: "cms4ja465002n42qyajlvjcnr" },
    data: {
      questionType: "CODING",
      codingData: primeCodingData
    }
  });

  // Patch in TestInstanceQuestion snapshots
  const tiqTwoSum = await prisma.testInstanceQuestion.findUnique({
    where: { id: "cmt8gm3qt002bhff1yr7ckm0k" }
  });
  if (tiqTwoSum) {
    const snap: any = tiqTwoSum.questionSnapshot || {};
    await prisma.testInstanceQuestion.update({
      where: { id: tiqTwoSum.id },
      data: {
        questionSnapshot: {
          ...snap,
          questionType: "CODING",
          codingData: twoSumCodingData
        }
      }
    });
  }

  const tiqPrime = await prisma.testInstanceQuestion.findUnique({
    where: { id: "cmt8gm3qt002chff1y777jzkv" }
  });
  if (tiqPrime) {
    const snap: any = tiqPrime.questionSnapshot || {};
    await prisma.testInstanceQuestion.update({
      where: { id: tiqPrime.id },
      data: {
        questionSnapshot: {
          ...snap,
          questionType: "CODING",
          codingData: primeCodingData
        }
      }
    });
  }

  console.log("Successfully updated Two Sum and Prime Number coding questions and snapshots.");
}

fixTwoSumAndPrime().catch(console.error).finally(() => prisma.$disconnect());
