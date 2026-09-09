const http = require('http');

const JUDGE0_URL = process.env.JUDGE0_URL || 'http://localhost:2358';

function b64(str) { return Buffer.from(str || '').toString('base64'); }
function unb64(str) { return Buffer.from(str || '', 'base64').toString(); }

function submit(payload) {
  return new Promise((resolve) => {
    const data = JSON.stringify(payload);
    const start = Date.now();
    const req = http.request({
      hostname: 'localhost',
      port: 2358,
      path: '/submissions?base64_encoded=true&wait=true',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data)
      }
    }, res => {
      let body = '';
      res.on('data', c => body += c);
      res.on('end', () => {
        const wallLatency = Date.now() - start;
        try {
          const parsed = JSON.parse(body);
          resolve({ httpStatus: res.statusCode, wallLatency, ...parsed });
        } catch (e) {
          resolve({ httpStatus: res.statusCode, wallLatency, error: e.message });
        }
      });
    });
    req.on('error', err => resolve({ httpStatus: 0, wallLatency: Date.now() - start, error: err.message }));
    req.write(data);
    req.end();
  });
}

const TESTS = [
  {
    name: 'Java: Accepted (AC)',
    lang: 62,
    code: `public class Main {
      public static void main(String[] args) {
        System.out.println("Hello Java Accepted");
      }
    }`,
    expectedStatusId: 3,
    check: r => unb64(r.stdout).includes('Hello Java Accepted')
  },
  {
    name: 'Java: Wrong Answer (WA)',
    lang: 62,
    code: `public class Main {
      public static void main(String[] args) {
        System.out.println("ActualOutput");
      }
    }`,
    expectedOutput: 'ExpectedOutput',
    expectedStatusId: 4,
    check: r => r.status?.id === 4
  },
  {
    name: 'Java: Compilation Error (CE)',
    lang: 62,
    code: `public class Main {
      public static void main(String[] args) {
        System.out.println(syntax error here)
      }
    }`,
    expectedStatusId: 6,
    check: r => r.status?.id === 6 && unb64(r.compile_output).includes('error:')
  },
  {
    name: 'Java: Runtime Error (NZEC / Exception)',
    lang: 62,
    code: `public class Main {
      public static void main(String[] args) {
        throw new RuntimeException("Simulated exception for testing");
      }
    }`,
    expectedStatusId: 11, // Non-zero exit code
    check: r => r.status?.id === 11 || unb64(r.stderr).includes('Simulated exception')
  },
  {
    name: 'Java: Time Limit Exceeded (TLE)',
    lang: 62,
    code: `public class Main {
      public static void main(String[] args) {
        while(true) {}
      }
    }`,
    cpuTimeLimit: 1,
    wallTimeLimit: 2,
    expectedStatusId: 5,
    check: r => r.status?.id === 5
  },
  {
    name: 'Java: Memory Limit / Out Of Memory',
    lang: 62,
    code: `public class Main {
      public static void main(String[] args) {
        byte[][] arr = new byte[10000][];
        for (int i = 0; i < 10000; i++) {
          arr[i] = new byte[1024 * 1024]; // Allocate > 500MB
        }
      }
    }`,
    memoryLimit: 128000, // 128MB limit
    check: r => r.status?.id === 12 || r.status?.id === 11 || unb64(r.stderr).includes('OutOfMemoryError') || unb64(r.message).includes('Memory')
  },
  {
    name: 'Python 3: Accepted (AC)',
    lang: 71,
    code: `print("Hello Python 3")`,
    expectedStatusId: 3,
    check: r => unb64(r.stdout).includes('Hello Python 3')
  },
  {
    name: 'Python 3: Wrong Answer (WA)',
    lang: 71,
    code: `print("Mismatch")`,
    expectedOutput: 'Match',
    expectedStatusId: 4,
    check: r => r.status?.id === 4
  },
  {
    name: 'C++ (GCC 9.2.0): Accepted (AC)',
    lang: 54,
    code: `#include <iostream>
    int main() {
      std::cout << "Hello C++" << std::endl;
      return 0;
    }`,
    expectedStatusId: 3,
    check: r => unb64(r.stdout).includes('Hello C++')
  },
  {
    name: 'C++ (GCC 9.2.0): Compilation Error (CE)',
    lang: 54,
    code: `#include <iostream>
    int main() {
      std::cout << UndefinedVar << std::endl;
      return 0;
    }`,
    expectedStatusId: 6,
    check: r => r.status?.id === 6
  },
  {
    name: 'JavaScript (Node.js 12.14.0): Accepted (AC)',
    lang: 63,
    code: `console.log("Hello Node.js");`,
    expectedStatusId: 3,
    check: r => unb64(r.stdout).includes('Hello Node.js')
  }
];

async function runRegression() {
  console.log("================================================================");
  console.log("           PHASE 6: FUNCTIONAL REGRESSION TEST SUITE            ");
  console.log("================================================================");

  let passedAll = true;
  for (const t of TESTS) {
    const payload = {
      source_code: b64(t.code),
      language_id: t.lang,
      expected_output: t.expectedOutput ? b64(t.expectedOutput) : undefined,
      cpu_time_limit: t.cpuTimeLimit,
      wall_time_limit: t.wallTimeLimit,
      memory_limit: t.memoryLimit
    };

    const res = await submit(payload);
    const passed = (t.expectedStatusId ? res.status?.id === t.expectedStatusId : true) && (t.check ? t.check(res) : true);
    if (!passed) passedAll = false;

    console.log(`[${passed ? 'PASS' : 'FAIL'}] ${t.name}`);
    console.log(`       Status: ${res.status?.id} (${res.status?.description}) | Latency: ${res.wallLatency}ms | CPU: ${res.time}s | RSS: ${res.memory}KB`);
    if (!passed) {
      console.log(`       Stderr: ${unb64(res.stderr)}`);
      console.log(`       Compile: ${unb64(res.compile_output)}`);
      console.log(`       Message: ${unb64(res.message)}`);
    }
  }

  console.log("================================================================");
  console.log(`Regression Test Result: ${passedAll ? 'ALL 11 TESTS PASSED' : 'FAILURES DETECTED'}`);
  console.log("================================================================");
  if (!passedAll) process.exit(1);
}

runRegression().catch(console.error);
