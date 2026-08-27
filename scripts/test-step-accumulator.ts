import fetch from "node-fetch";

const JUDGE0_URL = "https://marbled-fifty-unraveled.ngrok-free.dev";

// Java Solution for Step Accumulator
const javaSolution = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        // Simple demonstration
        System.out.println("{\\"result\\": 30}");
    }
}
`;

async function testStepAccumulator() {
  console.log("Testing Java Step Accumulator on Judge0...");

  const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "ngrok-skip-browser-warning": "true"
    },
    body: JSON.stringify({
      source_code: Buffer.from(javaSolution).toString("base64"),
      language_id: 62,
      stdin: Buffer.from(JSON.stringify({ initial: 10, operations: [{ op: "ADD", val: 5 }] })).toString("base64"),
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
