import { CodingStatementGeneratorService } from "../coding-statement-generator.service";

describe("CodingStatementGeneratorService - Normal Statement Formatting", () => {
  let service: CodingStatementGeneratorService;

  beforeEach(() => {
    service = new CodingStatementGeneratorService();
  });

  describe("formatNormalInput", () => {
    it("should format object input into clean variable assignments", () => {
      const formatted = service.formatNormalInput({ a: 12, b: 8 });
      expect(formatted).toBe("a = 12, b = 8");
    });

    it("should format arrays and strings cleanly", () => {
      const formatted = service.formatNormalInput({ nums: [2, 7, 11, 15], target: 9 });
      expect(formatted).toBe("nums = [2, 7, 11, 15], target = 9");
    });

    it("should parse stringified JSON input and format it cleanly", () => {
      const formatted = service.formatNormalInput('{"distance": 500, "fuel": 50}');
      expect(formatted).toBe("distance = 500, fuel = 50");
    });

    it("should preserve stdin if present", () => {
      const formatted = service.formatNormalInput({ stdin: "5 3\n1 2 3" });
      expect(formatted).toBe("5 3\n1 2 3");
    });

    it("should handle already formatted strings gracefully", () => {
      const formatted = service.formatNormalInput("a = 12, b = 8");
      expect(formatted).toBe("a = 12, b = 8");
    });
  });

  describe("formatNormalOutput", () => {
    it("should unwrap result key from output object", () => {
      expect(service.formatNormalOutput({ result: 20 })).toBe("20");
      expect(service.formatNormalOutput({ result: [1, 2, 3] })).toBe("[1, 2, 3]");
      expect(service.formatNormalOutput({ result: true })).toBe("true");
    });

    it("should unwrap ans, answer, output, or single key", () => {
      expect(service.formatNormalOutput({ ans: "hello" })).toBe("hello");
      expect(service.formatNormalOutput({ val: 42 })).toBe("42");
    });

    it("should parse stringified JSON output and unwrap result", () => {
      expect(service.formatNormalOutput('{"result": 20}')).toBe("20");
    });

    it("should handle primitive outputs directly", () => {
      expect(service.formatNormalOutput(20)).toBe("20");
      expect(service.formatNormalOutput("success")).toBe("success");
      expect(service.formatNormalOutput(false)).toBe("false");
    });
  });

  describe("sanitizeNarrative", () => {
    it("should convert bulleted JSON inputs and outputs into normal competitive programming format", () => {
      const rawNarrative = `### Examples

#### Example 1
- **Input**: \`{"a": 12, "b": 8}\`
- **Output**: \`{"result": 20}\`
- **Explanation**: 12 + 8 = 20.`;

      const sanitized = service.sanitizeNarrative(rawNarrative);

      expect(sanitized).toContain("**Input:** `a = 12, b = 8`");
      expect(sanitized).toContain("**Output:** `20`");
      expect(sanitized).not.toContain('{"a": 12, "b": 8}');
      expect(sanitized).not.toContain('{"result": 20}');
    });

    it("should convert codeblocks under Sample Input and Expected Output", () => {
      const rawNarrative = `### Sample Input
\`\`\`json
{
  "distance": 500,
  "fuel": 50
}
\`\`\`

### Expected Output
\`\`\`json
{
  "result": 10
}
\`\`\``;

      const sanitized = service.sanitizeNarrative(rawNarrative);

      expect(sanitized).toContain("distance = 500, fuel = 50");
      expect(sanitized).toContain("10");
      expect(sanitized).not.toContain('"result": 10');
    });
  });

  describe("generateStatement fallback narrative", () => {
    it("should generate a fallback narrative with normal input/output", async () => {
      const pattern: any = {
        title: "Two Sum",
        description: "calculate the sum of two numbers",
        oracleKey: "MATH_ADD_ORACLE",
        difficulty: "EASY",
      };

      const executionResult: any = {
        parameters: {},
        generatedInput: { a: 15, b: 25 },
        expectedOutput: { result: 40 },
        publicTests: [],
        hiddenTests: [],
        stressTests: [],
        boundaryTests: [],
        validation: { valid: true, errors: [], warnings: [] },
      };

      const statement = await service.generateStatement(pattern, executionResult);

      expect(statement.narrative).toContain("**Input:** `a = 15, b = 25`");
      expect(statement.narrative).toContain("**Output:** `40`");
      expect(statement.narrative).not.toContain('{"a": 15, "b": 25}');
      expect(statement.narrative).not.toContain('{"result": 40}');
    });
  });
});
