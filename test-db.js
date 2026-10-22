const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('--- تست دیتابیس ---');
  
  // 1. تعداد کل محصولات
  const productCount = await prisma.product.count();
  console.log('تعداد کل محصولات در دیتابیس:', productCount);

  // 2. تعداد کل آفرها (فروشندگان)
  const offerCount = await prisma.offer.count();
  console.log('تعداد کل آفرها (قیمت‌ها) در دیتابیس:', offerCount);

  // 3. تعداد فروشگاه‌ها
  const shopCount = await prisma.shop.count();
  console.log('تعداد کل فروشگاه‌ها در دیتابیس:', shopCount);

  // 4. یک نمونه محصول از دیتابیس بگیریم ببینیم اسمش چیه
  const sampleProduct = await prisma.product.findFirst({
    include: { offers: true }
  });
  
  if (sampleProduct) {
    console.log('\n--- نمونه محصول موجود در دیتابیس ---');
    console.log('اسم محصول:', sampleProduct.persianTitle);
    console.log('تعداد آفرهای این محصول:', sampleProduct.offers.length);
  }

  // 5. جستجوی کلمه "چراغ" در دیتابیس
  const searchTest = await prisma.product.findMany({
    where: { persianTitle: { contains: 'چراغ', mode: 'insensitive' } },
    take: 3
  });
  console.log('\nتعداد محصولات پیدا شده با کلمه "چراغ":', searchTest.length);
  if (searchTest.length > 0) {
    console.log('اسم یکی از محصولات چراغ:', searchTest[0].persianTitle);
  }

  await prisma.$disconnect();
}

main();