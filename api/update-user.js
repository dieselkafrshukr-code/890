const { initializeApp, cert, getApps } = require('firebase-admin/app');
const { getAuth } = require('firebase-admin/auth');

function initAdmin() {
    if (!getApps().length) {
        const base64Config = process.env.FB_CONFIG_BASE64;
        if (!base64Config) throw new Error("Missing FB_CONFIG_BASE64");
        const serviceAccount = JSON.parse(Buffer.from(base64Config, 'base64').toString('utf-8'));
        initializeApp({ credential: cert(serviceAccount) });
    }
    return getAuth();
}

module.exports = async function (req, res) {
    if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

    try {
        const authAdmin = initAdmin();
        const { email, newPassword, adminToken } = req.body;

        // 1. التأكد من أن اللي بيطلب التغيير هو الأدمن الفعلي (بتحقق من الـ Token)
        const decodedToken = await authAdmin.verifyIdToken(adminToken);
        const callerEmail = decodedToken.email.toLowerCase();

        // ⚠️ قائمة الإيميلات المسموح لها بتغيير الباسوردات (Super Admins)
        const superAdmins = ['mm12@gmail.com'];

        if (!superAdmins.includes(callerEmail)) {
            return res.status(403).json({ success: false, error: 'غير مسموح لك بإجراء هذا التعديل' });
        }

        // 2. البحث عن المستخدم وإيجاد الـ UID بتاعه
        const userRecord = await authAdmin.getUserByEmail(email);

        // 3. تحديث الباسورد
        await authAdmin.updateUser(userRecord.uid, {
            password: newPassword
        });

        return res.status(200).json({ success: true, message: `تم تحديث كلمة مرور ${email} بنجاح` });

    } catch (e) {
        console.error("Manage User Error:", e);
        return res.status(500).json({ success: false, error: e.message });
    }
};
