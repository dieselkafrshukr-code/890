// ============================================================
// 🔐 Vercel API Route: /api/create-order
// السعر بيتحسب هنا في السيرفر، مش عند العميل أبداً
// ============================================================

const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getFirestore, FieldValue } = require('firebase-admin/firestore');

// Initialize Firebase Admin (once - reused across invocations)
let db;
function getDB() {
    if (db) return db;
    if (!getApps().length) {
        const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
        initializeApp({ credential: cert(serviceAccount) });
    }
    db = getFirestore();
    return db;
}

module.exports = async function handler(req, res) {
    // CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method Not Allowed' });

    try {
        const firestore = getDB();
        const { customer, phone, phone2, address, governorate, paymentMethod, cartItems, couponCode } = req.body;

        // ── 1. Validate required fields ──────────────────────────
        if (!customer || customer.trim().length < 3)
            return res.status(400).json({ error: 'اسم العميل غير صحيح' });

        if (!phone || !/^[0-9]{10,15}$/.test(phone.trim()))
            return res.status(400).json({ error: 'رقم الهاتف غير صحيح' });

        if (!address || address.trim().length < 3)
            return res.status(400).json({ error: 'العنوان مطلوب' });

        if (!governorate)
            return res.status(400).json({ error: 'المحافظة مطلوبة' });

        if (!['delivery', 'online', 'cash'].includes(paymentMethod))
            return res.status(400).json({ error: 'طريقة دفع غير صحيحة' });

        if (!cartItems || !Array.isArray(cartItems) || cartItems.length === 0)
            return res.status(400).json({ error: 'السلة فارغة' });

        // ── 2. Fetch REAL prices from Firestore (Server-side) ────
        let subtotal = 0;
        const validatedItems = [];

        for (const item of cartItems) {
            if (!item.productId)
                return res.status(400).json({ error: 'بيانات المنتج غير صحيحة' });

            const productDoc = await firestore.collection('products').doc(item.productId).get();

            if (!productDoc.exists)
                return res.status(400).json({ error: `المنتج غير موجود` });

            const product = productDoc.data();

            if (product.hidden === true)
                return res.status(400).json({ error: 'أحد المنتجات غير متاح حالياً' });

            // ✅ السعر الحقيقي من Firebase، مش من العميل
            const realPrice = parseFloat(product.price);
            subtotal += realPrice;

            validatedItems.push({
                name: product.name,
                price: realPrice,
                sku: product.sku || '',
                image: product.mainImage || '',
                color: item.color || '',
                size: item.size || ''
            });
        }

        // ── 3. Apply Coupon (Server-side validation) ─────────────
        let discount = 0;

        if (couponCode) {
            const couponDoc = await firestore.collection('coupons').doc(couponCode.toUpperCase()).get();

            if (couponDoc.exists) {
                const coupon = couponDoc.data();
                const now = new Date();
                const isActive = coupon.active !== false;
                const withinUsage = !coupon.usageLimit || (coupon.usageCount || 0) < coupon.usageLimit;
                const notExpired = !coupon.expiryDate || new Date(coupon.expiryDate) > now;

                if (isActive && withinUsage && notExpired) {
                    const couponType = coupon.type || 'percent';
                    if (couponType === 'percent') {
                        discount = Math.round(subtotal * (parseFloat(coupon.discount) / 100));
                    } else {
                        discount = parseFloat(coupon.discount) || 0;
                    }
                }
            }
        }

        const discountedSubtotal = Math.max(0, subtotal - discount);

        // ── 4. Get Shipping Price (Server-side) ──────────────────
        let shipping = 0;
        const shippingDoc = await firestore.collection('settings').doc('governoratesPricing').get();

        if (shippingDoc.exists) {
            const prices = shippingDoc.data().prices || {};
            const govKey = Object.keys(prices).find(k => k.trim() === governorate.trim());
            if (govKey !== undefined) shipping = parseFloat(prices[govKey]) || 0;
        }

        // ── 5. Calculate FINAL total (Server owns this number) ───
        const finalTotal = discountedSubtotal + shipping;

        // ── 6. Build order item string ───────────────────────────
        const itemString = validatedItems.map(i => {
            let str = i.name;
            if (i.color) str += ` (لون: ${i.color})`;
            if (i.size) str += ` (مقاس: ${i.size})`;
            if (i.sku) str += ` [${i.sku}]`;
            return str;
        }).join(' | ');

        const orderImages = validatedItems
            .map(i => i.image)
            .filter(img => img && img.length > 10)
            .slice(0, 5);

        // ── 7. Save Order to Firestore (via Admin SDK - bypasses rules) ──
        const orderRef = await firestore.collection('orders').add({
            customer: customer.trim(),
            phone: phone.trim(),
            phone2: (phone2 || '').trim(),
            address: address.trim(),
            governorate: governorate.trim(),
            item: itemString,
            images: orderImages,
            total: finalTotal,       // ✅ محسوب في السيرفر
            shipping: shipping,      // ✅ محسوب في السيرفر
            paymentMethod: paymentMethod,
            coupon: couponCode || '',
            discount: discount,
            status: 'new',
            timestamp: FieldValue.serverTimestamp()
        });

        // ── 8. Increment coupon usage ────────────────────────────
        if (couponCode && discount > 0) {
            await firestore.collection('coupons').doc(couponCode.toUpperCase()).update({
                usageCount: FieldValue.increment(1)
            }).catch(() => { });
        }

        // ── 9. Return success ────────────────────────────────────
        return res.status(200).json({
            success: true,
            orderId: orderRef.id,
            total: finalTotal,
            shipping: shipping,
            discount: discount,
            subtotal: subtotal
        });

    } catch (err) {
        console.error('❌ create-order error:', err);
        return res.status(500).json({ error: 'حدث خطأ في السيرفر. حاول مرة أخرى.' });
    }
};
