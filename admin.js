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
    let currentModalTarget = null;

    // --- 1. AUTH LOGIC ---
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
        loginBtn.innerText = "جاري الدخول...";
        auth.signInWithEmailAndPassword(email, pass).catch(err => {
            alert("❌ فشل الدخول: " + err.message);
            loginBtn.innerText = "تسجيل الدخول";
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
        tabContent.innerHTML = '<div style="text-align:center; padding:50px;">جاري تحميل البيانات...</div>';
        if (tab === 'categories') renderCategoryEditor();
        if (tab === 'products') renderProductManager();
        if (tab === 'orders') renderOrderViewer();
    }

    // --- 3. CATEGORY EDITOR ---
    async function renderCategoryEditor() {
        const snap = await db.collection('settings').doc('storeTree').get();
        storeTreeData = snap.exists ? (snap.data().options || []) : [];
        updateTreeView();
    }

    function updateTreeView() {
        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>خريطة الأقسام</h3>
                <button onclick="window.openCategoryModal('root')" class="add-btn"><i data-lucide="plus-circle"></i> إضافة قسم رئيسي</button>
            </div>
            <div id="tree-container" class="tree-view"></div>
            <button id="sync-tree" class="add-btn" style="background:var(--accent); color:black; margin-top:3rem; width:100%; justify-content:center;">
                <i data-lucide="save"></i> حفظ ونشر التغييرات على الموقع
            </button>
        `;

        const container = document.getElementById('tree-container');
        if (storeTreeData.length === 0) {
            container.innerHTML = '<p style="text-align:center; color:var(--text-dim); padding:2rem;">لا توجد أقسام بعد.</p>';
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
                alert("✅ تم حفظ ونشر التغييرات بنجاح!");
            } catch (e) { alert("❌ خطأ: " + e.message); }
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
            item.innerHTML = `
                <span class="name">${node.name}</span>
                <div class="item-actions">
                    <button onclick="window.openCategoryModal('${node.id}')" class="action-link add"><i data-lucide="plus"></i> فرعي</button>
                    <button onclick="window.deleteNode('${node.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            container.appendChild(item);
            if (node.options) renderTreeView(node.options, container, level + 1);
        });
    }

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
        const newNode = { id: 'id_' + Date.now(), name: name, options: [] };
        if (currentModalTarget === 'root') storeTreeData.push(newNode);
        else addNodeToParent(storeTreeData, currentModalTarget, newNode);
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
        if (!confirm("هل متأكد من حذف هذا القسم؟")) return;
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
                <div>
                    <h3>إدارة المنتجات</h3>
                    <p style="color:var(--text-dim); font-size:0.85rem;">تحكم في صور وألوان ومقاسات منتجاتك</p>
                </div>
                <button onclick="window.openProductModal()" class="add-btn"><i data-lucide="plus-circle"></i> إضافة منتج جديد</button>
            </div>
            <div id="products-list-grid" class="orders-grid" style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 20px;">
                <p style="text-align:center; grid-column: 1/-1; padding: 4rem; color:var(--text-dim);">جاري التحميل...</p>
            </div>
        `;

        try {
            const container = document.getElementById('products-list-grid');
            const snap = await db.collection('products').orderBy('timestamp', 'desc').get();
            if (snap.empty) {
                container.innerHTML = '<div style="text-align:center; grid-column:1/-1; padding:5rem;"><p style="color:var(--text-dim);">لا توجد منتجات.</p></div>';
            } else {
                container.innerHTML = '';
                snap.forEach(doc => {
                    const p = doc.data();
                    const card = document.createElement('div');
                    card.className = 'tree-item';
                    card.style.flexDirection = 'row';
                    card.style.alignItems = 'center';
                    card.style.gap = '15px';
                    card.innerHTML = `
                        <img src="${p.mainImage || 'https://via.placeholder.com/60'}" style="width:60px; height:60px; border-radius:12px; object-fit:cover;">
                        <div style="flex-grow:1;">
                            <div style="display:flex; justify-content:space-between; width:100%; margin-bottom:4px;">
                                <span class="name" style="font-size:1.1rem; font-weight:800;">${p.name}</span>
                                <span style="color:var(--accent); font-weight:900;">${p.price} ج.م</span>
                            </div>
                            <div style="color:var(--text-dim); font-size:0.75rem;">${p.categoryName || 'قسم عام'}</div>
                        </div>
                        <button onclick="window.deleteProduct('${doc.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                    `;
                    container.appendChild(card);
                });
            }
        } catch (e) { console.error(e); }
        lucide.createIcons();
    }

    window.openProductModal = async () => {
        const catSelect = document.getElementById('prod-category');
        catSelect.innerHTML = '<option value="">-- اختر القسم --</option>';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-main-img').value = '';
        document.getElementById('prod-main-sizes').value = '';
        document.getElementById('color-variants-container').innerHTML = '';

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
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.dataset.name = c.name;
            opt.innerText = c.name;
            catSelect.appendChild(opt);
        });
        document.getElementById('modal-product').classList.remove('hidden');
    };

    window.addColorVariant = () => {
        const container = document.getElementById('color-variants-container');
        const rowId = 'color_' + Date.now();
        const row = document.createElement('div');
        row.className = 'color-variant-row';
        row.id = rowId;

        row.innerHTML = `
            <div class="variant-header" style="flex-wrap:wrap;">
                <input type="text" placeholder="اسم اللون (أبيض، أسود...)" class="v-name" style="width:100%;">
                <input type="file" accept="image/*" class="v-img" style="width:100%;">
                <input type="text" placeholder="المقاسات المتاحة للون ده (M, L, XL...)" class="v-sizes-text" style="width:100%; margin-top:10px;">
                <button type="button" onclick="document.getElementById('${rowId}').remove()" style="background:none; border:none; color:#ff4d4d; cursor:pointer; margin-top:10px; width:100%; display:flex; justify-content:center; gap:5px;"><i data-lucide="trash-2"></i> حذف هذا اللون</button>
            </div>
        `;
        container.appendChild(row);
        lucide.createIcons();
    };

    // Helper to convert file to Base64 with compression
    const fileToBase64 = (file) => new Promise((resolve, reject) => {
        if (!file) return resolve(null);

        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = (event) => {
            const img = new Image();
            img.src = event.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas');
                const MAX_WIDTH = 800; // Good balance for store images
                let width = img.width;
                let height = img.height;

                if (width > MAX_WIDTH) {
                    height *= MAX_WIDTH / width;
                    width = MAX_WIDTH;
                }

                canvas.width = width;
                canvas.height = height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(img, 0, 0, width, height);

                // Compress to 0.7 quality to save space in DB
                const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
                resolve(dataUrl);
            };
        };
        reader.onerror = error => reject(error);
    });

    document.getElementById('save-product').onclick = async () => {
        const nameInput = document.getElementById('prod-name');
        const priceInput = document.getElementById('prod-price');
        const catSelect = document.getElementById('prod-category');
        const mainSizesInput = document.getElementById('prod-main-sizes');
        const mainImgInput = document.getElementById('prod-main-img');
        const mainImgFile = mainImgInput.files[0];

        const name = nameInput.value.trim();
        const price = priceInput.value.trim();
        const catId = catSelect.value;
        const selectedOpt = catSelect.options[catSelect.selectedIndex];
        const catName = selectedOpt ? selectedOpt.dataset.name : "";
        const mainSizes = mainSizesInput.value.split(',').map(s => s.trim()).filter(s => s);

        // Collect Colors & Sizes
        const colorRows = document.querySelectorAll('.color-variant-row');

        if (!name || !price || !catId || !mainImgFile || !mainSizes.length) {
            return alert("❌ من فضلك اكمل البيانات الأساسية (الاسم، السعر، القسم، الصورة الرئيسية، المقاسات الرئيسية)!");
        }

        const btn = document.getElementById('save-product');
        const originalText = btn.innerText;
        btn.disabled = true;
        btn.innerText = "⏳ تحويل وحفظ...";

        try {
            // 1. Convert Main Image to Base64
            const mainBase64 = await fileToBase64(mainImgFile);

            // 2. Convert Color Variants
            const colorsData = [];
            for (let [index, row] of Array.from(colorRows).entries()) {
                const nameV = row.querySelector('.v-name').value.trim();
                const fileV = row.querySelector('.v-img').files[0];
                const sizesRaw = row.querySelector('.v-sizes-text').value;
                const sizesV = sizesRaw.split(',').map(s => s.trim()).filter(s => s);

                if (nameV && fileV) {
                    btn.innerText = `⏳ معالجة اللون ${index + 1}/${colorRows.length}...`;
                    const colorBase64 = await fileToBase64(fileV);
                    colorsData.push({ name: nameV, image: colorBase64, sizes: sizesV });
                }
            }

            // 3. Save to Firestore DIRECTLY
            btn.innerText = "⏳ جاري الحفظ في الداتابيز...";
            await db.collection('products').add({
                name,
                price: parseFloat(price),
                categoryId: catId,
                categoryName: catName,
                mainImage: mainBase64,
                mainSizes: mainSizes,
                colors: colorsData,
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            });

            window.closeModal('modal-product');
            alert("✅ تم الحفظ بنجاح!");
            renderProductManager();
        } catch (e) {
            console.error(e);
            alert("❌ خطأ: " + e.message);
        } finally {
            btn.innerText = originalText;
            btn.disabled = false;
        }
    };

    window.deleteProduct = async (id) => {
        if (!confirm("حذف المنتج؟")) return;
        await db.collection('products').doc(id).delete();
        renderProductManager();
    };

    // --- 5. ORDER VIEWER ---
    async function renderOrderViewer() {
        const snap = await db.collection('orders').orderBy('timestamp', 'desc').limit(50).get();
        if (snap.empty) {
            tabContent.innerHTML = '<p style="text-align:center; padding:3rem;">لا توجد طلبات.</p>';
            return;
        }
        let html = '<table class="orders-table"><thead><tr><th>العميل</th><th>الطلب</th><th>الوقت</th><th>الحالة</th></tr></thead><tbody>';
        snap.forEach(doc => {
            const o = doc.data();
            const date = o.timestamp ? new Date(o.timestamp.toDate()).toLocaleString('ar-EG') : '';
            html += `<tr><td>${o.customer}</td><td>${o.item}</td><td>${date}</td><td><span class="status-badge">${o.status}</span></td></tr>`;
        });
        html += '</tbody></table>';
        tabContent.innerHTML = html;
        lucide.createIcons();
    }
});
