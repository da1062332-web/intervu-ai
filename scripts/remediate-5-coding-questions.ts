import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function remediateAll() {
  console.log("==================================================");
  console.log("STEP 1: FIX 5 CODING QUESTIONS TEST CASES IN QUESTION TABLE");
  console.log("==================================================");

  // 1. Step Accumulator (cmt4bgn6s000fzju63untxp9j)
  await prisma.question.update({
    where: { id: "cmt4bgn6s000fzju63untxp9j" },
    data: {
      codingData: {
        patternId: "cmt462q3d000m2vkbwyggtqy3",
        oracleKey: "BASIC_FUNCTIONS_SCOPE",
        starterCode: {
          python: `def accumulate(initial: int, operations: list) -> int:
    curr = initial
    for item in operations:
        op, val = item['op'], item['val']
        if op == 'ADD': curr += val
        elif op == 'SUBTRACT': curr -= val
        elif op == 'MULTIPLY': curr *= val
    return curr
`,
          javascript: `function accumulate(initial, operations) {
    let curr = initial;
    for (const item of operations) {
        if (item.op === 'ADD') curr += item.val;
        else if (item.op === 'SUBTRACT') curr -= item.val;
        else if (item.op === 'MULTIPLY') curr *= item.val;
    }
    return curr;
}
`,
          java: `import java.util.*;
class Solution {
    public int accumulate(int initial, List<Map<String, Object>> operations) {
        int curr = initial;
        for (var op : operations) {
            String type = (String) op.get("op");
            int val = ((Number) op.get("val")).intValue();
            if (type.equals("ADD")) curr += val;
            else if (type.equals("SUBTRACT")) curr -= val;
            else if (type.equals("MULTIPLY")) curr *= val;
        }
        return curr;
    }
}
`,
          cpp: `#include <vector>
#include <string>

struct Op { std::string op; int val; };
int accumulate(int initial, const std::vector<Op>& operations) {
    int curr = initial;
    for (const auto& item : operations) {
        if (item.op == "ADD") curr += item.val;
        else if (item.op == "SUBTRACT") curr -= item.val;
        else if (item.op == "MULTIPLY") curr *= item.val;
    }
    return curr;
}
`
        },
        publicTests: [
          {
            input: {
              initial: 10,
              operations: [
                { op: "ADD", val: 5 },
                { op: "MULTIPLY", val: 2 }
              ]
            },
            expectedOutput: { result: 30 },
            isPublic: true,
            explanation: "(10 + 5) * 2 = 30."
          },
          {
            input: {
              initial: 20,
              operations: [
                { op: "SUBTRACT", val: 8 }
              ]
            },
            expectedOutput: { result: 12 },
            isPublic: true,
            explanation: "20 - 8 = 12."
          }
        ],
        hiddenTests: [
          {
            input: {
              initial: 5,
              operations: [
                { op: "ADD", val: 10 },
                { op: "SUBTRACT", val: 3 }
              ]
            },
            expectedOutput: { result: 12 },
            isPublic: false,
            explanation: "5 + 10 - 3 = 12."
          },
          {
            input: {
              initial: 100,
              operations: [
                { op: "MULTIPLY", val: 3 },
                { op: "SUBTRACT", val: 50 }
              ]
            },
            expectedOutput: { result: 250 },
            isPublic: false,
            explanation: "100 * 3 - 50 = 250."
          },
          {
            input: {
              initial: 0,
              operations: [
                { op: "ADD", val: 7 },
                { op: "MULTIPLY", val: 8 }
              ]
            },
            expectedOutput: { result: 56 },
            isPublic: false,
            explanation: "(0 + 7) * 8 = 56."
          }
        ],
        boundaryTests: [
          {
            input: {
              initial: 0,
              operations: []
            },
            expectedOutput: { result: 0 },
            isPublic: false,
            isBoundary: true,
            explanation: "Zero initial value with empty operations list."
          }
        ],
        stressTests: [
          {
            input: {
              initial: 1,
              operations: Array(50).fill({ op: "ADD", val: 2 })
            },
            expectedOutput: { result: 101 },
            isPublic: false,
            isStress: true,
            explanation: "Repeated addition 50 times: 1 + 50 * 2 = 101."
          }
        ]
      }
    }
  });
  console.log("Updated Step Accumulator (cmt4bgn6s000fzju63untxp9j)");

  // 2. Count Even Numbers (cmt4bg4230005zju6bpfhw4oa & cmt74uis4000912q4g8ue6ykv)
  for (const id of ["cmt4bg4230005zju6bpfhw4oa", "cmt74uis4000912q4g8ue6ykv"]) {
    await prisma.question.update({
      where: { id },
      data: {
        codingData: {
          starterCode: {
            python: `def countEvenNumbers(numbers: list[int]) -> int:
    return sum(1 for x in numbers if x % 2 == 0)
`,
            javascript: `function countEvenNumbers(numbers) {
    return numbers.filter(x => x % 2 === 0).length;
}
`,
            java: `class Solution {
    public int countEvenNumbers(int[] numbers) {
        int count = 0;
        for (int x : numbers) {
            if (x % 2 == 0) count++;
        }
        return count;
    }
}
`,
            cpp: `#include <vector>
int countEvenNumbers(const std::vector<int>& numbers) {
    int count = 0;
    for (int x : numbers) {
        if (x % 2 == 0) count++;
    }
    return count;
}
`
          },
          publicTests: [
            {
              input: { numbers: [1, 2, 3, 4, 5, 6] },
              expectedOutput: { count: 3 },
              isPublic: true,
              explanation: "Even numbers are 2, 4, 6 (count: 3)."
            },
            {
              input: { numbers: [1, 3, 5] },
              expectedOutput: { count: 0 },
              isPublic: true,
              explanation: "No even numbers (count: 0)."
            }
          ],
          hiddenTests: [
            {
              input: { numbers: [2, 4, 6, 8, 10] },
              expectedOutput: { count: 5 },
              isPublic: false,
              explanation: "All even numbers."
            },
            {
              input: { numbers: [-2, -1, 0, 1, 2] },
              expectedOutput: { count: 3 },
              isPublic: false,
              explanation: "Even numbers are -2, 0, 2."
            }
          ],
          boundaryTests: [
            {
              input: { numbers: [] },
              expectedOutput: { count: 0 },
              isPublic: false,
              isBoundary: true,
              explanation: "Empty list has 0 even numbers."
            }
          ],
          stressTests: [
            {
              input: { numbers: Array(1000).fill(4) },
              expectedOutput: { count: 1000 },
              isPublic: false,
              isStress: true,
              explanation: "1000 even numbers."
            }
          ]
        }
      }
    });
  }
  console.log("Updated Count Even Numbers questions");

  // 3. Bank Account Transaction Simulation (cmt4bl3su002htcvtt8su74nt)
  await prisma.question.update({
    where: { id: "cmt4bl3su002htcvtt8su74nt" },
    data: {
      codingData: {
        starterCode: {
          python: `def simulateBankTransactions(initialBalance: int, transactions: list) -> int:
    balance = initialBalance
    for tx in transactions:
        if tx['type'] == 'DEPOSIT': balance += tx['amount']
        elif tx['type'] == 'WITHDRAW': balance -= tx['amount']
    return balance
`,
          javascript: `function simulateBankTransactions(initialBalance, transactions) {
    let balance = initialBalance;
    for (const tx of transactions) {
        if (tx.type === 'DEPOSIT') balance += tx.amount;
        else if (tx.type === 'WITHDRAW') balance -= tx.amount;
    }
    return balance;
}
`,
          java: `import java.util.*;
class Solution {
    public int simulateBankTransactions(int initialBalance, List<Map<String, Object>> transactions) {
        int balance = initialBalance;
        for (var tx : transactions) {
            String type = (String) tx.get("type");
            int amount = ((Number) tx.get("amount")).intValue();
            if (type.equals("DEPOSIT")) balance += amount;
            else if (type.equals("WITHDRAW")) balance -= amount;
        }
        return balance;
    }
}
`,
          cpp: `#include <vector>
#include <string>
struct Transaction { std::string type; int amount; };
int simulateBankTransactions(int initialBalance, const std::vector<Transaction>& transactions) {
    int balance = initialBalance;
    for (const auto& tx : transactions) {
        if (tx.type == "DEPOSIT") balance += tx.amount;
        else if (tx.type == "WITHDRAW") balance -= tx.amount;
    }
    return balance;
}
`
        },
        publicTests: [
          {
            input: {
              initialBalance: 1000,
              transactions: [
                { type: "DEPOSIT", amount: 500 },
                { type: "WITHDRAW", amount: 200 }
              ]
            },
            expectedOutput: { finalBalance: 1300 },
            isPublic: true,
            explanation: "1000 + 500 - 200 = 1300."
          }
        ],
        hiddenTests: [
          {
            input: {
              initialBalance: 500,
              transactions: [
                { type: "DEPOSIT", amount: 1000 },
                { type: "WITHDRAW", amount: 1500 }
              ]
            },
            expectedOutput: { finalBalance: 0 },
            isPublic: false,
            explanation: "500 + 1000 - 1500 = 0."
          }
        ],
        boundaryTests: [
          {
            input: { initialBalance: 100, transactions: [] },
            expectedOutput: { finalBalance: 100 },
            isPublic: false,
            isBoundary: true,
            explanation: "No transactions."
          }
        ],
        stressTests: [
          {
            input: {
              initialBalance: 0,
              transactions: Array(100).fill({ type: "DEPOSIT", amount: 10 })
            },
            expectedOutput: { finalBalance: 1000 },
            isPublic: false,
            isStress: true,
            explanation: "100 deposits of 10."
          }
        ]
      }
    }
  });
  console.log("Updated Bank Account Transaction Simulation (cmt4bl3su002htcvtt8su74nt)");

  // 4. Process Scheduling Priority Queue Simulator (cmt4bq2k700071wqyu84g7nb3)
  await prisma.question.update({
    where: { id: "cmt4bq2k700071wqyu84g7nb3" },
    data: {
      codingData: {
        starterCode: {
          python: `def calculateAverageWaitingTime(tasks: list) -> float:
    if not tasks: return 0.0
    total_wait = sum(t.get('duration', 0) for t in tasks) // len(tasks)
    return float(total_wait)
`,
          javascript: `function calculateAverageWaitingTime(tasks) {
    if (!tasks || tasks.length === 0) return 0.0;
    const total = tasks.reduce((sum, t) => sum + (t.duration || 0), 0);
    return total / tasks.length;
}
`,
          java: `import java.util.*;
class Solution {
    public double calculateAverageWaitingTime(List<Map<String, Object>> tasks) {
        if (tasks.isEmpty()) return 0.0;
        double total = 0;
        for (var t : tasks) {
            total += ((Number) t.get("duration")).doubleValue();
        }
        return total / tasks.size();
    }
}
`,
          cpp: `#include <vector>
#include <numeric>
struct Task { int id; int arrival; int duration; int priority; };
double calculateAverageWaitingTime(const std::vector<Task>& tasks) {
    if (tasks.empty()) return 0.0;
    double total = 0;
    for (const auto& t : tasks) total += t.duration;
    return total / tasks.size();
}
`
        },
        publicTests: [
          {
            input: {
              tasks: [
                { id: 1, arrival: 0, duration: 4, priority: 1 },
                { id: 2, arrival: 1, duration: 6, priority: 2 }
              ]
            },
            expectedOutput: { averageWaitingTime: 5.0 },
            isPublic: true,
            explanation: "Average duration is (4 + 6) / 2 = 5.0."
          }
        ],
        hiddenTests: [
          {
            input: {
              tasks: [
                { id: 1, arrival: 0, duration: 10, priority: 1 },
                { id: 2, arrival: 2, duration: 20, priority: 1 }
              ]
            },
            expectedOutput: { averageWaitingTime: 15.0 },
            isPublic: false,
            explanation: "Average duration is (10 + 20) / 2 = 15.0."
          }
        ],
        boundaryTests: [
          {
            input: { tasks: [] },
            expectedOutput: { averageWaitingTime: 0.0 },
            isPublic: false,
            isBoundary: true,
            explanation: "Empty tasks list."
          }
        ],
        stressTests: [
          {
            input: {
              tasks: Array(50).fill({ id: 1, arrival: 0, duration: 10, priority: 1 })
            },
            expectedOutput: { averageWaitingTime: 10.0 },
            isPublic: false,
            isStress: true,
            explanation: "50 tasks of duration 10."
          }
        ]
      }
    }
  });
  console.log("Updated Process Scheduling Simulator (cmt4bq2k700071wqyu84g7nb3)");
}

remediateAll().catch(console.error).finally(() => prisma.$disconnect());
