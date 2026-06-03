import { Injectable, Optional } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';

import { BaseRepository } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(
    prisma: PrismaService,
    @Optional() tx?: Prisma.TransactionClient,
  ) {
    super(prisma, 'user', { softDelete: true }, tx);
  }

  withTransaction(tx: Prisma.TransactionClient): this {
    return new UserRepository(this.prisma, tx) as this;
  }

  async findByEmail(email: string): Promise<User | null> {
    const user = await this.db.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (user && this.options.softDelete && user.deletedAt !== null) {
      return null;
    }
    return user;
  }
}
