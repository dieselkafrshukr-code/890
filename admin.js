document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabItems = document.querySelectorAll('.nav-item:not(.logout)'); // Fix: Exclude logout button from tabs
    const tabContent = document.getElementById('tab-content');
    const tabTitle = document.getElementById('tab-title');

    // State
    let storeTreeData = [];
    let currentModalTarget = null;

    // --- AUTH ---
    // 1. Force logout initially on every page load
    // auth.signOut(); // Removed auto-logout to keep session active if desired, or keep it if strict security needed. Keeping it based on previous code.
    // Actually, user wants persistence. Let's remove initial signOut to allow persistence.

    auth.onAuthStateChanged(user => {
        if (user) {
            loginScreen.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadTab('orders');
        } else {
            loginScreen.classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    });

    loginBtn.onclick = () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        loginBtn.innerText = "⏳ جاري التحقق...";

        auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL) // Changed to LOCAL for better UX
            .then(() => auth.signInWithEmailAndPassword(email, pass))
            .catch(err => {
                alert("❌ خطأ: " + err.message);
                loginBtn.innerText = "تسجيل الدخول الآمن";
            });
    };

    if (logoutBtn) {
        logoutBtn.onclick = () => {
            if (confirm("هل تريد تسجيل الخروج؟")) {
                auth.signOut();
                window.location.reload();
            }
        };
    }

    // --- NAVIGATION ---
    tabItems.forEach(item => {
        item.onclick = () => {
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            if (tabTitle) tabTitle.innerText = item.querySelector('span').innerText;
            loadTab(tab);
        };
    });

    function loadTab(tab) {
        if (!tabContent) return;
        tabContent.innerHTML = '<div style="text-align:center; padding:100px; color:var(--accent);">⭐ جاري تحميل البيانات...</div>';

        if (tab === 'orders') renderOrders();
        if (tab === 'categories') renderCategories();
        if (tab === 'products') renderProducts();
        if (tab === 'governorates') renderGovernorates();
    }

    // --- 1. ORDERS ---
    async function renderOrders() {
        const snap = await db.collection('orders').orderBy('timestamp', 'desc').get();

        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>الطلبات الواردة</h3>
                <button id="delete-all-orders" class="action-link del" style="background:rgba(255,68,68,0.1); padding:10px 20px; border-radius:12px;">
                    <i data-lucide="trash-2"></i> مسح سجل الطلبات بالكامل
                </button>
            </div>
            <div id="orders-list-container"></div>
        `;

        const container = document.getElementById('orders-list-container');

        if (snap.empty) {
            container.innerHTML = '<div style="text-align:center; padding:5rem; color:var(--text-dim);">🕳️ لا توجد طلبات في الوقت الحالي.</div>';
            return;
        }

        let html = `
            <div class="orders-table-wrapper">
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>العميل</th>
                        <th>التليفون</th>
                        <th>العنوان</th>
                        <th>المحافظة</th>
                        <th>المنتجات</th>
                        <th>الإجمالي</th>
                        <th>الوقت</th>
                        <th>الحالة</th>
                        <th>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
        `;
        snap.forEach(doc => {
            const o = doc.data();
            const date = o.timestamp ? new Date(o.timestamp.toDate()).toLocaleString('ar-EG') : 'قيد المعالجة';
            html += `
                <tr id="order-${doc.id}">
                    <td><div style="font-weight:900;">${o.customer || '-'}</div></td>
                    <td><div style="font-size:0.85rem; direction:ltr;">${o.phone || '-'}</div></td>
                    <td style="font-size:0.8rem; color:var(--text-dim);">${o.address || '-'}</td>
                    <td><div style="font-weight:700; color:var(--accent);">${o.governorate || '-'}</div></td>
                    <td>${o.item}</td>
                    <td style="font-weight:900; color:#4caf50;">${o.total || '-'} ج.م</td>
                    <td style="font-size:0.8rem;">${date}</td>
                    <td><span class="status-badge">${o.status || 'جديد'}</span></td>
                    <td>
                        <button onclick="window.deleteOrder('${doc.id}')" class="action-link del" style="padding:8px; border-radius:8px;">
                            <i data-lucide="trash-2" style="width:18px;"></i>
                        </button>
                    </td>
                </tr>
            `;
        });
        html += '</tbody></table></div>';
        container.innerHTML = html;

        // Bulk delete logic
        document.getElementById('delete-all-orders').onclick = async () => {
            if (!confirm("⚠️ هل أنت متأكد تماماً من حذف جميع الطلبات؟ لا يمكن التراجع عن هذا الإجراء!")) return;

            const btn = document.getElementById('delete-all-orders');
            btn.innerHTML = "⏳ جاري المسح...";
            btn.disabled = true;

            const batch = db.batch();
            snap.docs.forEach(doc => batch.delete(doc.ref));

            await batch.commit();
            alert("✅ تم مسح جميع الطلبات بنجاح");
            renderOrders();
        };

        lucide.createIcons();
    }

    window.deleteOrder = async (id) => {
        if (!confirm("هل تريد حذف هذا الطلب؟")) return;
        try {
            await db.collection('orders').doc(id).delete();
            const row = document.getElementById(`order-${id}`);
            if (row) row.remove();
            // Refresh if empty
            const remaining = document.querySelectorAll('.orders-table tbody tr');
            if (remaining.length === 0) renderOrders();
        } catch (e) {
            alert("❌ خطأ أثناء الحذف: " + e.message);
        }
    };

    // --- 2. CATEGORIES ---
    async function renderCategories() {
        const snap = await db.collection('settings').doc('storeTree').get();
        storeTreeData = snap.exists ? (snap.data().options || []) : [];

        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>هيكل الأقسام</h3>
                <button onclick="window.openCategoryModal('root')" class="add-btn"><i data-lucide="plus"></i> إضافة قسم رئيسي</button>
            </div>
            <div id="tree-container"></div>
            <button id="sync-tree" class="add-btn" style="width:100%; justify-content:center; margin-top:2rem; height:60px;">
                <i data-lucide="save"></i> حفظ ونشر خريطة الموقع
            </button>
        `;

        const container = document.getElementById('tree-container');
        if (storeTreeData.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:3rem; color:var(--text-dim);">لم يتم إضافة أقسام بعد.</p>';
        } else {
            renderTreeView(storeTreeData, container);
        }

        document.getElementById('sync-tree').onclick = async () => {
            const btn = document.getElementById('sync-tree');
            btn.innerText = "⏳ جاري النشر...";
            await db.collection('settings').doc('storeTree').set({ options: storeTreeData });
            alert("✅ تم نشر الأقسام بنجاح!");
            btn.innerHTML = '<i data-lucide="save"></i> حفظ ونشر خريطة الموقع';
        };
        lucide.createIcons();
    }

    function renderTreeView(nodes, container, level = 0) {
        nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'tree-item';
            el.style.marginRight = `${level * 40}px`;
            el.innerHTML = `
                <div style="flex-grow:1; display:flex; align-items:center; gap:10px;">
                    <i data-lucide="${level === 0 ? 'folder' : 'chevron-left'}" style="width:18px; color:var(--accent);"></i>
                    <span class="name">${node.name}</span>
                </div>
                <div class="item-actions">
                    <button onclick="window.openCategoryModal('${node.id}')" class="action-link add"><i data-lucide="plus-square"></i> فرعي</button>
                    <button onclick="window.deleteNode('${node.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            container.appendChild(el);
            if (node.options) renderTreeView(node.options, container, level + 1);
        });
    }

    window.openCategoryModal = (id) => {
        currentModalTarget = id;
        document.getElementById('cat-name').value = '';
        document.getElementById('modal-category').classList.remove('hidden');
    };

    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    document.getElementById('save-cat').onclick = () => {
        const name = document.getElementById('cat-name').value.trim();
        if (!name) return;
        const newNode = { id: 'c_' + Date.now(), name: name, options: [] };
        if (currentModalTarget === 'root') storeTreeData.push(newNode);
        else findAndAdd(storeTreeData, currentModalTarget, newNode);
        window.closeModal('modal-category');
        renderCategories();
    };

    function findAndAdd(nodes, targetId, newNode) {
        for (let n of nodes) {
            if (n.id === targetId) { n.options.push(newNode); return true; }
            if (n.options && findAndAdd(n.options, targetId, newNode)) return true;
        }
    }

    window.deleteNode = (id) => {
        if (!confirm("هل تريد حذف هذا القسم وكل تفرعاته؟")) return;
        storeTreeData = filterNodes(storeTreeData, id);
        renderCategories();
    };

    function filterNodes(nodes, targetId) {
        return nodes.filter(n => {
            if (n.id === targetId) return false;
            if (n.options) n.options = filterNodes(n.options, targetId);
            return true;
        });
    }

    // --- 3. PRODUCTS & STATS ---
    async function renderProducts() {
        tabContent.innerHTML = `
            <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:3rem;">
                <div class="stat-card" style="background:var(--card); padding:25px; border-radius:20px; border:1px solid var(--border); text-align:center; position:relative; overflow:hidden;">
                    <i data-lucide="package" style="position:absolute; top:-10px; left:-10px; width:80px; height:80px; color:rgba(255,255,255,0.03);"></i>
                    <div style="font-size:2.5rem; font-weight:900; color:var(--accent);" id="stat-prods">-</div>
                    <div style="color:var(--text-dim); font-weight:700;">عدد المنتجات</div>
                </div>
                <div class="stat-card" style="background:var(--card); padding:25px; border-radius:20px; border:1px solid var(--border); text-align:center; position:relative; overflow:hidden;">
                    <i data-lucide="layers" style="position:absolute; top:-10px; left:-10px; width:80px; height:80px; color:rgba(255,255,255,0.03);"></i>
                    <div style="font-size:2.5rem; font-weight:900; color:#fff;" id="stat-cats">-</div>
                    <div style="color:var(--text-dim); font-weight:700;">عدد الأقسام</div>
                </div>
                 <div class="stat-card" style="background:var(--card); padding:25px; border-radius:20px; border:1px solid var(--border); text-align:center; position:relative; overflow:hidden;">
                    <i data-lucide="shopping-bag" style="position:absolute; top:-10px; left:-10px; width:80px; height:80px; color:rgba(255,255,255,0.03);"></i>
                    <div style="font-size:2.5rem; font-weight:900; color:#4caf50;" id="stat-orders">-</div>
                    <div style="color:var(--text-dim); font-weight:700;">إجمالي الطلبات</div>
                </div>
            </div>

            <div class="actions-header">
                <h3>إدارة المنتجات</h3>
                <button onclick="window.openProductModal()" class="add-btn"><i data-lucide="plus-circle"></i> إضافة منتج جديد</button>
            </div>
            <div id="products-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;">
                <p style="text-align:center; grid-column:1/-1; color:var(--text-dim);">جاري تحميل المنتجات...</p>
            </div>
        `;

        try {
            const [prodsSnap, ordersSnap, treeSnap] = await Promise.all([
                db.collection('products').orderBy('timestamp', 'desc').get(),
                db.collection('orders').get(),
                storeTreeData.length === 0 ? db.collection('settings').doc('storeTree').get() : Promise.resolve(null)
            ]);

            if (treeSnap && treeSnap.exists) {
                storeTreeData = treeSnap.data().options || [];
            }

            const prodCount = prodsSnap.size;
            const orderCount = ordersSnap.size;

            let catCount = 0;
            const countNodes = (nodes) => {
                nodes.forEach(n => { catCount++; if (n.options) countNodes(n.options); });
            };
            countNodes(storeTreeData);

            document.getElementById('stat-prods').innerText = prodCount;
            document.getElementById('stat-orders').innerText = orderCount;
            document.getElementById('stat-cats').innerText = catCount;

            const grid = document.getElementById('products-grid');
            if (prodsSnap.empty) {
                grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:3rem; color:var(--text-dim);">لا توجد منتجات حالياً.</p>';
            } else {
                grid.innerHTML = '';
                prodsSnap.forEach(doc => {
                    const p = doc.data();
                    const card = document.createElement('div');
                    card.className = 'product-item-card';
                    const mainColorBadge = p.mainColor ? `<span style="display:inline-block; background:var(--accent); color:#000; font-size:0.7rem; padding:2px 8px; border-radius:20px; font-weight:900; margin-top:4px;">🎨 ${p.mainColor}</span>` : '';
                    card.innerHTML = `
                        <img src="${p.mainImage}" style="width:70px; height:70px; border-radius:15px; object-fit:cover;">
                        <div style="flex-grow:1;">
                            <div style="font-weight:900;">${p.name}</div>
                            <div style="color:var(--accent); font-weight:800; font-size:1.1rem;">${p.price} ج.م</div>
                            <div style="font-size:0.75rem; color:var(--text-dim);">${p.categoryName || ''}</div>
                            ${mainColorBadge}
                        </div>
                        <button onclick="window.deleteProduct('${doc.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                    `;
                    grid.appendChild(card);
                });
            }
        } catch (e) {
            console.error("Error loading dashboard:", e);
        }
        lucide.createIcons();
    }

    window.openProductModal = () => {
        const select = document.getElementById('prod-category');
        select.innerHTML = '<option value="">-- اختر القسم --</option>';
        const categories = [];
        const flatten = (nodes, path = "") => {
            nodes.forEach(n => {
                const fullPath = path ? `${path} > ${n.name}` : n.name;
                categories.push({ id: n.id, name: fullPath });
                if (n.options) flatten(n.options, fullPath);
            });
        };
        flatten(storeTreeData);
        categories.forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.dataset.name = c.name;
            opt.innerText = c.name;
            select.appendChild(opt);
        });

        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-main-img').value = '';
        document.getElementById('prod-main-sizes').value = '';
        document.getElementById('prod-main-color').value = '';
        document.getElementById('color-variants-container').innerHTML = '';
        window.updateSizeSystem();
        document.getElementById('modal-product').classList.remove('hidden');
    };

    window.updateSizeSystem = () => { };

    window.addColorVariant = () => {
        const container = document.getElementById('color-variants-container');
        const rowId = 'v_' + Date.now();

        const div = document.createElement('div');
        div.className = 'variant-card';
        div.id = rowId;
        div.innerHTML = `
            <div class="variant-top" style="grid-template-columns: 1fr 1fr 2fr auto;">
                <input type="text" placeholder="اسم اللون" class="v-name">
                <input type="file" accept="image/*" class="v-img">
                <input type="text" placeholder="المقاسات (مثلاً: S, M, L, XL - افصل بفاصلة)" class="v-sizes-text" style="direction:ltr; text-align:right;">
                <button type="button" onclick="document.getElementById('${rowId}').remove()" class="action-link del"><i data-lucide="trash-2"></i></button>
            </div>
        `;
        container.appendChild(div);
        lucide.createIcons();
    };

    const fileToBase64 = (file) => new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image();
            img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX = 800;
                let w = img.width, h = img.height;
                if (w > MAX) { h *= MAX / w; w = MAX; }
                canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, w, h);
                resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });

    document.getElementById('save-product').onclick = async () => {
        const name = document.getElementById('prod-name').value.trim();
        const price = document.getElementById('prod-price').value;
        const catSelect = document.getElementById('prod-category');
        const mainImg = document.getElementById('prod-main-img').files[0];
        const mainColor = document.getElementById('prod-main-color').value.trim();

        if (!name || !price || !catSelect.value || !mainImg) return alert("❌ يرجى إكمال البيانات الأساسية");
        if (!mainColor) return alert("❌ يرجى إدخال اسم اللون الرئيسي للصورة الرئيسية");

        const btn = document.getElementById('save-product');
        btn.disabled = true; btn.innerText = "⏳ جاري المعالجة...";

        try {
            const mainBase64 = await fileToBase64(mainImg);
            const mainSizesRaw = document.getElementById('prod-main-sizes').value;
            const mainSizes = mainSizesRaw ? mainSizesRaw.split(',').map(s => s.trim()).filter(s => s) : [];

            const variants = [];
            const rows = document.querySelectorAll('.variant-card');

            for (let row of rows) {
                const vName = row.querySelector('.v-name').value.trim();
                const vFile = row.querySelector('.v-img').files[0];
                const vSizesRaw = row.querySelector('.v-sizes-text').value;
                const vSizes = vSizesRaw.split(',').map(s => s.trim()).filter(s => s);

                if (vName && vFile) {
                    const vBase64 = await fileToBase64(vFile);
                    variants.push({ name: vName, image: vBase64, sizes: vSizes });
                }
            }

            await db.collection('products').add({
                name,
                price: parseFloat(price),
                categoryId: catSelect.value,
                categoryName: catSelect.options[catSelect.selectedIndex].dataset.name,
                mainImage: mainBase64,
                mainColor: mainColor,
                mainSizes: mainSizes,
                colors: variants,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.closeModal('modal-product');
            alert("✅ تم نشر المنتج بنجاح!");
            renderProducts();
        } catch (e) { alert("❌ خطأ: " + e.message); }
        btn.disabled = false; btn.innerText = "حفظ ونشر المنتج";
    };

    window.deleteProduct = async (id) => {
        if (!confirm("هل تريد حذف هذا المنتج؟")) return;
        await db.collection('products').doc(id).delete();
        renderProducts();
    };

    // --- 4. GOVERNORATES & SHIPPING ---
    const EGYPT_GOVERNORATES = [
        "القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر",
        "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية",
        "المنيا", "القليوبية", "الوادي الجديد", "السويس", "أسوان",
        "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية",
        "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا",
        "شمال سيناء", "سوهاج"
    ];

    async function renderGovernorates() {
        // Load existing prices
        let govData = {};
        try {
            const snap = await db.collection('settings').doc('governoratesPricing').get();
            if (snap.exists) govData = snap.data().prices || {};
        } catch (e) { }

        let rowsHtml = EGYPT_GOVERNORATES.map(gov => `
            <tr>
                <td style="font-weight:700; padding:12px 16px;">${gov}</td>
                <td style="padding:12px 16px;">
                    <div style="display:flex; align-items:center; gap:10px;">
                        <input type="number" 
                            id="gov_${gov.replace(/\s/g, '_')}" 
                            value="${govData[gov] || 0}" 
                            min="0"
                            style="width:120px; background:var(--card,#111); border:1px solid #333; color:#fff; padding:8px 12px; border-radius:10px; font-size:1rem; text-align:center;"
                        >
                        <span style="color:var(--text-dim); font-size:0.85rem;">ج.م</span>
                    </div>
                </td>
            </tr>
        `).join('');

        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>🗺️ أسعار الشحن للمحافظات</h3>
            </div>
            <p style="color:var(--text-dim); margin-bottom:2rem; font-size:0.9rem;">
                حدد سعر الشحن لكل محافظة. سيتم إضافته تلقائياً على إجمالي الطلب عند اختيار العميل للمحافظة.
            </p>
            <div style="background:var(--card,#0f0f0f); border:1px solid #222; border-radius:20px; overflow:hidden;">
                <table style="width:100%; border-collapse:collapse;">
                    <thead>
                        <tr style="background:rgba(255,255,255,0.04); border-bottom:1px solid #333;">
                            <th style="text-align:right; padding:15px 16px; color:var(--accent);">المحافظة</th>
                            <th style="text-align:right; padding:15px 16px; color:var(--accent);">سعر الشحن</th>
                        </tr>
                    </thead>
                    <tbody style="divide-y:#222;">
                        ${rowsHtml}
                    </tbody>
                </table>
            </div>
            <button id="save-gov-prices" class="add-btn" style="width:100%; justify-content:center; margin-top:2rem; height:60px; font-size:1.1rem;">
                <i data-lucide="save"></i> حفظ أسعار الشحن
            </button>
        `;

        document.getElementById('save-gov-prices').onclick = async () => {
            const btn = document.getElementById('save-gov-prices');
            btn.innerText = "⏳ جاري الحفظ...";
            const prices = {};
            EGYPT_GOVERNORATES.forEach(gov => {
                const input = document.getElementById(`gov_${gov.replace(/\s/g, '_')}`);
                prices[gov] = parseFloat(input.value) || 0;
            });
            await db.collection('settings').doc('governoratesPricing').set({ prices });
            btn.innerHTML = '<i data-lucide="save"></i> حفظ أسعار الشحن';
            alert("✅ تم حفظ أسعار الشحن بنجاح!");
            lucide.createIcons();
        };

        lucide.createIcons();
    }

    // Expose for global access
    window.EGYPT_GOVERNORATES = EGYPT_GOVERNORATES;
});
