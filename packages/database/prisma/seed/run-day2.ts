import { PrismaClient } from '@prisma/client';
import { seedDay2Questions } from './day2-question-seed';

const prisma = new PrismaClient();
seedDay2Questions(prisma).then(() => prisma.$disconnect());
