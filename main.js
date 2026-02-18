document.addEventListener('DOMContentLoaded', () => {
    // Initialize Lucide Icons
    lucide.createIcons();

    // Data Structure from User Requirements
    const storeData = {
        men: {
            title: "رجالي",
            groups: [
                {
                    name: "ملابس",
                    items: ["بنطلون", "تيشيرت", "قميص", "جاكيت", "سويسرت", "بلوفر", "بدلة", "شورت"]
                },
                {
                    name: "أحذية",
                    items: ["كوتشي", "جزمة كلاسيك", "بوت", "صندل"]
                },
                {
                    name: "آخر",
                    items: ["إكسسوارات", "برفانات", "داخلي"]
                }
            ]
        },
        women: {
            title: "حريمي",
            groups: [
                {
                    name: "ملابس",
                    items: ["فستان", "بلوزة", "جيبة", "بنطلون", "جاكيت", "عباية", "ترينج"]
                },
                {
                    name: "أحذية",
                    items: ["هيلز", "فلات", "سنيكرز", "بوت", "صندل"]
                },
                {
                    name: "إكسسوارات وجمال",
                    items: ["شنط", "ميك أب", "إكسسوارات", "برفانات", "داخلي"]
                }
            ]
        },
        unisex: {
            title: "محير (يونيسكس)",
            groups: [
                {
                    name: "ملابس",
                    items: ["تيشيرت", "هودي", "سويسرت", "ترينج"]
                },
                {
                    name: "أحذية",
                    items: ["سنيكرز", "كاجوال"]
                }
            ]
        },
        kids: {
            title: "أطفال",
            subSections: [
                {
                    name: "أولادي",
                    nested: [
                        { name: "ملابس", items: ["تيشيرت", "بنطلون", "جاكيت", "ترينج"] },
                        { name: "أحذية", items: ["سنيكرز", "صندل", "بوت"] }
                    ]
                },
                {
                    name: "بناتي",
                    nested: [
                        { name: "ملابس", items: ["فستان", "بلوزة", "جيبة", "ترينج"] },
                        { name: "أحذية", items: ["هيلز أطفال", "فلات", "صندل", "سنيكرز"] }
                    ]
                }
            ]
        }
    };

    // DOM Elements
    const modal = document.getElementById('category-modal');
    const modalBody = document.getElementById('modal-body');
    const closeModal = document.querySelector('.close-modal');
    const mainCats = document.querySelectorAll('.main-cat');

    // Navigation Scroll Effect
    window.addEventListener('scroll', () => {
        const nav = document.querySelector('.glass-nav');
        if (window.scrollY > 50) {
            nav.style.height = '70px';
            nav.style.background = 'rgba(10, 10, 11, 0.95)';
        } else {
            nav.style.height = '80px';
            nav.style.background = 'rgba(18, 18, 20, 0.8)';
        }
    });

    // Open Modal with Category Content
    mainCats.forEach(cat => {
        cat.addEventListener('click', () => {
            const catKey = cat.getAttribute('data-category');
            renderCategoryInModal(catKey);
            modal.style.display = 'block';
            document.body.style.overflow = 'hidden'; // Prevent scroll
        });
    });

    // Close Modal
    closeModal.addEventListener('click', () => {
        modal.style.display = 'none';
        document.body.style.overflow = 'auto';
    });

    window.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.style.display = 'none';
            document.body.style.overflow = 'auto';
        }
    });

    function renderCategoryInModal(key) {
        const data = storeData[key];
        let html = `
            <div class="modal-header">
                <h2>${data.title}</h2>
                <p>تصفح التشكيلة الكاملة لقسم ${data.title}</p>
            </div>
            <div class="modal-grid">
        `;

        // Handle regular categories (Men, Women, Unisex)
        if (data.groups) {
            data.groups.forEach(group => {
                html += `
                    <div class="sub-cat-group">
                        <h4>${group.name}</h4>
                        <ul>
                            ${group.items.map(item => `<li>${item}</li>`).join('')}
                        </ul>
                    </div>
                `;
            });
        } 
        // Handle Kids category (Special structure)
        else if (data.subSections) {
            data.subSections.forEach(section => {
                html += `
                    <div class="sub-cat-group wide">
                        <h3>قـسم ${section.name}</h3>
                        ${section.nested.map(nest => `
                            <div class="nested-group">
                                <h4>${nest.name}</h4>
                                <ul>
                                    ${nest.items.map(item => `<li>${item}</li>`).join('')}
                                </ul>
                            </div>
                        `).join('')}
                    </div>
                `;
            });
        }

        html += `</div>`;
        modalBody.innerHTML = html;
    }

    // Rough cart animation
    let count = 0;
    const cartCountEl = document.querySelector('.cart-count');
    document.addEventListener('click', (e) => {
        if (e.target.tagName === 'LI' && modal.style.display === 'block') {
            count++;
            cartCountEl.textContent = count;
            // Simple toast or animation could go here
            e.target.style.color = '#d4af37';
            setTimeout(() => { e.target.style.color = ''; }, 500);
        }
    });
});
