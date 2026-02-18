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
    let cartCount = 0;

    // --- 3. DOM ELEMENTS ---
    const introScreen = document.getElementById('intro-screen');
    const mainApp = document.getElementById('main-app');
    const optionsGrid = document.getElementById('options-grid');
    const stageTitle = document.getElementById('stage-title');
    const stageDesc = document.getElementById('stage-desc');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-btn');
    const steps = document.querySelectorAll('.step');

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
                        btn.innerHTML = `${p.name} - <span style="color:#fff">${p.price} ج.م</span>`;
                        btn.onclick = () => sendOrder(`${p.name} (${p.price} ج.م) من قسم ${currentLevel.name}`);
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

    async function sendOrder(itemName) {
        // 1. Save to Firebase
        try {
            await db.collection('orders').add({
                item: itemName,
                customer: "عميل ويب",
                timestamp: firebase.firestore.FieldValue.serverTimestamp(),
                status: 'new'
            });
        } catch (e) {
            console.error("Firebase Order Error:", e);
        }

        // 2. WhatsApp
        const phone = "20123456789"; // Replace with your number
        const text = encodeURIComponent(`طلب جديد من EL TOUFAN: ${itemName}`);
        window.open(`https://wa.me/${phone}?text=${text}`, '_blank');

        alert("تم تسجيل طلبك وإرساله عبر واتساب!");
    }

    function selectOption(opt) {
        navigationStack.push(currentLevel);
        currentLevel = opt;
        renderStage();
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
