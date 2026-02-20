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
            phone: "رقم الهاتف",
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
            select_category: "اختر القسم أولاً"
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
            phone: "Phone Number",
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
            select_category: "Select category first"
        }
    };


    // WhatsApp Numbers
    const WA_NUMBER = "201020451206";   // الرقم الأول
    const WA_NUMBER_2 = "201020451206"; // الرقم الثاني - غيّره حسب رغبتك

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

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme') || 'dark';
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<i data-lucide="moon"></i>';
    } else {
        if (themeToggle) themeToggle.innerHTML = '<i data-lucide="sun"></i>';
    }

    if (themeToggle) {
        themeToggle.onclick = () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeToggle.innerHTML = isLight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
            lucide.createIcons();
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

    // --- 4. INITIALIZATION ---
    async function startIntro() {
        if (!introScreen) return initApp();

        // The animations are handled by CSS (logoGlowEntrance and smoothBrandEntrance)
        // We just need to wait 3 seconds before transitioning out

        setTimeout(() => {
            introScreen.style.transition = 'opacity 0.8s ease, filter 0.8s ease';
            introScreen.style.opacity = '0';
            introScreen.style.filter = 'blur(10px)';

            setTimeout(() => {
                introScreen.classList.add('hidden');
                initApp();
            }, 800);
        }, 3000); // 3 seconds stay
    }

    async function initApp() {
        // Show app if it takes more than 3 seconds to load data
        const emergencyShow = setTimeout(() => {
            if (mainApp && mainApp.classList.contains('hidden')) {
                mainApp.classList.remove('hidden');
                mainApp.style.opacity = '1';
                mainApp.style.transform = 'translateY(0)';
            }
        }, 3000);

        try {
            await Promise.all([syncData(), loadShippingPrices()]);
        } catch (e) { console.error("Init failed:", e); }

        clearTimeout(emergencyShow);
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

    async function syncData() {
        try {
            const snap = await db.collection('settings').doc('storeTree').get();
            if (snap.exists) {
                storeTree = snap.data();
                currentLevel = storeTree;
                navigationStack = [];
            } else {
                useDefaultData();
            }
        } catch (e) { useDefaultData(); }
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
            const depth = navigationStack.length + 1;
            let stepHtml = '';
            for (let i = 1; i <= depth; i++) {
                const isLast = (i === depth);
                const className = isLast ? 'step active' : 'step completed';
                stepHtml += `<div class="${className}" data-step="${i}">${i}</div>`;
                if (i < depth) {
                    stepHtml += `<div class="step-line active"></div>`;
                }
            }
            currentStepIndicator.innerHTML = stepHtml;
        }
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

        // Products
        if (currentLevel.id) {
            try {
                const prodSnap = await db.collection('products').where('categoryId', '==', currentLevel.id).get();
                if (!prodSnap.empty) {
                    prodSnap.forEach(doc => {
                        const p = doc.data();
                        const card = document.createElement('div');
                        card.className = 'product-card';
                        const pName = p[nameKey] || p.name;
                        const currency = currentLang === 'en' ? ' EGP' : ' ج.م';
                        const mainColorName = (currentLang === 'en' && p.mainColorEn) ? p.mainColorEn : p.mainColor;
                        const colorBadge = mainColorName
                            ? `<div class="product-color-badge">🎨 ${mainColorName}</div>`
                            : '';
                        card.innerHTML = `
                            <div class="product-card-img">
                                <img src="${p.mainImage || 'https://via.placeholder.com/300'}" alt="${pName}">
                            </div>
                            <div class="product-card-info">
                                <div class="product-card-name">${pName}</div>
                                ${colorBadge}
                                <div class="product-card-price">${p.price}${currency}</div>
                            </div>
                        `;
                        card.onclick = () => window.openProductDetail(doc.id);
                        optionsGrid.appendChild(card);
                    });
                }
            } catch (e) { console.error(e); }
        }

        backBtn.classList.toggle('hidden', navigationStack.length <= 1);
        resetBtn.classList.toggle('hidden', navigationStack.length <= 1);

        const searchWrapper = document.getElementById('search-bar-wrapper');
        const hasProducts = currentLevel.id && !currentLevel.options?.length;
        if (searchWrapper) searchWrapper.classList.toggle('hidden', !hasProducts);

        allProductCards = Array.from(optionsGrid.querySelectorAll('.product-card'));
        lucide.createIcons();
    }

    async function selectOption(opt) {
        navigationStack.push(currentLevel);
        currentLevel = opt;
        await renderStage();
    }

    window.goBack = async () => {
        if (navigationStack.length > 1) {
            currentLevel = navigationStack.pop();
            await renderStage();
        }
    };

    window.resetApp = async () => {
        currentLevel = storeTree;
        navigationStack = [];
        await renderStage();
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
        currentProductId = doc.id;
        selSize = ""; selColor = "";

        const pName = detailedProd[nameKey] || detailedProd.name;
        document.getElementById('detail-name').innerText = pName;
        document.getElementById('detail-price').innerText = detailedProd.price;
        document.getElementById('detail-main-img').src = detailedProd.mainImage;

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
        lucide.createIcons();
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

        window.addToCart(fullTitle, detailedProd.price, itemImage, detailedProd.sku);
        window.closeProductModal();
    };

    // --- 7. CART LOGIC ---
    if (cartTrigger) cartTrigger.onclick = () => window.toggleCart();
    window.toggleCart = () => cartDrawer.classList.toggle('hidden');

    window.addToCart = (name, price, image = '', sku = '') => {
        cart.push({ name, price: parseFloat(price), image, sku });
        updateCartUI();
        if (cartDrawer.classList.contains('hidden')) window.toggleCart();
    };

    function updateCartUI() {
        cartItemsContainer.innerHTML = '';
        let subtotal = 0;
        cart.forEach((item, index) => {
            subtotal += item.price;
            const div = document.createElement('div');
            div.className = 'cart-item';
            div.innerHTML = `
                <div>
                    <div style="font-weight:700;">${item.name}</div>
                    <div style="color:var(--accent); font-size:0.8rem;">${item.price} ج.م</div>
                </div>
                <button onclick="window.removeFromCart(${index})" style="background:none; border:none; color:#ff3a3a; cursor:pointer;"><i data-lucide="trash-2" style="width:16px;"></i></button>
            `;
            cartItemsContainer.appendChild(div);
        });
        badge.innerText = cart.length;

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

    window.removeFromCart = (idx) => { cart.splice(idx, 1); updateCartUI(); };

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

        const subtotal = cart.reduce((s, i) => s + i.price, 0);
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

    window.submitOrder = async () => {
        const name = document.getElementById('of-name').value.trim();
        const phone = document.getElementById('of-phone').value.trim();
        const address = document.getElementById('of-address').value.trim();
        const govRaw = document.getElementById('of-gov').value || '';
        const govSelection = govRaw.trim();

        if (!name) return alert("❌ يرجى إدخال الاسم!");
        if (!phone) return alert("❌ يرجى إدخال رقم الهاتف!");
        if (!address) return alert("❌ يرجى إدخال العنوان!");
        if (!govSelection) return alert("❌ يرجى اختيار المحافظة!");

        const subtotal = cart.reduce((s, i) => s + i.price, 0);
        const discount = (couponDiscount > 0)
            ? (couponType === 'percent' ? Math.round(subtotal * couponDiscount / 100) : couponDiscount)
            : 0;
        const discountedTotal = Math.max(0, subtotal - discount);

        const shipping = getShippingPrice(govSelection);
        const finalTotal = discountedTotal + shipping;

        const itemsList = cart.map(i => `• ${i.name} (${i.price} ج.م)`).join('\n');

        const t = translations[currentLang];
        const currency = currentLang === 'en' ? ' EGP' : ' ج.م';
        const waText = encodeURIComponent(
            `${t.order_whatsapp_title}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `${t.fullname}: ${name}\n` +
            `${t.phone}: ${phone}\n` +
            `${t.address}: ${address}\n` +
            `${t.gov}: ${govSelection}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `${t.items}:\n${itemsList}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `${t.items}: ${subtotal}${currency}\n` +
            (discount > 0 ? `🏷️ Discount (${couponCode}): -${discount}${currency}\n` : '') +
            `${t.shipping} (${govSelection}): ${shipping}${currency}\n` +
            `✅ ${t.total}: ${finalTotal}${currency}`
        );

        try {
            // Collect product images for display in admin
            const orderImages = cart.map(i => i.image).filter(img => img && img.length > 10).slice(0, 5);

            await db.collection('orders').add({
                customer: name,
                phone: phone,
                address: address,
                governorate: govSelection,
                item: cart.map(i => {
                    const skuTag = i.sku ? ` [‪${i.sku}‬]` : '';
                    return `${i.name}${skuTag}`;
                }).join(' | '),
                images: orderImages,
                total: finalTotal,
                shipping: shipping,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'new'
            });

            // Increment coupon usage if applied
            if (couponCode) {
                try {
                    await db.collection('coupons').doc(couponCode).update({
                        usageCount: firebase.firestore.FieldValue.increment(1)
                    });
                } catch (e) { console.warn("Could not increment coupon count:", e.message); }
            }
        } catch (e) { console.warn("Could not save to Firestore:", e.message); }

        // إرسال للرقم الأول
        window.open(`https://wa.me/${WA_NUMBER}?text=${waText}`, '_blank');
        // إرسال للرقم الثاني (بعد ثانية عشان المتصفح مايبلوكوش)
        if (WA_NUMBER_2 && WA_NUMBER_2 !== WA_NUMBER) {
            setTimeout(() => {
                window.open(`https://wa.me/${WA_NUMBER_2}?text=${waText}`, '_blank');
            }, 1000);
        }

        cart = [];
        updateCartUI();
        const modal = document.getElementById('order-form-modal');
        if (modal) modal.remove();
        cartDrawer.classList.add('hidden');
        alert("✅ تم إرسال طلبك! شكراً لك 🎉");
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

    window.toggleWishlistModal = () => {
        const modal = document.getElementById('wishlist-modal');
        if (!modal) return;
        modal.classList.toggle('hidden');
        renderWishlistModal();
        lucide.createIcons();
    };

    function renderWishlistModal() {
        const t = translations[currentLang];
        const container = document.getElementById('wishlist-items');
        if (!container) return;
        if (wishlist.length === 0) {
            container.innerHTML = `<p style="text-align:center; color:#666; padding:3rem;">${t.wishlist_empty}</p>`;
            return;
        }
        container.innerHTML = wishlist.map((item, i) => `
            <div class="wishlist-item">
                <img src="${item.image || ''}" alt="${item.name}">
                <div class="wishlist-item-info">
                    <div class="wishlist-item-name">${item.name}</div>
                    <div class="wishlist-item-price">${item.price} ج.م</div>
                </div>
                <button class="wishlist-add-to-cart-btn" onclick="window.addToCart('${item.name.replace(/'/g, '\\&apos;')}', ${item.price}); window.toggleWishlistModal();">🛒 ${t.add_to_cart}</button>
                <button class="wishlist-remove-btn" onclick="window.removeFromWishlist(${i})"><i data-lucide="x" style="width:16px;"></i></button>
            </div>
        `).join('');
        const title = document.querySelector('.wishlist-modal-header h3');
        if (title) title.innerText = currentLang === 'ar' ? 'المفضلة' : 'Wishlist';
        lucide.createIcons();
    }

    window.removeFromWishlist = (idx) => {
        wishlist.splice(idx, 1);
        saveWishlist();
        renderWishlistModal();
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
// Updated
