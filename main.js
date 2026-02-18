document.addEventListener('DOMContentLoaded', () => {
    // 1. Intro Animation
    const introTitle = document.getElementById('intro-title');
    const introSub = document.getElementById('intro-sub');
    const preloader = document.getElementById('preloader');
    const appContent = document.getElementById('app-content');

    const typeText = async (element, text, speed = 100) => {
        for (let i = 0; i < text.length; i++) {
            element.textContent += text[i];
            await new Promise(resolve => setTimeout(resolve, speed));
        }
    };

    const startIntro = async () => {
        await typeText(introTitle, "EL TOUFAN", 120);
        await new Promise(resolve => setTimeout(resolve, 500));
        await typeText(introSub, "KAFR SHUKR", 100);
        await new Promise(resolve => setTimeout(resolve, 1500));
        preloader.style.transition = 'opacity 1s ease';
        preloader.style.opacity = '0';
        setTimeout(() => {
            preloader.style.display = 'none';
            appContent.style.opacity = '1';
            initApp();
        }, 1000);
    };

    startIntro();

    function initApp() {
        lucide.createIcons();
        renderMainTabs();
    }

    // 2. Data Structure
    const storeData = [
        {
            id: 'men',
            name: 'رجالي',
            sub: [
                { id: 'm-clothes', name: 'ملابس', items: ["بنطلون", "تيشيرت", "قميص", "جاكيت", "سويسرت", "بلوفر", "بدلة", "شورت"] },
                { id: 'm-shoes', name: 'أحذية', items: ["كوتشي", "جزمة كلاسيك", "بوت", "صندل"] },
                { id: 'm-acc', name: 'إكسسوارات', items: ["ساعة", "نظارة", "حزام", "محفظة"] }
            ]
        },
        {
            id: 'women',
            name: 'حريمي',
            sub: [
                { id: 'w-clothes', name: 'ملابس', items: ["فستان", "بلوزة", "جيبة", "بنطلون", "جاكيت", "عباية", "ترينج"] },
                { id: 'w-shoes', name: 'أحذية', items: ["هيلز", "فلات", "سنيكرز", "بوت", "صندل"] },
                { id: 'w-acc', name: 'حقائب وجمال', items: ["شنطة", "ميك أب", "إكسسوارات", "برفان"] }
            ]
        },
        {
            id: 'kids',
            name: 'أطفال',
            sub: [
                { id: 'k-boys', name: 'أولادي', items: ["تيشيرت", "بنطلون", "جاكيت", "ترينج", "سنيكرز", "صندل"] },
                { id: 'k-girls', name: 'بناتي', items: ["فستان", "بلوزة", "جيبة", "ترينج", "فلات", "صندل"] }
            ]
        },
        {
            id: 'unisex',
            name: 'محير',
            sub: [
                { id: 'u-clothes', name: 'ملابس', items: ["تيشيرت", "هودي", "سويسرت", "ترينج"] },
                { id: 'u-shoes', name: 'أحذية', items: ["سنيكرز", "كاجوال"] }
            ]
        }
    ];

    let activeCategory = storeData[0];
    let activeSub = activeCategory.sub[0];

    // 3. UI Rendering Logic
    function renderMainTabs() {
        const container = document.getElementById('main-tabs');
        container.innerHTML = storeData.map(cat => `
            <button class="tab-btn ${cat.id === activeCategory.id ? 'active' : ''}" 
                    onclick="selectCategory('${cat.id}')">
                ${cat.name}
            </button>
        `).join('');
        renderSubFilters();
    }

    function renderSubFilters() {
        const container = document.getElementById('sub-filters');
        container.innerHTML = activeCategory.sub.map((sub, idx) => `
            <button class="filter-btn ${sub.id === activeSub.id ? 'active' : ''}" 
                    onclick="selectSub('${sub.id}')">
                ${sub.name}
            </button>
        `).join('');
        renderItems();
    }

    function renderItems() {
        const container = document.getElementById('final-items-grid');
        container.innerHTML = activeSub.items.map(item => `
            <div class="item-chip">${item}</div>
        `).join('');
    }

    // 4. Global Event Handlers
    window.selectCategory = (id) => {
        activeCategory = storeData.find(c => c.id === id);
        activeSub = activeCategory.sub[0];
        renderMainTabs();
    };

    window.selectSub = (id) => {
        activeSub = activeCategory.sub.find(s => s.id === id);
        renderSubFilters();
    };
});
