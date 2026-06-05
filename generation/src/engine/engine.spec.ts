import { PRNG } from "./prng";
import { evaluateExpression } from "./math-parser";
import { generateVariables, roundToPrecision } from "./variable-generator";
import { evaluateConstraints } from "./constraint-engine";
import {
  calculateDifficultyScore,
  getDifficultyCategory,
  isEasy,
  isMedium,
  isHard,
} from "./difficulty-rules";
import {
  validatePipeline,
  generateQuestionHash,
  checkVariableCollision,
  isSemanticallySimilar,
  calculateSemanticSimilarity,
  validateDifficulty,
} from "./validation-pipeline";
import { executeTemplate } from "./template-executor";
import { TemplateLoader } from "./template-loader";
import { AptitudeGenerationRuntime } from "./execution-runtime";
import {
  QuestionTemplate,
  TemplateCategory,
  QuestionTemplateSchema,
} from "../types/template.types";
import { MetricsTracker } from "./metrics-tracker";
import { DifficultyLevel } from "@intervu/shared";

// Load templates directly for testing
import rawTemplates from "../templates/aptitude.templates.json";
const templates = rawTemplates as QuestionTemplate[];

describe("Generation Engine Core Subsystem", () => {
  describe("Seed-based PRNG (prng.ts)", () => {
    it("should generate identical sequences for the same seed", () => {
      const prng1 = new PRNG(12345);
      const prng2 = new PRNG(12345);

      for (let i = 0; i < 20; i++) {
        expect(prng1.next()).toBe(prng2.next());
        expect(prng1.nextInt(1, 100)).toBe(prng2.nextInt(1, 100));
      }
    });

    it("should generate different sequences for different seeds", () => {
      const prng1 = new PRNG(12345);
      const prng2 = new PRNG(67890);

      let matches = 0;
      for (let i = 0; i < 20; i++) {
        if (prng1.next() === prng2.next()) {
          matches++;
        }
      }
      // Out of 20 random floats, they shouldn't all match
      expect(matches).toBeLessThan(5);
    });

    it("should shuffle arrays deterministically", () => {
      const array = ["A", "B", "C", "D", "E"];
      const prng1 = new PRNG(42);
      const prng2 = new PRNG(42);

      const shuffled1 = prng1.shuffle(array);
      const shuffled2 = prng2.shuffle(array);

      expect(shuffled1).toEqual(shuffled2);
      // Ensure it's actually shuffled (not identical to original)
      expect(shuffled1).not.toEqual(array);
    });
  });

  describe("Logical & Mathematical Expression Parser (math-parser.ts)", () => {
    it("should evaluate basic arithmetic operations with correct precedence", () => {
      expect(evaluateExpression("2 + 3 * 4", {})).toBe(14);
      expect(evaluateExpression("(2 + 3) * 4", {})).toBe(20);
      expect(evaluateExpression("10 - 4 / 2", {})).toBe(8);
      expect(evaluateExpression("13 % 5", {})).toBe(3);
    });

    it("should resolve variable values from context", () => {
      const context = { x: 10, y: 5, z: 2 };
      expect(evaluateExpression("x * y + z", context)).toBe(52);
      expect(evaluateExpression("x / (y - z)", context)).toBe(10 / 3);
    });

    it("should evaluate comparison and equality operators", () => {
      expect(evaluateExpression("10 > 5", {})).toBe(true);
      expect(evaluateExpression("10 < 5", {})).toBe(false);
      expect(evaluateExpression("10 >= 10", {})).toBe(true);
      expect(evaluateExpression("5 <= 4", {})).toBe(false);
      expect(evaluateExpression("10 === 10", {})).toBe(true);
      expect(evaluateExpression("10 !== 5", {})).toBe(true);
    });

    it("should evaluate logical expressions", () => {
      expect(
        evaluateExpression("true && false", { true: true, false: false }),
      ).toBe(false);
      expect(
        evaluateExpression("true || false", { true: true, false: false }),
      ).toBe(true);
      expect(evaluateExpression("5 > 3 && 2 < 4", {})).toBe(true);
    });

    it("should throw on division by zero", () => {
      expect(() => evaluateExpression("10 / 0", {})).toThrow(
        "Division by zero",
      );
    });

    it("should support string operations", () => {
      expect(evaluateExpression('name === "Alice"', { name: "Alice" })).toBe(
        true,
      );
      expect(evaluateExpression('name !== "Bob"', { name: "Alice" })).toBe(
        true,
      );
    });
  });

  describe("Variable Generator (variable-generator.ts)", () => {
    it("should respect step boundaries and range constraints", () => {
      const prng = new PRNG(100);
      const variables = [
        {
          name: "val",
          type: "number" as const,
          range: { min: 10, max: 20, step: 2 },
        },
      ];

      for (let i = 0; i < 50; i++) {
        const generated = generateVariables(variables, prng);
        const val = generated.val as number;
        expect(val).toBeGreaterThanOrEqual(10);
        expect(val).toBeLessThanOrEqual(20);
        // Should be even since min=10 and step=2
        expect(val % 2).toBe(0);
      }
    });

    it("should correctly round numbers to precision of step", () => {
      expect(roundToPrecision(0.333333, 0.01)).toBe(0.33);
      expect(roundToPrecision(5.5, 0.5)).toBe(5.5);
      expect(roundToPrecision(10.1234, 1)).toBe(10);
    });
  });

  describe("Constraint Engine (constraint-engine.ts)", () => {
    it("should identify warning and critical constraint violations", () => {
      const constraints = [
        { rule: "A !== B", severity: "critical" as const },
        { rule: "A > 10", severity: "warning" as const },
      ];

      const res1 = evaluateConstraints(constraints, { A: 15, B: 20 });
      expect(res1.isValid).toBe(true);
      expect(res1.violatedConstraints.length).toBe(0);

      // Violate critical constraint
      const res2 = evaluateConstraints(constraints, { A: 15, B: 15 });
      expect(res2.isValid).toBe(false);
      expect(res2.violatedConstraints[0].rule).toBe("A !== B");

      // Violate warning constraint only
      const res3 = evaluateConstraints(constraints, { A: 5, B: 10 });
      expect(res3.isValid).toBe(true);
      expect(res3.violatedConstraints.length).toBe(1);
      expect(res3.violatedConstraints[0].rule).toBe("A > 10");
    });
  });

  describe("Difficulty Rules (difficulty-rules.ts)", () => {
    it("should map scores correctly to easy, medium, and hard", () => {
      expect(getDifficultyCategory(2.9)).toBe("easy");
      expect(getDifficultyCategory(3.0)).toBe("medium");
      expect(getDifficultyCategory(5.99)).toBe("medium");
      expect(getDifficultyCategory(6.0)).toBe("hard");
    });

    it("should calculate difficulty scores accurately based on metadata weights", () => {
      const metadata = {
        w1_steps: 3.0,
        w2_number_complexity: 2.0,
        w3_concept_overlap: 1.5,
        w4_trick_factor: 2.0,
      };

      const score = calculateDifficultyScore(metadata, {});
      // (3.0 * 0.65) + (2.0 * 0.40) + (1.5 * 0.40) + (2.0 * 0.40)
      // = 1.95 + 0.8 + 0.6 + 0.8 = 4.15
      expect(score).toBe(4.15);
      expect(getDifficultyCategory(score)).toBe("medium");
    });
  });

  describe("Validation Pipeline (validation-pipeline.ts)", () => {
    const template = templates[1]; // APT_TIME_WORK_001 (easy)

    it("should pass validation for valid question sets", () => {
      const parameters = {
        worker_A: "Alice",
        worker_B: "Bob",
        days_A: 12,
        days_B: 24,
      };

      const validation = validatePipeline({
        template,
        parameters,
        correctAnswer: "8", // (12 * 24) / (12 + 24) = 8
        distractors: ["6", "10", "18"],
        seenHashes: new Set(),
      });

      expect(validation.valid).toBe(true);
      expect(validation.issues.length).toBe(0);
    });

    it("should detect duplicate hash collisions", () => {
      const parameters = {
        worker_A: "Alice",
        worker_B: "Bob",
        days_A: 12,
        days_B: 24,
      };

      const hash = generateQuestionHash(template.templateId, parameters);
      const validation = validatePipeline({
        template,
        parameters,
        correctAnswer: "8",
        distractors: ["6", "10", "18"],
        seenHashes: new Set([hash]),
      });

      expect(validation.valid).toBe(false);
      expect(validation.issues[0]).toContain("Duplicate question detected");
    });

    it("should detect options ambiguity", () => {
      const parameters = {
        worker_A: "Alice",
        worker_B: "Bob",
        days_A: 12,
        days_B: 24,
      };

      const validation = validatePipeline({
        template,
        parameters,
        correctAnswer: "8",
        distractors: ["8", "10", "18"], // Distractor matches correct answer
        seenHashes: new Set(),
      });

      expect(validation.valid).toBe(false);
      expect(validation.issues[0]).toContain("Ambiguity detected");
    });
  });

  describe("Orchestrated Template Executor (template-executor.ts)", () => {
    it("should generate fully hydrated and correct output with structured solution for all 5 templates", () => {
      for (const template of templates) {
        const seed = 1001;
        const result = executeTemplate(template, seed);

        expect(result.question).toBeDefined();
        expect(typeof result.question).toBe("string");

        expect(result.options.length).toBe(4);
        expect(result.options).toContain(result.correctAnswer);

        expect(result.difficulty).toBe(template.difficulty);

        // Verify solution structure
        expect(result.solution).toBeDefined();
        expect(Array.isArray(result.solution.steps)).toBe(true);
        expect(result.solution.steps.length).toBeGreaterThan(0);
        expect(result.solution.finalAnswer).toBe(result.correctAnswer);

        // Verify SHA-256 hash output
        expect(result.hash).toBeDefined();
        expect(result.hash.length).toBe(64); // SHA-256 is 64 hex chars

        // Verify determinism: Running again with same seed yields exact same result
        const result2 = executeTemplate(template, seed);
        expect(result.question).toBe(result2.question);
        expect(result.correctAnswer).toBe(result2.correctAnswer);
        expect(result.options).toEqual(result2.options);
        expect(result.solution).toEqual(result2.solution);
        expect(result.hash).toBe(result2.hash);
      }
    });

    it("should generate unique outputs when running with different seeds", () => {
      const template = templates[0];
      const result1 = executeTemplate(template, 1111);
      const result2 = executeTemplate(template, 2222);

      // Different seeds should produce different question text or values
      expect(result1.question).not.toBe(result2.question);
    });
  });

  describe("Template Loader (template-loader.ts)", () => {
    it("should load all templates and validate them successfully", () => {
      const loader = new TemplateLoader();
      const allTemplates = loader.getAllTemplates();
      expect(allTemplates.length).toBe(5);

      const template = loader.getTemplate("APT_PERCENTAGE_001");
      expect(template).toBeDefined();
      expect(template?.topic).toBe("percentages");
    });

    it("should filter templates by topic", () => {
      const loader = new TemplateLoader();
      const timeWorkTemplates = loader.getTemplatesByTopic("time_work");
      expect(timeWorkTemplates.length).toBe(1);
      expect(timeWorkTemplates[0].templateId).toBe("APT_TIME_WORK_001");
    });
  });

  describe("Execution Runtime (execution-runtime.ts)", () => {
    it("should generate a batch of unique questions for a topic", () => {
      const runtime = new AptitudeGenerationRuntime();
      const count = 3;
      const seenHashes = new Set<string>();

      // There is only 1 template for percentages in the JSON, but since we vary seeds,
      // we can generate multiple distinct questions from it.
      const questions = runtime.generateQuestionsForTopic(
        "percentages",
        count,
        100,
        seenHashes,
      );

      expect(questions.length).toBe(count);
      expect(seenHashes.size).toBe(count);

      // Verify all generated questions have the structured solution and correct topic
      for (const q of questions) {
        expect(q.solution).toBeDefined();
        expect(q.options.length).toBe(4);
        expect(q.correctAnswer).toBeDefined();
      }
    });
  });

  describe("Day 4 Deliverables: Metadata, Scoring, and Metrics", () => {
    describe("Template Categorization & Tags Schema Validation", () => {
      it("should validate and parse custom categories and optional tags", () => {
        const dummyTemplate = {
          templateId: "TEST_CATEGORIES_001",
          type: TemplateCategory.CODING,
          topic: "sorting_algorithms",
          difficulty: "hard",
          variables: [
            {
              name: "arr_size",
              type: "number",
              range: { min: 10, max: 100, step: 10 },
            },
          ],
          constraints: [],
          questionTemplate: "Sort an array of size {arr_size}.",
          solutionTemplate: {
            steps: ["Create array", "Sort array"],
            finalAnswer: "arr_size * log(arr_size)",
          },
          metadata: {
            w1_steps: 5.0,
            w2_number_complexity: 3.0,
            w3_concept_overlap: 2.0,
            w4_trick_factor: 3.0,
          },
          tags: ["algorithms", "sorting", "arrays"],
        };

        const parsed = QuestionTemplateSchema.safeParse(dummyTemplate);
        expect(parsed.success).toBe(true);
        if (parsed.success) {
          expect(parsed.data.type).toBe(TemplateCategory.CODING);
          expect(parsed.data.tags).toEqual(["algorithms", "sorting", "arrays"]);
          expect(parsed.data.topic).toBe("sorting_algorithms");
        }
      });
    });

    describe("Constraint-Weighted Scoring Engine", () => {
      const metadata = {
        w1_steps: 2.0,
        w2_number_complexity: 1.5,
        w3_concept_overlap: 1.0,
        w4_trick_factor: 1.0,
      };

      it("should calculate difficulty score with zero constraints", () => {
        const score = calculateDifficultyScore(metadata, {}, 0);
        // (2.0 * 0.65) + (1.5 * 0.40) + (1.0 * 0.40) + (1.0 * 0.40) + (0 * 0.15)
        // = 1.30 + 0.60 + 0.40 + 0.40 = 2.70
        expect(score).toBe(2.7);
        expect(isEasy(score)).toBe(true);
        expect(getDifficultyCategory(score)).toBe("easy");
      });

      it("should calculate difficulty score with constraint weight modifier", () => {
        const score = calculateDifficultyScore(metadata, {}, 3);
        // 2.70 + (3 * 0.15) = 2.70 + 0.45 = 3.15
        expect(score).toBe(3.15);
        expect(isMedium(score)).toBe(true);
        expect(getDifficultyCategory(score)).toBe("medium");
      });

      it("should calculate hard reasoning scoring correctly", () => {
        const hardMetadata = {
          w1_steps: 5.0,
          w2_number_complexity: 3.5,
          w3_concept_overlap: 3.0,
          w4_trick_factor: 3.0,
        };
        const score = calculateDifficultyScore(hardMetadata, {}, 2);
        // (5.0 * 0.65) + (3.5 * 0.40) + (3.0 * 0.40) + (3.0 * 0.40) + (2 * 0.15)
        // = 3.25 + 1.40 + 1.20 + 1.20 + 0.30 = 7.35
        expect(score).toBe(7.35);
        expect(isHard(score)).toBe(true);
        expect(getDifficultyCategory(score)).toBe("hard");
      });
    });

    describe("Generation Telemetry Metrics & Tracker", () => {
      it("should correctly capture runs, runtimes, validation failures and duplicates", () => {
        const tracker = new MetricsTracker();

        // 1. Record a successful run with no failures
        tracker.recordRun({
          templateId: "T1",
          success: true,
          runtimeMs: 12.5,
          attemptsUsed: 1,
          failures: [],
        });

        // 2. Record a successful run with 2 retries (e.g. constraints violated)
        tracker.recordRun({
          templateId: "T1",
          success: true,
          runtimeMs: 25.0,
          attemptsUsed: 3,
          failures: [{ reason: "constraint_violation", count: 2 }],
        });

        // 3. Record a failed run that hit max attempts
        tracker.recordRun({
          templateId: "T1",
          success: false,
          runtimeMs: 150.0,
          attemptsUsed: 5,
          failures: [
            { reason: "duplicate_collision", count: 3 },
            { reason: "difficulty_mismatch", count: 2 },
          ],
        });

        const contract = tracker.getMetricsForTemplate(
          "T1",
          "medium",
          "percentages",
          ["tags1"],
        );

        expect(contract.templateId).toBe("T1");
        expect(contract.difficulty).toBe("medium");
        expect(contract.topic).toBe("percentages");
        expect(contract.tags).toEqual(["tags1"]);

        // success rate: 2 successes / 3 total runs = 0.67
        expect(contract.metrics.generationSuccessRate).toBe(0.67);
        // avg runtime: (12.5 + 25 + 150) / 3 = 62.5
        expect(contract.metrics.averageRuntimeMs).toBe(62.5);
        // duplicate collision frequency: 3 / 3 = 1.00
        expect(contract.metrics.duplicateFrequency).toBe(1);
        // total validation failures: 2 (constraint) + 3 (duplicate) + 2 (difficulty) = 7
        expect(contract.metrics.validationFailures).toBe(7);

        expect(contract.metrics.failureBreakdown).toEqual({
          constraint_violation: 2,
          difficulty_mismatch: 2,
          solvability_failure: 0,
          duplicate_collision: 3,
          other: 0,
        });
      });

      it("should integrate telemetry tracking inside AptitudeGenerationRuntime", () => {
        const runtime = new AptitudeGenerationRuntime();
        const startSeed = 999;

        // Generate a question (which will pass constraints and register a run)
        const q = runtime.generateQuestion("APT_PERCENTAGE_001", startSeed);
        expect(q).toBeDefined();

        const metadata = runtime.getTemplateMetadata("APT_PERCENTAGE_001");
        expect(metadata).not.toBeNull();
        if (metadata) {
          expect(metadata.templateId).toBe("APT_PERCENTAGE_001");
          expect(metadata.metrics.generationSuccessRate).toBe(1.0);
          expect(metadata.metrics.averageRuntimeMs).toBeGreaterThan(0);
        }
      });
    });
  });

  describe("Day 5 Deliverables: Hardened Validation & Failure Recovery", () => {
    describe("Output Verification Pipeline & Score", () => {
      it("should calculate validation scores correctly under warning and critical conditions", () => {
        const template = templates[0]; // APT_PERCENTAGE_001 (medium)

        // 1. Fully valid question should have score 1.0 and valid: true
        const validRes = validatePipeline({
          template,
          parameters: { percent_increase: 25 },
          correctAnswer: "20",
          distractors: ["15", "22", "30"],
          seenHashes: new Set(),
        });
        expect(validRes.valid).toBe(true);
        expect(validRes.score).toBe(1.0);
        expect(validRes.issues.length).toBe(0);

        // 2. Warning conditions should reduce score but keep valid: true (unless critical issues exist)
        const templateWithWarning = {
          ...template,
          constraints: [
            { rule: "percent_increase !== 25", severity: "warning" as const },
          ],
        };
        const warningRes = validatePipeline({
          template: templateWithWarning,
          parameters: { percent_increase: 25 },
          correctAnswer: "20",
          distractors: ["15", "22", "30"],
          seenHashes: new Set(),
        });
        expect(warningRes.valid).toBe(true);
        expect(warningRes.score).toBe(0.95); // 1.0 - 0.05
        expect(warningRes.issues[0]).toContain(
          "Warning constraint rule violated",
        );

        // 3. Critical issues should set score to 0.0 and valid: false
        const criticalRes = validatePipeline({
          template,
          parameters: { percent_increase: -10 }, // violates critical rule percent_increase > 0
          correctAnswer: "20",
          distractors: ["15", "22", "30"],
          seenHashes: new Set(),
        });
        expect(criticalRes.valid).toBe(false);
        expect(criticalRes.score).toBe(0.0);
        expect(criticalRes.issues.length).toBeGreaterThan(0);
      });

      it("should validate output choices schema strictly", () => {
        const template = templates[0];

        // Incorrect number of choices (distractors length !== 3)
        const schemaRes = validatePipeline({
          template,
          parameters: { percent_increase: 25 },
          correctAnswer: "20",
          distractors: ["15", "22"], // only 2 distractors
          seenHashes: new Set(),
        });
        expect(schemaRes.valid).toBe(false);
        expect(schemaRes.score).toBe(0.0);
        expect(schemaRes.issues[0]).toContain("Schema validation failed");
      });
    });

    describe("Duplicate Detection Engine", () => {
      it("should detect parameter variable collisions", () => {
        const pastParameters = [
          { percent_increase: 25 },
          { percent_increase: 30 },
        ];

        expect(
          checkVariableCollision({ percent_increase: 25 }, pastParameters),
        ).toBe(true);
        expect(
          checkVariableCollision({ percent_increase: 30 }, pastParameters),
        ).toBe(true);
        expect(
          checkVariableCollision({ percent_increase: 35 }, pastParameters),
        ).toBe(false);
      });

      it("should detect semantic similarity ignoring minor punctuation or number variations", () => {
        const textA =
          "Amit can complete a project in 12 days and Vijay can complete it in 24 days.";
        const textB =
          "Amit can complete a project in 15 days and Vijay can complete it in 30 days.";
        const textC = "If the price of petrol is increased by 25 percent...";

        // Word tokens should match closely when numbers are normalized to '#'
        expect(calculateSemanticSimilarity(textA, textB)).toBeGreaterThan(0.9);
        expect(isSemanticallySimilar(textA, textB)).toBe(true);

        expect(calculateSemanticSimilarity(textA, textC)).toBeLessThan(0.3);
        expect(isSemanticallySimilar(textA, textC)).toBe(false);
      });
    });

    describe("Difficulty Weight Mapping Validation", () => {
      it("should validate template difficulty against mapped parameters and constraints count", () => {
        const template = templates[0]; // APT_PERCENTAGE_001 (medium, difficulty score maps to medium)
        const result = validateDifficulty(template, { percent_increase: 25 });
        expect(result.isValid).toBe(true);
        expect(result.expectedCategory).toBe("medium");
      });
    });

    describe("Failure Recovery Logic & Fallbacks", () => {
      it("should fallback to other templates in the same topic when generation fails", () => {
        const loader = new TemplateLoader();

        // Sabotage the percentage template (APT_PERCENTAGE_001) by making calculated difficulty hard
        const target = loader.getTemplate("APT_PERCENTAGE_001");
        if (target) {
          target.metadata.w1_steps = 10.0; // calculated score will be > 6.0 (hard), causing mismatch
        }

        // Change profit_loss template to percentages topic so it acts as medium fallback
        const fallback = loader.getTemplate("APT_PROFIT_LOSS_001");
        if (fallback) {
          fallback.topic = "percentages";
        }

        const customRuntime = new AptitudeGenerationRuntime(loader);

        // Try generating question for the sabotaged template ID.
        // It should fail on the original template, fall back to profit_loss, and succeed!
        const result = customRuntime.generateQuestion(
          "APT_PERCENTAGE_001",
          123,
        );

        expect(result).toBeDefined();
        expect(result.question).toContain("retailer purchases a product");
        expect(result.difficulty).toBe(DifficultyLevel.MEDIUM);

        const logs = customRuntime.getFailureLogs();
        expect(logs.length).toBeGreaterThan(0);
        expect(logs[0].templateId).toBe("APT_PERCENTAGE_001");
        expect(logs[0].reason).toContain(
          "Failed to generate a valid, unique question",
        );

        // RESTORE target and fallback templates to prevent test pollution
        if (target) {
          target.metadata.w1_steps = 3.0;
        }
        if (fallback) {
          fallback.topic = "profit_loss";
        }
      });
    });

    describe("Validation Metrics Tracking", () => {
      it("should report retry counts, validation success rates, and failure breakdowns correctly", () => {
        const runtime = new AptitudeGenerationRuntime();

        runtime.generateQuestion("APT_PERCENTAGE_001", 100);
        runtime.generateQuestion("APT_PERCENTAGE_001", 200);

        const metadata = runtime.getTemplateMetadata("APT_PERCENTAGE_001");
        expect(metadata).not.toBeNull();
        if (metadata) {
          expect(metadata.metrics.validationSuccessRate).toBe(1.0);
          expect(metadata.metrics.retryCounts).toBeDefined();
          expect(metadata.metrics.failureBreakdown).toBeDefined();
        }
      });
    });
  });
});
