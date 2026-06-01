import { Injectable } from '@nestjs/common';
import { User, Prisma } from '@prisma/client';

import { BaseRepository } from '../../../common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class UserRepository extends BaseRepository<
  User,
  Prisma.UserCreateInput,
  Prisma.UserUpdateInput
> {
  constructor(prisma: PrismaService) {
    super(prisma, 'user');
  }

  async findByEmail(email: string): Promise<User | null> {
    return this.prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
  }
}
