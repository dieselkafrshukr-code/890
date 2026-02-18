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
        try {
            const snap = await db.collection('settings').doc('storeTree').get();
            if (snap.exists) {
                storeTree = snap.data();
                currentLevel = storeTree;
                navigationStack = [storeTree];
            } else {
                storeTree.options = defaultData;
                currentLevel = storeTree;
                navigationStack = [storeTree];
            }
        } catch (e) {
            console.error("Firebase fetch error:", e);
            storeTree.options = defaultData;
            currentLevel = storeTree;
            navigationStack = [storeTree];
        }
    }

    // --- 4. RENDER LOGIC ---
    function renderStage() {
        stageTitle.innerText = currentLevel.name || "EL TOUFAN";
        stageDesc.innerText = currentLevel.desc || "اختر من الخيارات المتاحة";

        const levelIdx = navigationStack.length;
        steps.forEach((s, i) => {
            s.classList.toggle('active', i + 1 <= levelIdx);
        });

        optionsGrid.innerHTML = '';

        if (currentLevel.options && currentLevel.options.length > 0) {
            currentLevel.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.innerText = opt.name;
                btn.onclick = () => selectOption(opt);
                optionsGrid.appendChild(btn);
            });
        } else if (currentLevel.name !== "EL TOUFAN") {
            // Leaf node: Final Item
            const msg = document.createElement('div');
            msg.className = 'stage-desc';
            msg.style.width = '100%';
            msg.innerHTML = `<p style="color: var(--gold); font-size: 1.5rem; font-weight: 700;">تم اختيار: ${currentLevel.name}</p>`;
            optionsGrid.appendChild(msg);

            const addBtn = document.createElement('button');
            addBtn.className = 'opt-btn active';
            addBtn.innerHTML = `<i data-lucide="shopping-cart"></i> اطلب الآن (واتساب + تسجيل)`;
            addBtn.onclick = () => sendOrder(currentLevel.name);
            optionsGrid.appendChild(addBtn);
            lucide.createIcons();
        }

        backBtn.classList.toggle('hidden', navigationStack.length <= 1);
        resetBtn.classList.toggle('hidden', navigationStack.length <= 1);
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

    window.goBack = () => {
        if (navigationStack.length > 1) {
            navigationStack.pop();
            currentLevel = navigationStack[navigationStack.length - 1];
            renderStage();
        }
    };

    window.resetApp = () => {
        currentLevel = storeTree;
        navigationStack = [storeTree];
        renderStage();
    };

    backBtn.onclick = window.goBack;
    resetBtn.onclick = window.resetApp;

    startIntro();
});
