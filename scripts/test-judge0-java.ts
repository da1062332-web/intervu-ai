import fetch from "node-fetch";

const JUDGE0_URL = "https://marbled-fifty-unraveled.ngrok-free.dev";

const javaCode = `
import java.util.*;

public class Main {
    public static void main(String[] args) {
        System.out.println("Hello Java from Judge0!");
    }
}
`;

async function testJava() {
  console.log("Testing Judge0 at:", JUDGE0_URL);

  const tests = [
    {
      name: "Default with memory_limit 2048000",
      payload: {
        source_code: Buffer.from(javaCode).toString("base64"),
        language_id: 62,
        compiler_options: "-J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-Xmx256m",
        memory_limit: 2048000,
        cpu_time_limit: 5
      }
    },
    {
      name: "Without memory_limit (null/omitted)",
      payload: {
        source_code: Buffer.from(javaCode).toString("base64"),
        language_id: 62,
        compiler_options: "-J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-Xmx256m",
        cpu_time_limit: 5
      }
    },
    {
      name: "With memory_limit 512000 (512MB)",
      payload: {
        source_code: Buffer.from(javaCode).toString("base64"),
        language_id: 62,
        compiler_options: "-J-XX:CompressedClassSpaceSize=64m -J-XX:MaxMetaspaceSize=128m -J-Xmx256m",
        memory_limit: 512000,
        cpu_time_limit: 5
      }
    },
    {
      name: "Without compiler_options and without memory_limit",
      payload: {
        source_code: Buffer.from(javaCode).toString("base64"),
        language_id: 62,
        cpu_time_limit: 5
      }
    }
  ];

  for (const t of tests) {
    console.log("\n-------------------------------------------");
    console.log(`Running test: ${t.name}`);
    try {
      const res = await fetch(`${JUDGE0_URL}/submissions?base64_encoded=true&wait=true`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "ngrok-skip-browser-warning": "true"
        },
        body: JSON.stringify(t.payload)
      });

      const data: any = await res.json();
      const stdout = data.stdout ? Buffer.from(data.stdout, "base64").toString("utf-8") : null;
      const stderr = data.stderr ? Buffer.from(data.stderr, "base64").toString("utf-8") : null;
      const compileOut = data.compile_output ? Buffer.from(data.compile_output, "base64").toString("utf-8") : null;

      console.log("Status:", data.status?.description, `(ID: ${data.status_id})`);
      console.log("Stdout:", stdout);
      console.log("Stderr:", stderr);
      console.log("Compile Output:", compileOut);
      console.log("Memory (KB):", data.memory);
      console.log("Time (s):", data.time);
    } catch (e: any) {
      console.error("Error:", e.message);
    }
  }
}

testJava().catch(console.error);
