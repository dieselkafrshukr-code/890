const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore } = require('firebase-admin/firestore');

let db;

function getDB() {
    if (db) return db;
    if (!getApps().length) {
        try {
            const base64Config = process.env.FB_CONFIG_BASE64;
            if (!base64Config) {
                console.error("❌ FB_CONFIG_BASE64 is missing in Vercel!");
                throw new Error("السيرفر غير مهيأ (Environment Variable Missing)");
            }

            const jsonString = Buffer.from(base64Config, 'base64').toString('utf-8');
            const serviceAccount = JSON.parse(jsonString);

            initializeApp({
                credential: cert(serviceAccount)
            });
            console.log("✅ Firebase Admin initialized perfectly via Base64!");
        } catch (e) {
            console.error("Firebase Init Error:", e.message);
            throw new Error(`خطأ السيرفر: ${e.message}`);
        }
    }
    db = getFirestore();
    return db;
}

module.exports = async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ success: false, error: 'Method not allowed' });

    try {
        const firestore = getDB();
        const { customer, phone, phone2, address, governorate, paymentMethod, cartItems, couponCode } = req.body;

        if (!customer || !phone || !address || !governorate || !cartItems) {
            return res.status(400).json({ success: false, error: 'بيانات الطلب ناقصة' });
        }

        // 1. حساب السعر (مبسط دلوقتي عشان نشغل المتجر)
        let subtotal = 0;
        const itemsDetail = [];

        for (const item of cartItems) {
            const prodSnap = await firestore.collection('products').doc(item.productId).get();
            if (prodSnap.exists) {
                const data = prodSnap.data();
                subtotal += data.price;
                itemsDetail.push({
                    name: data.name,
                    price: data.price,
                    color: item.color,
                    size: item.size,
                    image: data.mainImage || '' // ✅ إضافة الصورة
                });
            }
        }

        // 2. جلب سعر الشحن
        let shipping = 0;
        const shipSnap = await firestore.collection('settings').doc('shipping_prices').get();
        if (shipSnap.exists) {
            shipping = shipSnap.data()[governorate] || 0;
        }

        const total = subtotal + shipping;

        const { Timestamp } = require('firebase-admin/firestore');

        // 3. تجهيز بيانات إضافية للوحة التحكم (Summary for Admin)
        const itemSummary = itemsDetail.map(i => `${i.name} (${i.color || ''} - ${i.size || ''})`).join(' | ');
        const productImages = itemsDetail.map(i => i.image).filter(img => img);

        // 4. حفظ الأوردر
        const orderData = {
            customer,
            phone,
            phone2: phone2 || '',
            address,
            governorate,
            paymentMethod,
            items: itemsDetail, // التفاصيل الكاملة
            item: itemSummary,   // ملخص نصي للجدول
            images: productImages, // صور للجدول
            subtotal,
            shipping,
            total,
            status: 'pending',
            timestamp: Timestamp.now(), // ✅ الحقل اللي الداشبورد بيدور عليه
            source: 'Server (Base64)'
        };

        const docRef = await firestore.collection('orders').add(orderData);

        return res.status(200).json({
            success: true,
            orderId: docRef.id,
            total,
            subtotal,
            shipping,
            discount: 0
        });

    } catch (e) {
        console.error('API Error:', e);
        return res.status(500).json({ success: false, error: e.message });
    }
};
