module.exports = async function handler(req, res) {
    // CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    if (req.method === 'OPTIONS') return res.status(200).end();

    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

    const GEMINI_API_KEY = process.env.GEMINI_API_KEY || 'AIzaSyDocJGg_V2d5P7mCVqdErhLWigFq2EbDXA';

    const { message, history } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required' });
    }

    // System prompt مع كل بيانات المحل
    const systemInstruction = `أنت مساعد ذكي ودود اسمك "مساعد الطوفان" تابع لمحل "الطوفان ستوك (El Toufan Stock)" في بورسعيد، مصر.

## معلومات المحل الكاملة:

### الفروع:
1. فرع أوت ليت الجديد: سوق أوت ليت الجديد، محل رقم 139، أمام سوق السمك الجديد، حي الشرق، بورسعيد. يعمل 24 ساعة / 7 أيام.
2. الفرع الرئيسي: شارع 23 يوليو، أمام ميدان الشهداء (المسلة)، بورسعيد.
3. فرع أرض العزب: بجوار محمصة الحطاب، بورسعيد.

### الموقع الجغرافي:
خط العرض: 31.2576927 | خط الطول: 32.2933663

### المنتجات:
- ملابس رجالي: قمصان، تيشرتات، بنطلونات، ملابس داخلية مستوردة، جواكت
- ملابس حريمي: ملابس خروج وبيتي بأعلى جودة
- ملابس أطفال: تشكيلة للأولاد والبنات بكل الأعمار
- أحذية: رجالي، حريمي، أطفال - ماركات أصلية
- إكسسوارات: شرابات أصلية، أحزمة

### التخصص:
توكيلات أوروبية وبراندات عالمية أصلية بأسعار تُوصف بـ "سعر المصري". يوفر بيع جملة وقطاعي.

### المميزات:
- عروض دمار وتخفيضات مستمرة
- شحن لجميع محافظات مصر
- تقييم 5/5 على خرائط جوجل
- الدفع عند الاستلام أو أونلاين (فيزا/كارت)

### التواصل:
- هاتف/واتساب: 01275460336
- فيسبوك: https://www.facebook.com/share/1FBVWWwdd4/?mibextid=wwXIfr
- تيك توك: https://www.tiktok.com/@eltoufanstock

## قواعد الرد:
1. رد باللهجة المصرية العامية بشكل ودود وطبيعي.
2. أجب فقط عن أسئلة تخص محل الطوفان ستوك أو الملابس والتسوق بشكل عام.
3. لو السؤال لا علاقة له بالمحل أو التسوق، اعتذر بلطف ووجه الشخص لأسئلة عن المحل.
4. خلي ردودك قصيرة ومفيدة (لا تتعدى 3-4 سطور إلا لو السؤال محتاج تفصيل).
5. استخدم إيموجي بشكل معتدل.
6. لو حد سألك عن سعر منتج محدد، قوله يتواصل على واتساب أو يزور المحل.
7. لا تخترع معلومات غير موجودة.`;

    try {
        // Build conversation for Gemini
        const contents = [];

        // Add history if available
        if (history && Array.isArray(history)) {
            history.forEach(h => {
                contents.push({
                    role: h.role === 'user' ? 'user' : 'model',
                    parts: [{ text: h.text }]
                });
            });
        }

        // Add current user message
        contents.push({
            role: 'user',
            parts: [{ text: message }]
        });

        const response = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    system_instruction: {
                        parts: [{ text: systemInstruction }]
                    },
                    contents: contents,
                    generationConfig: {
                        temperature: 0.7,
                        topP: 0.9,
                        topK: 40,
                        maxOutputTokens: 500
                    },
                    safetySettings: [
                        { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_MEDIUM_AND_ABOVE" },
                        { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_MEDIUM_AND_ABOVE" }
                    ]
                })
            }
        );

        if (!response.ok) {
            const errData = await response.text();
            console.error('Gemini API Error:', errData);
            return res.status(500).json({ error: 'Gemini API request failed' });
        }

        const data = await response.json();
        const reply = data.candidates?.[0]?.content?.parts?.[0]?.text || 'عذراً، حصل خطأ. جرب تاني!';

        return res.status(200).json({ success: true, reply });

    } catch (e) {
        console.error('Chatbot API Error:', e);
        return res.status(500).json({ error: e.message });
    }
};
