import { Test, TestingModule } from "@nestjs/testing";
import { PublicTestsService } from "./public-tests.service";
import { PublicTestsRepository } from "../repositories/public-tests.repository";

describe("PublicTestsService", () => {
  let service: PublicTestsService;
  let repository: PublicTestsRepository;

  beforeEach(async () => {
    const mockRepository = {
      findPublicTests: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PublicTestsService,
        { provide: PublicTestsRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<PublicTestsService>(PublicTestsService);
    repository = module.get<PublicTestsRepository>(PublicTestsRepository);
  });

  it("should paginate, search, and format public tests", async () => {
    jest.spyOn(repository, "findPublicTests").mockResolvedValue({
      total: 2,
      items: [
        {
          id: "test1",
          displayName: "React Basics",
          companyName: "Acme",
          totalDurationSeconds: 1800,
          sections: [{ displayName: "Coding" }],
        } as any,
      ],
    });

    const result = await service.getPublicTests({
      search: "React",
      page: 1,
      limit: 10,
    });

    expect(repository.findPublicTests).toHaveBeenCalledWith(
      expect.objectContaining({
        search: "React",
        skip: 0,
        take: 10,
      }),
    );

    expect(result.pagination.total).toBe(2);
    expect(result.tests).toHaveLength(1);
    expect(result.tests[0].name).toBe("React Basics");
    expect(result.tests[0].sections).toEqual(["Coding"]);
  });
});
