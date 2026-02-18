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
        const tl = gsap.timeline();
        tl.to(".intro-main", { duration: 1.5, opacity: 1, y: 0, ease: "power4.out" });
        tl.to(".intro-sub-line", { duration: 1, opacity: 1, delay: 0.5 });
        tl.to(introScreen, {
            duration: 1, opacity: 0, delay: 1, onComplete: () => {
                introScreen.classList.add('hidden');
                initApp();
            }
        });
    }

    async function initApp() {
        mainApp.classList.remove('hidden');
        await syncData();
        await renderStage();
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
                        card.innerHTML = `
                            <div class="product-card-img">
                                <img src="${p.mainImage || 'https://via.placeholder.com/300'}" alt="${p.name}">
                            </div>
                            <div class="product-card-info">
                                <div class="product-card-name">${p.name}</div>
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
        selSize = ""; selColor = "";

        document.getElementById('detail-name').innerText = detailedProd.name;
        document.getElementById('detail-price').innerText = detailedProd.price;
        document.getElementById('detail-main-img').src = detailedProd.mainImage;

        // Colors
        const colorGroup = document.getElementById('detail-colors');
        colorGroup.innerHTML = (detailedProd.colors || []).map(c =>
            `<button class="detail-chip" onclick="window.selectColor(this, '${c.name}', '${c.image}')">${c.name}</button>`
        ).join('');

        // Initially clear sizes until color is picked, or show if only 1 color
        document.getElementById('detail-sizes').innerHTML = '<p style="font-size:0.8rem; color:var(--text-dim);">اختر اللون لرؤية المقاسات المتاحة</p>';

        document.getElementById('product-detail-modal').classList.remove('hidden');
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
        selSize = ""; // Reset size when color changes
        if (img) document.getElementById('detail-main-img').src = img;

        // Find the sizes for THIS color
        const variant = (detailedProd.colors || []).find(vc => vc.name === cName);
        const sizes = variant ? (variant.sizes || []) : [];

        const sizeGroup = document.getElementById('detail-sizes');
        if (sizes.length > 0) {
            sizeGroup.innerHTML = sizes.map(s =>
                `<button class="detail-chip" onclick="window.selectSize(this, '${s}')">${s}</button>`
            ).join('');
        } else {
            sizeGroup.innerHTML = '<p style="color:red; font-size:0.8rem;">غير متوفر مقاسات لهذا اللون</p>';
        }
    };

    document.getElementById('add-to-cart-detailed').onclick = () => {
        if (!detailedProd) return;

        let requiresSizeSelection = false;
        if (detailedProd.colors && detailedProd.colors.length > 0) {
            // If colors exist, check the selected color's sizes
            const selectedVariant = detailedProd.colors.find(c => c.name === selColor);
            if (!selColor) return alert("اختر اللون!");
            if (selectedVariant && selectedVariant.sizes && selectedVariant.sizes.length > 0) {
                requiresSizeSelection = true;
            }
        } else if (detailedProd.sizes && detailedProd.sizes.length > 0) {
            // Fallback to top-level sizes if no colors
            requiresSizeSelection = true;
        }

        if (requiresSizeSelection && !selSize) return alert("اختر المقاس!");

        const fullTitle = `${detailedProd.name} ${selColor ? `(لون: ${selColor})` : ''} ${selSize ? `(مقاس: ${selSize})` : ''}`;
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
        let total = 0;
        cart.forEach((item, index) => {
            total += item.price;
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
        cartTotalDisplay.innerText = `${total} ج.م`;
        lucide.createIcons();
    }

    window.removeFromCart = (idx) => { cart.splice(idx, 1); updateCartUI(); };

    window.confirmOrder = async () => {
        if (cart.length === 0) return alert("السلة فارغة!");
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        const itemsList = cart.map(i => `- ${i.name} (${i.price} ج.م)`).join('%0A');

        try {
            await db.collection('orders').add({
                customer: "عميل اونلاين",
                item: cart.map(i => i.name).join(' | '),
                total: total,
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'new'
            });
            const phone = "201020304050";
            const text = `طلب جديد من الطوفان:%0A${itemsList}%0A%0Aالإجمالي: ${total} ج.م`;
            window.open(`https://wa.me/${phone}?text=${text}`, '_blank');
            cart = []; updateCartUI(); window.toggleCart();
            alert("تم إرسال طلبك!");
        } catch (e) { alert("خطأ: " + e.message); }
    };

    startIntro();
});
