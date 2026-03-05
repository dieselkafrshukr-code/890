document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & DATA ---
    let storeTree = { name: "EL TOUFAN", options: [] };
    const defaultData = [
        { id: "wholesale", name: "جملة", options: [] },
        { id: "retail", name: "قطاعي", options: [] }
    ];

    // --- 2. STATE MANAGEMENT ---
    let navigationStack = [];
    let currentLevel = storeTree;
    let cart = [];
    let shippingPrices = {};
    window.CURRENT_SHIPPING_PRICES = shippingPrices;
    let wishlist = JSON.parse(localStorage.getItem('eltoufan_wishlist') || '[]');
    let couponDiscount = 0;
    let couponCode = '';
    let couponType = 'percent';
    let allProductCards = [];
    let currentProductId = null;
    let productCache = {}; // Cache for category products
    let activeOffers = []; // Live special offers from dashboard

    let currentLang = localStorage.getItem('eltoufan_lang') || 'ar';

    const translations = {
        ar: {
            welcome: "مرحباً بك في الطوفان",
            choose_buying: "اختر طريقة الشراء أولاً",
            search: "ابحث عن منتج...",
            back: "رجوع",
            start: "البداية",
            cart_title: "سلة التسوق",
            confirm_order: "إتمام الطلب",
            empty_cart: "السلة فارغة!",
            fullname: "الاسم الكامل",
            phone: "رقم الهاتف الأساسي",
            phone2: "رقم هاتف إضافي (اختياري)",
            address: "العنوان التفصيلي",
            gov: "المحافظة",
            choose_gov: "-- اختر المحافظة --",
            items: "المنتجات",
            shipping: "الشحن",
            total: "الإجمالي",
            whatsapp_btn: "📲 أرسل عبر واتساب",
            cancel: "إلغاء",
            sizes: "المقاسات",
            colors: "الألوان",
            no_sizes: "لا توجد مقاسات محددة",
            no_colors: "لا توجد ألوان إضافية",
            add_to_cart: "إضافة للسلة",
            select_size: "يرجى اختيار المقاس أولاً!",
            order_whatsapp_title: "🛖 طلب جديد - EL TOUFAN",
            wishlist_empty: "قائمة المفضلة فارغة 🥲",
            select_category: "اختر القسم أولاً",
            payment_method: "طريقة الدفع",
            pay_online: "دفع اون لاين (فيزا / كارت)",
            pay_delivery: "عند الاستلام"
        },
        en: {
            welcome: "Welcome to El Toufan",
            choose_buying: "Choose buying method",
            search: "Search products...",
            back: "Back",
            start: "Home",
            cart_title: "Shopping Cart",
            confirm_order: "Checkout",
            empty_cart: "Cart is empty!",
            fullname: "Full Name",
            phone: "Primary Phone Number",
            phone2: "Additional Phone (Optional)",
            address: "Full Address",
            gov: "Governorate",
            choose_gov: "-- Select Governorate --",
            items: "Products",
            shipping: "Shipping",
            total: "Total",
            whatsapp_btn: "📲 Send via WhatsApp",
            cancel: "Cancel",
            sizes: "Sizes",
            colors: "Colors",
            no_sizes: "No specific sizes",
            no_colors: "No additional colors",
            add_to_cart: "Add to Cart",
            select_size: "Please select size first!",
            order_whatsapp_title: "🛖 New Order - EL TOUFAN",
            wishlist_empty: "Wishlist is empty 🥲",
            select_category: "Select category first",
            payment_method: "Payment Method",
            pay_online: "Pay Online (Visa/Card)",
            pay_delivery: "Cash on Delivery"
        }
    };


    // WhatsApp Numbers (Defaults - updated from Firebase)
    let WA_NUMBER = "201020451206";
    let WA_NUMBER_2 = "201020451206";

    // Egypt Governorates
    const EGYPT_GOVERNORATES = [
        "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر",
        "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية",
        "المنيا", "القليوبية", "الوادي الجديد", "السويس", "أسوان",
        "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية",
        "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا",
        "شمال سيناء", "سوهاج"
    ];

    // --- 3. DOM ELEMENTS ---
    const cartDrawer = document.getElementById('cart-drawer');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTrigger = document.querySelector('.cart-trigger');
    const badge = document.getElementById('cart-count');
    const cartTotalDisplay = document.getElementById('cart-total');

    const introScreen = document.getElementById('intro-screen');
    const mainApp = document.getElementById('main-app');
    const optionsGrid = document.getElementById('options-grid');
    const stageTitle = document.getElementById('stage-title');
    const stageDesc = document.getElementById('stage-desc');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-btn');
    const stepIndicator = document.querySelector('.step-indicator');
    const themeToggle = document.getElementById('theme-toggle');

    // --- Theme Logic (Enhanced: Force Light on Load) ---
    function updateThemeUI(isDark) {
        if (isDark) {
            document.body.classList.add('dark-mode');
            if (themeToggle) themeToggle.innerHTML = '<i data-lucide="sun"></i>';
        } else {
            document.body.classList.remove('dark-mode');
            if (themeToggle) themeToggle.innerHTML = '<i data-lucide="moon"></i>';
        }
        if (window.lucide) lucide.createIcons();
    }

    // Always start with Light Mode regardless of previous state
    localStorage.setItem('theme', 'light');
    updateThemeUI(false);

    if (themeToggle) {
        themeToggle.onclick = () => {
            const willBeDark = !document.body.classList.contains('dark-mode');
            localStorage.setItem('theme', willBeDark ? 'dark' : 'light');
            updateThemeUI(willBeDark);
        };
    }

    const langToggle = document.getElementById('lang-toggle');
    if (langToggle) {
        langToggle.innerText = currentLang === 'ar' ? 'EN' : 'AR';
        langToggle.onclick = () => {
            currentLang = currentLang === 'ar' ? 'en' : 'ar';
            localStorage.setItem('eltoufan_lang', currentLang);
            langToggle.innerText = currentLang === 'ar' ? 'EN' : 'AR';
            document.documentElement.lang = currentLang;
            document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
            applyTranslations();
            renderStage();
        };
    }

    function applyTranslations() {
        const t = translations[currentLang];
        const stageDesc = document.getElementById('stage-desc');
        if (stageDesc && navigationStack.length <= 1) stageDesc.innerText = t.choose_buying;

        const searchInput = document.getElementById('product-search');
        if (searchInput) searchInput.placeholder = t.search;

        if (backBtn) backBtn.innerHTML = (currentLang === 'ar' ? '<i data-lucide="chevron-right"></i> ' : '') + t.back + (currentLang === 'en' ? ' <i data-lucide="chevron-left"></i>' : '');
        if (resetBtn) resetBtn.innerHTML = t.start + ' <i data-lucide="home"></i>';

        const cartTitle = document.querySelector('.cart-header h3');
        if (cartTitle) cartTitle.innerText = t.cart_title;

        const checkoutBtn = document.querySelector('.checkout-btn');
        if (checkoutBtn) checkoutBtn.innerText = t.confirm_order;

        lucide.createIcons();
    }
    document.documentElement.dir = currentLang === 'ar' ? 'rtl' : 'ltr';
    applyTranslations();

    // ============================================
    // GOOGLE SIGN IN & ORDER TRACKING (REWRITTEN)
    // ============================================

    // Set Persistence at startup
    auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch(e => console.error("Persistence error:", e));

    function setupAuthModals() {
        if (document.getElementById('auth-modals-container')) return;
        const container = document.createElement('div');
        container.id = 'auth-modals-container';
        container.innerHTML = `
            <!-- Login Modal -->
            <div id="customer-login-modal" class="admin-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.92); backdrop-filter:blur(12px); z-index:999999; align-items:center; justify-content:center; padding:1.2rem; direction:rtl;">
                <div class="login-card" style="background:#0a0a0a; border:1px solid #222; border-radius:32px; padding:3.5rem 2rem; width:100%; max-width:400px; position:relative; box-shadow:0 30px 60px rgba(0,0,0,0.8); text-align:center;">
                    <button type="button" class="close-modal" id="close-login-btn" style="position:absolute; top:20px; left:20px; background:rgba(255,255,255,0.05); border:none; color:#fff; width:36px; height:36px; border-radius:50%; cursor:pointer; display:flex; align-items:center; justify-content:center;"><i data-lucide="x"></i></button>
                    <div style="background:var(--accent); width:76px; height:76px; border-radius:26px; display:flex; align-items:center; justify-content:center; margin:0 auto 1.5rem auto; box-shadow:0 10px 30px rgba(212,175,55,0.3);">
                        <i data-lucide="user-check" style="color:#000; width:36px; height:36px;"></i>
                    </div>
                    <h2 style="font-weight:900; font-size:1.8rem; color:#fff; margin-bottom:12px; font-family:'Cairo', sans-serif;">مرحباً بك مجدداً</h2>
                    <p style="color:#888; font-size:0.95rem; margin-bottom:2.5rem; line-height:1.6;">سجل دخول لمتابعة حالة طلباتك الحالية والسابقة بكل سهولة.</p>
                    <button type="button" id="google-login-action" style="background:#fff; color:#000; width:100%; border:none; padding:18px; border-radius:18px; font-family:'Cairo', sans-serif; font-weight:800; font-size:1rem; display:flex; align-items:center; justify-content:center; gap:12px; cursor:pointer; transition:0.3s; box-shadow:0 10px 20px rgba(255,255,255,0.1);">
                         <svg width="20" height="20" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                         المتابعة باستخدام Google
                    </button>
                </div>
            </div>

            <!-- User Orders / Profile Modal -->
            <div id="user-orders-modal" class="admin-modal" style="display:none; position:fixed; inset:0; background:rgba(0,0,0,0.95); backdrop-filter:blur(15px); z-index:999999; align-items:center; justify-content:center; padding:1rem; direction:rtl;">
                <div class="modal-card" style="background:#0f0f0f; border:1px solid #333; border-radius:32px; width:100%; max-width:650px; max-height:85vh; display:flex; flex-direction:column; box-shadow:0 30px 80px rgba(0,0,0,1);">
                    <div style="padding:1.5rem 2rem; border-bottom:1px solid #222; display:flex; justify-content:space-between; align-items:center; flex-shrink:0;">
                        <div id="user-profile-info" style="display:flex; align-items:center; gap:12px;">
                            <!-- Injected info -->
                        </div>
                        <button type="button" class="close-modal" id="close-orders-btn" style="background:rgba(255,255,255,0.05); border:none; color:#888; width:40px; height:40px; border-radius:50%; cursor:pointer;"><i data-lucide="x"></i></button>
                    </div>
                    <div id="orders-display-area" style="padding:1.5rem 2rem; overflow-y:auto; flex-grow:1; display:flex; flex-direction:column; gap:16px;">
                        <!-- List of orders here -->
                    </div>
                    <div style="padding:1.2rem 2rem; border-top:1px solid #222; flex-shrink:0; display:flex; gap:12px;">
                        <button type="button" id="customer-sign-out" style="background:rgba(255,68,68,0.05); color:#ff4444; border:1px solid rgba(255,68,68,0.1); flex:1; padding:14px; border-radius:15px; font-weight:800; cursor:pointer; display:flex; align-items:center; justify-content:center; gap:8px;">
                            <i data-lucide="log-out" style="width:18px;"></i> تسجيل الخروج
                        </button>
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(container);

        // Bind Buttons
        document.getElementById('close-login-btn').onclick = () => document.getElementById('customer-login-modal').style.display = 'none';
        document.getElementById('close-orders-btn').onclick = () => document.getElementById('user-orders-modal').style.display = 'none';

        document.getElementById('google-login-action').onclick = async () => {
            try {
                const provider = new firebase.auth.GoogleAuthProvider();
                // Switching back to Popup as Redirect is causing reload loops in some environments
                await auth.signInWithPopup(provider);
                document.getElementById('customer-login-modal').style.display = 'none';
                window.handleUserIconClick(); // Refresh UI to show orders
            } catch (err) {
                console.error("Login Error:", err);
                if (err.code === 'auth/popup-closed-by-user') return;
                alert("تعذر تسجيل الدخول: " + err.message);
            }
        };

        document.getElementById('customer-sign-out').onclick = async () => {
            if (confirm("هل أنت متأكد من تسجيل الخروج من حسابك؟")) {
                await auth.signOut();
                localStorage.removeItem('eltoufan_user');
                document.getElementById('user-orders-modal').style.display = 'none';
            }
        };

        if (window.lucide) lucide.createIcons();
    }

    // Global listener for header UI
    auth.onAuthStateChanged(user => {
        const iconBtn = document.getElementById('google-login-btn');
        if (!iconBtn) return;
        if (user) {
            localStorage.setItem('eltoufan_user', JSON.stringify({ email: user.email, photoURL: user.photoURL }));
            if (user.photoURL) {
                iconBtn.innerHTML = `<img src="${user.photoURL}" style="width:100%; height:100%; border-radius:50%; object-fit:cover;">`;
            } else {
                iconBtn.innerHTML = `<div style="background:var(--accent); color:#000; width:100%; height:100%; border-radius:50%; display:flex; align-items:center; justify-content:center; font-weight:900;">${user.email[0].toUpperCase()}</div>`;
            }
        } else {
            iconBtn.innerHTML = `<i data-lucide="user"></i>`;
            if (window.lucide) lucide.createIcons();
        }
    });

    // Auto-setup on load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', setupAuthModals);
    } else {
        setupAuthModals();
    }

    window.handleUserIconClick = async () => {
        setupAuthModals();

        // Ensure state is ready
        if (auth.currentUser === null) {
            // Check if firebase is still initializing (can happen on fast clicks)
            const checkUser = await new Promise(resolve => {
                const unsubscribe = auth.onAuthStateChanged(user => {
                    unsubscribe();
                    resolve(user);
                });
                setTimeout(() => resolve(null), 800);
            });
            if (!checkUser) {
                const m = document.getElementById('customer-login-modal');
                if (m) m.style.display = 'flex';
                return;
            }
        }

        const user = auth.currentUser;
        if (user) {
            const modal = document.getElementById('user-orders-modal');
            if (modal) modal.style.display = 'flex';

            // Set profile data
            const profileHeader = document.getElementById('user-profile-info');
            if (profileHeader) {
                profileHeader.innerHTML = `
                    <div style="position:relative;">
                        <img src="${user.photoURL || 'https://via.placeholder.com/40'}" style="width:44px; height:44px; border-radius:14px; border:2px solid var(--accent);">
                    </div>
                    <div>
                        <div style="font-weight:900; color:#fff; font-size:1.1rem; font-family:'Cairo', sans-serif;">مرحباً ${user.displayName || 'يا صديقي'}</div>
                        <div style="font-size:0.75rem; color:#666; font-family:monospace;">${user.email}</div>
                    </div>
                `;
            }

            await loadPersonalOrders(user.email);
        }
    };

    async function loadPersonalOrders(email) {
        const container = document.getElementById('orders-display-area');
        if (!container) return;

        container.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--accent);">
                <div class="custom-loader" style="width:40px; height:40px; border:3px solid #222; border-top-color:var(--accent); border-radius:50%; margin:0 auto 1rem auto; animation: spin 0.8s linear infinite;"></div>
                <div style="font-weight:700; font-size:0.9rem;">جاري جلب طلباتك...</div>
            </div>
            <style>@keyframes spin { to { transform: rotate(360deg); } }</style>
        `;

        try {
            const cleanEmail = email.toLowerCase().trim();
            const snap = await db.collection('orders').where('customerEmail', '==', cleanEmail).get();

            if (snap.empty) {
                container.innerHTML = `
                    <div style="text-align:center; padding:4rem 2rem; color:#666; background:rgba(255,212,55,0.02); border-radius:30px; border:1px dashed #222;">
                        <i data-lucide="package-search" style="width:50px; height:50px; margin-bottom:1rem; opacity:0.4;"></i>
                        <h3 style="color:#fff; font-weight:800; margin-bottom:10px;">لا توجد طلبات سابقة</h3>
                        <p style="font-size:0.85rem; line-height:1.6;">لم نجد أي طلبات مرتبطة ببريدك الإلكتروني (${cleanEmail}) في قاعدة بياناتنا.</p>
                    </div>
                `;
            } else {
                let html = '';
                const sorted = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }))
                    .sort((a, b) => {
                        const dateA = (a.createdAt || a.timestamp)?.toMillis?.() || 0;
                        const dateB = (b.createdAt || b.timestamp)?.toMillis?.() || 0;
                        return dateB - dateA;
                    });

                sorted.forEach(order => {
                    const statuses = {
                        'جديد': { color: '#2196f3', icon: 'clock' },
                        'جاري التجهيز': { color: '#ff9800', icon: 'package' },
                        'تم الشحن': { color: '#9c27b0', icon: 'truck' },
                        'تم التوصيل': { color: '#4caf50', icon: 'check-circle' },
                        'ملغي': { color: '#f44336', icon: 'x-circle' }
                    };
                    const st = statuses[order.status] || statuses['جديد'];
                    const time = (order.createdAt || order.timestamp)?.toDate?.()?.toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) || '---';

                    let itemsHtml = '';
                    if (Array.isArray(order.items)) {
                        itemsHtml = order.items.map(it => `
                            <div style="display:flex; justify-content:space-between; font-size:0.85rem; border-bottom:1px solid #1a1a1a; padding:6px 0;">
                                <span style="color:#eee;">• ${it.name} ${it.color ? `(${it.color})` : ''}</span>
                                <span style="color:var(--accent); font-weight:700;">${it.price} ج.م</span>
                            </div>
                        `).join('');
                    } else {
                        itemsHtml = `<div style="font-size:0.8rem; color:#777; line-height:1.4;">${order.item || '---'}</div>`;
                    }

                    html += `
                        <div style="background:#141414; border:1px solid #222; border-radius:24px; padding:20px; position:relative; transition:0.3s;" onmouseover="this.style.borderColor='var(--accent)'" onmouseout="this.style.borderColor='#222'">
                            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:15px;">
                                <div>
                                    <div style="font-family:monospace; color:#444; font-size:0.75rem; letter-spacing:1px; margin-bottom:4px;">ORD-${order.id.slice(-6).toUpperCase()}</div>
                                    <div style="font-weight:700; color:#888; font-size:0.8rem;">${time}</div>
                                </div>
                                <div style="color:${st.color}; background:${st.color}15; border:1px solid ${st.color}33; padding:6px 14px; border-radius:12px; font-size:0.75rem; font-weight:900; display:flex; align-items:center; gap:6px;">
                                    <i data-lucide="${st.icon}" style="width:14px; height:14px;"></i>
                                    ${order.status || 'جديد'}
                                </div>
                            </div>
                            <div style="margin-bottom:15px; background:rgba(0,0,0,0.2); border-radius:14px; padding:10px;">
                                ${itemsHtml}
                            </div>
                            <div style="display:flex; justify-content:space-between; align-items:center; border-top:1px solid #222; padding-top:15px;">
                                <span style="color:#666; font-size:0.85rem;">الإجمالي النهائي</span>
                                <span style="color:var(--accent); font-weight:900; font-size:1.3rem;">${order.total} ج.م</span>
                            </div>
                        </div>
                    `;
                });
                container.innerHTML = html;
            }
        } catch (err) {
            console.error(err);
            container.innerHTML = `<div style="color:#ff4444; text-align:center; padding:3rem; font-weight:700;"><i data-lucide="alert-circle" style="width:30px; margin-bottom:10px;"></i><br>عذراً، حدث خطأ أثناء تحميل الطلبات.<br><span style="font-size:0.75rem; opacity:0.6; font-weight:400;">${err.message}</span></div>`;
        }
        if (window.lucide) lucide.createIcons();
    }

    // Orders logic end

    // --- 4. INITIALIZATION ---
    // --- 4. ULTIMATE CINEMATIC INITIALIZATION (THE STORM'S EYE) ---
    function initUltimateIntro() {
        const canvas = document.getElementById("particles-canvas");
        if (!canvas) return;
        const ctx = canvas.getContext("2d");
        let w = canvas.width = window.innerWidth;
        let h = canvas.height = window.innerHeight;

        let particles = [];
        let vortexMode = true;
        let warpMode = false;
        let vortexSpeed = 0.02;

        class CosmicParticle {
            constructor() {
                this.reset();
            }
            reset() {
                this.x = Math.random() * w;
                this.y = Math.random() * h;
                this.z = Math.random() * w;
                this.vx = (Math.random() - 0.5) * 2;
                this.vy = (Math.random() - 0.5) * 2;
                this.color = Math.random() > 0.8 ? '#d4af37' : '#ffffff';
                this.size = Math.random() * 2;
                this.angle = Math.random() * Math.PI * 2;
                this.radius = Math.random() * (w / 2);
            }
            update() {
                if (warpMode) {
                    this.z -= 20;
                    if (this.z <= 1) this.z = w;
                } else if (vortexMode) {
                    this.angle += vortexSpeed;
                    this.x = w / 2 + Math.cos(this.angle) * this.radius;
                    this.y = h / 2 + Math.sin(this.angle) * this.radius;
                    this.radius *= 0.995; // Gravity effect
                    if (this.radius < 10) this.radius = w / 2 + Math.random() * 200;
                } else {
                    this.x += this.vx;
                    this.y += this.vy;
                }
            }
            draw() {
                let x = this.x;
                let y = this.y;
                let s = this.size;

                if (warpMode) {
                    let k = 1200 / this.z;
                    x = (this.x - w / 2) * k + w / 2;
                    y = (this.y - h / 2) * k + h / 2;
                    s = this.size * k;
                }

                ctx.fillStyle = this.color;
                ctx.beginPath();
                ctx.arc(x, y, s, 0, Math.PI * 2);
                ctx.fill();
            }
        }

        for (let i = 0; i < 400; i++) particles.push(new CosmicParticle());

        function loop() {
            if (introScreen.classList.contains('hidden')) return;
            ctx.fillStyle = warpMode ? 'rgba(0,0,0,0.2)' : 'rgba(0,0,0,0.4)';
            ctx.fillRect(0, 0, w, h);
            particles.forEach(p => { p.update(); p.draw(); });
            requestAnimationFrame(loop);
        }

        window.addEventListener('resize', () => {
            w = canvas.width = window.innerWidth;
            h = canvas.height = window.innerHeight;
        });

        loop();

        // GSAP ORCHESTRATION - SIGNIFICANTLY SPED UP
        const tl = gsap.timeline({
            onComplete: () => {
                setTimeout(() => {
                    initApp();
                }, 50);
            }
        });

        // Skip on click
        introScreen.onclick = () => {
            tl.progress(0.99);
            initApp();
        };

        // Step 1: Eye focus
        tl.to({}, { duration: 0.3 }); // Silence

        // Step 2: Vortex acceleration
        tl.to({}, {
            duration: 0.4,
            onUpdate: function () {
                vortexSpeed = 0.02 + (this.progress() * 0.5);
            }
        });

        // Step 3: THE FLASH & IMPACT
        tl.to('.intro-flash', { opacity: 1, duration: 0.05, ease: "power4.in" });
        tl.set('.intro-flash', { opacity: 0, delay: 0.02 });
        tl.set({}, { onUpdate: () => { vortexMode = false; } });

        // Step 4: MATERIALIZATION
        tl.to('.intro-logo-outer', {
            opacity: 1,
            scale: 1,
            z: 0,
            filter: 'blur(0px)',
            duration: 0.5,
            ease: "expo.out"
        }, "-=0.05");

        tl.to('.intro-loading-line', {
            width: '300px',
            duration: 0.6,
            ease: "power2.inOut"
        }, "-=0.3");

        // Step 5: WARP TO STORE
        tl.to({}, { duration: 0.4 }); // Reduced wait

        tl.add(() => {
            warpMode = true;
            introScreen.classList.add('warp-speed');
            mainApp.classList.remove('hidden');
            mainApp.classList.add('intro-transitioning');
        });

        tl.to('.app-container', {
            opacity: 1,
            filter: 'blur(0px) brightness(1)',
            duration: 0.4,
            ease: "power3.inOut"
        });

        tl.add(() => {
            introScreen.classList.add('hidden');
            mainApp.classList.remove('intro-transitioning');
        });
    }

    async function startIntro() {
        if (!introScreen) return initApp();
        initUltimateIntro();
    }

    let allProducts = []; // Global products list for instant filtering

    async function initApp() {
        // Show app if it takes more than 5 seconds to load data
        const emergencyShow = setTimeout(() => {
            if (mainApp && mainApp.classList.contains('hidden')) {
                mainApp.classList.remove('hidden');
                mainApp.style.opacity = '1';
                mainApp.style.transform = 'translateY(0)';
            }
        }, 5000);

        try {
            // Pre-fetch only essential settings
            const [treeSnap, prices, wa, mnt, ann] = await Promise.all([
                db.collection('settings').doc('storeTree').get(),
                loadShippingPrices(),
                loadWhatsAppNumbers(),
                checkMaintenanceMode(),
                checkAnnouncement()
            ]);

            if (treeSnap.exists) {
                storeTree = treeSnap.data();
                currentLevel = storeTree;
            } else {
                useDefaultData();
            }

        } catch (e) {
            console.error("Init failed:", e);
            useDefaultData();
        }

        clearTimeout(emergencyShow);

        async function checkMaintenanceMode() {
            // Listen in real-time to allow instant unlock/lock
            db.collection('settings').doc('maintenance').onSnapshot(doc => {
                if (!doc.exists) return;
                const data = doc.data();
                const overlay = document.getElementById('maintenance-overlay');
                if (!overlay) return;

                if (data.enabled) {
                    // Check if user is an admin to bypass
                    const user = auth.currentUser;
                    const ADMINS = ['mm12@gmail.com', 'orders@eltoufan.com', 'store@eltoufan.com'];

                    if (user && ADMINS.includes(user.email.toLowerCase())) {
                        console.log("🛡️ Admin detected - Maintenance Mode bypassed.");
                        overlay.classList.add('hidden');
                        return;
                    }

                    document.getElementById('mnt-reason-text').innerText = data.reason || 'تحديثات عامة';
                    document.getElementById('mnt-duration-text').innerText = data.duration || 'غير محدد';
                    document.getElementById('mnt-extra-msg').innerText = data.message || '';
                    overlay.classList.remove('hidden');
                    // Disable scrolling
                    document.body.style.overflow = 'hidden';
                } else {
                    overlay.classList.add('hidden');
                    document.body.style.overflow = '';
                }
                if (window.lucide) lucide.createIcons();
            });
        }

        // Add auth listener specifically for maintenance bypass
        auth.onAuthStateChanged(user => {
            // Re-trigger check if auth state changes while site is in maintenance
            db.collection('settings').doc('maintenance').get().then(doc => {
                if (doc.exists && doc.data().enabled) {
                    const overlay = document.getElementById('maintenance-overlay');
                    if (!overlay) return;

                    const ADMINS = ['mm12@gmail.com', 'orders@eltoufan.com', 'store@eltoufan.com'];
                    if (user && ADMINS.includes(user.email.toLowerCase())) {
                        overlay.classList.add('hidden');
                        document.body.style.overflow = '';
                    } else {
                        overlay.classList.remove('hidden');
                        document.body.style.overflow = 'hidden';
                    }
                }
            });
        });

        async function checkAnnouncement() {
            const bar = document.getElementById('announcement-bar');
            const textEl = document.getElementById('announcement-text');
            if (!bar || !textEl) return;

            db.collection('settings').doc('announcement').onSnapshot(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    if (data.enabled) {
                        textEl.innerText = data.text || '';
                        bar.classList.remove('hidden');
                        document.body.classList.add('has-announcement');
                    } else {
                        bar.classList.add('hidden');
                        document.body.classList.remove('has-announcement');
                    }
                } else {
                    bar.classList.add('hidden');
                    document.body.classList.remove('has-announcement');
                }
            });

            window.closeAnnouncement = () => {
                bar.classList.add('hidden');
                document.body.classList.remove('has-announcement');
            };
        }

        // Special offers logic removed for simplified site-wide alert system

        mainApp.classList.remove('hidden');
        mainApp.style.opacity = '1';
        mainApp.style.transform = 'translateY(0)';
        await renderStage();
    }


    async function loadShippingPrices() {
        console.log("🚛 جاري تحميل أسعار الشحن من لوحة التحكم...");

        // الأسعار بتيجي من Firebase فقط (لوحة التحكم)
        try {
            const snap = await db.collection('settings').doc('governoratesPricing').get();
            if (snap.exists) {
                const firebasePrices = snap.data().prices || {};
                const keys = Object.keys(firebasePrices);

                if (keys.length > 0) {
                    // مسح القديم وتحميل الجديد
                    Object.keys(shippingPrices).forEach(k => delete shippingPrices[k]);
                    keys.forEach(k => {
                        const val = parseFloat(firebasePrices[k]);
                        if (!isNaN(val)) shippingPrices[k.trim()] = val;
                    });
                    console.log('✅ تم تحميل أسعار الشحن من Firebase:', Object.keys(shippingPrices).length, 'محافظة');
                } else {
                    console.warn('⚠️ Firebase موجود لكن لا توجد أسعار - يرجى حفظ الأسعار من لوحة التحكم');
                }
            } else {
                console.warn('⚠️ لم يتم العثور على أسعار الشحن في Firebase - يرجى حفظ الأسعار من لوحة التحكم أولاً');
            }
        } catch (e) {
            console.error('❌ فشل تحميل أسعار الشحن من Firebase:', e.message);
        }

        window.CURRENT_SHIPPING_PRICES = shippingPrices;
        console.log('📦 أسعار الشحن النهائية:', shippingPrices);
    }

    async function loadWhatsAppNumbers() {
        try {
            const snap = await db.collection('settings').doc('whatsappNumbers').get();
            if (snap.exists) {
                const data = snap.data();
                if (data.wa1) WA_NUMBER = data.wa1;
                if (data.wa2) WA_NUMBER_2 = data.wa2;
                console.log("📲 تم تحديث أرقام الواتساب من الداشبورد");
            }
        } catch (e) { console.warn("Could not load WA numbers:", e); }
    }

    // Centralized shipping price lookup (handles Arabic text normalization)
    function getShippingPrice(governorate) {
        if (!governorate) return 0;
        const gov = governorate.trim();

        // Exact match first
        if (shippingPrices[gov] !== undefined) return shippingPrices[gov];

        // Trimmed key match
        const match = Object.keys(shippingPrices).find(k => k.trim() === gov);
        if (match !== undefined) return shippingPrices[match];

        console.warn(`⚠️ No shipping price found for: "${gov}"`);
        return 0;
    }


    function useDefaultData() {
        storeTree.options = defaultData;
        currentLevel = storeTree;
        navigationStack = [];
    }

    // --- 5. RENDER LOGIC ---
    async function renderStage() {
        const t = translations[currentLang];
        const nameKey = currentLang === 'en' ? 'nameEn' : 'name';

        stageTitle.innerText = currentLevel[nameKey] || currentLevel.name || "EL TOUFAN";

        const currentStepIndicator = document.querySelector('.step-indicator');
        if (currentStepIndicator) {
            const depth = navigationStack.length;
            let stepHtml = `<div class="step ${depth === 0 ? 'active' : 'completed'}" onclick="window.resetApp()" style="cursor:pointer;">${t.start}</div>`;

            // Skip the first item if it's the store root to avoid redundancy with "Start"
            navigationStack.forEach((nav, idx) => {
                if (idx === 0) return;
                const navName = nav[nameKey] || nav.name;
                stepHtml += `<div class="step-line active"></div>`;
                stepHtml += `<div class="step completed" onclick="window.jumpToStep(${idx})" style="cursor:pointer;">${navName}</div>`;
            });

            if (depth > 0) {
                stepHtml += `<div class="step-line active"></div>`;
                stepHtml += `<div class="step active">${currentLevel[nameKey] || currentLevel.name}</div>`;
            }
            currentStepIndicator.innerHTML = stepHtml;
        }

        // Sibling Quick Nav removed as requested

        optionsGrid.innerHTML = '';

        // Sub-Categories
        if (currentLevel.options && currentLevel.options.length > 0) {
            currentLevel.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.innerText = opt[nameKey] || opt.name;
                btn.onclick = () => selectOption(opt);
                optionsGrid.appendChild(btn);
            });
        }

        // Products - LAZY LOADING
        if (currentLevel.id) {
            if (!productCache[currentLevel.id]) {
                const searchWrapper = document.getElementById('search-bar-wrapper');
                if (searchWrapper) searchWrapper.classList.add('hidden'); // Hide search while loading

                // Show a loading indicator
                const loader = document.createElement('div');
                loader.style.cssText = 'text-align:center; padding:3rem; grid-column:1/-1; color:var(--accent);';
                loader.innerHTML = `<div class="custom-loader" style="width:40px; height:40px; border:3px solid #222; border-top-color:var(--accent); border-radius:50%; margin:0 auto 1rem auto; animation: spin 0.8s linear infinite;"></div><div style="font-weight:700; font-size:0.9rem;">${currentLang === 'ar' ? 'جاري تحميل المنتجات...' : 'Loading products...'}</div>`;
                optionsGrid.appendChild(loader);

                try {
                    const snap = await db.collection('products').where('categoryId', '==', currentLevel.id).get();
                    productCache[currentLevel.id] = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                } catch (e) {
                    console.error("Failed to load category products:", e);
                    productCache[currentLevel.id] = [];
                }

                if (loader.parentNode) loader.remove();
            }

            const products = productCache[currentLevel.id] || [];
            if (products.length > 0) {
                products.forEach(p => {
                    if (p.hidden === true) return; // Skip hidden products
                    const card = document.createElement('div');
                    card.className = 'product-card';
                    const pName = p[nameKey] || p.name;
                    const currency = currentLang === 'en' ? ' EGP' : ' ج.م';

                    card.innerHTML = `
                        <div class="product-card-img">
                            <img src="${p.mainImage || 'https://via.placeholder.com/300'}" alt="${pName}" loading="lazy">
                        </div>
                        <div class="product-card-info">
                            <div class="product-card-name">${pName}</div>
                            ${colorBadge}
                            <div class="product-card-price">${p.price}${currency}</div>
                        </div>
                    `;
                    card.onclick = () => window.openProductDetail(p.id);
                    optionsGrid.appendChild(card);
                });
            }
        }

        backBtn.classList.toggle('hidden', navigationStack.length === 0);
        resetBtn.classList.toggle('hidden', navigationStack.length === 0);

        const searchWrapper = document.getElementById('search-bar-wrapper');
        const hasProducts = currentLevel.id && !currentLevel.options?.length;
        if (searchWrapper) searchWrapper.classList.toggle('hidden', !hasProducts);

        allProductCards = Array.from(optionsGrid.querySelectorAll('.product-card'));
        lucide.createIcons();

        // Scroll to top for a fresh view
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    async function selectOption(opt) {
        navigationStack.push(currentLevel);
        currentLevel = opt;
        await renderStage();
    }

    window.goBack = async () => {
        if (navigationStack.length > 0) {
            currentLevel = navigationStack.pop();
            await renderStage();
        }
    };

    window.resetApp = async () => {
        currentLevel = storeTree;
        navigationStack = [];
        await renderStage();
    };

    window.jumpToStep = async (idx) => {
        currentLevel = navigationStack[idx];
        navigationStack = navigationStack.slice(0, idx);
        await renderStage();
    };

    window.switchSibling = async (id) => {
        const parent = navigationStack[navigationStack.length - 1] || storeTree;
        const opt = parent.options.find(o => o.id === id);
        if (opt) {
            currentLevel = opt;
            await renderStage();
        }
    };

    backBtn.onclick = window.goBack;
    resetBtn.onclick = window.resetApp;

    // --- 6. PRODUCT DETAIL ---
    let detailedProd = null;
    let selSize = "";
    let selColor = "";

    window.openProductDetail = async (id) => {
        const t = translations[currentLang];
        const nameKey = currentLang === 'en' ? 'nameEn' : 'name';
        const doc = await db.collection('products').doc(id).get();
        if (!doc.exists) return;
        detailedProd = doc.data();
        if (detailedProd.hidden === true) {
            console.warn("Product is hidden.");
            return;
        }
        currentProductId = doc.id;
        selSize = ""; selColor = "";

        const pName = detailedProd[nameKey] || detailedProd.name;
        const currency = currentLang === 'en' ? ' EGP' : ' ج.م';
        document.getElementById('detail-name').innerText = pName;
        document.getElementById('detail-price').innerHTML = `${detailedProd.price}${currency}`;
        document.getElementById('detail-main-img').src = detailedProd.mainImage;

        const descEl = document.getElementById('detail-description');
        if (descEl) {
            descEl.innerText = detailedProd.description || "";
            descEl.style.display = detailedProd.description ? 'block' : 'none';
        }

        // Update static labels in modal
        const sizesLabel = document.querySelector('.detail-section-title:nth-of-type(1)');
        if (sizesLabel) sizesLabel.innerText = t.sizes;
        const colorsLabel = document.querySelector('.detail-section-title:nth-of-type(2)');
        if (colorsLabel) colorsLabel.innerText = t.colors;
        const addToCartBtn = document.getElementById('add-to-cart-detailed');
        if (addToCartBtn) addToCartBtn.innerText = t.add_to_cart;

        // Render Main Sizes
        const sizeGroup = document.getElementById('detail-sizes');
        const initialSizes = detailedProd.mainSizes || [];
        if (initialSizes.length > 0) {
            sizeGroup.innerHTML = initialSizes.map(s =>
                `<button class="detail-chip" onclick="window.selectSize(this, '${s}')">${s}</button>`
            ).join('');
        } else {
            sizeGroup.innerHTML = `<p style="font-size:0.8rem; color:var(--text-dim);">${t.no_sizes}</p>`;
        }

        const colorGroup = document.getElementById('detail-colors');
        let allColors = [];
        if (detailedProd.mainColor) {
            allColors.push({
                name: detailedProd.mainColor,
                nameEn: detailedProd.mainColorEn || detailedProd.mainColor,
                image: detailedProd.mainImage,
                sizes: detailedProd.mainSizes || [],
                isMain: true
            });
        }
        if (detailedProd.colors) {
            detailedProd.colors.forEach(c => allColors.push({ ...c, isMain: false }));
        }

        if (allColors.length > 0) {
            colorGroup.innerHTML = allColors.map((c, i) => {
                const displayName = currentLang === 'en' ? (c.nameEn || c.name) : c.name;
                return `<button class="detail-chip ${i === 0 ? 'active' : ''}" onclick="window.selectColor(this, '${c.name}', '${c.image}')">${displayName}${c.isMain ? ' ✦' : ''}</button>`;
            }).join('');
            if (allColors[0]) selColor = allColors[0].name;
        } else {
            colorGroup.innerHTML = `<p style="font-size:0.8rem; color:var(--text-dim);">${t.no_colors}</p>`;
        }

        document.getElementById('product-detail-modal').classList.remove('hidden');
        updateWishlistBtnState();

        // جلب الأيقونات للتأكد من ظهورها (X و القلب)
        if (window.lucide) {
            setTimeout(() => lucide.createIcons(), 10);
        }
    };

    window.closeProductModal = () => document.getElementById('product-detail-modal').classList.add('hidden');

    window.selectSize = (btn, s) => {
        document.querySelectorAll('#detail-sizes .detail-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        selSize = s;
    };

    window.selectColor = (btn, cName, img) => {
        document.querySelectorAll('#detail-colors .detail-chip').forEach(c => c.classList.remove('active'));
        btn.classList.add('active');
        selColor = cName;
        selSize = "";
        if (img) document.getElementById('detail-main-img').src = img;

        // Check if this is the main color
        if (detailedProd.mainColor === cName) {
            const sizes = detailedProd.mainSizes || [];
            const sizeGroup = document.getElementById('detail-sizes');
            sizeGroup.innerHTML = sizes.length > 0
                ? sizes.map(s => `<button class="detail-chip" onclick="window.selectSize(this, '${s}')">${s}</button>`).join('')
                : '<p style="font-size:0.8rem; color:var(--text-dim);">لا توجد مقاسات محددة</p>';
            return;
        }

        // Find sizes for variant color
        const variant = (detailedProd.colors || []).find(vc => vc.name === cName);
        const sizes = (variant && variant.sizes && variant.sizes.length > 0) ? variant.sizes : (detailedProd.mainSizes || []);

        const sizeGroup = document.getElementById('detail-sizes');
        if (sizes.length > 0) {
            sizeGroup.innerHTML = sizes.map(s =>
                `<button class="detail-chip" onclick="window.selectSize(this, '${s}')">${s}</button>`
            ).join('');
        } else {
            sizeGroup.innerHTML = '<p style="color:red; font-size:0.8rem;">غير متوفر مقاسات</p>';
        }
    };

    document.getElementById('add-to-cart-detailed').onclick = () => {
        if (!detailedProd) return;

        let availableSizes = [];
        if (selColor) {
            if (detailedProd.mainColor === selColor) {
                availableSizes = detailedProd.mainSizes || [];
            } else {
                const variant = (detailedProd.colors || []).find(c => c.name === selColor);
                availableSizes = (variant && variant.sizes && variant.sizes.length > 0) ? variant.sizes : (detailedProd.mainSizes || []);
            }
        } else {
            availableSizes = detailedProd.mainSizes || [];
        }

        if (availableSizes.length > 0 && !selSize) {
            return alert("يرجى اختيار المقاس أولاً!");
        }

        const colorLabel = selColor ? `(لون: ${selColor})` : '';
        const sizeLabel = selSize ? `(مقاس: ${selSize})` : '';
        const fullTitle = `${detailedProd.name} ${colorLabel} ${sizeLabel}`.trim();

        // Get the image for selected color
        let itemImage = detailedProd.mainImage;
        if (selColor && selColor !== detailedProd.mainColor) {
            const variant = (detailedProd.colors || []).find(c => c.name === selColor);
            if (variant && variant.image) itemImage = variant.image;
        }

        window.addToCart(fullTitle, detailedProd.price, itemImage, detailedProd.sku, currentProductId, selColor, selSize);
        window.closeProductModal();
    };

    // --- 7. CART LOGIC ---
    if (cartTrigger) cartTrigger.onclick = () => window.toggleCart();
    window.toggleCart = () => cartDrawer.classList.toggle('hidden');

    window.addToCart = (name, price, image = '', sku = '', productId = '', color = '', size = '') => {
        // Check if same product+color+size already in cart
        const key = `${productId}|${color}|${size}`;
        const existing = cart.find(i => i.key === key);
        if (existing) {
            existing.qty = (existing.qty || 1) + 1;
        } else {
            cart.push({ name, price: parseFloat(price), image, sku, productId, color, size, key, qty: 1 });
        }
        updateCartUI();
        if (cartDrawer.classList.contains('hidden')) window.toggleCart();
    };

    window.changeQty = (key, delta) => {
        const item = cart.find(i => i.key === key);
        if (!item) return;
        item.qty = (item.qty || 1) + delta;
        if (item.qty <= 0) cart.splice(cart.indexOf(item), 1);
        updateCartUI();
    };

    window.removeFromCart = (key) => {
        const idx = cart.findIndex(i => i.key === key);
        if (idx > -1) cart.splice(idx, 1);
        updateCartUI();
    };

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        cart.forEach((item) => {
            const qty = item.qty || 1;
            subtotal += item.price * qty;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.style.cssText = 'display:flex; align-items:center; gap:10px; padding:12px 0; border-bottom:1px solid #1a1a1a;';
            const colorLine = item.color ? ` <span style="color:#888;font-size:0.78rem;">لون: ${item.color}</span>` : '';
            const sizeLine = item.size ? ` <span style="color:#888;font-size:0.78rem;">مقاس: ${item.size}</span>` : '';
            const skuLine = item.sku ? ` <span style="font-family:monospace;color:#555;font-size:0.72rem;">[${item.sku}]</span>` : '';
            div.innerHTML = `
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:700; font-size:0.92rem;">${item.name}</div>
                    <div style="display:flex;flex-wrap:wrap;gap:6px;margin-top:2px;">${colorLine}${sizeLine}${skuLine}</div>
                    <div style="color:var(--accent); font-size:0.85rem; margin-top:2px;">${(item.price * qty).toFixed(0)} ج.م ${qty > 1 ? `<span style="color:#666;font-size:0.75rem;">(${item.price} × ${qty})</span>` : ''}</div>
                </div>
                <div style="display:flex; align-items:center; gap:6px; flex-shrink:0;">
                    <button onclick="window.changeQty('${item.key}', -1)" style="width:28px;height:28px;border-radius:8px;background:#1a1a1a;border:1px solid #333;color:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">-</button>
                    <span style="font-weight:800;min-width:18px;text-align:center;">${qty}</span>
                    <button onclick="window.changeQty('${item.key}', 1)" style="width:28px;height:28px;border-radius:8px;background:#1a1a1a;border:1px solid #333;color:#fff;cursor:pointer;font-size:1rem;display:flex;align-items:center;justify-content:center;">+</button>
                    <button onclick="window.removeFromCart('${item.key}')" style="width:28px;height:28px;border-radius:8px;background:rgba(255,58,58,0.1);border:none;color:#ff3a3a;cursor:pointer;display:flex;align-items:center;justify-content:center;"><i data-lucide="trash-2" style="width:14px;"></i></button>
                </div>
            `;
            cartItemsContainer.appendChild(div);
        });
        badge.innerText = cart.reduce((s, i) => s + (i.qty || 1), 0);

        // Coupon section
        const couponSection = document.querySelector('.coupon-section');
        if (!couponSection) {
            const cs = document.createElement('div');
            cs.className = 'coupon-section';
            cs.innerHTML = `
                <div class="coupon-row">
                    <input type="text" class="coupon-input" id="coupon-input" placeholder="كود الخصم" />
                    <button class="coupon-apply-btn" onclick="window.applyCoupon()">تطبيق</button>
                </div>
                <div class="coupon-msg" id="coupon-msg"></div>
            `;
            cartItemsContainer.parentNode.insertBefore(cs, cartItemsContainer.nextSibling);
        }

        // Restore coupon input value
        const inp = document.getElementById('coupon-input');
        if (inp && couponCode) inp.value = couponCode;

        // Calculate total with discount
        const discount = couponDiscount > 0
            ? (couponType === 'percent'
                ? Math.round(subtotal * couponDiscount / 100)
                : couponDiscount)
            : 0;
        const finalTotal = Math.max(0, subtotal - discount);
        cartTotalDisplay.innerText = `${finalTotal} ج.م${discount > 0 ? ` (وُفِّر ${discount} ج.م)` : ''}`;
        if (discount > 0) cartTotalDisplay.style.color = '#4caf50';
        else cartTotalDisplay.style.color = '';

        lucide.createIcons();
    }


    // --- 8. ORDER FORM (Customer Info + Governorate) ---
    window.confirmOrder = () => {
        if (cart.length === 0) return alert("السلة فارغة!");

        // Show customer info modal
        showOrderForm();
    };

    function showOrderForm() {
        const t = translations[currentLang];
        const existing = document.getElementById('order-form-modal');
        if (existing) existing.remove();

        const govOptions = EGYPT_GOVERNORATES.map(g =>
            `<option value="${g}">${g}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.id = 'order-form-modal';
        modal.className = 'admin-modal'; // Use existing class for styling
        modal.style.cssText = `position:fixed; inset:0; background:rgba(0,0,0,0.95); backdrop-filter:blur(15px); z-index:99999; display:flex; align-items:center; justify-content:center; padding:1rem; animation: modalPop 0.35s;`;

        const subtotal = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
        const currency = currentLang === 'en' ? ' EGP' : ' ج.م';

        modal.innerHTML = `
            <div style="background:#0f0f0f; border:1px solid #333; border-radius:24px; padding:2rem; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; font-family:'Cairo', sans-serif; color:#fff; direction:${currentLang === 'ar' ? 'rtl' : 'ltr'};">
                <h2 style="font-size:1.8rem; font-weight:900; margin-bottom:0.5rem; color:#d4af37;">📦 ${t.confirm_order}</h2>
                <p style="color:#666; margin-bottom:2rem; font-size:0.9rem;">${currentLang === 'ar' ? 'يرجى ملء البيانات لإتمام طلبك' : 'Please fill details to complete your order'}</p>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">${t.fullname} *</label>
                    <input id="of-name" type="text" placeholder="${t.fullname}" style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px; border-radius:12px;">
                </div>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">${t.phone} *</label>
                    <input id="of-phone" type="tel" placeholder="01XXXXXXXXX" style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px; border-radius:12px; text-align:${currentLang === 'ar' ? 'right' : 'left'};">
                </div>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">${t.phone2}</label>
                    <input id="of-phone2" type="tel" placeholder="01XXXXXXXXX" style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px; border-radius:12px; text-align:${currentLang === 'ar' ? 'right' : 'left'};">
                </div>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">${t.address} *</label>
                    <input id="of-address" type="text" placeholder="${t.address}" style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px; border-radius:12px;">
                </div>

                <div style="margin-bottom:1.5rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">${t.gov} *</label>
                    <select id="of-gov" style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px; border-radius:12px;" onchange="window.updateOrderTotal()">
                        <option value="">${t.choose_gov}</option>
                        ${govOptions}
                    </select>
                </div>

                <div style="margin-bottom:1.5rem;">
                    <label style="display:block; font-weight:700; margin-bottom:1rem; color:#aaa;">${t.payment_method} *</label>
                    <div class="payment-selector" style="display:flex; gap:12px;">
                        <div id="pay-delivery" class="payment-opt active" onclick="window.selectPayment('delivery')" style="flex:1; padding:15px; background:#1a1a1a; border:1px solid #d4af37; border-radius:12px; cursor:pointer; text-align:center; transition:0.3s; display:flex; flex-direction:column; align-items:center; gap:8px; color:#fff;">
                            <i data-lucide="truck"></i>
                            <span style="font-size:0.85rem; font-weight:600;">${t.pay_delivery}</span>
                        </div>
                        <div id="pay-online" class="payment-opt" onclick="window.selectPayment('online')" style="flex:1; padding:15px; background:#1a1a1a; border:1px solid #333; border-radius:12px; cursor:pointer; text-align:center; transition:0.3s; display:flex; flex-direction:column; align-items:center; gap:8px; color:#666;">
                            <i data-lucide="credit-card"></i>
                            <span style="font-size:0.85rem; font-weight:600;">${t.pay_online}</span>
                        </div>
                    </div>
                    <input type="hidden" id="selected-payment" value="delivery">
                </div>

                <div id="of-price-box" style="background:#111; border:1px solid #222; border-radius:16px; padding:1.2rem; margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#aaa;">${t.items}:</span>
                        <span id="of-subtotal" style="font-weight:700;">${subtotal}${currency}</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#aaa;">${t.shipping}:</span>
                        <span id="of-shipping-cost" style="font-weight:700; color:#4caf50;">0${currency}</span>
                    </div>
                    <div style="height:1px; background:#333; margin:10px 0;"></div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-weight:900; font-size:1.1rem;">${t.total}:</span>
                        <span id="of-total" style="font-weight:900; font-size:1.3rem; color:#d4af37;">${subtotal}${currency}</span>
                    </div>
                </div>

                <div style="display:flex; gap:12px;">
                    <button onclick="window.submitOrder()" style="flex:1; background:#25d366; border:none; color:#fff; padding:16px; border-radius:14px; font-weight:900; cursor:pointer;">${t.whatsapp_btn}</button>
                    <button onclick="document.getElementById('order-form-modal').remove()" style="background:#1a1a1a; border:1px solid #333; color:#aaa; padding:16px; border-radius:14px; cursor:pointer;">${t.cancel}</button>
                </div>
            </div>
        `;
        document.body.appendChild(modal);
        window.updateOrderTotal();
    }

    // Store shipping prices for use in form
    window.updateOrderTotal = () => {
        const subtotal = cart.reduce((s, i) => s + i.price, 0);
        const discount = couponDiscount > 0
            ? (couponType === 'percent' ? Math.round(subtotal * couponDiscount / 100) : couponDiscount)
            : 0;
        const discountedSubtotal = Math.max(0, subtotal - discount);

        const govSelect = document.getElementById('of-gov');
        const gov = (govSelect ? govSelect.value : '').trim();

        let shipping = 0;
        if (gov) {
            shipping = getShippingPrice(gov);
            console.log(`[SHIPPING] Gov: "${gov}" | Price: ${shipping}`);
        }

        const total = discountedSubtotal + shipping;

        const subtotalEl = document.getElementById('of-subtotal');
        const shippingEl = document.getElementById('of-shipping-cost');
        const totalEl = document.getElementById('of-total');
        const discountRow = document.getElementById('of-discount-row');
        const discountAmountEl = document.getElementById('of-discount-amount');

        const currency = currentLang === 'en' ? ' EGP' : ' ج.م';
        if (subtotalEl) subtotalEl.innerText = `${subtotal}${currency}`;
        if (shippingEl) {
            shippingEl.innerText = `${shipping}${currency}`;
            shippingEl.style.color = (shipping > 0) ? '#ff9800' : '#4caf50';
        }
        if (totalEl) totalEl.innerText = `${total}${currency}`;

        if (discountRow) discountRow.style.display = (discount > 0) ? 'flex' : 'none';
        if (discountAmountEl) discountAmountEl.innerText = `-${discount} ج.م`;

        const discLabel = document.querySelector('#of-discount-row span:first-child');
        if (discLabel && couponCode) discLabel.innerText = `خصم كوبون (${couponCode}):`;
    };

    window.selectPayment = (method) => {
        const deliveryBtn = document.getElementById('pay-delivery');
        const onlineBtn = document.getElementById('pay-online');
        const input = document.getElementById('selected-payment');

        if (method === 'delivery') {
            deliveryBtn.style.borderColor = '#d4af37';
            deliveryBtn.style.color = '#fff';
            onlineBtn.style.borderColor = '#333';
            onlineBtn.style.color = '#666';
            input.value = 'delivery';
        } else {
            onlineBtn.style.borderColor = '#d4af37';
            onlineBtn.style.color = '#fff';
            deliveryBtn.style.borderColor = '#333';
            deliveryBtn.style.color = '#666';
            input.value = 'online';
        }
    };

    window.submitOrder = async () => {
        const name = document.getElementById('of-name')?.value.trim();
        const phone = document.getElementById('of-phone')?.value.trim();
        const phone2 = document.getElementById('of-phone2')?.value.trim() || '';
        const address = document.getElementById('of-address')?.value.trim();
        const govRaw = document.getElementById('of-gov')?.value || '';
        const govSelection = govRaw.trim();
        const paymentMethod = document.getElementById('selected-payment')?.value || 'delivery';

        if (!name) return alert("❌ يرجى إدخال الاسم!");
        if (!phone) return alert("❌ يرجى إدخال رقم الهاتف!");
        if (!/^[0-9]{10,15}$/.test(phone)) return alert("❌ رقم الهاتف غير صحيح! أدخل أرقاماً فقط (مثال: 01012345678)");
        if (!address) return alert("❌ يرجى إدخال العنوان!");
        if (!govSelection) return alert("❌ يرجى اختيار المحافظة!");

        // Disable the submit button to avoid double submit
        const submitBtn = document.querySelector('#order-form-modal button[onclick="window.submitOrder()"]');
        if (submitBtn) { submitBtn.disabled = true; submitBtn.innerText = '⏳ جاري إرسال الطلب...'; }
        try {
            const t = translations[currentLang];
            const currency = currentLang === 'en' ? ' EGP' : ' ج.م';

            // حساب المجاميع مع الكميات
            const fbSubtotal = cart.reduce((s, i) => s + i.price * (i.qty || 1), 0);
            const fbShipping = getShippingPrice(govSelection);

            // تحسيب الخصم
            let discount = 0;
            if (couponCode && couponDiscount > 0) {
                discount = couponType === 'percent'
                    ? Math.round(fbSubtotal * couponDiscount / 100)
                    : couponDiscount;
            }
            const fbTotal = Math.max(0, fbSubtotal - discount) + fbShipping;

            // تجهيز المنتجات لحفظها
            const itemsForDB = cart.map(i => ({
                name: i.name,
                price: i.price,
                qty: i.qty || 1,
                sku: i.sku || '',
                color: i.color || '',
                size: i.size || '',
                productId: i.productId || '',
                image: i.image || ''
            }));

            const fbItemString = cart.map(i => {
                const qty = i.qty || 1;
                let s = qty > 1 ? `${qty}× ` : '';
                s += i.name;
                if (i.color) s += ` (لون: ${i.color})`;
                if (i.size) s += ` (مقاس: ${i.size})`;
                if (i.sku) s += ` [${i.sku}]`;
                return s;
            }).join(' | ');

            const orderImages = itemsForDB.map(i => i.image).filter(img => img && img.length > 5);

            // حفظ عبر السيرفر (Vercel API) لزيادة الأمان ومنع التلاعب
            const response = await fetch('/api/create-order', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    customer: name,
                    phone: phone,
                    phone2: phone2,
                    address: address,
                    governorate: govSelection,
                    paymentMethod: paymentMethod,
                    cartItems: itemsForDB,
                    couponCode: couponCode || '',
                    customerEmail: auth.currentUser ? auth.currentUser.email :
                        (localStorage.getItem('eltoufan_user') ? JSON.parse(localStorage.getItem('eltoufan_user')).email : null)
                })
            });

            const result = await response.json();
            if (!result.success) throw new Error(result.error || 'Failed to create order');

            const orderId = result.orderId.slice(-6).toUpperCase();
            fbShipping = result.shipping;
            fbTotal = result.total;
            discount = result.discount;

            // ✅ بناء رسالة الواتساب من itemsForDB (يضمن أن qty صحيح دايماً)
            const itemsList = itemsForDB.map(i => {
                const qty = i.qty || 1;
                let line = `${qty}× ${i.name}`;
                if (i.color) line += ` (لون: ${i.color})`;
                if (i.size) line += ` (مقاس: ${i.size})`;
                if (i.sku) line += ` [${i.sku}]`;
                line += ` — ${(i.price * qty).toFixed(0)} ج.م`;
                return line;
            }).join('\n');

            const waText = encodeURIComponent(
                `${t.order_whatsapp_title}\n` +
                `━━━━━━━━━━━━━━━\n` +
                `📦 رقم الطلب: #${orderId}\n` +
                `${t.fullname}: ${name}\n` +
                `${t.phone}: ${phone}\n` +
                (phone2 ? `${t.phone2}: ${phone2}\n` : '') +
                `${t.address}: ${address}\n` +
                `${t.gov}: ${govSelection}\n` +
                `${t.payment_method}: ${paymentMethod === 'online' ? t.pay_online : t.pay_delivery}\n` +
                `━━━━━━━━━━━━━━━\n` +
                `${t.items}:\n${itemsList}\n` +
                `━━━━━━━━━━━━━━━\n` +
                (discount > 0 ? `🎟️ خصم: -${discount} ج.م\n` : '') +
                `🚚 شحن: ${fbShipping} ج.م\n` +
                `✅ ${t.total}: ${fbTotal}${currency}`
            );

            // مسح السلة والإغلاق
            cart = [];
            couponDiscount = 0;
            couponCode = '';
            updateCartUI();
            const modal = document.getElementById('order-form-modal');
            if (modal) modal.remove();
            cartDrawer.classList.add('hidden');

            window.open(`https://wa.me/${WA_NUMBER}?text=${waText}`, '_blank');
            alert(`✅ تم استلام طلبك #${orderId} وبانتظار التأكيد على واتساب! 🎉`);

        } catch (e) {
            console.error('❌ Order submission failed:', e);
            alert(`❌ فشل في إرسال الطلب: ${e.message}`);
            if (submitBtn) { submitBtn.disabled = false; submitBtn.innerText = translations[currentLang]?.whatsapp_btn || 'إرسال'; }
        }
    };

    startIntro();

    // ============================================
    // WISHLIST
    // ============================================
    function saveWishlist() {
        localStorage.setItem('eltoufan_wishlist', JSON.stringify(wishlist));
        const wc = document.getElementById('wishlist-count');
        if (wc) wc.innerText = wishlist.length;
    }

    function updateWishlistBtnState() {
        const btn = document.getElementById('wishlist-toggle-btn');
        if (!btn || !detailedProd || !currentProductId) return;
        const inList = wishlist.some(w => w.id === currentProductId);
        btn.classList.toggle('active', inList);
    }

    window.toggleWishlist = () => {
        if (!detailedProd || !currentProductId) {
            console.error("Wishlist toggle failed: Missing data", { detailedProd, currentProductId });
            return;
        }
        const idx = wishlist.findIndex(w => w.id === currentProductId);
        if (idx > -1) {
            wishlist.splice(idx, 1);
            alert("❌ تم الإزالة من المفضلة");
        } else {
            wishlist.push({
                id: currentProductId,
                name: detailedProd.name,
                price: detailedProd.price,
                image: detailedProd.mainImage || ''
            });
            alert("❤️ تم الإضافة للمفضلة");
        }
        saveWishlist();
        updateWishlistBtnState();
    };

    window.toggleWishlistModal = async () => {
        const modal = document.getElementById('wishlist-modal');
        if (!modal) return;
        const isOpening = modal.classList.contains('hidden');
        modal.classList.toggle('hidden');
        if (isOpening) {
            await renderWishlistModal();
        }
        lucide.createIcons();
    };

    async function renderWishlistModal() {
        const t = translations[currentLang];
        const container = document.getElementById('wishlist-items');
        if (!container) return;

        if (wishlist.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#666; padding:3rem;">${t.wishlist_empty}</p>`;
            return;
        }

        // Show a loader while checking for hidden products
        container.innerHTML = `
            <div style="text-align:center; padding:3rem; color:var(--accent);">
                <div class="loader-spin" style="margin-bottom:1rem;">⏳</div>
                <div>${currentLang === 'ar' ? 'جاري تحديث المفضلة...' : 'Updating wishlist...'}</div>
            </div>`;

        // Verify product visibility and existence
        const ids = wishlist.map(w => w.id);
        const validItems = [];

        try {
            // Firestore 'in' query supports up to 10 items.
            for (let i = 0; i < ids.length; i += 10) {
                const chunk = ids.slice(i, i + 10);
                const snap = await db.collection('products').where(firebase.firestore.FieldPath.documentId(), 'in', chunk).get();

                snap.forEach(doc => {
                    const data = doc.data();
                    if (data.hidden !== true) {
                        const wishItem = wishlist.find(w => w.id === doc.id);
                        if (wishItem) validItems.push(wishItem);
                    }
                });
            }
        } catch (e) {
            console.warn("Wishlist verification error, showing fallback:", e);
            validItems.push(...wishlist);
        }

        if (validItems.length === 0) {
            if (wishlist.length > 0) {
                // Sync the actual list as empty
                wishlist = [];
                saveWishlist();
                container.innerHTML = `<p style="text-align:center; color:#666; padding:3rem;">${currentLang === 'ar' ? 'عذراً، هذه المنتجات لم تعد متوفرة حالياً 🥲' : 'Sorry, these products are no longer available 🥲'}</p>`;
            } else {
                container.innerHTML = `<p style="text-align:center; color:#666; padding:3rem;">${t.wishlist_empty}</p>`;
            }
            return;
        }

        // If some items were filtered out (deleted/hidden in DB), sync the global wishlist
        if (validItems.length !== wishlist.length) {
            wishlist = [...validItems];
            saveWishlist();
        }

        container.innerHTML = validItems.map((item) => `
            <div class="wishlist-item" id="wish-item-${item.id}">
                <img src="${item.image || ''}" alt="${item.name}">
                <div class="wishlist-item-info">
                    <div class="wishlist-item-name">${item.name}</div>
                    <div class="wishlist-item-price">${item.price} ج.م</div>
                </div>
                <button class="wishlist-add-to-cart-btn" onclick="window.openProductDetail('${item.id}'); window.toggleWishlistModal();">🛒 ${t.add_to_cart}</button>
                <button class="wishlist-remove-btn" onclick="window.removeFromWishlist('${item.id}')"><i data-lucide="x" style="width:16px;"></i></button>
            </div>
        `).join('');

        const title = document.querySelector('.wishlist-modal-header h3');
        if (title) title.innerText = currentLang === 'ar' ? 'قائمة المفضلة' : 'My Wishlist';
        lucide.createIcons();
    }

    window.removeFromWishlist = (id) => {
        const idx = wishlist.findIndex(w => w.id === id);
        if (idx > -1) {
            wishlist.splice(idx, 1);
            saveWishlist();
            renderWishlistModal();
        }
    };

    // Init wishlist count
    saveWishlist();

    // ============================================
    // PRODUCT SEARCH
    // ============================================
    window.filterProducts = (query) => {
        const q = query.trim().toLowerCase();
        const cards = optionsGrid.querySelectorAll('.product-card');
        let found = 0;
        cards.forEach(card => {
            const name = card.querySelector('.product-card-name')?.innerText?.toLowerCase() || '';
            const match = !q || name.includes(q);
            card.style.display = match ? '' : 'none';
            if (match) found++;
        });
        // Show no-results message
        let noResult = document.getElementById('search-no-result');
        if (!q || found > 0) {
            if (noResult) noResult.remove();
        } else {
            if (!noResult) {
                noResult = document.createElement('p');
                noResult.id = 'search-no-result';
                noResult.style.cssText = 'text-align:center; color:#666; padding:2rem; grid-column:1/-1;';
                optionsGrid.appendChild(noResult);
            }
            noResult.innerText = `🔍 لا توجد منتجات باسم "${query}"`;
        }
    };

    window.clearSearch = () => {
        const inp = document.getElementById('product-search');
        if (inp) { inp.value = ''; window.filterProducts(''); }
    };

    // ============================================
    // COUPON
    // ============================================
    window.applyCoupon = async () => {
        const btn = document.querySelector('.coupon-apply-btn');
        const inp = document.getElementById('coupon-input');
        const msg = document.getElementById('coupon-msg');
        if (!inp || !msg) return;

        const code = inp.value.trim().toUpperCase();
        if (!code) {
            msg.textContent = '';
            couponDiscount = 0;
            couponCode = '';
            updateCartUI();
            return;
        }

        if (btn) btn.innerText = "⏳...";

        try {
            const snap = await db.collection('coupons').doc(code).get();
            if (snap.exists) {
                const cp = snap.data();

                // Check limit
                if (cp.limit > 0 && (cp.usageCount || 0) >= cp.limit) {
                    msg.textContent = '❌ عذراً، هذا الكوبون استنفد عدد مرات استخدامه المسموحة.';
                    msg.className = 'coupon-msg error';
                    couponDiscount = 0;
                    couponCode = '';
                } else {
                    couponDiscount = cp.value;
                    couponCode = code;
                    couponType = cp.type;

                    const label = cp.type === 'percent' ? `${cp.value}%` : `${cp.value} ج.م`;
                    msg.textContent = `✅ تم تطبيق الخصم (${label})`;
                    msg.className = 'coupon-msg success';
                }
            } else {
                msg.textContent = '❌ كود خصم غير صحيح أو منتهي';
                msg.className = 'coupon-msg error';
                couponDiscount = 0;
                couponCode = '';
            }
        } catch (e) {
            console.error("Coupon Error Details:", e);
            msg.textContent = '❌ خطأ: ' + (e.message.includes('permission') ? 'صلاحيات الوصول (Rules)' : 'خطأ في الاتصال');
            msg.className = 'coupon-msg error';
        }

        if (btn) btn.innerText = "تطبيق";
        updateCartUI();
    };


});

// --- PWA Registration ---
if ("serviceWorker" in navigator) {
    window.addEventListener("load", () => {
        navigator.serviceWorker.register("sw.js").then((reg) => {
            console.log("🌊 EL TOUFAN PWA: Service Worker Registered!", reg.scope);
        }).catch((err) => {
            console.error("🌊 EL TOUFAN PWA: Service Worker Registration Failed:", err);
        });
    });
}

// --- PWA Installation Logic ---
let deferredPrompt;
const installBtnContainer = document.getElementById('install-pwa-container');
const installBtn = document.getElementById('install-pwa-btn');
const iosGuide = document.getElementById('ios-install-guide');

window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent the mini-infobar from appearing on mobile
    e.preventDefault();
    // Stash the event so it can be triggered later.
    deferredPrompt = e;
    // Update UI notify the user they can install the PWA
    if (installBtnContainer) installBtnContainer.classList.remove('hidden');
    if (installBtn) installBtn.classList.remove('hidden');
});

if (installBtn) {
    installBtn.addEventListener('click', async () => {
        // Detect iOS
        const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;

        if (isIOS) {
            // Show iOS specific guide
            if (iosGuide) iosGuide.classList.toggle('hidden');
            return;
        }

        if (!deferredPrompt) {
            // If already installed or prompt logic not ready
            alert("التطبيق مثبت بالفعل أو متصفحك لا يدعم التحميل المباشر. اتبع تعليمات المتصفح.");
            return;
        }

        // Show the install prompt
        deferredPrompt.prompt();
        // Wait for the user to respond to the prompt
        const { outcome } = await deferredPrompt.userChoice;
        console.log(`User response to the install prompt: ${outcome}`);
        // We've used the prompt, and can't use it again, throw it away
        deferredPrompt = null;
        if (installBtnContainer) installBtnContainer.classList.add('hidden');
    });
}

// Logic to show button even if prompt not triggered (for iOS or helpful tip)
window.addEventListener('DOMContentLoaded', () => {
    // If iOS, show the container but hide the install button or change text
    const isIOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    if (isIOS && installBtnContainer) {
        installBtnContainer.classList.remove('hidden');
        if (installBtn) {
            installBtn.innerHTML = '<i data-lucide="info"></i> طريقة تثبيت التطبيق على iPhone';
        }
    }
});

// Confirm installation
window.addEventListener('appinstalled', (evt) => {
    console.log('EL TOUFAN was installed.');
    if (installBtnContainer) installBtnContainer.classList.add('hidden');
});
