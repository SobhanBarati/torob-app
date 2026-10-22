import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const globalForPrisma = globalThis;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get('q');
  const onlyWithOffers = searchParams.get('onlyWithOffers') === 'true';

  console.log("🔍 کلمه دریافت شده در بک‌اند:", q);

  if (!q || q.length < 2) {
    return NextResponse.json({ error: 'لطفاً حداقل ۲ کاراکتر وارد کنید.' }, { status: 400 });
  }

  try {
    const products = await prisma.product.findMany({
      where: {
        OR: [
          { persianTitle: { contains: q, mode: 'insensitive' } },
          { categoryName: { contains: q, mode: 'insensitive' } }
        ],
        // ✅ اگر پارامتر true بود، فقط محصولات دارای فروشنده رو بگیر
        ...(onlyWithOffers ? { offers: { some: {} } } : {})
      },
      take: 12,
      include: {
        offers: {
          include: { shop: true },
          orderBy: { priceToman: 'asc' },
          take: 3,
        },
      },
    });

    console.log(`✅ تعداد نتیجه پیدا شده در دیتابیس: ${products.length}`);

    return NextResponse.json({ success: true, data: products });
  } catch (error) {
    console.error("❌ خطای دیتابیس در جستجو:", error);
    return NextResponse.json({ error: 'خطای سرور در جستجو' }, { status: 500 });
  }
}