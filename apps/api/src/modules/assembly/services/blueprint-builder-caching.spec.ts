import { BlueprintBuilderService } from "./blueprint-builder.service";
import { BlueprintRepository } from "../repositories/blueprint.repository";
import { RedisCacheService } from "../../../cache/redis-cache.service";
import { BlueprintDto } from "@intervu/shared";

describe("BlueprintBuilderService Caching MVP", () => {
  let service: BlueprintBuilderService;
  let repo: jest.Mocked<BlueprintRepository>;
  let redis: jest.Mocked<RedisCacheService>;

  beforeEach(() => {
    repo = {
      getExamConfigForBlueprint: jest.fn(),
    } as never;

    redis = {
      getBlueprint: jest.fn(),
      setBlueprint: jest.fn(),
    } as never;

    service = new BlueprintBuilderService(repo, redis as unknown as RedisCacheService);
  });

  it("should return blueprint from cache if present (Cache Hit)", async () => {
    const cachedBlueprint: BlueprintDto = {
      testConfigId: "cfg-cache",
      totalQuestions: 10,
      totalDurationSeconds: 600,
      sections: [],
    };

    redis.getBlueprint.mockResolvedValue(cachedBlueprint);

    const result = await service.generateBlueprint("cfg-cache");

    expect(redis.getBlueprint).toHaveBeenCalledWith("cfg-cache");
    expect(repo.getExamConfigForBlueprint).not.toHaveBeenCalled();
    expect(redis.setBlueprint).not.toHaveBeenCalled();
    expect(result).toEqual(cachedBlueprint);
  });

  it("should generate, cache, and return blueprint on cache miss", async () => {
    redis.getBlueprint.mockResolvedValue(null);

    repo.getExamConfigForBlueprint.mockResolvedValue({
      id: "cfg-1",
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

    const result = await service.generateBlueprint("cfg-1");

    expect(redis.getBlueprint).toHaveBeenCalledWith("cfg-1");
    expect(repo.getExamConfigForBlueprint).toHaveBeenCalledWith("cfg-1");
    expect(redis.setBlueprint).toHaveBeenCalledWith("cfg-1", result, expect.any(Number));
    expect(result.testConfigId).toBe("cfg-1");
  });

  it("should generate correctly even if Redis setBlueprint fails (Graceful Fallback)", async () => {
    redis.getBlueprint.mockResolvedValue(null);
    redis.setBlueprint.mockResolvedValue(false);

    repo.getExamConfigForBlueprint.mockResolvedValue({
      id: "cfg-fail",
      sections: [
        {
          id: "sec-1",
          code: "SEC1",
          name: "Section 1",
          questionCount: 5,
          sectionDurationMinutes: 5,
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

    const result = await service.generateBlueprint("cfg-fail");

    expect(repo.getExamConfigForBlueprint).toHaveBeenCalled();
    expect(result.testConfigId).toBe("cfg-fail");
  });
});
