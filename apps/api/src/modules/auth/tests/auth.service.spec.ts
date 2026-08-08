import { Test, TestingModule } from "@nestjs/testing";
import { UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { OAuth2Client } from "google-auth-library";

import { AuthService } from "../services/auth.service";
import { UserRepository } from "../../users/repositories/user.repository";
import { SessionRepository } from "../../users/repositories/session.repository";
import { AppConfigService } from "../../../config";

// Mock the google-auth-library
jest.mock("google-auth-library", () => {
  return {
    OAuth2Client: jest.fn().mockImplementation(() => {
      return {
        verifyIdToken: jest.fn(),
      };
    }),
  };
});

describe("AuthService - Google Login", () => {
  let service: AuthService;
  let userRepository: UserRepository;
  let sessionRepository: SessionRepository;
  let jwtService: JwtService;
  let configService: AppConfigService;
  let mockOAuth2ClientInstance: any;

  const mockUser = {
    id: "user-1",
    email: "test@example.com",
    passwordHash: null,
    googleId: "google-id-1",
    fullName: "Google User",
    role: "CANDIDATE" as const,
    createdAt: new Date(),
    updatedAt: new Date(),
    deletedAt: null,
    college: null,
    graduationYear: null,
    phone: null,
  };

  const mockSession = {
    id: "session-1",
    userId: "user-1",
    userAgent: "Mozilla/5.0",
    ipAddress: "127.0.0.1",
    createdAt: new Date(),
    expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24),
  };

  beforeEach(async () => {
    // Reset the mock implementation of OAuth2Client
    const mockVerifyIdToken = jest.fn();
    mockOAuth2ClientInstance = {
      verifyIdToken: mockVerifyIdToken,
    };
    (OAuth2Client as any).mockImplementation(() => mockOAuth2ClientInstance);

    const mockUserRepo = {
      findByGoogleId: jest.fn(),
      findByEmail: jest.fn(),
      update: jest.fn(),
      create: jest.fn(),
      findById: jest.fn(),
    };

    const mockSessionRepo = {
      createSession: jest.fn().mockResolvedValue(mockSession),
      createRefreshToken: jest.fn().mockResolvedValue({}),
      findRefreshToken: jest.fn(),
      revokeRefreshToken: jest.fn(),
      delete: jest.fn(),
    };

    const mockJwtService = {
      sign: jest.fn().mockReturnValue("mock-token"),
      verify: jest.fn(),
    };

    const mockConfigService = {
      get googleClientId() {
        return "google-client-id-123";
      },
      jwtRefreshSecret: "refresh-secret-123-chars-minimum-32",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthService,
        { provide: UserRepository, useValue: mockUserRepo },
        { provide: SessionRepository, useValue: mockSessionRepo },
        { provide: JwtService, useValue: mockJwtService },
        { provide: AppConfigService, useValue: mockConfigService },
      ],
    }).compile();

    service = module.get<AuthService>(AuthService);
    userRepository = module.get<UserRepository>(UserRepository);
    sessionRepository = module.get<SessionRepository>(SessionRepository);
    jwtService = module.get<JwtService>(JwtService);
    configService = module.get<AppConfigService>(AppConfigService);
  });

  it("should be defined", () => {
    expect(service).toBeDefined();
  });

  describe("loginWithGoogle", () => {
    it("should throw UnauthorizedException if googleClientId is not configured", async () => {
      jest.spyOn(configService, "googleClientId", "get").mockReturnValue("");

      await expect(
        service.loginWithGoogle({ idToken: "some-token" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should throw UnauthorizedException if ticket verification fails", async () => {
      mockOAuth2ClientInstance.verifyIdToken.mockRejectedValue(
        new Error("Invalid token"),
      );

      await expect(
        service.loginWithGoogle({ idToken: "some-token" }),
      ).rejects.toThrow(UnauthorizedException);
    });

    it("should login user if googleId matches an existing user", async () => {
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "test@example.com",
          sub: "google-id-1",
          name: "Google User",
        }),
      });

      jest.spyOn(userRepository, "findByGoogleId").mockResolvedValue(mockUser);

      const result = await service.loginWithGoogle({ idToken: "valid-token" });

      expect(userRepository.findByGoogleId).toHaveBeenCalledWith("google-id-1");
      expect(result.user.email).toBe("test@example.com");
      expect(result.accessToken).toBe("mock-token");
      expect(result.refreshToken).toBe("mock-token");
    });

    it("should link account and login if email matches an existing user without googleId", async () => {
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "test@example.com",
          sub: "google-id-1",
          name: "Google User",
        }),
      });

      // User exists by email but has no googleId set
      const userByEmail = { ...mockUser, googleId: null };
      jest.spyOn(userRepository, "findByGoogleId").mockResolvedValue(null);
      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(userByEmail);
      jest.spyOn(userRepository, "update").mockResolvedValue(mockUser);

      const result = await service.loginWithGoogle({ idToken: "valid-token" });

      expect(userRepository.findByGoogleId).toHaveBeenCalledWith("google-id-1");
      expect(userRepository.findByEmail).toHaveBeenCalledWith(
        "test@example.com",
      );
      expect(userRepository.update).toHaveBeenCalledWith("user-1", {
        googleId: "google-id-1",
      });
      expect(result.user.email).toBe("test@example.com");
    });

    it("should register new candidate user and login if user does not exist", async () => {
      mockOAuth2ClientInstance.verifyIdToken.mockResolvedValue({
        getPayload: () => ({
          email: "new-user@example.com",
          sub: "google-id-2",
          name: "New User",
        }),
      });

      jest.spyOn(userRepository, "findByGoogleId").mockResolvedValue(null);
      jest.spyOn(userRepository, "findByEmail").mockResolvedValue(null);
      jest.spyOn(userRepository, "create").mockResolvedValue({
        ...mockUser,
        id: "user-2",
        email: "new-user@example.com",
        googleId: "google-id-2",
        fullName: "New User",
      });

      const result = await service.loginWithGoogle({ idToken: "valid-token" });

      expect(userRepository.create).toHaveBeenCalledWith({
        email: "new-user@example.com",
        googleId: "google-id-2",
        passwordHash: null,
        fullName: "New User",
        role: "CANDIDATE",
      });
      expect(result.user.email).toBe("new-user@example.com");
    });
  });
});
