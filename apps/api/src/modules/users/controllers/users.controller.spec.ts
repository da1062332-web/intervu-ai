import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';

import { UsersController } from './users.controller';
import { UsersService } from '../services/users.service';
import { AuthUser } from '../../auth/interfaces/auth-user.interface';

describe('UsersController', () => {
  let controller: UsersController;
  let service: UsersService;

  const mockAuthUser: AuthUser = {
    id: 'user-1',
    email: 'test@example.com',
    role: UserRole.CANDIDATE,
    sessionId: 'session-1',
  };

  const mockUserEntity = {
    id: 'user-1',
    email: 'test@example.com',
    name: 'Test User',
    role: UserRole.CANDIDATE,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockSessionEntity = {
    id: 'session-1',
    userAgent: 'Mozilla/5.0',
    ipAddress: '127.0.0.1',
    createdAt: new Date(),
    expiresAt: new Date(),
    isCurrent: true,
  };

  beforeEach(async () => {
    const mockUsersService = {
      getProfile: jest.fn(),
      updateProfile: jest.fn(),
      getSessions: jest.fn(),
      terminateSession: jest.fn(),
      terminateAllOtherSessions: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      controllers: [UsersController],
      providers: [{ provide: UsersService, useValue: mockUsersService }],
    }).compile();

    controller = module.get<UsersController>(UsersController);
    service = module.get<UsersService>(UsersService);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getMe', () => {
    it('should return profile of the current user', async () => {
      jest.spyOn(service, 'getProfile').mockResolvedValue(mockUserEntity);

      const result = await controller.getMe(mockAuthUser);

      expect(service.getProfile).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(mockUserEntity);
    });
  });

  describe('updateProfile', () => {
    it('should call service to update profile', async () => {
      const dto = { name: 'Updated Name' };
      jest.spyOn(service, 'updateProfile').mockResolvedValue({
        ...mockUserEntity,
        name: 'Updated Name',
      });

      const result = await controller.updateProfile(mockAuthUser, dto);

      expect(service.updateProfile).toHaveBeenCalledWith('user-1', dto);
      expect(result.name).toBe('Updated Name');
    });
  });

  describe('getSessions', () => {
    it('should return active sessions list', async () => {
      jest.spyOn(service, 'getSessions').mockResolvedValue([mockSessionEntity]);

      const result = await controller.getSessions(mockAuthUser);

      expect(service.getSessions).toHaveBeenCalledWith('user-1', 'session-1');
      expect(result).toEqual([mockSessionEntity]);
    });
  });

  describe('terminateSession', () => {
    it('should call service to terminate session', async () => {
      jest.spyOn(service, 'terminateSession').mockResolvedValue(undefined);

      await controller.terminateSession(mockAuthUser, 'session-2');

      expect(service.terminateSession).toHaveBeenCalledWith('session-2', 'user-1');
    });
  });

  describe('terminateOtherSessions', () => {
    it('should call service to terminate all other sessions', async () => {
      jest.spyOn(service, 'terminateAllOtherSessions').mockResolvedValue(undefined);

      await controller.terminateOtherSessions(mockAuthUser);

      expect(service.terminateAllOtherSessions).toHaveBeenCalledWith('user-1', 'session-1');
    });
  });
});
