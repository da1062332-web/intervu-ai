const { PrismaClient } = require('@prisma/client'); const prisma = new PrismaClient(); prisma.concept.findMany().then(r => console.log('Concepts:', r.length)).finally(() => process.exit(0));
