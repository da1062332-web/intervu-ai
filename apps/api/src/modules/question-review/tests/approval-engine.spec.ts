import { ApprovalEngineService } from "../reviewers/approval-engine.service";

describe("ApprovalEngineService", () => {
  let service: ApprovalEngineService;

  beforeEach(() => {
    service = new ApprovalEngineService();
  });

  it("should recommend APPROVE for scores > 85 with no critical issues", () => {
    const res = service.recommend(90, 0);
    expect(res.recommendation).toBe("APPROVE");
    expect(res.reason).toContain("Approved");
  });

  it("should recommend REVIEW for scores between 60 and 85", () => {
    const res = service.recommend(75, 0);
    expect(res.recommendation).toBe("REVIEW");
    expect(res.reason).toContain("Escalated");
  });

  it("should recommend REJECT for scores < 60", () => {
    const res = service.recommend(55, 0);
    expect(res.recommendation).toBe("REJECT");
    expect(res.reason).toContain("Rejected");
  });

  it("should reject immediately if critical issues exist, regardless of score", () => {
    const res = service.recommend(95, 1);
    expect(res.recommendation).toBe("REJECT");
    expect(res.reason).toContain("Rejected due to 1 critical");
  });
});
