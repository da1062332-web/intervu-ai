import { Test, TestingModule } from "@nestjs/testing";
import { ReadinessEngineService } from "./readiness-engine.service";
import { ExamConfigRepository } from "../../admin-config/repositories/exam-config.repository";
import { ExamSectionRepository } from "../../admin-config/repositories/exam-section.repository";
import { TopicRepository } from "../../concept-mapping/repositories/topic.repository";
import { ConceptMappingRepository } from "../../concept-mapping/repositories/concept-mapping.repository";
import { TopicSectionMappingRepository } from "../../topic-section-mapping/repositories/topic-section-mapping.repository";
import { TopicWeightageRepository } from "../../topic-section-mapping/repositories/topic-weightage.repository";
import { TemplateRepository } from "../../template-library/repositories/template.repository";
import { TemplateVariableRepository } from "../../template-library/repositories/template-variable.repository";
import { TemplateRuleRepository } from "../../template-library/repositories/template-rule.repository";
import { BlueprintService } from "../../blueprint/services/blueprint.service";
import { BlueprintRepository } from "../../blueprint/repositories/blueprint.repository";
import { ReadinessReportRepository } from "../repositories/readiness-report.repository";
import { PrismaService } from "../../../prisma/prisma.service";

describe("ReadinessEngineService Unit Tests", () => {
  let service: ReadinessEngineService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ReadinessEngineService,
        { provide: PrismaService, useValue: {} },
        { provide: ExamConfigRepository, useValue: {} },
        { provide: ExamSectionRepository, useValue: {} },
        { provide: TopicRepository, useValue: {} },
        { provide: ConceptMappingRepository, useValue: {} },
        { provide: TopicSectionMappingRepository, useValue: {} },
        { provide: TopicWeightageRepository, useValue: {} },
        { provide: TemplateRepository, useValue: {} },
        { provide: TemplateVariableRepository, useValue: {} },
        { provide: TemplateRuleRepository, useValue: {} },
        { provide: BlueprintService, useValue: {} },
        { provide: BlueprintRepository, useValue: {} },
        { provide: ReadinessReportRepository, useValue: {} },
      ],
    }).compile();

    service = module.get<ReadinessEngineService>(ReadinessEngineService);
  });

  describe("Score Calculation", () => {
    it("should return 0 when all checks fail", () => {
      const checks = Array(10).fill({ status: "FAIL" });
      const score = service.calculateScore(checks);
      expect(score).toBe(0);
    });

    it("should return 100 when all 10 checks pass", () => {
      const checks = Array(10).fill({ status: "PASS" });
      const score = service.calculateScore(checks);
      expect(score).toBe(100);
    });

    it("should return 50 when 5 checks pass", () => {
      const checks = [
        ...Array(5).fill({ status: "PASS" }),
        ...Array(5).fill({ status: "FAIL" }),
      ];
      const score = service.calculateScore(checks);
      expect(score).toBe(50);
    });
  });

  describe("Status Assignment", () => {
    it("should return READY for 100 score", () => {
      const status = service.getReadinessStatus(100);
      expect(status).toBe("READY");
    });

    it("should return PARTIALLY_READY for score between 50 and 99", () => {
      expect(service.getReadinessStatus(50)).toBe("PARTIALLY_READY");
      expect(service.getReadinessStatus(90)).toBe("PARTIALLY_READY");
    });

    it("should return NOT_READY for score below 50", () => {
      expect(service.getReadinessStatus(0)).toBe("NOT_READY");
      expect(service.getReadinessStatus(40)).toBe("NOT_READY");
    });
  });
});
