document.addEventListener('DOMContentLoaded', () => {
    // --- 1. CONFIG & DATA ---
    const storeTree = {
        name: "EL TOUFAN",
        options: [
            {
                id: "wholesale",
                name: "جملة",
                desc: "أسعار خاصة للتجار والكميات",
                options: [] // Wholesale can be added later or follow the same tree
            },
            {
                id: "retail",
                name: "قطاعي",
                desc: "أرقى الموديلات للأفراد",
                options: [
                    {
                        id: "men",
                        name: "رجالي",
                        options: [
                            {
                                id: "m-clothes",
                                name: "ملابس",
                                options: [
                                    { name: "بنطلون" }, { name: "تيشيرت" }, { name: "قميص" }, { name: "جاكيت" },
                                    { name: "سويسرت" }, { name: "بلوفر" }, { name: "بدلة" }, { name: "شورت" }
                                ]
                            },
                            {
                                id: "m-shoes",
                                name: "أحذية",
                                options: [
                                    { name: "كوتشي" }, { name: "جزمة كلاسيك" }, { name: "بوت" }, { name: "صندل" }
                                ]
                            },
                            {
                                id: "m-acc",
                                name: "إكسسوارات",
                                options: [{ name: "ساعة" }, { name: "نظارة" }, { name: "حزام" }, { name: "محفظة" }]
                            },
                            { name: "برفانات" },
                            { name: "داخلي" }
                        ]
                    },
                    {
                        id: "women",
                        name: "حريمي",
                        options: [
                            {
                                id: "w-clothes",
                                name: "ملابس",
                                options: [
                                    { name: "فستان" }, { name: "بلوزة" }, { name: "جيبة" }, { name: "بنطلون" },
                                    { name: "جاكيت" }, { name: "عباية" }, { name: "ترينج" }
                                ]
                            },
                            {
                                id: "w-shoes",
                                name: "أحذية",
                                options: [
                                    { name: "هيلز" }, { name: "فلات" }, { name: "سنيكرز" }, { name: "بوت" }, { name: "صندل" }
                                ]
                            },
                            { name: "شنط" },
                            { name: "ميك أب" },
                            { name: "إكسسوارات" },
                            { name: "برفانات" },
                            { name: "داخلي" }
                        ]
                    },
                    {
                        id: "unisex",
                        name: "محير (يونيسكس)",
                        options: [
                            {
                                id: "u-clothes",
                                name: "ملابس",
                                options: [{ name: "تيشيرت" }, { name: "هودي" }, { name: "سويسرت" }, { name: "ترينج" }]
                            },
                            {
                                id: "u-shoes",
                                name: "أحذية",
                                options: [{ name: "سنيكرز" }, { name: "كاجوال" }]
                            }
                        ]
                    },
                    {
                        id: "kids",
                        name: "أطفال",
                        options: [
                            {
                                id: "k-clothes",
                                name: "ملابس",
                                options: [
                                    {
                                        name: "أولادي",
                                        options: [{ name: "تيشيرت" }, { name: "بنطلون" }, { name: "جاكيت" }, { name: "ترينج" }]
                                    },
                                    {
                                        name: "بناتي",
                                        options: [{ name: "فستان" }, { name: "بلوزة" }, { name: "جيبة" }, { name: "ترينج" }]
                                    }
                                ]
                            },
                            {
                                id: "k-shoes",
                                name: "أحذية",
                                options: [
                                    {
                                        name: "أولادي",
                                        options: [{ name: "سنيكرز" }, { name: "صندل" }, { name: "بوت" }]
                                    },
                                    {
                                        name: "بناتي",
                                        options: [{ name: "هيلز أطفال" }, { name: "فلات" }, { name: "صندل" }, { name: "سنيكرز" }]
                                    }
                                ]
                            }
                        ]
                    }
                ]
            }
        ]
    };

    // Fill Wholesale with a clone of Retail for demo purposes if needed
    storeTree.options[0].options = JSON.parse(JSON.stringify(storeTree.options[1].options));

    // --- 2. STATE MANAGEMENT ---
    let navigationStack = [storeTree]; // To handle back button
    let currentLevel = storeTree;
    let cartCount = 0;

    // --- 3. DOM ELEMENTS ---
    const introTitle = document.getElementById('intro-title');
    const introSub = document.querySelector('.intro-sub-line');
    const introScreen = document.getElementById('intro-screen'); // Corrected
    const mainApp = document.getElementById('main-app');

    // Missing variables needed for renderStage
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
        // Line 1: EL TOUFAN
        const mainTitle = document.querySelector('.intro-main');
        mainTitle.textContent = "";
        await typeText(mainTitle, "EL TOUFAN", 120);
        await new Promise(resolve => setTimeout(resolve, 1500));

        // Fade out preloader
        introScreen.style.transition = 'opacity 1s ease';
        introScreen.classList.add('hidden');

        setTimeout(() => {
            introScreen.style.display = 'none';
            mainApp.classList.remove('hidden');
            renderStage();
            lucide.createIcons();
        }, 1000);
    };

    // --- 5. RENDER LOGIC ---
    function renderStage() {
        // Update Title & Desc
        stageTitle.innerText = currentLevel.name;
        stageDesc.innerText = currentLevel.desc || "اختر من الخيارات المتاحة";

        // Update Steps
        const levelIdx = navigationStack.length;
        steps.forEach((s, i) => {
            s.classList.toggle('active', i + 1 <= levelIdx);
        });

        // Clear and Render Grid
        optionsGrid.innerHTML = '';

        if (currentLevel.options && currentLevel.options.length > 0) {
            currentLevel.options.forEach(opt => {
                const btn = document.createElement('button');
                btn.className = 'opt-btn';
                btn.innerText = opt.name;
                btn.onclick = () => selectOption(opt);
                optionsGrid.appendChild(btn);
            });
        } else {
            // Leaf node: Final Item
            const msg = document.createElement('div');
            msg.className = 'stage-desc';
            msg.style.width = '100%';
            msg.innerHTML = `<p style="color: var(--gold); font-size: 1.5rem; font-weight: 700;">تم اختيار: ${currentLevel.name}</p>`;
            optionsGrid.appendChild(msg);

            const addBtn = document.createElement('button');
            addBtn.className = 'opt-btn active';
            addBtn.innerHTML = `<i data-lucide="shopping-cart"></i> أضف للطلب`;
            addBtn.onclick = () => {
                cartCount++;
                document.getElementById('cart-count').innerText = cartCount;
                addBtn.innerText = "تمت الإضافة ✓";
                addBtn.disabled = true;
            };
            optionsGrid.appendChild(addBtn);
            lucide.createIcons();
        }

        // Show/Hide Back & Reset
        backBtn.classList.toggle('hidden', navigationStack.length <= 1);
        resetBtn.classList.toggle('hidden', navigationStack.length <= 1);
    }

    function selectOption(opt) {
        navigationStack.push(currentLevel);
        currentLevel = opt;
        renderStage();
    }

    window.goBack = () => {
        if (navigationStack.length > 0) {
            currentLevel = navigationStack.pop();
            renderStage();
        }
    };

    window.resetApp = () => {
        navigationStack = [];
        currentLevel = storeTree;
        renderStage();
    };

    // Event Bindings
    backBtn.onclick = window.goBack;
    resetBtn.onclick = window.resetApp;

    startIntro();
});
