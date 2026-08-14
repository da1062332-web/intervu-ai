import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "@nestjs/event-emitter";
import { PrismaService } from "../../../prisma/prisma.service";
import { PatternExecutionService } from "../../coding/services/pattern-execution.service";
import { CodingStatementGeneratorService } from "../../coding/services/coding-statement-generator.service";
import { OracleRegistry } from "../../coding/oracles/oracle.registry";

@Injectable()
export class CodingPatternListener {
  private readonly logger = new Logger(CodingPatternListener.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly executionService: PatternExecutionService,
    private readonly statementGenerator: CodingStatementGeneratorService,
    private readonly oracleRegistry: OracleRegistry,
  ) {}

  @OnEvent("coding_pattern.created", { async: true })
  async handleCodingPatternCreatedEvent(payload: {
    patternId: string;
    oracleKey: string;
  }) {
    this.logger.log(
      `Received coding_pattern.created for patternId=${payload.patternId}`,
    );
    try {
      const pattern = await this.prisma.codingPattern.findUnique({
        where: { id: payload.patternId },
      });
      if (!pattern) {
        this.logger.warn(
          `Pattern ${payload.patternId} not found, skipping generation.`,
        );
        return;
      }

      // 1. Execute deterministic pattern pipeline
      const seed = Math.floor(Math.random() * 1000000);
      const executionResult = await this.executionService.executePattern(
        {
          oracleKey: pattern.oracleKey,
          parameterSchema:
            (pattern.parameterSchema as Record<string, any>) || {},
          constraintSchema:
            (pattern.constraintSchema as Record<string, any>) || {},
          difficulty: pattern.difficulty,
        },
        seed,
      );

      // 2. Generate AI narrative
      const aiStatement = await this.statementGenerator.generateStatement(
        pattern as any,
        executionResult,
      );

      // 3. Derive oracle category dynamically
      let oracleCategory = "CODING";
      try {
        const oracle = this.oracleRegistry.getOracle(pattern.oracleKey);
        oracleCategory = (oracle.category || "CODING").toString().toUpperCase();
      } catch {
        // Fallback - oracle not in registry
      }

      const patternSpec =
        (pattern.statementSpecification as Record<string, any>) || {};
      const statementSpecification = {
        ...patternSpec,
        problemType: oracleCategory,
      };

      // 4. Resolve topicId from pattern.metadata
      const patternMeta = (pattern.metadata as Record<string, any>) || {};
      let topicId = patternMeta.topicId;

      // If no topicId in metadata, try to find via conceptKey
      if (!topicId && patternMeta.conceptKey) {
        const concept = await this.prisma.concept.findFirst({
          where: {
            code: { equals: patternMeta.conceptKey, mode: "insensitive" },
          },
        });
        if (concept) {
          topicId = concept.topicId;
        }
      }

      // Last resort: find any topic
      if (!topicId) {
        const anyTopic = await this.prisma.topic.findFirst();
        topicId = anyTopic?.id;
      }

      if (!topicId) {
        this.logger.error(
          `No topicId could be resolved for pattern ${pattern.id}. Cannot save question.`,
        );
        return;
      }

      // 5. Find a default section
      const section = await this.prisma.examSection.findFirst();

      // 6. Build coding_data (matches the working example structure)
      const codingData = {
        seed,
        oracleKey: pattern.oracleKey,
        patternId: pattern.id,
        patternKey: pattern.patternKey,
        parameters: executionResult.parameters,
        generatedInput: executionResult.generatedInput,
        expectedOutput: executionResult.expectedOutput,
        publicTests: executionResult.publicTests,
        hiddenTests: executionResult.hiddenTests,
        stressTests: executionResult.stressTests,
        boundaryTests: executionResult.boundaryTests,
        starterCode: (pattern.starterCode as Record<string, any>) || {},
      };

      // 7. Build metadata (matches the working example structure)
      const metadata = {
        seed,
        status: "APPROVED",
        strategy: "CODING_PATTERN",
        oracleKey: pattern.oracleKey,
        patternId: pattern.id,
        conceptKey: patternMeta.conceptKey,
        difficulty: pattern.difficulty,
        parameters: executionResult.parameters,
        patternKey: pattern.patternKey,
        templateId: pattern.id,
        aiStatement,
        generatedAt: new Date().toISOString(),
        hiddenTests: executionResult.hiddenTests,
        publicTests: executionResult.publicTests,
        starterCode: (pattern.starterCode as Record<string, any>) || {},
        stressTests: executionResult.stressTests,
        boundaryTests: executionResult.boundaryTests,
        contextSummary: `Coding pattern strategy — pattern: ${pattern.patternKey}, oracle: ${pattern.oracleKey}`,
        expectedOutput: executionResult.expectedOutput,
        generatedInput: executionResult.generatedInput,
        statementSpecification,
      };

      // 8. Resolve conceptId and templateId
      let conceptId: string | undefined;
      let templateId: string | undefined = patternMeta.templateId;

      if (patternMeta.conceptKey) {
        const concept = await this.prisma.concept.findFirst({
          where: {
            code: { equals: patternMeta.conceptKey, mode: "insensitive" },
          },
        });
        conceptId = concept?.id;

        if (!templateId) {
          const tmpl = await this.prisma.template.findFirst({
            where: {
              conceptKey: { equals: patternMeta.conceptKey, mode: "insensitive" },
            },
          });
          templateId = tmpl?.id;
        }
      }

      // Generate instructions JSON with constraints and sample test cases
      const instructions = JSON.stringify({
        constraints:
          aiStatement.constraintsDescription ||
          "Standard time O(N) and space O(1) constraints apply.",
        testCases: JSON.stringify(
          (executionResult.publicTests || []).map((t: any) => ({
            input:
              typeof t.input === "object"
                ? JSON.stringify(t.input)
                : String(t.input),
            output:
              typeof t.expectedOutput === "object" &&
              t.expectedOutput.result !== undefined
                ? String(t.expectedOutput.result)
                : JSON.stringify(t.expectedOutput),
          })),
          null,
          2,
        ),
      });

      // 9. Check if question already exists for this pattern, update instead of creating duplicate
      const existingQuestion = await this.prisma.question.findFirst({
        where: {
          questionType: "CODING",
          metadata: { path: ["patternId"], equals: pattern.id },
        },
      });

      if (existingQuestion) {
        const updated = await this.prisma.question.update({
          where: { id: existingQuestion.id },
          data: {
            questionText: aiStatement.narrative || "Coding Question",
            questionTitle: aiStatement.title || pattern.title,
            questionStatement: aiStatement.narrative,
            instructions,
            answer: JSON.stringify(executionResult.expectedOutput),
            explanation: `Generated by Coding Pattern strategy`,
            difficulty: pattern.difficulty,
            templateId: templateId || existingQuestion.templateId,
            codingData: codingData as any,
            metadata: metadata as any,
            topicId,
            conceptId,
            updatedAt: new Date(),
          },
        });
        this.logger.log(
          `Updated existing question ${updated.id} for pattern ${pattern.id}`,
        );
      } else {
        const saved = await this.prisma.question.create({
          data: {
            questionText: aiStatement.narrative || "Coding Question",
            questionTitle: aiStatement.title || pattern.title,
            questionStatement: aiStatement.narrative,
            instructions,
            answer: JSON.stringify(executionResult.expectedOutput),
            explanation: `Generated by Coding Pattern strategy`,
            difficulty: pattern.difficulty,
            source: "GENERATED",
            questionType: "CODING",
            templateId,
            topicId,
            conceptId,
            sectionId: section?.id,
            codingData: codingData as any,
            metadata: metadata as any,
            status: "ACTIVE",
          },
        });
        this.logger.log(
          `Created new question ${saved.id} for pattern ${pattern.id}`,
        );
      }
    } catch (error: any) {
      this.logger.error(
        `Failed to auto-generate question for pattern ${payload.patternId}: ${error.message}`,
        error.stack,
      );
    }
  }
}
