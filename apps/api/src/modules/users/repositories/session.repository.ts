import { Injectable, Optional } from '@nestjs/common';
import { Session, Prisma, RefreshToken } from '@prisma/client';

import { BaseRepository } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class SessionRepository extends BaseRepository<
  Session,
  Prisma.SessionCreateInput,
  Prisma.SessionUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, 'session', { softDelete: false }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new SessionRepository(this.prisma, tx) as this;
  }

  async findActiveSessionsByUserId(userId: string): Promise<Session[]> {
    return this.db.session.findMany({
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
    return this.db.session.create({
      data: data as unknown as Prisma.SessionCreateInput,
    });
  }

  async deleteSession(id: string, userId: string): Promise<Session> {
    return this.db.session.delete({
      where: { id, userId },
    });
  }

  async deleteAllSessionsByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.db.session.deleteMany({
      where: { userId },
    });
  }

  async deleteOtherSessions(userId: string, currentSessionId: string): Promise<Prisma.BatchPayload> {
    return this.db.session.deleteMany({
      where: {
        userId,
        id: {
          not: currentSessionId,
        },
      },
    });
  }

  async revokeOtherRefreshTokens(userId: string, currentSessionId: string): Promise<Prisma.BatchPayload> {
    return this.db.refreshToken.updateMany({
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
    return this.db.refreshToken.create({
      data: data as unknown as Prisma.RefreshTokenCreateInput,
    });
  }

  async findRefreshToken(token: string): Promise<(RefreshToken & { session: Session | null }) | null> {
    return this.db.refreshToken.findUnique({
      where: { token },
      include: { session: true },
    });
  }

  async revokeRefreshToken(token: string): Promise<RefreshToken> {
    return this.db.refreshToken.update({
      where: { token },
      data: { revoked: true },
    });
  }

  async revokeAllRefreshTokensByUserId(userId: string): Promise<Prisma.BatchPayload> {
    return this.db.refreshToken.updateMany({
      where: { userId, revoked: false },
      data: { revoked: true },
    });
  }

  async deleteExpiredSessionsAndTokens(): Promise<{ deletedSessions: number; deletedTokens: number }> {
    const now = new Date();
    const sessions = await this.db.session.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    const tokens = await this.db.refreshToken.deleteMany({
      where: { expiresAt: { lt: now } },
    });
    return {
      deletedSessions: sessions.count,
      deletedTokens: tokens.count,
    };
  }
}
