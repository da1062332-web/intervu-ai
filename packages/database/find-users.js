const { PrismaClient } = require('@prisma/client');
const p = new PrismaClient();
p.user.findMany({ take: 5 })
  .then(users => console.log(users.map(x => ({ id: x.id, email: x.email, role: x.role }))))
  .finally(() => p.$disconnect());
