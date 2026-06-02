import { Injectable, NotFoundException } from '@nestjs/common';
import { User, Session } from '@prisma/client';

import { UserRepository } from '../repositories/user.repository';
import { SessionRepository } from '../repositories/session.repository';
import { UpdateProfileDto } from '../dto/update-profile.dto';
import { UserEntity } from '../entities/user.entity';
import { SessionEntity } from '../entities/session.entity';

@Injectable()
export class UsersService {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly sessionRepository: SessionRepository,
  ) {}

  async getProfile(userId: string): Promise<UserEntity> {
    // 1. Validate
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies
    const user = await this.userRepository.findById(userId);

    // 3. Core logic
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 4. Format response
    return this.formatUserResponse(user);
  }

  async updateProfile(userId: string, dto: UpdateProfileDto): Promise<UserEntity> {
    // 1. Validate
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies
    const user = await this.userRepository.findById(userId);
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // 3. Core logic
    const updateData: any = {};
    if (dto.name !== undefined) {
      updateData.fullName = dto.name;
    }

    const updatedUser = await this.userRepository.update(userId, updateData);

    // 4. Format response
    return this.formatUserResponse(updatedUser);
  }

  async getSessions(userId: string, currentSessionId?: string): Promise<SessionEntity[]> {
    // 1. Validate
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies
    const sessions = await this.sessionRepository.findActiveSessionsByUserId(userId);

    // 3. Core logic & 4. Format response
    return sessions.map((session) => this.formatSessionResponse(session, currentSessionId));
  }

  async terminateSession(sessionId: string, userId: string): Promise<void> {
    // 1. Validate
    if (!sessionId || !userId) {
      throw new NotFoundException('Session ID and User ID are required');
    }

    // 2. Fetch dependencies & 3. Core logic
    try {
      await this.sessionRepository.deleteSession(sessionId, userId);
    } catch (error) {
      throw new NotFoundException('Session not found or already terminated');
    }
  }

  async terminateAllOtherSessions(userId: string, currentSessionId?: string): Promise<void> {
    // 1. Validate
    if (!userId) {
      throw new NotFoundException('User ID is required');
    }

    // 2. Fetch dependencies & 3. Core logic
    if (currentSessionId) {
      await this.sessionRepository.deleteOtherSessions(userId, currentSessionId);
      await this.sessionRepository.revokeOtherRefreshTokens(userId, currentSessionId);
    } else {
      await this.sessionRepository.deleteAllSessionsByUserId(userId);
      await this.sessionRepository.revokeAllRefreshTokensByUserId(userId);
    }
  }

  private formatUserResponse(user: User): UserEntity {
    return {
      id: user.id,
      email: user.email,
      name: user.fullName,
      role: user.role,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private formatSessionResponse(session: Session, currentSessionId?: string): SessionEntity {
    return {
      id: session.id,
      userAgent: session.userAgent,
      ipAddress: session.ipAddress,
      createdAt: session.createdAt,
      expiresAt: session.expiresAt,
      isCurrent: session.id === currentSessionId,
    };
  }
}
