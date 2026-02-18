document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabItems = document.querySelectorAll('.nav-item');
    const tabContent = document.getElementById('tab-content');
    const tabTitle = document.getElementById('tab-title');

    // Global State for the Store Tree
    let storeTreeData = [];
    let currentModalTarget = null; // 'root' or a parent node id

    // --- 1. AUTH LOGIC ---
    auth.onAuthStateChanged(user => {
        if (user) {
            loginScreen.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadTab('categories');
        } else {
            loginScreen.classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    });

    loginBtn.onclick = () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        loginBtn.innerText = "جاري الدخول...";
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            alert("❌ فشل الدخول: " + err.message);
            loginBtn.innerText = "Login";
        });
    };

    logoutBtn.onclick = () => auth.signOut();

    // --- 2. TAB NAVIGATION ---
    tabItems.forEach(item => {
        item.onclick = () => {
            if (item.classList.contains('logout')) return;
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            tabTitle.innerText = item.innerText;
            loadTab(tab);
        };
    });

    function loadTab(tab) {
        tabContent.innerHTML = '<div style="text-align:center; padding:50px;">جاري التحميل...</div>';
        if (tab === 'categories') renderCategoryEditor();
        if (tab === 'products') renderProductManager();
        if (tab === 'orders') renderOrderViewer();
    }

    // --- 3. CATEGORY EDITOR (THE MAP) ---
    async function renderCategoryEditor() {
        const snap = await db.collection('settings').doc('storeTree').get();
        storeTreeData = snap.exists ? (snap.data().options || []) : [];

        updateTreeView();
    }

    function updateTreeView() {
        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>خريطة الأقسام الحالية</h3>
                <button onclick="window.openCategoryModal('root')" class="add-btn"><i data-lucide="plus-circle"></i> إضافة قسم رئيسي</button>
            </div>
            <div id="tree-container" class="tree-view"></div>
            <button id="sync-tree" class="add-btn" style="background:var(--accent); color:black; margin-top:3rem; width:100%; justify-content:center;">
                <i data-lucide="save"></i> حفظ ونشر التغييرات على الموقع
            </button>
        `;

        const container = document.getElementById('tree-container');
        if (storeTreeData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-dim); padding:2rem;">لا توجد أقسام بعد. ابدأ بإضافة قسم رئيسي.</p>';
        } else {
            renderTreeView(storeTreeData, container);
        }

        document.getElementById('sync-tree').onclick = async () => {
            const btn = document.getElementById('sync-tree');
            btn.innerText = "جاري الحفظ...";
            btn.disabled = true;
            try {
                await db.collection('settings').doc('storeTree').set({
                    name: "EL TOUFAN",
                    options: storeTreeData
                });
                alert("✅ تم حفظ الخريطة ونشرها على الموقع بنجاح!");
            } catch (e) {
                alert("❌ خطأ في الحفظ: " + e.message);
            }
            btn.innerHTML = '<i data-lucide="save"></i> حفظ ونشر التغييرات على الموقع';
            btn.disabled = false;
            lucide.createIcons();
        };
        lucide.createIcons();
    }

    function renderTreeView(nodes, container, level = 0) {
        nodes.forEach((node) => {
            const item = document.createElement('div');
            item.className = 'tree-item';
            item.style.marginRight = `${level * 40}px`;

            // Check if it's a leaf node or has children
            const hasChildren = node.options && node.options.length > 0;

            item.innerHTML = `
                <span class="name">${node.name}</span>
                <div class="item-actions">
                    <button onclick="window.openCategoryModal('${node.id}')" class="action-link add"><i data-lucide="plus"></i> فرعي</button>
                    <button onclick="window.deleteNode('${node.id}')" class="action-link del"><i data-lucide="trash-2"></i> حذف</button>
                </div>
            `;
            container.appendChild(item);
            if (node.options) renderTreeView(node.options, container, level + 1);
        });
    }

    // --- MODAL LOGIC ---
    window.openCategoryModal = (parentId) => {
        currentModalTarget = parentId;
        document.getElementById('cat-name').value = '';
        document.getElementById('modal-category').classList.remove('hidden');
    };

    window.closeModal = (id) => {
        document.getElementById(id).classList.add('hidden');
    };

    document.getElementById('save-cat').onclick = () => {
        const name = document.getElementById('cat-name').value.trim();
        if (!name) return alert("يرجى إدخال اسم القسم");

        const newNode = {
            id: 'id_' + Date.now(),
            name: name,
            options: []
        };

        if (currentModalTarget === 'root') {
            storeTreeData.push(newNode);
        } else {
            addNodeToParent(storeTreeData, currentModalTarget, newNode);
        }

        window.closeModal('modal-category');
        updateTreeView();
    };

    function addNodeToParent(nodes, parentId, newNode) {
        for (let node of nodes) {
            if (node.id === parentId) {
                if (!node.options) node.options = [];
                node.options.push(newNode);
                return true;
            }
            if (node.options && addNodeToParent(node.options, parentId, newNode)) return true;
        }
        return false;
    }

    window.deleteNode = (id) => {
        if (!confirm("هل أنت متأكد من حذف هذا القسم وكل تفرعاته؟")) return;
        storeTreeData = removeNodeById(storeTreeData, id);
        updateTreeView();
    };

    function removeNodeById(nodes, id) {
        return nodes.filter(node => {
            if (node.id === id) return false;
            if (node.options) node.options = removeNodeById(node.options, id);
            return true;
        });
    }

    // --- 4. PRODUCT MANAGER ---
    async function renderProductManager() {
        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>إدارة المنتجات</h3>
                <button onclick="window.openProductModal()" class="add-btn"><i data-lucide="plus-circle"></i> إضافة منتج جديد</button>
            </div>
            <div id="products-list" class="orders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(250px, 1fr)); gap: 20px;">
                <p style="text-align:center; grid-column: 1/-1;">جاري تحميل المنتجات...</p>
            </div>
        `;

        const productsContainer = document.getElementById('products-list');
        const snap = await db.collection('products').orderBy('timestamp', 'desc').get();

        if (snap.empty) {
            productsContainer.innerHTML = '<p style="text-align:center; grid-column: 1/-1; color:var(--text-dim);">لا توجد منتجات حالياً.</p>';
        } else {
            productsContainer.innerHTML = '';
            snap.forEach(doc => {
                const p = doc.data();
                const card = document.createElement('div');
                card.className = 'tree-item'; // Reusing style
                card.style.flexDirection = 'column';
                card.style.alignItems = 'flex-start';
                card.innerHTML = `
                    <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:10px;">
                        <span class="name">${p.name}</span>
                        <span style="color:var(--accent); font-weight:900;">${p.price} ج.م</span>
                    </div>
                    <div style="color:var(--text-dim); font-size:0.8rem; margin-bottom:10px;">
                        <i data-lucide="tag" style="width:12px;"></i> ${p.categoryName || 'بدون قسم'}
                    </div>
                    <button onclick="window.deleteProduct('${doc.id}')" class="action-link del"><i data-lucide="trash-2"></i> حذف المنتج</button>
                `;
                productsContainer.appendChild(card);
            });
        }
        lucide.createIcons();
    }

    window.openProductModal = async () => {
        const catSelect = document.getElementById('prod-category');
        catSelect.innerHTML = '<option value="">اختر القسم...</option>';

        // Flatten the tree for the select dropdown
        const categories = [];
        const flatten = (nodes, path = "") => {
            nodes.forEach(n => {
                const currentPath = path ? `${path} > ${n.name}` : n.name;
                categories.push({ id: n.id, name: currentPath });
                if (n.options) flatten(n.options, currentPath);
            });
        };
        flatten(storeTreeData);

        categories.forEach(c => {
            catSelect.innerHTML += `<option value="${c.id}" data-name="${c.name}">${c.name}</option>`;
        });

        document.getElementById('modal-product').classList.remove('hidden');
    };

    document.getElementById('save-product').onclick = async () => {
        const name = document.getElementById('prod-name').value.trim();
        const price = document.getElementById('prod-price').value.trim();
        const catSelect = document.getElementById('prod-category');
        const catId = catSelect.value;
        const catName = catSelect.options[catSelect.selectedIndex].dataset.name;

        if (!name || !price || !catId) return alert("يرجى ملء جميع البيانات");

        const btn = document.getElementById('save-product');
        btn.innerText = "جاري الحفظ...";
        btn.disabled = true;

        try {
            await db.collection('products').add({
                name,
                price,
                categoryId: catId,
                categoryName: catName,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });
            window.closeModal('modal-product');
            renderProductManager();
        } catch (e) {
            alert("خطأ في الحفظ: " + e.message);
        }
        btn.innerText = "حفظ المنتج";
        btn.disabled = false;
    };

    window.deleteProduct = async (id) => {
        if (!confirm("هل أنت متأكد من حذف هذا المنتج؟")) return;
        await db.collection('products').doc(id).delete();
        renderProductManager();
    };

    // --- 5. ORDER VIEWER ---
    async function renderOrderViewer() {
        const snap = await db.collection('orders').orderBy('timestamp', 'desc').limit(50).get();
        if (snap.empty) {
            tabContent.innerHTML = '<p style="text-align:center; padding:3rem; color:var(--text-dim);">لا توجد طلبات حالياً.</p>';
            return;
        }

        let html = `
            <table class="orders-table">
                <thead>
                    <tr>
                        <th>العميل</th>
                        <th>المنتج</th>
                        <th>الوقت</th>
                        <th>الحالة</th>
                    </tr>
                </thead>
                <tbody>
        `;

        snap.forEach(doc => {
            const order = doc.data();
            const date = order.timestamp ? new Date(order.timestamp.toDate()).toLocaleString('ar-EG') : 'غير مسجل';
            html += `
                <tr>
                    <td>${order.customer || 'زائر'}</td>
                    <td><span style="font-weight:700; color:var(--accent);">${order.item}</span></td>
                    <td>${date}</td>
                    <td><span class="status-badge">${order.status === 'new' ? 'طلب جديد' : order.status}</span></td>
                </tr>
            `;
        });
        html += '</tbody></table>';
        tabContent.innerHTML = html;
        lucide.createIcons();
    }

    function renderProductManager() {
        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>إدارة المنتجات</h3>
                <p style="color:var(--text-dim)">قريباً: رفع صور المنتجات وتحديد الأسعار بالتفصيل.</p>
            </div>
            <div style="background:var(--card); padding:3rem; border-radius:20px; text-align:center; border:1px solid var(--border);">
                <i data-lucide="construction" style="width:60px; height:60px; color:var(--accent); margin-bottom:1rem;"></i>
                <p>هذا القسم قيد التطوير حالياً لربطه بالمخزن.</p>
            </div>
        `;
        lucide.createIcons();
    }

});
