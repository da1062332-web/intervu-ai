/* eslint-disable @typescript-eslint/ban-ts-comment */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
// @ts-nocheck
// ts-nocheck-removed
import { QuestionAllocatorService } from "../src/modules/assembly/services/question-allocator.service";
import { AntiRepetitionService } from "../src/modules/assembly/services/anti-repetition.service";
import { BlueprintBuilderService } from "../src/modules/assembly/services/blueprint-builder.service";
import { AssemblyValidatorService } from "../src/modules/assembly/validators/assembly-validator.service";
import { AssemblyService } from "../src/modules/assembly/services/test-assembly.service";
import { MockSemanticSimilarityProvider } from "../src/modules/assembly/providers/mock-semantic-similarity.provider";
import { SectionBuilderService } from "../src/modules/assembly/services/section-builder.service";

async function runBenchmark() {
  const poolRepositoryMock = {
    findAvailableQuestions: jest
      .fn()
      .mockImplementation((topicId, diff, count, excluded) => {
        // Return requested amount of mock questions
        const q = [];
        for (let i = 0; i < count; i++) {
          q.push({
            id: `q-${topicId}-${diff}-${i}-${Math.random()}`,
            questionHash: "hash",
            conceptKey: topicId,
            difficultyLevel: diff,
            questionType: "MULTIPLE_CHOICE",
            text: "What is " + topicId + " in " + diff + " difficulty?",
          });
        }
        return Promise.resolve(q);
      }),
    findRecentUsedQuestions: jest.fn().mockResolvedValue([]),
    getQuestionsByIds: jest.fn().mockImplementation((ids) => {
      return Promise.resolve(
        ids.map((id) => ({ id, text: "Some question text" })),
      );
    }),
  };

  const blueprintRepositoryMock = {
    getExamConfigForBlueprint: jest.fn().mockResolvedValue({
      id: "cfg-1",
      difficultyDistribution: {
        easyPercentage: 40,
        mediumPercentage: 40,
        hardPercentage: 20,
      },
      sections: [
        {
          id: "sec-1",
          code: "SEC1",
          name: "Section 1",
          questionCount: 30,
          sectionDurationMinutes: 30,
          sectionOrder: 0,
          sectionTopics: [
            { topicId: "react", topicWeightage: { weightagePercentage: 100 } },
          ],
        },
        {
          id: "sec-2",
          code: "SEC2",
          name: "Section 2",
          questionCount: 30,
          sectionDurationMinutes: 30,
          sectionOrder: 1,
          sectionTopics: [
            { topicId: "node", topicWeightage: { weightagePercentage: 100 } },
          ],
        },
        {
          id: "sec-3",
          code: "SEC3",
          name: "Section 3",
          questionCount: 30,
          sectionDurationMinutes: 30,
          sectionOrder: 2,
          sectionTopics: [
            { topicId: "sql", topicWeightage: { weightagePercentage: 100 } },
          ],
        },
      ],
    }),
  };

  const assemblyRepositoryMock = {
    createTestInstanceWithTransaction: jest
      .fn()
      .mockResolvedValue({ testInstanceId: "ti-123" }),
  };

  const semanticProvider = new MockSemanticSimilarityProvider();
  const antiRepetitionService = new AntiRepetitionService(
    semanticProvider,
    poolRepositoryMock as never,
  );
  const allocator = new QuestionAllocatorService(
    poolRepositoryMock as never,
    antiRepetitionService,
  );
  const blueprintBuilder = new BlueprintBuilderService(
    blueprintRepositoryMock as never,
  );
  const validator = new AssemblyValidatorService();

  const sectionBuilder = new SectionBuilderService();

  const assemblyService = new AssemblyService(
    assemblyRepositoryMock as never,
    blueprintBuilder,
    allocator,
    sectionBuilder,
    validator,
    poolRepositoryMock as never,
  );

  const start = performance.now();
  await await assemblyService.assembleTest("cfg-1", "cand-1");
  const end = performance.now();

  console.log(`Generated test in ${(end - start).toFixed(2)} ms`);
  if (end - start < 5000) {
    console.log("Benchmark PASSED: < 5 seconds");
  } else {
    console.log("Benchmark FAILED: >= 5 seconds");
  }
}

// Simple mock for jest to avoid error
(global as any).jest = {
  fn: () => {
    let mockImpl: any = () => {};
    const mockFn = (...args: any[]) => mockImpl(...args);
    mockFn.mockImplementation = (impl: any) => {
      mockImpl = impl;
      return mockFn;
    };
    mockFn.mockResolvedValue = (val: any) => {
      mockImpl = () => Promise.resolve(val);
      return mockFn;
    };
    return mockFn as any;
  },
};

runBenchmark().catch(console.error);
