async function runTest() {
  console.log('=== STARTING JUDGE0 MULTI-LANGUAGE VERIFICATION ===\n');

  const tests = [
    {
      name: 'Java Prime (7 -> true)',
      languageId: 62, // Java
      sourceCode: `
public class Main {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (sc.hasNextInt()) {
            System.out.println(isPrime(sc.nextInt()));
        }
    }
}
      `.trim(),
      stdin: '7',
      expectedStdout: 'true',
    },
    {
      name: 'Java Prime (10 -> false)',
      languageId: 62,
      sourceCode: `
public class Main {
    public static boolean isPrime(int n) {
        if (n <= 1) return false;
        for (int i = 2; i * i <= n; i++) {
            if (n % i == 0) return false;
        }
        return true;
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (sc.hasNextInt()) {
            System.out.println(isPrime(sc.nextInt()));
        }
    }
}
      `.trim(),
      stdin: '10',
      expectedStdout: 'false',
    },
    {
      name: 'Java Reverse String ("hello" -> "olleh")',
      languageId: 62,
      sourceCode: `
public class Main {
    public static String reverseString(String s) {
        return new StringBuilder(s).reverse().toString();
    }

    public static void main(String[] args) {
        java.util.Scanner sc = new java.util.Scanner(System.in);
        if (sc.hasNext()) {
            System.out.println(reverseString(sc.next()));
        }
    }
}
      `.trim(),
      stdin: 'hello',
      expectedStdout: 'olleh',
    },
    {
      name: 'Python Prime (7 -> true)',
      languageId: 71, // Python 3
      sourceCode: `
import sys

def is_prime(n):
    if n <= 1:
        return False
    for i in range(2, int(n**0.5) + 1):
        if n % i == 0:
            return False
    return True

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(str(is_prime(int(raw))).lower())
      `.trim(),
      stdin: '7',
      expectedStdout: 'true',
    },
    {
      name: 'Python Reverse String ("hello" -> "olleh")',
      languageId: 71,
      sourceCode: `
import sys

def reverse_string(s):
    return s[::-1]

if __name__ == '__main__':
    raw = sys.stdin.read().strip()
    if raw:
        print(reverse_string(raw))
      `.trim(),
      stdin: 'hello',
      expectedStdout: 'olleh',
    },
    {
      name: 'C++ Prime (7 -> true)',
      languageId: 54, // C++
      sourceCode: `
#include <iostream>

bool isPrime(int n) {
    if (n <= 1) return false;
    for (int i = 2; i * i <= n; i++) {
        if (n % i == 0) return false;
    }
    return true;
}

int main() {
    int n;
    if (std::cin >> n) {
        std::cout << (isPrime(n) ? "true" : "false") << std::endl;
    }
    return 0;
}
      `.trim(),
      stdin: '7',
      expectedStdout: 'true',
    },
    {
      name: 'C++ Reverse String ("hello" -> "olleh")',
      languageId: 54,
      sourceCode: `
#include <iostream>
#include <string>
#include <algorithm>

int main() {
    std::string s;
    if (std::cin >> s) {
        std::reverse(s.begin(), s.end());
        std::cout << s << std::endl;
    }
    return 0;
}
      `.trim(),
      stdin: 'hello',
      expectedStdout: 'olleh',
    },
  ];

  let passed = 0;
  for (const t of tests) {
    process.stdout.write(`Testing ${t.name}... `);
    const payload = {
      source_code: Buffer.from(t.sourceCode).toString('base64'),
      language_id: t.languageId,
      stdin: Buffer.from(t.stdin).toString('base64'),
    };

    const res = await fetch('http://localhost:2358/submissions?base64_encoded=true&wait=true', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });

    const data: any = await res.json();
    const stdout = data.stdout ? Buffer.from(data.stdout, 'base64').toString().trim() : '';

    if (data.status?.id === 3 && stdout === t.expectedStdout) {
      console.log('✅ PASSED (stdout: "%s")', stdout);
      passed++;
    } else {
      console.log('❌ FAILED');
      console.log('   Status:', data.status);
      console.log('   Actual stdout:', stdout);
      console.log('   Expected stdout:', t.expectedStdout);
      console.log('   Stderr:', data.stderr ? Buffer.from(data.stderr, 'base64').toString() : '');
      console.log('   Compile output:', data.compile_output ? Buffer.from(data.compile_output, 'base64').toString() : '');
    }
  }

  console.log(`\n=== SUMMARY: ${passed} / ${tests.length} TESTS PASSED ===`);
  if (passed === tests.length) {
    console.log('🎉 ALL JUDGE0 MULTI-LANGUAGE VERIFICATION TESTS PASSED SUCCESSFULLY!');
  } else {
    process.exit(1);
  }
}

runTest().catch((err) => {
  console.error(err);
  process.exit(1);
});
