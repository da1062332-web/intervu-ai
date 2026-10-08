import { CodeHarnessService } from "../code-harness.service";

describe("CodeHarnessService", () => {
  const harness = new CodeHarnessService();

  describe("Java", () => {
    const starter = `class Solution {
    public Object divideAndConquerMaximumSubarrayCrossingSum(Object nums) {
        return null;
    }
}`;

    it("appends a public Main driver targeting Solution and the candidate's method", () => {
      const program = harness.prepare(starter, "java");

      expect(program.stdinMode).toBe("json");
      expect(program.sourceCode.startsWith("import java.util.*;")).toBe(true);
      expect(program.sourceCode).toContain("public class Main {");
      expect(program.sourceCode).toContain('IV_TARGET_CLASS = "Solution"');
      expect(program.sourceCode).toContain(
        'IV_PREFERRED_METHOD = "divideAndConquerMaximumSubarrayCrossingSum"',
      );
    });

    it("drops public from candidate top-level types so Main is the only public class", () => {
      const program = harness.prepare(
        "package com.x;\npublic final class Solution {\n    public int solve(int[] a) { return 0; }\n}",
        62,
      );

      expect(program.sourceCode).not.toMatch(/package\s+com\.x/);
      expect(program.sourceCode).toContain("final class Solution {");
      expect(program.sourceCode).not.toContain("public final class Solution");
      expect(program.sourceCode.match(/public\s+(final\s+)?class\s+\w+/g)).toEqual(["public class Main"]);
    });

    it("renames a candidate class called Main so it does not clash with the driver", () => {
      const program = harness.prepare("class Main {\n    public int solve(int n) { return n; }\n}", "java");

      expect(program.sourceCode).toContain("class CandidateMain {");
      expect(program.sourceCode).toContain('IV_TARGET_CLASS = "CandidateMain"');
    });

    it("leaves programs with their own main() alone apart from naming the public class Main", () => {
      const program = harness.prepare(
        "public class Solution {\n    public static void main(String[] args) {}\n}",
        "java",
      );

      expect(program.stdinMode).toBe("legacy");
      expect(program.sourceCode).toBe("public class Main {\n    public static void main(String[] args) {}\n}");
    });

    it("does not treat JavaScript as Java", () => {
      const code = "class Solution { solve(a) { return a; } }";
      const program = harness.prepare(code, "javascript");

      expect(program).toEqual({ sourceCode: code, stdinMode: "legacy" });
    });
  });

  describe("Python", () => {
    it("appends a JSON-reading driver that calls the first public def", () => {
      const program = harness.prepare("def max_sub(nums):\n    return 0\n", "python");

      expect(program.stdinMode).toBe("json");
      expect(program.sourceCode.startsWith("from __future__ import annotations\n")).toBe(true);
      expect(program.sourceCode).toContain('globals().get("max_sub")');
      expect(program.sourceCode).toContain('getattr(globals()["Solution"](), "max_sub")');
    });

    it("keeps legacy stdin for code that reads stdin itself", () => {
      const program = harness.prepare("import sys\nprint(sum(map(int, sys.stdin.read().split())))\n", 71);

      expect(program.stdinMode).toBe("legacy");
      expect(program.sourceCode).not.toContain("_iv_");
    });
  });

  describe("buildStdin", () => {
    it("sends JSON so single-element and empty arrays keep their type", () => {
      expect(harness.buildStdin({ nums: [1] }, "json")).toBe('{"nums":[1]}');
      expect(harness.buildStdin({ nums: [] }, "json")).toBe('{"nums":[]}');
      expect(harness.buildStdin({ nums: [-2, 1, -3] }, "json")).toBe('{"nums":[-2,1,-3]}');
    });

    it("parses JSON strings before re-encoding and keeps plain strings as strings", () => {
      expect(harness.buildStdin('{"a": 1}', "json")).toBe('{"a":1}');
      expect(harness.buildStdin("5", "json")).toBe("5");
      expect(harness.buildStdin("hello", "json")).toBe('"hello"');
      expect(harness.buildStdin(undefined, "json")).toBe("null");
    });

    it("keeps the whitespace format for legacy programs", () => {
      expect(harness.buildStdin({ nums: [-2, 1, -3] }, "legacy")).toBe("-2 1 -3");
      expect(harness.buildStdin({ n: 3, nums: [1, 2] }, "legacy")).toBe("3\n1 2");
      expect(harness.buildStdin(42, "legacy")).toBe("42");
    });
  });
});
