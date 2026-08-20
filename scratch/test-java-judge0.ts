async function testJavaWithCmdArgs() {
  const javaCode = `
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
            int n = sc.nextInt();
            System.out.println(isPrime(n));
        }
    }
}
  `.trim();

  const payload = {
    source_code: Buffer.from(javaCode).toString('base64'),
    language_id: 62,
    stdin: Buffer.from('7').toString('base64'),
    compiler_options: '-J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-Xmx256m',
    command_line_arguments: '-XX:CompressedClassSpaceSize=64m -XX:MaxMetaspaceSize=128m -Xmx256m',
  };

  console.log('Sending Java submission via ngrok...');
  const res = await fetch('https://marbled-fifty-unraveled.ngrok-free.dev/submissions?base64_encoded=true&wait=true', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'ngrok-skip-browser-warning': 'true',
    },
    body: JSON.stringify(payload),
  });

  const data: any = await res.json();
  console.log('Judge0 Response Status:', data.status);
  console.log('Stdout:', data.stdout ? Buffer.from(data.stdout, 'base64').toString() : '');
  console.log('Stderr:', data.stderr ? Buffer.from(data.stderr, 'base64').toString() : '');
  console.log('Compile Output:', data.compile_output ? Buffer.from(data.compile_output, 'base64').toString() : '');
}

testJavaWithCmdArgs().catch(console.error);
