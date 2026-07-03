import { Test, TestingModule } from "@nestjs/testing";
import { CandidateProfileService } from "./candidate-profile.service";
import { CandidateProfileRepository } from "../repositories/candidate-profile.repository";
import { NotFoundException } from "@nestjs/common";

describe("CandidateProfileService", () => {
  let service: CandidateProfileService;
  let repository: CandidateProfileRepository;

  beforeEach(async () => {
    const mockRepository = {
      findById: jest.fn(),
      updateProfile: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CandidateProfileService,
        { provide: CandidateProfileRepository, useValue: mockRepository },
      ],
    }).compile();

    service = module.get<CandidateProfileService>(CandidateProfileService);
    repository = module.get<CandidateProfileRepository>(
      CandidateProfileRepository,
    );
  });

  describe("getProfile", () => {
    it("should throw NotFound if user not found", async () => {
      jest.spyOn(repository, "findById").mockResolvedValue(null);
      await expect(service.getProfile("user1")).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return formatted profile", async () => {
      const mockDate = new Date();
      jest.spyOn(repository, "findById").mockResolvedValue({
        id: "user1",
        email: "test@test.com",
        fullName: "Test User",
        phone: "123",
        college: "MIT",
        graduationYear: 2024,
        role: "CANDIDATE",
        createdAt: mockDate,
      } as any);

      const result = await service.getProfile("user1");

      expect(result).toEqual({
        id: "user1",
        email: "test@test.com",
        name: "Test User",
        phone: "123",
        college: "MIT",
        graduationYear: 2024,
        role: "CANDIDATE",
        createdAt: mockDate.toISOString(),
      });
    });
  });

  describe("updateProfile", () => {
    it("should throw NotFound if user not found", async () => {
      jest.spyOn(repository, "findById").mockResolvedValue(null);
      await expect(service.updateProfile("user1", {})).rejects.toThrow(
        NotFoundException,
      );
    });

    it("should return updated formatted profile", async () => {
      const mockDate = new Date();
      jest
        .spyOn(repository, "findById")
        .mockResolvedValue({ id: "user1" } as any);
      jest.spyOn(repository, "updateProfile").mockResolvedValue({
        id: "user1",
        email: "test@test.com",
        fullName: "New Name",
        phone: "123",
        college: "MIT",
        graduationYear: 2024,
        role: "CANDIDATE",
        createdAt: mockDate,
      } as any);

      const result = await service.updateProfile("user1", { name: "New Name" });

      expect(repository.updateProfile).toHaveBeenCalledWith("user1", {
        fullName: "New Name",
        email: undefined,
        phone: undefined,
        college: undefined,
        graduationYear: undefined,
      });

      expect(result.name).toBe("New Name");
    });
  });
});
