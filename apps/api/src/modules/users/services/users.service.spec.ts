import { Test, TestingModule } from "@nestjs/testing";
import { NotFoundException } from "@nestjs/common";
import { UserRole } from "@prisma/client";

import { UsersService } from "./users.service";
import { UserRepository } from "../repositories/user.repository";
import { SessionRepository } from "../repositories/session.repository";

describe("UsersService", () => {
  let service: UsersService;
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    passwordHash: "hashedpassword",
    fullName: "Test User",
    role: UserRole.CANDIDATE,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null as Date | null,
  };

  const mockSession = {
    id: "session-1",
    userId: "user-1",
    userAgent: "Mozilla/5.0",
    ipAddress: "127.0.0.1",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60),
  };

  beforeEach(async () => {
    const mockUserRepo = {
      findById: jest.fn(),
      update: jest.fn(),
    };
    const mockSessionRepo = {
      findActiveSessionsByUserId: jest.fn(),
      deleteSession: jest.fn(),
      deleteOtherSessions: jest.fn(),
      revokeOtherRefreshTokens: jest.fn(),
      deleteAllSessionsByUserId: jest.fn(),
      revokeAllRefreshTokensByUserId: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        UsersService,
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: SessionRepository, useValue: mockSessionRepo },
      ],
    }).compile();

    service = module.get<UsersService>(UsersService);
    userRepository = module.get<UserRepository>(UserRepository);
    sessionRepository = module.get<SessionRepository>(SessionRepository);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("getProfile", () => {
    it("should return a user profile if found", async () => {
      jest.spyOn(userRepository, "findById").mockResolvedValue(mockUser);

      const result = await service.getProfile("user-1");

      expect(userRepository.findById).toHaveBeenCalledWith("user-1");
      expect(result).toEqual({
        id: "user-1",
        email: "test@example.com",
        name: "Test User",
        role: UserRole.CANDIDATE,
        createdAt: mockUser.createdAt,
        updatedAt: mockUser.updatedAt,
      });
    });

    it("should throw NotFoundException if user is not found", async () => {
      jest.spyOn(userRepository, "findById").mockResolvedValue(null);

      await expect(service.getProfile("user-2")).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe("updateProfile", () => {
    it("should update user profile successfully", async () => {
      jest.spyOn(userRepository, "findById").mockResolvedValue(mockUser);
      jest.spyOn(userRepository, "update").mockResolvedValue({
        ...mockUser,
        fullName: "Updated Name",
      });

      const result = await service.updateProfile("user-1", {
        name: "Updated Name",
      });

      expect(userRepository.findById).toHaveBeenCalledWith("user-1");
      expect(userRepository.update).toHaveBeenCalledWith("user-1", {
        fullName: "Updated Name",
      });
      expect(result.name).toBe("Updated Name");
    });

    it("should throw NotFoundException if user does not exist", async () => {
      jest.spyOn(userRepository, "findById").mockResolvedValue(null);

      await expect(
        service.updateProfile("user-2", { name: "Updated Name" }),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("getSessions", () => {
    it("should return mapped active sessions", async () => {
      jest
        .spyOn(sessionRepository, "findActiveSessionsByUserId")
        .mockResolvedValue([mockSession] as never);

      const result = await service.getSessions("user-1", "session-1");

      expect(sessionRepository.findActiveSessionsByUserId).toHaveBeenCalledWith(
        "user-1",
      );
      expect(result).toHaveLength(1);
      expect(result[0]).toEqual({
        id: "session-1",
        userAgent: "Mozilla/5.0",
        ipAddress: "127.0.0.1",
        createdAt: mockSession.createdAt,
        expiresAt: mockSession.expiresAt,
        isCurrent: true,
      });
    });
  });

  describe("terminateSession", () => {
    it("should call repository to delete session", async () => {
      jest
        .spyOn(sessionRepository, "deleteSession")
        .mockResolvedValue({} as never);

      await service.terminateSession("session-1", "user-1");

      expect(sessionRepository.deleteSession).toHaveBeenCalledWith(
        "session-1",
        "user-1",
      );
    });

    it("should throw NotFoundException if repository delete fails", async () => {
      jest
        .spyOn(sessionRepository, "deleteSession")
        .mockRejectedValue(new Error("Prisma error"));

      await expect(
        service.terminateSession("session-1", "user-1"),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe("terminateAllOtherSessions", () => {
    it("should terminate other sessions and tokens when currentSessionId is provided", async () => {
      jest
        .spyOn(sessionRepository, "deleteOtherSessions")
        .mockResolvedValue({ count: 1 } as never);
      jest
        .spyOn(sessionRepository, "revokeOtherRefreshTokens")
        .mockResolvedValue({ count: 1 } as never);

      await service.terminateAllOtherSessions("user-1", "session-1");

      expect(sessionRepository.deleteOtherSessions).toHaveBeenCalledWith(
        "user-1",
        "session-1",
      );
      expect(sessionRepository.revokeOtherRefreshTokens).toHaveBeenCalledWith(
        "user-1",
        "session-1",
      );
    });

    it("should terminate all sessions and tokens when currentSessionId is not provided", async () => {
      jest
        .spyOn(sessionRepository, "deleteAllSessionsByUserId")
        .mockResolvedValue({ count: 2 } as never);
      jest
        .spyOn(sessionRepository, "revokeAllRefreshTokensByUserId")
        .mockResolvedValue({ count: 2 } as never);

      await service.terminateAllOtherSessions("user-1");

      expect(sessionRepository.deleteAllSessionsByUserId).toHaveBeenCalledWith(
        "user-1",
      );
      expect(
        sessionRepository.revokeAllRefreshTokensByUserId,
      ).toHaveBeenCalledWith("user-1");
    });
  });
});
