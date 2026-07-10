import { Test, TestingModule } from "@nestjs/testing";
import { TemplateController } from "../controllers/template.controller";
import { TemplateService } from "../services/template.service";
import { SolutionTemplateService } from "../services/solution-template.service";

describe("Template Sub-resources Integration Tests", () => {
  let controller: TemplateController;
  let templateServiceMock: any;
  let solutionTemplateServiceMock: any;

  beforeEach(async () => {
    templateServiceMock = {
      findById: jest.fn(),
      update: jest.fn(),
    };

    solutionTemplateServiceMock = {};

    const module: TestingModule = await Test.createTestingModule({
      controllers: [TemplateController],
      providers: [
        { provide: TemplateService, useValue: templateServiceMock },
        {
          provide: SolutionTemplateService,
          useValue: solutionTemplateServiceMock,
        },
      ],
    }).compile();

    controller = module.get<TemplateController>(TemplateController);
  });

  describe("1. Question Definition Sub-resources", () => {
    it("should load the question definition successfully", async () => {
      templateServiceMock.findById.mockResolvedValue({
        id: "tpl-1",
        structure: {
          questionTemplate: "How much is {{a}} + {{b}}?",
        },
      });

      const result = await controller.getQuestionDefinition("tpl-1");
      expect(result).toEqual({
        templateId: "tpl-1",
        questionTemplate: "How much is {{a}} + {{b}}?",
      });
      expect(templateServiceMock.findById).toHaveBeenCalledWith("tpl-1");
    });

    it("should save/update the question definition successfully", async () => {
      templateServiceMock.findById.mockResolvedValue({
        id: "tpl-1",
        structure: {
          optionsTemplate: ["a", "b"],
        },
      });

      templateServiceMock.update.mockResolvedValue({
        id: "tpl-1",
        structure: {
          questionTemplate: "New question text?",
          optionsTemplate: ["a", "b"],
        },
      });

      const result = await controller.saveQuestionDefinition("tpl-1", {
        questionTemplate: "New question text?",
      });

      expect(templateServiceMock.update).toHaveBeenCalledWith("tpl-1", {
        structure: {
          questionTemplate: "New question text?",
          optionsTemplate: ["a", "b"],
        },
      });
    });
  });

  describe("2. Option Strategy Sub-resources", () => {
    it("should load the options strategy successfully", async () => {
      templateServiceMock.findById.mockResolvedValue({
        id: "tpl-1",
        structure: {
          optionsTemplate: ["opt1", "opt2"],
        },
      });

      const result = await controller.getOptionStrategy("tpl-1");
      expect(result).toEqual({
        templateId: "tpl-1",
        optionsTemplate: ["opt1", "opt2"],
      });
    });

    it("should save/update the option strategy successfully", async () => {
      templateServiceMock.findById.mockResolvedValue({
        id: "tpl-1",
        structure: {
          questionTemplate: "Text",
        },
      });

      templateServiceMock.update.mockResolvedValue({
        id: "tpl-1",
        structure: {
          questionTemplate: "Text",
          optionsTemplate: ["new1", "new2"],
        },
      });

      const result = await controller.saveOptionStrategy("tpl-1", {
        optionsTemplate: ["new1", "new2"],
      });

      expect(templateServiceMock.update).toHaveBeenCalledWith("tpl-1", {
        structure: {
          questionTemplate: "Text",
          optionsTemplate: ["new1", "new2"],
        },
      });
    });
  });
});
