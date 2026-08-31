import fetch from "node-fetch";

const JUDGE0_URL = "https://marbled-fifty-unraveled.ngrok-free.dev";

// Java Solution for Step Accumulator from user
const javaSolution = `
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        Scanner sc = new Scanner(System.in);
        int result = sc.nextInt();
        int n = sc.nextInt();

        for (int i = 0; i < n; i++) {
            String operation = sc.next();
            int value = sc.nextInt();

            switch (operation) {
                case "ADD":
                    result += value;
                    break;
                case "SUBTRACT":
                    result -= value;
                    break;
                case "MULTIPLY":
                    result *= value;
                    break;
                default:
                    break;
            }
        }

        System.out.println(result);
        sc.close();
    }
}
`;

async function testStepAccumulator() {
  console.log("Testing Java Step Accumulator on Judge0 with plain text input...");

  const stdinText = "10\n2\nADD 5\nMULTIPLY 2\n";

  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      source_code: Buffer.from(javaSolution).toString("base64"),
      language_id: 62,
      stdin: Buffer.from(stdinText).toString("base64"),
      expected_output: Buffer.from("30\n").toString("base64"),
      cpu_time_limit: 5
    })
  });

  const data: any = await res.json();
  const stdout = data.stdout ? Buffer.from(data.stdout, "base64").toString("utf-8") : null;
  const stderr = data.stderr ? Buffer.from(data.stderr, "base64").toString("utf-8") : null;
  const compileOut = data.compile_output ? Buffer.from(data.compile_output, "base64").toString("utf-8") : null;

  console.log("Status:", data.status?.description);
  console.log("Stdout:", stdout);
  console.log("Stderr:", stderr);
  console.log("Compile Output:", compileOut);
}

testStepAccumulator().catch(console.error);
