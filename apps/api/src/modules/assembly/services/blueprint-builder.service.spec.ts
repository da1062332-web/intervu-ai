import { BlueprintBuilderService } from "./blueprint-builder.service";
import { BlueprintRepository } from "../repositories/blueprint.repository";

describe("BlueprintBuilderService", () => {
  let service: BlueprintBuilderService;
  let repo: jest.Mocked<BlueprintRepository>;

  beforeEach(() => {
    repo = {
      getExamConfigForBlueprint: jest.fn(),
    } as never;

    service = new BlueprintBuilderService(repo);
  });

  it("should dynamically build a blueprint from ExamConfig", async () => {
    repo.getExamConfigForBlueprint.mockResolvedValue({
      id: "cfg-1",
      difficultyDistribution: {
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 20,
      },
      sections: [
        {
          id: "sec-1",
          code: "SEC1",
          name: "Section 1",
          questionCount: 10,
          sectionDurationMinutes: 10,
          sectionOrder: 0,
          sectionTopics: [
            {
              topicId: "top-1",
              topicWeightage: { weightagePercentage: 100 },
            },
          ],
        },
      ],
    } as never);

    const blueprint = await service.generateBlueprint("cfg-1");
    expect(blueprint.testConfigId).toBe("cfg-1");
    expect(blueprint.totalQuestions).toBe(10);
    expect(blueprint.sections).toHaveLength(1);
    expect(blueprint.sections[0].sectionKey).toBe("SEC1");
  });

  it("should fail if difficulty total != 100", async () => {
    repo.getExamConfigForBlueprint.mockResolvedValue({
      id: "cfg-1",
      difficultyDistribution: {
        easyPercentage: 30,
        mediumPercentage: 50,
        hardPercentage: 10,
      },
      sections: [{}],
    } as never);

    await expect(service.generateBlueprint("cfg-1")).rejects.toThrow(
      "Difficulty total != 100%",
    );
  });
});
