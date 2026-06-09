import { describe, it, expect, vi, beforeEach } from "vitest";
import { PrismaClient } from "@prisma/client";
import { AssemblyRepository } from "../assembly.repository";
import { TestInstanceRepository } from "../test-instance.repository";
import { TestInstanceSectionRepository } from "../test-instance-section.repository";
import { TestInstanceQuestionRepository } from "../test-instance-question.repository";

// Mock the entire prisma client module
vi.mock("../../client", () => ({
  prisma: {
    testInstance: {
      create: vi.fn(),
      findUnique: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
    },
    testInstanceSection: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      findUnique: vi.fn(),
    },
    testInstanceQuestion: {
      create: vi.fn(),
      createMany: vi.fn(),
      findMany: vi.fn(),
      count: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

import { prisma } from "../../client";

describe("Day 3 Test Assembly Engine Unit Tests", () => {
  let assemblyRepo: AssemblyRepository;
  let instanceRepo: TestInstanceRepository;
  let sectionRepo: TestInstanceSectionRepository;
  let questionRepo: TestInstanceQuestionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    assemblyRepo = new AssemblyRepository();
    instanceRepo = new TestInstanceRepository();
    sectionRepo = new TestInstanceSectionRepository();
    questionRepo = new TestInstanceQuestionRepository();
  });

  it("ASM-DB-001: Create instance", async () => {
    const mockInstance = { id: "inst-1", userId: "u1", testConfigId: "cfg-1" };
    (prisma.testInstance.create as vi.Mock).mockResolvedValue(mockInstance);

    const result = await instanceRepo.create({
      userId: "u1",
      testConfigId: "cfg-1",
    });

    expect(prisma.testInstance.create).toHaveBeenCalledWith({
      data: { userId: "u1", testConfigId: "cfg-1" },
    });
    expect(result).toEqual(mockInstance);
  });

  it("ASM-DB-002: Create sections", async () => {
    (prisma.testInstanceSection.createMany as vi.Mock).mockResolvedValue({ count: 2 });

    const result = await sectionRepo.createMany([
      { testInstanceId: "inst-1", sectionKey: "s1", sectionName: "S1", durationSeconds: 60, questionCount: 1, orderIndex: 0 },
      { testInstanceId: "inst-1", sectionKey: "s2", sectionName: "S2", durationSeconds: 60, questionCount: 1, orderIndex: 1 },
    ]);

    expect(prisma.testInstanceSection.createMany).toHaveBeenCalled();
    expect(result).toBe(2);
  });

  it("ASM-DB-003: Create questions", async () => {
    (prisma.testInstanceQuestion.createMany as vi.Mock).mockResolvedValue({ count: 3 });

    const result = await questionRepo.createMany([
      { testInstanceId: "inst-1", sectionId: "sec-1", questionId: "q1", questionOrder: 0, questionSnapshot: {} },
    ]);

    expect(prisma.testInstanceQuestion.createMany).toHaveBeenCalled();
    expect(result).toBe(3);
  });

  it("ASM-DB-004: Find instance", async () => {
    const mockData = { id: "inst-1", sections: [] };
    (prisma.testInstance.findUnique as vi.Mock).mockResolvedValue(mockData);

    const result = await assemblyRepo.getAssemblyData("inst-1");

    expect(prisma.testInstance.findUnique).toHaveBeenCalledWith({
      where: { id: "inst-1" },
      include: expect.any(Object),
    });
    expect(result).toEqual(mockData);
  });

  it("ASM-DB-005: Status update", async () => {
    const mockInstance = { id: "inst-1", status: "IN_PROGRESS" };
    (prisma.testInstance.update as vi.Mock).mockResolvedValue(mockInstance);

    const result = await instanceRepo.updateStatus("inst-1", "IN_PROGRESS");

    expect(prisma.testInstance.update).toHaveBeenCalledWith({
      where: { id: "inst-1" },
      data: { status: "IN_PROGRESS" },
    });
    expect(result.status).toBe("IN_PROGRESS");
  });

  it("ASM-DB-006: Rollback transaction (using AssemblyRepository)", async () => {
    // Mock transaction to simulate failure
    (prisma.$transaction as vi.Mock).mockRejectedValue(new Error("Simulated Transaction Failure"));

    await expect(
      assemblyRepo.persistAssembly({ userId: "u1", testConfigId: "cfg-1" }, [], {})
    ).rejects.toThrow("Failed to persist assembly: Simulated Transaction Failure");
  });

  it("ASM-DB-007: Snapshot persistence", async () => {
    const snapshot = { questionText: "What is React?", options: [], correctAnswer: "A", solution: "B" };
    
    // With array transactions, the results array is returned
    (prisma.$transaction as vi.Mock).mockResolvedValue([{ id: "inst-1" }]);

    await assemblyRepo.persistAssembly(
      { id: "inst-1", userId: "u1", testConfigId: "cfg-1" },
      [{ id: "sec-1", sectionKey: "s1", sectionName: "S1", durationSeconds: 60, questionCount: 1, orderIndex: 0 }],
      {
        "s1": [{ id: "q1", questionId: "q1", questionOrder: 0, questionSnapshot: snapshot }]
      }
    );

    // Verify snapshot was passed exactly as provided (in the array pushed to transaction)
    expect(prisma.testInstanceQuestion.createMany).toHaveBeenCalledWith({
      data: [
        { id: "q1", testInstanceId: "inst-1", sectionId: "sec-1", questionId: "q1", questionOrder: 0, questionSnapshot: snapshot }
      ]
    });
  });
});
