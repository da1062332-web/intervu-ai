const { PrismaClient } = require('@prisma/client');
const argon2 = require('argon2');
const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.findFirst({
    where: { email: 'admin@intervu.ai' }
  });
  console.log('Admin email:', admin.email);
  const isValid = await argon2.verify(admin.passwordHash, 'Intervu123!');
  console.log('Is admin password Intervu123! valid?', isValid);
}

main().finally(() => prisma.$disconnect());
