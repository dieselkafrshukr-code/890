document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabItems = document.querySelectorAll('.nav-item');
    const tabContent = document.getElementById('tab-content');
    const tabTitle = document.getElementById('tab-title');

    // State
    let storeTreeData = [];
    let currentModalTarget = null;
    const sizeSystems = {
        clothes: ['S', 'M', 'L', 'XL', '2XL', '3XL', '4XL'],
        pants: ['28', '30', '32', '34', '36', '38', '40', '42'],
        shoes: ['37', '38', '39', '40', '41', '42', '43', '44', '45']
    };

    // --- AUTH ---
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
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            alert("❌ خطأ: " + err.message);
            loginBtn.innerText = "تسجيل الدخول الآمن";
        });
    };

    logoutBtn.onclick = () => auth.signOut();

    // --- NAVIGATION ---
    tabItems.forEach(item => {
        item.onclick = () => {
            if (item.classList.contains('logout')) return;
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            tabTitle.innerText = item.querySelector('span').innerText;
            loadTab(tab);
        };
    });

    function loadTab(tab) {
        tabContent.innerHTML = '<div style="text-align:center; padding:100px; color:var(--accent);">⭐ جاري تحميل البيانات...</div>';
        if (tab === 'orders') renderOrders();
        if (tab === 'categories') renderCategories();
        if (tab === 'products') renderProducts();
    }

    // --- 1. ORDERS ---
    async function renderOrders() {
        const snap = await db.collection('orders').orderBy('timestamp', 'desc').get();
        if (snap.empty) {
            tabContent.innerHTML = '<div style="text-align:center; padding:5rem; color:var(--text-dim);">🕳️ لا توجد طلبات في الوقت الحالي.</div>';
            return;
        }

        let html = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>العميل</th>
                        <th>المنتجات</th>
                        <th>الوقت</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
        `;
        snap.forEach(doc => {
            const o = doc.data();
            const date = o.timestamp ? new Date(o.timestamp.toDate()).toLocaleString('ar-EG') : 'قيد المعالجة';
            html += `
                <tr>
                    <td>
                        <div style="font-weight:900;">${o.customer}</div>
                        <div style="font-size:0.8rem; color:var(--text-dim);">${o.phone || ''}</div>
                    </td>
                    <td>${o.item}</td>
                    <td style="font-size:0.8rem;">${date}</td>
                    <td><span class="status-badge">${o.status || 'جديد'}</span></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        tabContent.innerHTML = html;
        lucide.createIcons();
    }

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

    // --- 3. PRODUCTS ---
    async function renderProducts() {
        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>إدارة المنتجات</h3>
                <button onclick="window.openProductModal()" class="add-btn"><i data-lucide="plus-circle"></i> إضافة منتج جديد</button>
            </div>
            <div id="products-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;"></div>
        `;

        const grid = document.getElementById('products-grid');
        const snap = await db.collection('products').orderBy('timestamp', 'desc').get();

        if (snap.empty) {
            grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:3rem; color:var(--text-dim);">لا توجد منتجات حالياً.</p>';
        } else {
            snap.forEach(doc => {
                const p = doc.data();
                const card = document.createElement('div');
                card.className = 'product-item-card';
                card.innerHTML = `
                    <img src="${p.mainImage}" style="width:70px; height:70px; border-radius:15px; object-fit:cover;">
                    <div style="flex-grow:1;">
                        <div style="font-weight:900;">${p.name}</div>
                        <div style="color:var(--accent); font-weight:800; font-size:1.1rem;">${p.price} ج.م</div>
                        <div style="font-size:0.75rem; color:var(--text-dim);">${p.categoryName || ''}</div>
                    </div>
                    <button onclick="window.deleteProduct('${doc.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                `;
                grid.appendChild(card);
            });
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
        document.getElementById('color-variants-container').innerHTML = '';
        window.updateSizeSystem();
        document.getElementById('modal-product').classList.remove('hidden');
    };

    window.updateSizeSystem = () => {
        // Refresh any existing variant rows with new chips if needed, but usually just for new ones
        console.log("Size system updated globally");
    };

    window.addColorVariant = () => {
        const container = document.getElementById('color-variants-container');
        const system = document.getElementById('size-type-selector').value;
        const availableSizes = sizeSystems[system];
        const rowId = 'v_' + Date.now();

        const div = document.createElement('div');
        div.className = 'variant-card';
        div.id = rowId;
        div.innerHTML = `
            <div class="variant-top">
                <input type="text" placeholder="اسم اللون" class="v-name">
                <input type="file" accept="image/*" class="v-img">
                <button type="button" onclick="document.getElementById('${rowId}').remove()" class="action-link del"><i data-lucide="trash-2"></i></button>
            </div>
            <div class="v-size-grid">
                ${availableSizes.map(s => `<label class="size-chip"><input type="checkbox" value="${s}"> ${s}</label>`).join('')}
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

        if (!name || !price || !catSelect.value || !mainImg) return alert("❌ يرجى إكمال البيانات الأساسية");

        const btn = document.getElementById('save-product');
        btn.disabled = true; btn.innerText = "⏳ جاري المعالجة...";

        try {
            const mainBase64 = await fileToBase64(mainImg);
            const variants = [];
            const rows = document.querySelectorAll('.variant-card');

            for (let row of rows) {
                const vName = row.querySelector('.v-name').value.trim();
                const vFile = row.querySelector('.v-img').files[0];
                const vSizes = Array.from(row.querySelectorAll('input:checked')).map(c => c.value);

                if (vName && vFile) {
                    const vBase64 = await fileToBase64(vFile);
                    variants.push({ name: vName, image: vBase64, sizes: vSizes });
                }
            }

            await db.collection('products').add({
                name, price: parseFloat(price),
                categoryId: catSelect.value,
                categoryName: catSelect.options[catSelect.selectedIndex].dataset.name,
                mainImage: mainBase64,
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
});
