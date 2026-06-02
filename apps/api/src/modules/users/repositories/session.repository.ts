import { Injectable } from '@nestjs/common';
import { Session, Prisma, RefreshToken } from '@prisma/client';

import { BaseRepository } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SessionRepository extends BaseRepository<
  Session,
  Prisma.SessionCreateInput,
  Prisma.SessionUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'session');
  }

  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    return this.prisma.session.findMany({
      where: {
        userId,
        expiresAt: {
          gt: new Date(),
        },
      },
      orderBy: {
        createdAt: 'desc',
      },
    });
  }

  async createSession(data: Prisma.SessionUncheckedCreateInput): Promise<Session> {
    return this.prisma.session.create({
      data,
    });
  }

  async deleteSession(id: string, userId: string): Promise<Session> {
    return this.prisma.session.delete({
      where: { id, userId },
    });
  }

  async deleteAllSessionsByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.session.deleteMany({
      where: { userId },
    });
  }

  async deleteOtherSessions(userId: string, currentSessionId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.session.deleteMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
      },
    });
  }

  async revokeOtherRefreshTokens(userId: string, currentSessionId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: {
        userId,
        sessionId: {
          not: currentSessionId,
        },
        revoked: false,
      },
      data: {
        revoked: true,
      },
    });
  }

  async createRefreshToken(data: Prisma.RefreshTokenUncheckedCreateInput): Promise<RefreshToken> {
    return this.prisma.refreshToken.create({
      data,
    });
  }

  async findRefreshToken(token: string): Promise<(RefreshToken & { session: Session | null }) | null> {
    return this.prisma.refreshToken.findUnique({
      where: { token },
      include: { session: true },
    }) as any;
  }

  async revokeRefreshToken(token: string): Promise<RefreshToken> {
    return this.prisma.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  async revokeAllRefreshTokensByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.prisma.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async deleteExpiredSessionsAndTokens(): Promise<{ deletedSessions: number; deletedTokens: number }> {
    const now = new Date();
    const sessions = await this.prisma.session.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    const tokens = await this.prisma.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return {
      deletedSessions: sessions.count,
      deletedTokens: tokens.count,
    };
  }
}
