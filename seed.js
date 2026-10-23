const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const BATCH_SIZE = 100; // کاهش سایز برای جلوگیری از پر شدن رم

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const parseJsonSafe = (str) => {
  if (!str || str === 'null' || str === '[]' || str === '{}') return null;
  try { return JSON.parse(str); } catch (e) { return null; }
};

async function seedProducts() {
  const results = [];
  let count = 0;
  console.log("🚀 در حال پردازش فایل products.csv ...");
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('products.csv')
      .pipe(csv())
      .on('data', (data) => {
        results.push({
          id: data.product_id,
          persianTitle: data.persian_title,
          brandName: data.brand_name !== 'null' ? data.brand_name : null,
          categoryName: data.category_name !== 'null' ? data.category_name : null,
          model: data.model !== 'null' ? data.model : null,
          imageUrls: parseJsonSafe(data.image_urls),
          specs: parseJsonSafe(data.specs),
        });
        if (results.length >= BATCH_SIZE) {
          const batch = results.splice(0, BATCH_SIZE);
          prisma.product.createMany({ data: batch, skipDuplicates: true }).catch(()=>{});
          count += BATCH_SIZE;
          if (count % 5000 === 0) console.log(`⏳ ${count} محصول وارد شد...`);
        }
      })
      .on('end', async () => {
        if (results.length > 0) {
          await prisma.product.createMany({ data: results, skipDuplicates: true }).catch(()=>{});
          count += results.length;
        }
        console.log(`✅ ایمپورت محصولات تمام شد (${count} رکورد).`);
        resolve();
      })
      .on('error', reject);
  });
}

async function seedShops() {
  const results = [];
  let count = 0;
  console.log("🚀 در حال پردازش فایل shops.csv ...");
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('shops.csv')
      .pipe(csv())
      .on('data', (data) => {
        results.push({
          id: data.shop_id,
          name: data.name !== 'null' ? data.name : null,
          address: data.address !== 'null' ? data.address : null,
          categoryNames: parseJsonSafe(data.category_names),
          contacts: parseJsonSafe(data.contacts),
          instagram: data.instagram !== 'null' ? data.instagram : null,
          lat: data.lat !== 'null' ? parseFloat(data.lat) : null,
          lon: data.lon !== 'null' ? parseFloat(data.lon) : null,
          locationLabel: data.location_label !== 'null' ? data.location_label : null,
          paymentOptions: parseJsonSafe(data.payment_options),
          supportsFastDelivery: data.supports_fast_delivery === 'true',
          websiteUrl: data.website_url !== 'null' ? data.website_url : null,
          weeklyHours: parseJsonSafe(data.weekly_hours),
        });
        if (results.length >= BATCH_SIZE) {
          const batch = results.splice(0, BATCH_SIZE);
          prisma.shop.createMany({ data: batch, skipDuplicates: true }).catch(()=>{});
          count += BATCH_SIZE;
          if (count % 5000 === 0) console.log(`⏳ ${count} فروشگاه وارد شد...`);
        }
      })
      .on('end', async () => {
        if (results.length > 0) {
          await prisma.shop.createMany({ data: results, skipDuplicates: true }).catch(()=>{});
          count += results.length;
        }
        console.log(`✅ ایمپورت فروشگاه‌ها تمام شد (${count} رکورد).`);
        resolve();
      })
      .on('error', reject);
  });
}

async function seedOffers() {
  console.log("🔍 در حال خواندن لیست محصولات و فروشگاه‌ها...");
  const allProducts = await prisma.product.findMany({ select: { id: true } });
  const allShops = await prisma.shop.findMany({ select: { id: true } });

  const validProductIds = new Set(allProducts.map(p => p.id));
  const validShopIds = new Set(allShops.map(s => s.id));

  console.log(`✅ ${validProductIds.size} محصول و ${validShopIds.size} فروشگاه معتبر.`);
  
  let count = 0;
  let skipped = 0;
  let results = [];
  
  return new Promise((resolve, reject) => {
    fs.createReadStream('offers.csv')
      .pipe(csv())
      .on('data', (data) => {
        if (!data.offer_id || !data.product_id || !data.shop_id) return;

        if (validProductIds.has(data.product_id) && validShopIds.has(data.shop_id)) {
          results.push({
            id: data.offer_id,
            productId: data.product_id,
            shopId: data.shop_id,
            priceToman: parseInt(data.price_toman) || 0,
            description: data.description && data.description !== 'null' ? data.description : null,
            sellerTitle: data.seller_title && data.seller_title !== 'null' ? data.seller_title : null,
            warranty: parseJsonSafe(data.warranty),
            lastPriceChangedAt: data.last_price_changed_at ? new Date(data.last_price_changed_at) : null,
          });
        } else {
          skipped++;
        }
        
        if (results.length >= BATCH_SIZE) {
          const batch = results.splice(0, BATCH_SIZE);
          prisma.offer.createMany({ data: batch, skipDuplicates: true }).catch(()=>{});
          count += BATCH_SIZE;
          if (count % 10000 === 0) console.log(`⏳ ${count} آفر وارد شد...`);
        }
      })
      .on('end', async () => {
        if (results.length > 0) {
          await prisma.offer.createMany({ data: results, skipDuplicates: true }).catch(()=>{});
          count += results.length;
        }
        console.log(`✅ ایمپورت آفرها تمام شد. موفق: ${count} | یتیم: ${skipped}`);
        resolve();
      })
      .on('error', reject);
  });
}

async function run() {
  // اگر دیتابیس خالیه، این بخش‌ها را اجرا کن
  await seedProducts();
  await seedShops();
  await seedOffers();
  console.log("🎉 کل دیتابیس با موفقیت آماده شد!");
  await prisma.$disconnect();
}

run();