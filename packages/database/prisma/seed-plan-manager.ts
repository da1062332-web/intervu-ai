import { PrismaClient, UserRole } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

async function main() {
  const email = 'planmanager@intervu.ai';
  const rawPassword = 'PlanManager@123';
  const passwordHash = await argon2.hash(rawPassword);

  console.log(`Seeding Plan Manager user: ${email}...`);

  const user = await prisma.user.upsert({
    where: { email },
    create: {
      email,
      fullName: 'Plan Manager Admin',
      passwordHash,
      role: 'PLAN_MANAGER' as UserRole,
    },
    update: {
      fullName: 'Plan Manager Admin',
      passwordHash,
      role: 'PLAN_MANAGER' as UserRole,
    },
  });

  console.log(`Successfully created/updated Plan Manager user!`);
  console.log(`-----------------------------------------------`);
  console.log(`Email:    ${email}`);
  console.log(`Password: ${rawPassword}`);
  console.log(`Role:     ${user.role}`);
  console.log(`User ID:  ${user.id}`);
  console.log(`-----------------------------------------------`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
