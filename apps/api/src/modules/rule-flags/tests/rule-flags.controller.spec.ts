import { Test, TestingModule } from "@nestjs/testing";
import { RuleFlagsController } from "../controllers/rule-flags.controller";
import { RuleFlagsService } from "../services/rule-flags.service";

describe("RuleFlagsController", () => {
  let controller: RuleFlagsController;
  let service: jest.Mocked<RuleFlagsService>;

  const mockService = {
    getRuleFlags: jest.fn(),
    updateRuleFlags: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [RuleFlagsController],
      providers: [{ provide: RuleFlagsService, useValue: mockService }],
    }).compile();

    controller = module.get<RuleFlagsController>(RuleFlagsController);
    service = module.get(RuleFlagsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("getRuleFlags", () => {
    it("should return rule flags", async () => {
      const mockResult = {
        id: "1",
      } as import("@intervu/shared").RuleFlagsResponseDto;
      service.getRuleFlags.mockResolvedValue(mockResult);

      const result = await controller.getRuleFlags("config-1");

      expect(service.getRuleFlags).toHaveBeenCalledWith("config-1");
      expect(result).toEqual(mockResult);
    });
  });

  describe("updateRuleFlags", () => {
    it("should update rule flags", async () => {
      const mockPayload = {
        sectionLockingEnabled: true,
      } as import("@intervu/shared").UpdateRuleFlagsDto;
      const mockResult = {
        id: "1",
        ...mockPayload,
      } as unknown as import("@intervu/shared").RuleFlagsResponseDto;
      service.updateRuleFlags.mockResolvedValue(mockResult);

      const result = await controller.updateRuleFlags("config-1", mockPayload);

      expect(service.updateRuleFlags).toHaveBeenCalledWith(
        "config-1",
        mockPayload,
      );
      expect(result).toEqual(mockResult);
    });
  });
});
