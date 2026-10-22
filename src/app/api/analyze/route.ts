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
    const { productId } = await request.json();
    
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        offers: {
          include: { shop: true },
          orderBy: { priceToman: 'asc' },
          take: 3,
        }
      }
    });

    if (!product) {
      return NextResponse.json({ error: 'محصول یافت نشد' }, { status: 404 });
    }

    // ساخت متن برای هوش مصنوعی
    const shopsContext = product.offers.map((o: any) => 
      `- فروشگاه ${o.shop?.name || 'ناشناس'} | آدرس: ${o.shop?.address || 'نامشخص'} | قیمت: ${o.priceToman} تومان | شماره‌تماس: ${JSON.stringify(o.shop?.contacts)}`
    ).join('\n');

    const prompt = `
    محصول: ${product.persianTitle}
    مشخصات: ${JSON.stringify(product.specs)}
    
    لیست فروشندگان:
    ${shopsContext}

    بر اساس مشخصات و لیست فروشندگان بالا، تحلیل کن:
    آیا این کالا ارزش خرید دارد؟ (بهترین فروشنده از نظر قیمت/فاصله کدام است؟)
    2 نظر کوتاه از خریداران فرضی.
    
    دقیقاً و فقط یک JSON با کلیدهای زیر برگردان:
    {
      "verdict": "یک جمله درباره ارزش خرید و بهترین فروشگاه", 
      "pro": "نقطه قوت اصلی", 
      "con": "نقطه ضعف احتمالی",
      "reviews": [
        {"name": "اسم ایرانی", "comment": "نظر"}
      ]
    }
    هیچ کلمه اضافه‌ای ننویس.
    `;

    const response = await openai.chat.completions.create({
      model: "gpt-5-mini", 
      messages: [{ role: "user", content: prompt }]
    });

    const aiMessage = response.choices[0].message.content || '{}';
    
    let parsedData = { verdict: "", pro: "", con: "", reviews: [] };

    try {
      const jsonStart = aiMessage.indexOf('{');
      const jsonEnd = aiMessage.lastIndexOf('}');
      if (jsonStart !== -1 && jsonEnd !== -1) {
        parsedData = JSON.parse(aiMessage.substring(jsonStart, jsonEnd + 1));
      }
    } catch (e) { console.error(e); }

    // 👈 خروجی شامل topOffers (لیست فروشگاه‌ها) میشود تا در UI نمایش دهیم
    return NextResponse.json({ success: true, analysis: parsedData, topOffers: product.offers });
  } catch (error) {
    return NextResponse.json({ error: 'خطا در ارتباط با هوش مصنوعی' }, { status: 500 });
  }
}