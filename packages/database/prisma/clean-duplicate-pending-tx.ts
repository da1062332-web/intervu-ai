import { PrismaClient, PaymentStatus } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('Cleaning up duplicate pending transactions where a SUCCESS transaction already exists...');

  const successfulTx = await prisma.paymentTransaction.findMany({
    where: {
      status: PaymentStatus.SUCCESS,
      razorpayOrderId: { not: null },
    },
    select: {
      razorpayOrderId: true,
    },
  });

  const orderIds = successfulTx
    .map((t) => t.razorpayOrderId)
    .filter((id): id is string => Boolean(id));

  console.log(`Found ${orderIds.length} successful order IDs.`);

  if (orderIds.length > 0) {
    const deleteResult = await prisma.paymentTransaction.deleteMany({
      where: {
        status: PaymentStatus.PENDING,
        razorpayOrderId: { in: orderIds },
      },
    });

    console.log(`Deleted ${deleteResult.count} duplicate pending transaction records.`);
  }
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
