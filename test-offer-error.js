const fs = require('fs');
const csv = require('csv-parser');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();
const dataToInsert = [];

fs.createReadStream('offers.csv')
  .pipe(csv())
  .on('data', (data) => {
    // فقط 3 ردیف اول رو برمیداریم
    if (dataToInsert.length < 3) {
      dataToInsert.push({
        id: data.offer_id,
        productId: data.product_id,
        shopId: data.shop_id,
        priceToman: parseInt(data.price_toman) || 0,
        description: data.description !== 'null' ? data.description : null,
        sellerTitle: data.seller_title !== 'null' ? data.seller_title : null,
        warranty: data.warranty ? (() => { try { return JSON.parse(data.warranty); } catch(e) { return null; } })() : null,
        lastPriceChangedAt: data.last_price_changed_at ? new Date(data.last_price_changed_at) : null,
      });
    } else {
      // وقتی 3 تا جمع شد، متوقف میشیم
      process.exit(0); 
    }
  });

// وقتی برنامه بسته شد، دیتا رو به دیتابیس میفرستیم
process.on('exit', async () => {
  console.log('اطلاعات 3 ردیف اول که خوانده شد:', dataToInsert);
  
  for (const item of dataToInsert) {
    try {
      await prisma.offer.create({ data: item });
      console.log('✅ یک ردیف با موفقیت ذخیره شد:', item.id);
    } catch (e) {
      console.error('\n❌ خطا در ذخیره ردیف:', item.id);
      console.error('جزئیات کامل خطا:', e);
    }
  }
  await prisma.$disconnect();
});