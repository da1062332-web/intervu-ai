import { Test, TestingModule } from "@nestjs/testing";
import { DistributionAnalyticsService } from "./distribution-analytics.service";
import { AssembledTestRepository } from "../repositories/assembled-test.repository";
import { AssemblyRepository } from "../repositories/assembly.repository";

describe("DistributionAnalyticsService", () => {
  let service: DistributionAnalyticsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DistributionAnalyticsService,
        {
          provide: AssembledTestRepository,
          useValue: {
            findById: jest.fn().mockResolvedValue({
              id: "test-1",
              sections: [
                {
                  questions: [
                    {
                      questionSnapshot: {
                        conceptKey: "React",
                        difficultyLevel: "HARD",
                      },
                    },
                    {
                      questionSnapshot: {
                        conceptKey: "Node",
                        difficultyLevel: "MEDIUM",
                      },
                    },
                  ],
                },
              ],
            }),
          },
        },
        {
          provide: AssemblyRepository,
          useValue: {
            findById: jest.fn(),
          },
        },
      ],
    }).compile();

    service = module.get<DistributionAnalyticsService>(
      DistributionAnalyticsService,
    );
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });
});
