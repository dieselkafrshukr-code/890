document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & DATA ---
    let storeTree = {
        name: "EL TOUFAN",
        options: []
    };

    // Default Fallback Data
    const defaultData = [
        { id: "wholesale", name: "جملة", options: [] },
        { id: "retail", name: "قطاعي", options: [] }
    ];

    // --- 2. STATE MANAGEMENT ---
    let navigationStack = [];
    let currentLevel = storeTree;
    let cart = []; // Real shopping cart array

    // --- 3. DOM ELEMENTS ---
    const cartDrawer = document.getElementById('cart-drawer');
    const cartItemsContainer = document.getElementById('cart-items');
    const cartTrigger = document.querySelector('.cart-trigger');
    const badge = document.querySelector('.badge');
    const cartTotalDisplay = document.getElementById('cart-total');

    const introScreen = document.getElementById('intro-screen');
    const mainApp = document.getElementById('main-app');
    const optionsGrid = document.getElementById('options-grid');
    const stageTitle = document.getElementById('stage-title');
    const stageDesc = document.getElementById('stage-desc');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-btn');
    const steps = document.querySelectorAll('.step');

    // Cart Logic
    if (cartTrigger) cartTrigger.onclick = () => window.toggleCart();

    window.toggleCart = () => {
        cartDrawer.classList.toggle('hidden');
    };

    window.addToCart = (name, price) => {
        cart.push({ name, price: parseFloat(price) });
        updateCartUI();
        alert(`تم إضافة ${name} إلى السلة`);
    };

    function updateCartUI() {
        if (badge) badge.innerText = cart.length;
        if (cart.length === 0) {
            cartItemsContainer.innerHTML = '<p style="text-align:center; color:var(--text-dim); padding:2rem;">السلة فارغة حالياً</p>';
            cartTotalDisplay.innerText = "0 ج.م";
            return;
        }
        let total = 0;
        cartItemsContainer.innerHTML = cart.map((item, idx) => {
            total += item.price;
            return `
                <div class="cart-item">
                    <div>
                        <div style="font-weight:700;">${item.name}</div>
                        <div style="color:var(--accent); font-size:0.9rem;">${item.price} ج.م</div>
                    </div>
                    <button onclick="window.removeFromCart(${idx})" style="background:none; border:none; color:#ff3e3e; cursor:pointer;"><i data-lucide="trash-2"></i></button>
                </div>
            `;
        }).join('');
        cartTotalDisplay.innerText = `${total} ج.م`;
        lucide.createIcons();
    }

    window.removeFromCart = (index) => {
        cart.splice(index, 1);
        updateCartUI();
    };

    window.confirmOrder = async () => {
        if (cart.length === 0) return alert("السلة فارغة!");
        const orderText = cart.map(item => `- ${item.name} (${item.price} ج.م)`).join('\n');
        const total = cart.reduce((sum, item) => sum + item.price, 0);
        try {
            await db.collection('orders').add({
                item: orderText,
                total: total,
                customer: "عميل ويب",
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'new'
            });
        } catch (e) { console.error("Firebase Order Error:", e); }
        const phone = "201020304050";
        const finalMsg = encodeURIComponent(`طلب جديد من EL TOUFAN:\n${orderText}\n\nالإجمالي: ${total} ج.م`);
        window.open(`https://wa.me/${phone}?text=${finalMsg}`, '_blank');
        alert("تم إرسال طلبك وتسجيله بنجاح!");
        cart = [];
        updateCartUI();
        window.toggleCart();
    };

    const typeText = async (element, text, speed = 100) => {
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    };

    const startIntro = async () => {
        const mainTitle = document.querySelector('.intro-main');
        mainTitle.textContent = "";
        await typeText(mainTitle, "EL TOUFAN", 60);
        await new Promise(resolve => setTimeout(resolve, 600));

        introScreen.style.transition = 'opacity 0.6s ease';
        introScreen.classList.add('hidden');

        setTimeout(async () => {
            introScreen.style.display = 'none';
            mainApp.classList.remove('hidden');
            await initFirebaseData();
            renderStage();
            lucide.createIcons();
        }, 600);
    };

    async function initFirebaseData() {
        // Set a timeout of 2 seconds for Firebase, so the site doesn't "hang"
        const timeoutPromise = new Promise(resolve => setTimeout(resolve, 2000));

        try {
            const fetchPromise = db.collection('settings').doc('storeTree').get();
            const snap = await Promise.race([fetchPromise, timeoutPromise]);

            if (snap && snap.exists) {
                storeTree = snap.data();
                currentLevel = storeTree;
                navigationStack = [storeTree];
                console.log("Firebase Data Loaded");
            } else {
                useDefaultData();
            }
        } catch (e) {
            console.error("Firebase Error or Timeout, using local data.");
            useDefaultData();
        }
    }

    function useDefaultData() {
        storeTree.options = defaultData;
        currentLevel = storeTree;
        navigationStack = [storeTree];
    }

    // --- 4. RENDER LOGIC ---
    async function renderStage() {
        stageTitle.innerText = currentLevel.name || "EL TOUFAN";
        stageDesc.innerText = currentLevel.desc || "اختر من الخيارات المتاحة";

        const levelIdx = navigationStack.length;
        steps.forEach((s, i) => {
            s.classList.toggle('active', i + 1 <= levelIdx);
        });

        optionsGrid.innerHTML = '';

        // 1. Render Sub-Categories if any
        if (currentLevel.options && currentLevel.options.length > 0) {
            currentLevel.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.innerText = opt.name;
                btn.onclick = () => selectOption(opt);
                optionsGrid.appendChild(btn);
            });
        }

        // 2. Render Products for this leaf category (or any level)
        if (currentLevel.id) {
            try {
                const prodSnap = await db.collection('products').where('categoryId', '==', currentLevel.id).get();
                if (!prodSnap.empty) {
                    const header = document.createElement('div');
                    header.style.width = '100%';
                    header.style.marginTop = '2rem';
                    header.innerHTML = `<p style="color:var(--accent); font-weight:900;">المنتجات المتاحة في ${currentLevel.name}:</p>`;
                    optionsGrid.appendChild(header);

                    prodSnap.forEach(doc => {
                        const p = doc.data();
                        const btn = document.createElement('button');
                        btn.className = 'opt-btn active';
                        btn.style.margin = '5px';
                        btn.innerHTML = `+ ${p.name} - <span style="color:#fff">${p.price} ج.م</span>`;
                        btn.onclick = () => window.addToCart(p.name, p.price);
                        optionsGrid.appendChild(btn);
                    });
                }
            } catch (e) {
                console.error("Error fetching products:", e);
            }
        }

        // 3. Fallback message if totally empty
        if ((!currentLevel.options || currentLevel.options.length === 0) && currentLevel.name !== "EL TOUFAN") {
            const prodSnapCheck = await db.collection('products').where('categoryId', '==', currentLevel.id).get();
            if (prodSnapCheck.empty) {
                optionsGrid.innerHTML += `<p style="color:var(--text-dim); width:100%; margin-top:20px;">لا توجد منتجات حالياً في هذا القسم.</p>`;
            }
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

    startIntro();
});
