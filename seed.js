const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BATCH_SIZE = 1000; // سایز رو بزرگتر کردیم چون دیگه خطا نداریم

const parseJsonSafe = (str) => {
  if (!str || str === 'null' || str === '[]' || str === '{}') return null;
  try { return JSON.parse(str); } catch (e) { return null; }
};

const parseDateSafe = (dateStr) => {
  if (!dateStr || dateStr === 'null' || dateStr === 'Invalid Date') return null;
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
};

async function seedOffers() {
  console.log("🔍 در حال خواندن لیست تمام محصولات و فروشگاه‌های معتبر از دیتابیس...");
  
  // 👇 گرفتن لیست تمام IDهای موجود
  const allProducts = await prisma.product.findMany({ select: { id: true } });
  const allShops = await prisma.shop.findMany({ select: { id: true } });

  const validProductIds = new Set(allProducts.map(p => p.id));
  const validShopIds = new Set(allShops.map(s => s.id));

  console.log(`✅ ${validProductIds.size} محصول و ${validShopIds.size} فروشگاه معتبر پیدا شد.`);

  let count = 0;
  let skipped = 0;
  let results = [];
  
  console.log("🚀 در حال پردازش فایل offers.csv ...");

  return new Promise((resolve, reject) => {
    fs.createReadStream('offers.csv')
      .pipe(csv())
      .on('data', (data) => {
        if (!data.offer_id || !data.product_id || !data.shop_id) return;

        // 👇 فقط اگر محصول و فروشگاه در دیتابیس وجود داشت، اضافه کن
        if (validProductIds.has(data.product_id) && validShopIds.has(data.shop_id)) {
          results.push({
            id: data.offer_id,
            productId: data.product_id,
            shopId: data.shop_id,
            priceToman: parseInt(data.price_toman) || 0,
            description: data.description && data.description !== 'null' ? data.description : null,
            sellerTitle: data.seller_title && data.seller_title !== 'null' ? data.seller_title : null,
            warranty: parseJsonSafe(data.warranty),
            lastPriceChangedAt: parseDateSafe(data.last_price_changed_at),
          });
        } else {
          skipped++;
        }
      })
      .on('end', async () => {
        console.log(`✅ فایل خوانده شد. ${results.length} آفر معتبر و ${skipped} آفر یتیم نادیده گرفته شد.`);
        console.log("⏳ در حال درج در دیتابیس (این مرحله خیلی سریع‌تر خواهد بود)...");
        
        for (let i = 0; i < results.length; i += BATCH_SIZE) {
          const batch = results.slice(i, i + BATCH_SIZE);
          try {
            await prisma.offer.createMany({ 
              data: batch, 
              skipDuplicates: true 
            });
            count += batch.length;
            if (count % 20000 === 0) console.log(`⏳ ${count} رکورد درج شد...`);
          } catch (error) {
            console.error("⚠️ خطای درج بسته:", error.message);
          }
        }

        console.log(`🎉 ایمپورت کامل شد! تعداد کل موفق: ${count}`);
        await prisma.$disconnect();
        resolve();
      })
      .on('error', (err) => {
        console.error("❌ خطا در خواندن فایل:", err);
        reject(err);
      });
  });
}

async function run() {
  await seedOffers();
}

run();