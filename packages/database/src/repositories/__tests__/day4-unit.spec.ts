import { expect, test, describe, vi, beforeEach } from "vitest";
import { PrismaClient, SubmissionStatus } from "@prisma/client";
import { ExecutionPersistenceRepository } from "../execution-persistence.repository";
import { SubmissionRepository } from "../submission.repository";

// Mock PrismaClient
const mockPrisma = {
  candidateAnswer: { upsert: vi.fn() },
  executionState: { upsert: vi.fn() },
  submission: { findUnique: vi.fn(), upsert: vi.fn(), update: vi.fn() },
  $transaction: vi.fn(),
} as unknown as PrismaClient;

describe("Day 4: Execution Persistence & Submission Locking", () => {
  let executionPersistenceRepo: ExecutionPersistenceRepository;
  let submissionRepo: SubmissionRepository;

  beforeEach(() => {
    vi.clearAllMocks();
    executionPersistenceRepo = new ExecutionPersistenceRepository(mockPrisma);
    submissionRepo = new SubmissionRepository(mockPrisma);
  });

  test("SUB-001: should enforce atomicity with a flat-array transaction for autosave", async () => {
    mockPrisma.$transaction = vi.fn().mockResolvedValue([{}, {}]);
    mockPrisma.candidateAnswer.upsert = vi
      .fn()
      .mockReturnValue("upsert_answer");
    mockPrisma.executionState.upsert = vi.fn().mockReturnValue("upsert_state");

    await executionPersistenceRepo.saveAnswerAndState(
      { testInstanceId: "inst_1", questionId: "q_1", answer: { choice: "A" } },
      {
        testInstanceId: "inst_1",
        currentQuestionIndex: 2,
        remainingTimeSeconds: 500,
      },
    );

    expect(mockPrisma.candidateAnswer.upsert).toHaveBeenCalled();
    expect(mockPrisma.executionState.upsert).toHaveBeenCalled();

    // Crucial: Must be wrapped in $transaction as a flat array
    expect(mockPrisma.$transaction).toHaveBeenCalledWith([
      "upsert_answer",
      "upsert_state",
    ]);
  });

  test("SUB-002: should lazily create a PENDING submission record", async () => {
    mockPrisma.submission.upsert = vi
      .fn()
      .mockResolvedValue({ status: SubmissionStatus.PENDING });
    await submissionRepo.createSubmission("inst_1");
    expect(mockPrisma.submission.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        create: { testInstanceId: "inst_1", status: SubmissionStatus.PENDING },
      }),
    );
  });

  test("SUB-003: should lock status to SUBMITTED and stamp date", async () => {
    mockPrisma.submission.update = vi
      .fn()
      .mockResolvedValue({ status: SubmissionStatus.SUBMITTED });
    await submissionRepo.updateStatus(
      "inst_1",
      SubmissionStatus.SUBMITTED,
      "hash_123",
    );

    expect(mockPrisma.submission.update).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          status: SubmissionStatus.SUBMITTED,
          submissionHash: "hash_123",
        }),
      }),
    );
  });
});
