const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function reset() {
  console.log("🧹 در حال خالی کردن جدول‌ها...");
  try {
    // به ترتیب وابستگی‌ها (اول آفرها، بعد محصولات و فروشگاه‌ها)
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "offers" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "products" CASCADE;`);
    await prisma.$executeRawUnsafe(`TRUNCATE TABLE "shops" CASCADE;`);
    console.log("✅ همه جدول‌ها با موفقیت خالی شدند.");
  } catch (error) {
    console.error("❌ خطا در خالی کردن:", error.message);
  } finally {
    await prisma.$disconnect();
  }
}

reset();