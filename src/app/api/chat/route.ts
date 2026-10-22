import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { OpenAI } from 'openai';

const globalForPrisma = globalThis as any;
const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

const openai = new OpenAI({
  apiKey: process.env.BOXAPI_KEY,
  baseURL: "https://ai.boxapi.ir/ai/v1",
});

export async function POST(request: Request) {
  try {
    const { messages } = await request.json();

    if (!messages || messages.length === 0) {
      return NextResponse.json({ error: 'پیامی ارسال نشد' }, { status: 400 });
    }

    const lastUserMessage = messages[messages.length - 1].content;

    // ۱. استخراج نام محصول
    const extractPrompt = `
    پیام کاربر: "${lastUserMessage}"
    فقط و فقط نام محصولی که کاربر می‌خواد رو به فارسی استخراج کن. 
    اگر پیام کلمات "بله"، "باشه" یا "جایگزین" بود، کلمه "جایگزین" رو برگردون.
    اگر اسم محصولی توش نبود (مثلاً سلام و احوال‌پرسی)، فقط کلمه "نامشخص" رو برگردون. هیچ کلمه دیگه‌ای ننویس.
    `;

    const extractRes = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "user", content: extractPrompt }]
    });

    let productKeyword = extractRes.choices[0].message.content?.trim() || "نامشخص";
    
    let dbContext = "محصولی با این نام در دیتابیس وجود ندارد.";
    
    // ۲. جستجو در دیتابیس
    if (productKeyword !== "نامشخص" && productKeyword !== "جایگزین") {
      const products = await prisma.product.findMany({
        where: { persianTitle: { contains: productKeyword, mode: 'insensitive' } },
        take: 1,
        include: {
          offers: {
            include: { shop: true },
            orderBy: { priceToman: 'asc' },
            take: 3
          }
        }
      });

      if (products.length > 0) {
        const p = products[0];
        const shopsList = p.offers.map((o: any) => 
          `- فروشگاه ${o.shop?.name} | آدرس: ${o.shop?.address} | قیمت: ${o.priceToman} تومان | شماره‌تماس: ${JSON.stringify(o.shop?.contacts)}`
        ).join('\n');

        dbContext = `
        محصول پیدا شده: ${p.persianTitle}
        لیست فروشندگان:
        ${shopsList}
        `;
      }
    }

    // ۳. تولید پاسخ (با اصلاح پرامپت برای جلوگیری از پیشنهاد الکی)
    const finalPrompt = `
    تو یک دستیار خرید حضوری در تهران هستی.
    
    اطلاعات واقعی از دیتابیس:
    ${dbContext}
    
    قوانین پاسخ‌دهی:
    1. اگر پیام کاربر فقط شامل سلام و احوال‌پرسی بود (مثل "سلام"، "خوبی")، فقط سلام کن و بپرس چه محصولی می‌خواهد. در این حالت اسم هیچ محصولی را نبر و JSON نفرست.
    2. اگر محصول پیدا شد، حتماً لیست فروشگاه‌ها را در انتهای پاسخ خودت به صورت JSON بفرست.
    3. اگر محصول پیدا نشد و کاربر چیزی خواسته بود، یک جایگزین هوشمند پیشنهاد بده.
    
    فرمت خروجی JSON (در صورت وجود فروشگاه):
    [JSON_START]
    [
      {"shopName": "اسم فروشگاه", "address": "آدرس", "price": 120000, "phone": "شماره تماس"}
    ]
    [JSON_END]
    
    اگر فروشگاهی نداری، بخش JSON را کلا ننویس.
    `;

    const formattedHistory = messages.map((m: any) => ({
      role: m.role === 'ai' ? 'assistant' : 'user',
      content: m.content
    }));

    const finalRes = await openai.chat.completions.create({
      model: "gpt-5-mini",
      messages: [{ role: "system", content: finalPrompt }, ...formattedHistory]
    });

    const rawReply = finalRes.choices[0].message.content || "";
    
    let replyText = rawReply;
    let parsedShops: any[] = [];

    if (rawReply.includes("[JSON_START]") && rawReply.includes("[JSON_END]")) {
      const parts = rawReply.split("[JSON_START]");
      replyText = parts[0].trim();
      const jsonPart = parts[1].split("[JSON_END]")[0].trim();
      try {
        parsedShops = JSON.parse(jsonPart);
      } catch (e) { console.error("JSON Parsing Error"); }
    }

    return NextResponse.json({ 
      success: true, 
      reply: replyText, 
      shops: parsedShops 
    });

  } catch (error) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: 'خطا در پردازش درخواست' }, { status: 500 });
  }
}