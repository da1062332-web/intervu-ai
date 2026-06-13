import { connectPrisma, disconnectPrisma, prisma, TemplateRepository } from "../packages/database/src";
import { GenerationService } from "../packages/ai-core/src/generation/generation.service";
import { TemplateSelectorService } from "../packages/ai-core/src/generation/template-selector.service";

const CONCEPTS = ["time_work", "percentages", "probability", "averages", "profit_loss"];
const DIFFICULTIES: Array<"easy" | "medium" | "hard"> = ["easy", "medium", "hard"];

class CachedTemplateRepository extends TemplateRepository {
  private cache = new Map<string, any[]>();
  async findByConceptAndDifficulty(conceptKey: string, difficultyLevel: any): Promise<any[]> {
    const cacheKey = `${conceptKey}_${difficultyLevel}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }
    const result = await super.findByConceptAndDifficulty(conceptKey, difficultyLevel);
    this.cache.set(cacheKey, result);
    return result;
  }
}

async function runAudit() {
  console.log("==========================================");
  console.log("Running Question Generation Quality Audit (100 Assessments)");
  console.log("==========================================\n");

  await connectPrisma();

  try {
    const cachedRepo = new CachedTemplateRepository();
    const selector = new TemplateSelectorService(cachedRepo);
    const generationService = new GenerationService(selector);

    let totalAssessments = 100;
    let duplicateFailures = 0;
    let missingAnswerFailures = 0;
    let invalidMetadataFailures = 0;
    let invalidDifficultyFailures = 0;
    let otherFailures = 0;

    // 1. Ensure all 15 audit templates exist with correct difficulty step counts
    console.log("Upserting audit templates...");
    for (const concept of CONCEPTS) {
      for (const difficulty of DIFFICULTIES) {
        const key = `audit_template_${concept}_${difficulty}`;
        
        let steps: string[] = [];
        if (difficulty === "easy") {
          steps = ["Step 1: add {a} + {b}"];
        } else if (difficulty === "medium") {
          steps = ["Step 1: find {a}", "Step 2: find {b}", "Step 3: add {a} + {b}"];
        } else {
          steps = ["Step 1: start", "Step 2: read {a}", "Step 3: read {b}", "Step 4: add", "Step 5: final sum is {a} + {b}"];
        }

        await prisma.template.upsert({
          where: { templateKey: key },
          create: {
            templateKey: key,
            conceptKey: concept,
            difficultyLevel: difficulty.toUpperCase() as any,
            questionType: "mcq",
            name: `Audit Template ${concept} ${difficulty}`,
            structure: {
              questionTemplate: `What is {a} + {b}? [Audit: ${concept} ${difficulty}]?`,
            },
            variableSchema: {
              variables: [
                { name: "a", type: "number", range: { min: 1, max: 10 } },
                { name: "b", type: "number", range: { min: 1, max: 10 } },
              ],
            },
            constraints: { constraints: [] },
            solutionSchema: {
              steps,
              finalAnswer: "a + b",
            },
            version: 1,
            isActive: true,
          },
          update: {
            isActive: true,
            conceptKey: concept,
            difficultyLevel: difficulty.toUpperCase() as any,
            questionType: "mcq",
            structure: {
              questionTemplate: `What is {a} + {b}? [Audit: ${concept} ${difficulty}]?`,
            },
            variableSchema: {
              variables: [
                { name: "a", type: "number", range: { min: 1, max: 10 } },
                { name: "b", type: "number", range: { min: 1, max: 10 } },
              ],
            },
            constraints: { constraints: [] },
            solutionSchema: {
              steps,
              finalAnswer: "a + b",
            },
          },
        });
      }
    }

    // 2. Temporarily deactivate all other templates for these concepts to prevent collisons
    console.log("Deactivating other templates temporarily...");
    await prisma.template.updateMany({
      where: {
        conceptKey: { in: CONCEPTS },
        NOT: { templateKey: { startsWith: "audit_template_" } }
      },
      data: { isActive: false }
    });

    console.log("Running audit simulations...");
    for (let a = 1; a <= totalAssessments; a++) {
      const questionsInAssessment: any[] = [];
      
      // Each assessment consists of 2 questions from different concepts and difficulties
      for (let q = 1; q <= 2; q++) {
        // Deterministically select concept and difficulty based on assessment index a and question index q
        const concept = CONCEPTS[(a + q) % CONCEPTS.length];
        const difficulty = DIFFICULTIES[(a * q) % DIFFICULTIES.length];

        const seed = `assessment_audit_${a}_question_${q}`;
        
        try {
          const result = await generationService.generateQuestion(
            {
              conceptKey: concept,
              difficultyLevel: difficulty,
              questionType: "mcq",
            },
            seed
          );
          
          questionsInAssessment.push(result.question);
        } catch (error: any) {
          console.error(`Assessment #${a} Q#${q} Generation Error:`, error.message);
          otherFailures++;
        }
      }

      if (questionsInAssessment.length < 2) {
        continue; // Generation failed, counted in otherFailures
      }

      const [q1, q2] = questionsInAssessment;

      // 1. Check for Duplicate Questions within the same assessment
      if (
        q1.questionText.trim().toLowerCase() === q2.questionText.trim().toLowerCase() ||
        q1.questionId === q2.questionId
      ) {
        console.error(`❌ Assessment #${a} Fail: Duplicate questions in same assessment.`);
        duplicateFailures++;
      }

      for (let idx = 0; idx < questionsInAssessment.length; idx++) {
        const question = questionsInAssessment[idx];

        // 2. Check for Missing Answers
        if (!question.correctAnswer || String(question.correctAnswer).trim() === "") {
          console.error(`❌ Assessment #${a} Q#${idx + 1} Fail: Missing correct answer.`);
          missingAnswerFailures++;
        }
        if (question.options && !question.options.includes(question.correctAnswer)) {
          console.error(`❌ Assessment #${a} Q#${idx + 1} Fail: Correct answer not in MCQ options list.`);
          missingAnswerFailures++;
        }

        // 3. Check for Invalid Metadata (empty, or containing unresolved curly brace placeholders)
        const text = question.questionText || "";
        const hasUnresolvedBraces = /\{([a-zA-Z0-9_]+)\}/.test(text);
        const metadata = question.metadata || {};
        const isMetadataEmpty = Object.keys(metadata).length === 0;

        if (hasUnresolvedBraces || isMetadataEmpty) {
          console.error(`❌ Assessment #${a} Q#${idx + 1} Fail: Invalid metadata / unresolved placeholders.`);
          invalidMetadataFailures++;
        }

        // 4. Check for Invalid Difficulty (Easy: 1-2 steps, Medium: 2-4 steps, Hard: 4+ steps)
        const difficulty = question.difficultyLevel;
        let stepCount = 0;
        if (question.solution) {
          try {
            const parsed = JSON.parse(question.solution);
            if (parsed && Array.isArray(parsed.steps)) {
              stepCount = parsed.steps.length;
            }
          } catch {
            stepCount = question.solution.split(/[.!?\n]+/).filter((line: string) => line.trim().length > 0).length;
          }
        }
        
        let isDifficultyValid = false;
        if (difficulty === "easy") {
          isDifficultyValid = stepCount >= 1 && stepCount <= 2;
        } else if (difficulty === "medium") {
          isDifficultyValid = stepCount >= 2 && stepCount <= 4;
        } else if (difficulty === "hard") {
          isDifficultyValid = stepCount >= 4;
        }

        if (!isDifficultyValid) {
          console.error(`❌ Assessment #${a} Q#${idx + 1} Fail: Invalid step count (${stepCount}) for difficulty '${difficulty}'.`);
          invalidDifficultyFailures++;
        }
      }
    }

    const totalFailures = duplicateFailures + missingAnswerFailures + invalidMetadataFailures + invalidDifficultyFailures + otherFailures;

    console.log("\n==========================================");
    console.log("Generation Audit Summary");
    console.log(`Duplicate Failures: ${duplicateFailures}`);
    console.log(`Missing Answer Failures: ${missingAnswerFailures}`);
    console.log(`Invalid Metadata Failures: ${invalidMetadataFailures}`);
    console.log(`Invalid Difficulty Failures: ${invalidDifficultyFailures}`);
    console.log(`Other Generation Failures: ${otherFailures}`);
    console.log(`Total Failures: ${totalFailures}`);
    console.log("==========================================\n");

    if (totalFailures > 0) {
      console.error("❌ GENERATION AUDIT FAILED");
      process.exit(1);
    } else {
      console.log("GENERATION PASS");
      process.exit(0);
    }
  } catch (error) {
    console.error("Critical failure during generation audit:", error);
    process.exit(1);
  } finally {
    // 3. Restore all other templates back to active state
    console.log("Restoring other templates...");
    await prisma.template.updateMany({
      where: {
        conceptKey: { in: CONCEPTS },
        NOT: { templateKey: { startsWith: "audit_template_" } }
      },
      data: { isActive: true }
    }).catch((err) => console.error("Error restoring templates:", err));

    await disconnectPrisma();
  }
}

runAudit();
