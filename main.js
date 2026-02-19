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
    window.CURRENT_SHIPPING_PRICES = shippingPrices; // External access for debug
    let wishlist = JSON.parse(localStorage.getItem('eltoufan_wishlist') || '[]');
    let couponDiscount = 0;
    let couponCode = '';
    let couponType = 'percent'; // Default
    let allProductCards = []; // For search
    let currentProductId = null; // For rating


    // WhatsApp Number
    const WA_NUMBER = "201020451206";

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
    const steps = document.querySelectorAll('.step');
    const themeToggle = document.getElementById('theme-toggle');

    // --- Theme Logic ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
        if (themeToggle) themeToggle.innerHTML = '<i data-lucide="moon"></i>';
    }

    if (themeToggle) {
        themeToggle.onclick = () => {
            const isLight = document.body.classList.toggle('light-mode');
            localStorage.setItem('theme', isLight ? 'light' : 'dark');
            themeToggle.innerHTML = isLight ? '<i data-lucide="moon"></i>' : '<i data-lucide="sun"></i>';
            lucide.createIcons();
        };
    }

    // --- 4. INITIALIZATION ---
    async function startIntro() {
        if (!introScreen) return initApp();

        // Fast, dynamic intro animation
        const introMain = document.querySelector('.intro-main');
        const introSub = document.querySelector('.intro-sub-line');

        if (introMain) {
            introMain.style.opacity = '0';
            introMain.style.transform = 'translateY(40px) scale(0.8)';
            introMain.style.transition = 'none';
        }
        if (introSub) {
            introSub.style.opacity = '0';
        }

        requestAnimationFrame(() => {
            setTimeout(() => {
                if (introMain) {
                    introMain.style.transition = 'opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1)';
                    introMain.style.opacity = '1';
                    introMain.style.transform = 'translateY(0) scale(1)';
                }
                setTimeout(() => {
                    if (introSub) {
                        introSub.style.transition = 'opacity 0.4s ease';
                        introSub.style.opacity = '1';
                    }
                    setTimeout(() => {
                        introScreen.style.transition = 'opacity 0.4s ease, transform 0.4s ease';
                        introScreen.style.opacity = '0';
                        introScreen.style.transform = 'scale(1.05)';
                        setTimeout(() => {
                            introScreen.classList.add('hidden');
                            initApp();
                        }, 400);
                    }, 700);
                }, 500);
            }, 50);
        });
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
        console.log("🚛 Step 1: Loading baseline from shipping-config.js...");

        // Load file prices as baseline
        if (window.LOCAL_SHIPPING_PRICES) {
            Object.keys(window.LOCAL_SHIPPING_PRICES).forEach(g => {
                shippingPrices[g.trim()] = parseFloat(window.LOCAL_SHIPPING_PRICES[g]) || 0;
            });
        }

        // 2. Sync with Firestore (The MASTER source)
        try {
            const snap = await db.collection('settings').doc('governoratesPricing').get();
            if (snap.exists) {
                const firebasePrices = snap.data().prices || {};
                const keys = Object.keys(firebasePrices);

                if (keys.length > 0) {
                    keys.forEach(k => {
                        const val = parseFloat(firebasePrices[k]);
                        if (!isNaN(val)) shippingPrices[k.trim()] = val;
                    });
                    console.log('✅ Final Shipping Data (Synced from Cloud):');
                    console.table(shippingPrices);
                }
            }
        } catch (e) {
            console.warn('ℹ️ Remote sync failed, using local fallback.', e);
        }

        window.CURRENT_SHIPPING_PRICES = shippingPrices;
    }

    async function syncData() {
        try {
            const snap = await db.collection('settings').doc('storeTree').get();
            if (snap.exists) {
                storeTree = snap.data();
                currentLevel = storeTree;
                navigationStack = [storeTree];
            } else {
                useDefaultData();
            }
        } catch (e) { useDefaultData(); }
    }

    function useDefaultData() {
        storeTree.options = defaultData;
        currentLevel = storeTree;
        navigationStack = [storeTree];
    }

    // --- 5. RENDER LOGIC ---
    async function renderStage() {
        stageTitle.innerText = currentLevel.name || "EL TOUFAN";

        const levelIdx = navigationStack.length;
        steps.forEach((s, i) => s.classList.toggle('active', i + 1 <= levelIdx));
        optionsGrid.innerHTML = '';

        // Sub-Categories
        if (currentLevel.options && currentLevel.options.length > 0) {
            currentLevel.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.innerText = opt.name;
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
                        const colorBadge = p.mainColor
                            ? `<div class="product-color-badge">🎨 ${p.mainColor}</div>`
                            : '';
                        card.innerHTML = `
                            <div class="product-card-img">
                                <img src="${p.mainImage || 'https://via.placeholder.com/300'}" alt="${p.name}">
                            </div>
                            <div class="product-card-info">
                                <div class="product-card-name">${p.name}</div>
                                ${colorBadge}
                                <div class="product-card-price">${p.price} ج.م</div>
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

        // Show/hide search bar when on product level
        const searchWrapper = document.getElementById('search-bar-wrapper');
        const hasProducts = currentLevel.id && !currentLevel.options?.length;
        if (searchWrapper) {
            if (hasProducts) {
                searchWrapper.classList.remove('hidden');
            } else {
                searchWrapper.classList.add('hidden');
            }
        }

        // Store all product cards for search filtering
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
            navigationStack.pop();
            currentLevel = navigationStack[navigationStack.length - 1];
            await renderStage();
        }
    };

    window.resetApp = async () => {
        currentLevel = storeTree;
        navigationStack = [storeTree];
        await renderStage();
    };

    backBtn.onclick = window.goBack;
    resetBtn.onclick = window.resetApp;

    // --- 6. PRODUCT DETAIL ---
    let detailedProd = null;
    let selSize = "";
    let selColor = "";

    window.openProductDetail = async (id) => {
        const doc = await db.collection('products').doc(id).get();
        if (!doc.exists) return;
        detailedProd = doc.data();
        currentProductId = doc.id;
        selSize = ""; selColor = "";

        document.getElementById('detail-name').innerText = detailedProd.name;
        document.getElementById('detail-price').innerText = detailedProd.price;
        document.getElementById('detail-main-img').src = detailedProd.mainImage;

        // Render Main Sizes by default
        const sizeGroup = document.getElementById('detail-sizes');
        const initialSizes = detailedProd.mainSizes || [];
        if (initialSizes.length > 0) {
            sizeGroup.innerHTML = initialSizes.map(s =>
                `<button class="detail-chip" onclick="window.selectSize(this, '${s}')">${s}</button>`
            ).join('');
        } else {
            sizeGroup.innerHTML = '<p style="font-size:0.8rem; color:var(--text-dim);">لا توجد مقاسات محددة</p>';
        }

        // Colors: show main color first + additional variants
        const colorGroup = document.getElementById('detail-colors');
        let allColors = [];

        // Add main color as first chip
        if (detailedProd.mainColor) {
            allColors.push({ name: detailedProd.mainColor, image: detailedProd.mainImage, sizes: detailedProd.mainSizes || [], isMain: true });
        }
        // Add additional color variants
        if (detailedProd.colors && detailedProd.colors.length > 0) {
            detailedProd.colors.forEach(c => allColors.push({ ...c, isMain: false }));
        }

        if (allColors.length > 0) {
            colorGroup.innerHTML = allColors.map((c, i) =>
                `<button class="detail-chip ${i === 0 ? 'active' : ''}" onclick="window.selectColor(this, '${c.name}', '${c.image}')">${c.name}${c.isMain ? ' ✦' : ''}</button>`
            ).join('');
            // Pre-select first color
            if (allColors[0]) {
                selColor = allColors[0].name;
            }
        } else {
            colorGroup.innerHTML = '<p style="font-size:0.8rem; color:var(--text-dim);">لا توجد ألوان إضافية</p>';
        }

        document.getElementById('product-detail-modal').classList.remove('hidden');
        updateWishlistBtnState();
        await loadProductRating(doc.id);
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
        window.addToCart(fullTitle, detailedProd.price);
        window.closeProductModal();
    };

    // --- 7. CART LOGIC ---
    if (cartTrigger) cartTrigger.onclick = () => window.toggleCart();
    window.toggleCart = () => cartDrawer.classList.toggle('hidden');

    window.addToCart = (name, price) => {
        cart.push({ name, price: parseFloat(price) });
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
        // Remove existing modal if any
        const existing = document.getElementById('order-form-modal');
        if (existing) existing.remove();

        const govOptions = EGYPT_GOVERNORATES.map(g =>
            `<option value="${g}">${g}</option>`
        ).join('');

        const modal = document.createElement('div');
        modal.id = 'order-form-modal';
        modal.style.cssText = `
            position:fixed; inset:0; background:rgba(0,0,0,0.95);
            backdrop-filter:blur(15px); z-index:99999;
            display:flex; align-items:center; justify-content:center;
            padding:1rem; animation: modalPop 0.35s cubic-bezier(0.175,0.885,0.32,1.275);
        `;

        const subtotal = cart.reduce((s, i) => s + i.price, 0);

        modal.innerHTML = `
            <div style="
                background:#0f0f0f; border:1px solid #333; border-radius:24px;
                padding:2.5rem; width:100%; max-width:500px; max-height:90vh; overflow-y:auto;
                font-family:'Cairo', sans-serif; color:#fff; direction:rtl;
            ">
                <h2 style="font-size:1.8rem; font-weight:900; margin-bottom:0.5rem; color:#d4af37;">📦 إتمام الطلب</h2>
                <p style="color:#666; margin-bottom:2rem; font-size:0.9rem;">يرجى ملء البيانات لإتمام طلبك</p>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">الاسم الكامل *</label>
                    <input id="of-name" type="text" placeholder="اسمك الكامل"
                        style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px 16px; border-radius:12px; font-size:1rem; font-family:'Cairo',sans-serif;">
                </div>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">رقم الهاتف *</label>
                    <input id="of-phone" type="tel" placeholder="01XXXXXXXXX" dir="ltr"
                        style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px 16px; border-radius:12px; font-size:1rem; text-align:right; font-family:'Cairo',sans-serif;">
                </div>

                <div style="margin-bottom:1.2rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">العنوان التفصيلي *</label>
                    <input id="of-address" type="text" placeholder="الشارع، الحي، رقم المبنى..."
                        style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px 16px; border-radius:12px; font-size:1rem; font-family:'Cairo',sans-serif;">
                </div>

                <div style="margin-bottom:1.5rem;">
                    <label style="display:block; font-weight:700; margin-bottom:0.5rem; color:#aaa;">المحافظة *</label>
                    <select id="of-gov"
                        style="width:100%; background:#1a1a1a; border:1px solid #333; color:#fff; padding:14px 16px; border-radius:12px; font-size:1rem; font-family:'Cairo',sans-serif; cursor:pointer;"
                        onchange="window.updateOrderTotal()">
                        <option value="">-- اختر المحافظة --</option>
                        ${govOptions}
                    </select>
                </div>

                <!-- Price Breakdown -->
                <div id="of-price-box" style="background:#111; border:1px solid #222; border-radius:16px; padding:1.2rem; margin-bottom:1.5rem;">
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#aaa;">المنتجات:</span>
                        <span id="of-subtotal" style="font-weight:700;">${subtotal} ج.م</span>
                    </div>
                    <div id="of-discount-row" style="display:none; justify-content:space-between; margin-bottom:8px; color:#4caf50;">
                        <span>خصم كوبون:</span>
                        <span id="of-discount-amount" style="font-weight:700;">0 ج.م</span>
                    </div>
                    <div style="display:flex; justify-content:space-between; margin-bottom:8px;">
                        <span style="color:#aaa;">الشحن:</span>
                        <span id="of-shipping-cost" style="font-weight:700; color:#4caf50;">0 ج.م</span>
                    </div>
                    <div style="height:1px; background:#333; margin:10px 0;"></div>
                    <div style="display:flex; justify-content:space-between;">
                        <span style="font-weight:900; font-size:1.1rem;">الإجمالي:</span>
                        <span id="of-total" style="font-weight:900; font-size:1.3rem; color:#d4af37;">${subtotal} ج.م</span>
                    </div>
                </div>

                <div style="display:flex; gap:12px;">
                    <button onclick="window.submitOrder()" style="
                        flex:1; background:#25d366; border:none; color:#fff; padding:16px;
                        border-radius:14px; font-size:1.1rem; font-weight:900; cursor:pointer;
                        font-family:'Cairo',sans-serif; display:flex; align-items:center; justify-content:center; gap:8px;
                    ">📲 أرسل عبر واتساب</button>
                    <button onclick="document.getElementById('order-form-modal').remove()" style="
                        background:#1a1a1a; border:1px solid #333; color:#aaa; padding:16px 20px;
                        border-radius:14px; font-size:1rem; cursor:pointer; font-family:'Cairo',sans-serif;
                    ">إلغاء</button>
                </div>
            </div>
        `;

        document.body.appendChild(modal);
        window.updateOrderTotal(); // Initial calculation
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
            // Priority 1: Exact Match
            if (shippingPrices[gov] !== undefined) {
                shipping = shippingPrices[gov];
            } else {
                // Priority 2: Trimmed match
                const match = Object.keys(shippingPrices).find(k => k.trim() === gov);
                if (match) shipping = shippingPrices[match];
            }
            console.log(`[SHIPPING] Gov: "${gov}" | Price: ${shipping} | Source:`, shippingPrices);
        }

        const total = discountedSubtotal + shipping;

        const subtotalEl = document.getElementById('of-subtotal');
        const shippingEl = document.getElementById('of-shipping-cost');
        const totalEl = document.getElementById('of-total');
        const discountRow = document.getElementById('of-discount-row');
        const discountAmountEl = document.getElementById('of-discount-amount');

        if (subtotalEl) subtotalEl.innerText = `${subtotal} ج.م`;
        if (shippingEl) {
            shippingEl.innerText = `${shipping} ج.م`;
            shippingEl.style.color = (shipping > 0) ? '#ff9800' : '#4caf50';
        }
        if (totalEl) totalEl.innerText = `${total} ج.م`;

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

        const shipping = (govSelection && shippingPrices[govSelection] !== undefined) ? shippingPrices[govSelection] : 0;
        const finalTotal = discountedTotal + shipping;

        const itemsList = cart.map(i => `• ${i.name} (${i.price} ج.م)`).join('\n');

        const waText = encodeURIComponent(
            `🛖 طلب جديد - EL TOUFAN\n` +
            `━━━━━━━━━━━━━━━\n` +
            `👤 الاسم: ${name}\n` +
            `📱 التليفون: ${phone}\n` +
            `📍 العنوان: ${address}\n` +
            `🗺️ المحافظة: ${govSelection}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `🛒 المنتجات:\n${itemsList}\n` +
            `━━━━━━━━━━━━━━━\n` +
            `💰 المنتجات: ${subtotal} ج.م\n` +
            (discount > 0 ? `🏷️ خصم (${couponCode}): -${discount} ج.م\n` : '') +
            `🚚 الشحن (${govSelection}): ${shipping} ج.م\n` +
            `✅ الإجمالي: ${finalTotal} ج.م`
        );

        try {
            await db.collection('orders').add({
                customer: name,
                phone: phone,
                address: address,
                governorate: govSelection,
                item: cart.map(i => i.name).join(' | '),
                total: finalTotal,
                shipping: shipping,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'new'
            });
        } catch (e) { console.warn("Could not save to Firestore:", e.message); }

        window.open(`https://wa.me/${WA_NUMBER}?text=${waText}`, '_blank');

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
        const container = document.getElementById('wishlist-items');
        if (!container) return;
        if (wishlist.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:#666; padding:3rem;">قائمة المفضلة فارغة 🥲</p>';
            return;
        }
        container.innerHTML = wishlist.map((item, i) => `
            <div class="wishlist-item">
                <img src="${item.image || ''}" alt="${item.name}">
                <div class="wishlist-item-info">
                    <div class="wishlist-item-name">${item.name}</div>
                    <div class="wishlist-item-price">${item.price} ج.م</div>
                </div>
                <button class="wishlist-add-to-cart-btn" onclick="window.addToCart('${item.name.replace(/'/g, '\\&apos;')}', ${item.price}); window.toggleWishlistModal();">🛒 سلة</button>
                <button class="wishlist-remove-btn" onclick="window.removeFromWishlist(${i})"><i data-lucide="x" style="width:16px;"></i></button>
            </div>
        `).join('');
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
                couponDiscount = cp.value;
                couponCode = code;
                couponType = cp.type;

                const label = cp.type === 'percent' ? `${cp.value}%` : `${cp.value} ج.م`;
                msg.textContent = `✅ تم تطبيق الخصم (${label})`;
                msg.className = 'coupon-msg success';
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

    // ============================================
    // STAR RATING
    // ============================================
    async function loadProductRating(productId) {
        try {
            const snap = await db.collection('ratings').doc(productId).get();
            const starsDisplay = document.getElementById('stars-display');
            const ratingCount = document.getElementById('rating-count');
            if (snap.exists) {
                const data = snap.data();
                const avg = data.total / data.count;
                const rounded = Math.round(avg);
                if (starsDisplay) starsDisplay.innerText = '★'.repeat(rounded) + '☆'.repeat(5 - rounded);
                if (ratingCount) ratingCount.innerText = `${data.count} تقييم (متوسط ${avg.toFixed(1)})`;
            } else {
                if (starsDisplay) starsDisplay.innerText = '☆☆☆☆☆';
                if (ratingCount) ratingCount.innerText = 'لا توجد تقييمات بعد';
            }
        } catch (e) { console.warn('Rating load error:', e); }
    }

    window.rateProduct = async (stars) => {
        if (!currentProductId) return;
        // Highlight selected stars
        document.querySelectorAll('.star-btn').forEach((btn, i) => {
            btn.classList.toggle('active', i < stars);
        });
        try {
            const ref = db.collection('ratings').doc(currentProductId);
            await db.runTransaction(async tx => {
                const snap = await tx.get(ref);
                if (snap.exists) {
                    tx.update(ref, {
                        total: firebase.firestore.FieldValue.increment(stars),
                        count: firebase.firestore.FieldValue.increment(1)
                    });
                } else {
                    tx.set(ref, { total: stars, count: 1 });
                }
            });
            setTimeout(() => loadProductRating(currentProductId), 500);
        } catch (e) { console.warn('Rating error:', e); }
    };

});
