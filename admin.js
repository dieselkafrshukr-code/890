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

    // --- AUTH (SECURE MODE) ---
    // Force logout on every page load for maximum security
    auth.signOut().then(() => {
        loginScreen.classList.remove('hidden');
        adminPanel.classList.add('hidden');
    });

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
        if (!email || !pass) return alert("❌ يرجى إدخال الإيميل وكلمة المرور!");
        loginBtn.innerText = "⏳ جاري التحقق...";

        auth.setPersistence(firebase.auth.Auth.Persistence.SESSION)
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
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.querySelector('.sidebar');
    const sidebarOverlay = document.getElementById('sidebar-overlay');

    if (menuToggle) {
        menuToggle.onclick = () => {
            sidebar.classList.add('active');
            sidebarOverlay.classList.add('active');
        };
    }

    if (sidebarOverlay) {
        sidebarOverlay.onclick = () => {
            sidebar.classList.remove('active');
            sidebarOverlay.classList.remove('active');
        };
    }

    tabItems.forEach(item => {
        item.onclick = () => {
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            if (tabTitle) tabTitle.innerText = item.querySelector('span').innerText;
            loadTab(tab);

            // Close sidebar on mobile after clicking
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        };
    });

    function loadTab(tab) {
        if (!tabContent) return;
        tabContent.innerHTML = '<div style="text-align:center; padding:100px; color:var(--accent);">⭐ جاري تحميل البيانات...</div>';

        if (tab === 'orders') renderOrders();
        if (tab === 'categories') renderCategories();
        if (tab === 'products') renderProducts();
        if (tab === 'governorates') renderGovernorates();
        if (tab === 'coupons') renderCoupons();
    }

    // ============================================
    // SOUND NOTIFICATION FOR NEW ORDERS
    // ============================================
    let lastOrderCount = null;
    let soundEnabled = true;

    function playNotifSound() {
        if (!soundEnabled) return;
        try {
            const ctx = new (window.AudioContext || window.webkitAudioContext)();
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.type = 'sine';
            // Play a pleasant 2-note chime
            osc.frequency.setValueAtTime(880, ctx.currentTime);
            osc.frequency.setValueAtTime(1100, ctx.currentTime + 0.15);
            gain.gain.setValueAtTime(0.4, ctx.currentTime);
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
            osc.start(ctx.currentTime);
            osc.stop(ctx.currentTime + 0.6);
        } catch (e) { }
    }

    function showNewOrderToast() {
        let toast = document.getElementById('order-toast');
        if (!toast) {
            toast = document.createElement('div');
            toast.id = 'order-toast';
            toast.style.cssText = `
                position:fixed; top:20px; left:50%; transform:translateX(-50%);
                background:linear-gradient(135deg,#d4af37,#b8942e); color:#000;
                padding:14px 28px; border-radius:16px; font-weight:900; font-size:1rem;
                font-family:'Cairo',sans-serif; z-index:99999;
                box-shadow:0 10px 40px rgba(212,175,55,0.5);
                animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1);
            `;
            document.head.insertAdjacentHTML('beforeend', `
                <style>
                    @keyframes toastIn { from{transform:translateX(-50%) translateY(-40px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} }
                    @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateX(-50%) translateY(-20px)} }
                </style>
            `);
            document.body.appendChild(toast);
        }
        toast.innerText = '🛖 طلب جديد وصل!';
        toast.style.animation = 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => {
            toast.style.animation = 'toastOut 0.4s ease forwards';
        }, 3000);
    }

    // Real-time listener for new orders
    db.collection('orders').onSnapshot(snap => {
        if (lastOrderCount === null) {
            lastOrderCount = snap.size;
            return;
        }
        if (snap.size > lastOrderCount) {
            playNotifSound();
            showNewOrderToast();
        }
        lastOrderCount = snap.size;
    });

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
    async function renderCategories(forceFetch = false) {
        if (forceFetch || storeTreeData.length === 0) {
            tabContent.innerHTML = '<div style="text-align:center; padding:100px; color:var(--accent);">⭐ جاري تحميل شجرة الأقسام...</div>';
            const snap = await db.collection('settings').doc('storeTree').get();
            storeTreeData = snap.exists ? (snap.data().options || []) : [];
        }

        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>هيكل الأقسام</h3>
                <button onclick="window.openCategoryModal('root')" class="add-btn"><i data-lucide="plus"></i> إضافة قسم رئيسي</button>
            </div>
            <div id="tree-container"></div>
            <div style="margin-top:2rem; background:rgba(212,175,55,0.05); border:1px solid rgba(212,175,55,0.2); padding:1rem; border-radius:12px; margin-bottom:1rem;">
                <p style="color:var(--accent); font-size:0.9rem; font-weight:700;">💡 ملاحظة: التغييرات التي تجريها هنا (إضافة أو حذف) تكون "مؤقتة" حتى تضغط على زر الحفظ بالأسفل لتعميمها على الموقع.</p>
            </div>
            <button id="sync-tree" class="add-btn" style="width:100%; justify-content:center; height:60px;">
                <i data-lucide="save"></i> حفظ ونشر كوردات الموقع الآن
            </button>
        `;

        const container = document.getElementById('tree-container');
        if (storeTreeData.length === 0) {
            container.innerHTML = '<p style="text-align:center; padding:3rem; color:var(--text-dim);">لم يتم إضافة أقسام بعد. ابدأ بإضافة قسم رئيسي.</p>';
        } else {
            renderTreeView(storeTreeData, container);
        }

        document.getElementById('sync-tree').onclick = async () => {
            const btn = document.getElementById('sync-tree');
            const originalText = btn.innerHTML;
            btn.disabled = true;
            btn.innerText = "⏳ جاري الحفظ والنشر...";
            try {
                await db.collection('settings').doc('storeTree').set({ options: storeTreeData });
                alert("✅ تم تحديث ونشر خريطة الأقسام بنجاح!");
            } catch (e) {
                alert("❌ حدث خطأ أثناء الحفظ: " + e.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalText;
                lucide.createIcons();
            }
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

        // Re-attach save-cat event listener every time modal opens to ensure it's fresh
        const saveCatBtn = document.getElementById('save-cat');
        if (saveCatBtn) {
            saveCatBtn.onclick = () => {
                const nameInput = document.getElementById('cat-name');
                const name = nameInput.value.trim();
                if (!name) return;

                const newNode = { id: 'c_' + Date.now(), name: name, options: [] };

                if (currentModalTarget === 'root') {
                    storeTreeData.push(newNode);
                } else {
                    findAndAdd(storeTreeData, currentModalTarget, newNode);
                }

                window.closeModal('modal-category');
                renderCategories();
            };
        }
    };

    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    // Remove the global listener for save-cat since it's now handled in openCategoryModal
    // to avoid potential issues with element references.

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
            <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:20px; margin-bottom:2rem;">
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

            <!-- Sales Chart -->
            <div style="background:var(--card); border:1px solid var(--border); border-radius:20px; padding:1.5rem; margin-bottom:2rem;">
                <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:1.5rem; flex-wrap:wrap; gap:10px;">
                    <h3 style="font-weight:900; font-size:1.1rem;">📊 مبيعات آخر 7 أيام</h3>
                    <div style="display:flex; gap:8px;">
                        <button onclick="window.showChart('week')" id="chart-week-btn" style="padding:6px 14px; border-radius:8px; border:1px solid var(--accent); background:var(--accent); color:#000; font-weight:800; font-size:0.8rem; cursor:pointer; font-family:'Cairo',sans-serif;">أسبوعي</button>
                        <button onclick="window.showChart('month')" id="chart-month-btn" style="padding:6px 14px; border-radius:8px; border:1px solid #333; background:transparent; color:#fff; font-weight:800; font-size:0.8rem; cursor:pointer; font-family:'Cairo',sans-serif;">شهري</button>
                    </div>
                </div>
                <div style="position:relative; height:220px;">
                    <canvas id="sales-chart"></canvas>
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

            // Build sales chart from orders data
            buildSalesChart(ordersSnap);

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
                            value="${govData[gov] !== undefined ? govData[gov] : (window.LOCAL_SHIPPING_PRICES ? window.LOCAL_SHIPPING_PRICES[gov] : 0)}" 
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
            const originalHtml = btn.innerHTML;
            btn.disabled = true;
            btn.innerText = "⏳ جاري الحفظ في قاعدة البيانات...";

            try {
                const prices = {};
                EGYPT_GOVERNORATES.forEach(gov => {
                    const input = document.getElementById(`gov_${gov.replace(/\s/g, '_')}`);
                    if (input) {
                        prices[gov.trim()] = parseFloat(input.value) || 0;
                    }
                });

                console.log("💾 Attempting to save prices:", prices);

                await db.collection('settings').doc('governoratesPricing').set({
                    prices: prices,
                    lastUpdated: firebase.firestore.FieldValue.serverTimestamp()
                });

                alert("✅ رائع! تم حفظ الأسعار بنجاح في قاعدة البيانات.\nالموقع سيستخدم هذه الأسعار الجديدة فوراً.");
            } catch (error) {
                console.error("❌ Save Error:", error);
                alert("❌ حدث خطأ أثناء الحفظ: " + error.message);
            } finally {
                btn.disabled = false;
                btn.innerHTML = originalHtml;
                lucide.createIcons();
            }
        };

        lucide.createIcons();
    }

    // Expose for global access
    window.EGYPT_GOVERNORATES = EGYPT_GOVERNORATES;

    // ============================================
    // COUPONS MANAGEMENT
    // ============================================
    async function renderCoupons() {
        const snap = await db.collection('coupons').get();

        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>إدارة كوبونات الخصم</h3>
                <button onclick="window.openCouponModal()" class="add-btn"><i data-lucide="plus-circle"></i> إضافة كوبون جديد</button>
            </div>
            <div class="orders-table-wrapper" style="margin-top:20px;">
                <table style="width:100%; border-collapse:collapse; text-align:right;">
                    <thead>
                        <tr style="background:rgba(255,255,255,0.05); border-bottom:1px solid #333;">
                            <th style="padding:15px;">الكود</th>
                            <th style="padding:15px;">النوع</th>
                            <th style="padding:15px;">القيمة</th>
                            <th style="padding:15px;">إجراءات</th>
                        </tr>
                    </thead>
                    <tbody id="coupons-list"></tbody>
                </table>
            </div>

            <!-- Add/Edit Coupon Modal Shell -->
            <div id="coupon-modal" class="admin-modal hidden">
                <div class="login-card" style="max-width:400px; padding:2rem;">
                    <h3 style="margin-bottom:1.5rem; text-align:center; color:var(--accent);">🎫 كوبون جديد</h3>
                    <div class="input-group">
                        <label>كود الخصم (مثال: SAVE10)</label>
                        <input type="text" id="cp-code" placeholder="أدخل الكود هنا..." style="text-transform:uppercase;">
                    </div>
                    <div class="input-group" style="margin-top:1rem;">
                        <label>نوع الخصم</label>
                        <select id="cp-type" style="width:100%; padding:12px; background:#111; border:1px solid #333; color:#fff; border-radius:10px;">
                            <option value="percent">نسبة مئوية (%)</option>
                            <option value="fixed">مبلغ ثابت (ج.م)</option>
                        </select>
                    </div>
                    <div class="input-group" style="margin-top:1rem;">
                        <label>قيمة الخصم</label>
                        <input type="number" id="cp-value" placeholder="القيمة...">
                    </div>
                    <div style="display:flex; gap:10px; margin-top:2rem;">
                        <button onclick="window.saveCoupon()" class="add-btn" style="flex:1; justify-content:center;">حفظ الكوبون</button>
                        <button onclick="window.closeCouponModal()" class="action-link del" style="flex:1; text-align:center; border:1px solid #ff4444; border-radius:12px; color:#ff4444;">إلغاء</button>
                    </div>
                </div>
            </div>
        `;

        const list = document.getElementById('coupons-list');
        if (snap.empty) {
            list.innerHTML = '<tr><td colspan="4" style="text-align:center; padding:3rem; color:#666;">لا توجد كوبونات حالياً.</td></tr>';
        } else {
            snap.forEach(doc => {
                const cp = doc.data();
                const tr = document.createElement('tr');
                tr.style.borderBottom = '1px solid #222';
                tr.innerHTML = `
                    <td style="padding:15px; font-weight:800; color:var(--accent);">${doc.id}</td>
                    <td style="padding:15px;">${cp.type === 'percent' ? 'نسبة مئوية' : 'مبلغ ثابت'}</td>
                    <td style="padding:15px;">${cp.value} ${cp.type === 'percent' ? '%' : 'ج.م'}</td>
                    <td style="padding:15px;">
                        <button onclick="window.deleteCoupon('${doc.id}')" style="background:none; border:none; color:#ff4444; cursor:pointer;" title="حذف">
                            <i data-lucide="trash-2" style="width:18px;"></i>
                        </button>
                    </td>
                `;
                list.appendChild(tr);
            });
        }
        lucide.createIcons();
    }

    window.openCouponModal = () => document.getElementById('coupon-modal').classList.remove('hidden');
    window.closeCouponModal = () => {
        document.getElementById('coupon-modal').classList.add('hidden');
        document.getElementById('cp-code').value = '';
        document.getElementById('cp-value').value = '';
    };

    window.saveCoupon = async () => {
        const code = document.getElementById('cp-code').value.trim().toUpperCase();
        const type = document.getElementById('cp-type').value;
        const value = parseFloat(document.getElementById('cp-value').value);

        if (!code || isNaN(value)) return alert("❌ يرجى ملء جميع البيانات!");

        try {
            await db.collection('coupons').doc(code).set({
                type,
                value,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert("✅ تم حفظ الكوبون بنجاح!");
            window.closeCouponModal();
            renderCoupons();
        } catch (e) {
            alert("❌ خطأ أثناء الحفظ: " + e.message);
        }
    };

    window.deleteCoupon = async (id) => {
        if (!confirm(`هل أنت متأكد من حذف الكوبون ${id}؟`)) return;
        try {
            await db.collection('coupons').doc(id).delete();
            renderCoupons();
        } catch (e) {
            alert("❌ خطأ أثناء الحذف: " + e.message);
        }
    };

    // ============================================
    // SALES CHART
    // ============================================
    let salesChartInstance = null;
    let salesOrdersData = null;

    function buildSalesChart(ordersSnap) {
        salesOrdersData = ordersSnap;
        window.showChart('week');
    }

    window.showChart = (mode) => {
        if (!salesOrdersData) return;

        // Update button styles
        const weekBtn = document.getElementById('chart-week-btn');
        const monthBtn = document.getElementById('chart-month-btn');
        if (weekBtn && monthBtn) {
            if (mode === 'week') {
                weekBtn.style.background = 'var(--accent)'; weekBtn.style.color = '#000'; weekBtn.style.borderColor = 'var(--accent)';
                monthBtn.style.background = 'transparent'; monthBtn.style.color = '#fff'; monthBtn.style.borderColor = '#333';
            } else {
                monthBtn.style.background = 'var(--accent)'; monthBtn.style.color = '#000'; monthBtn.style.borderColor = 'var(--accent)';
                weekBtn.style.background = 'transparent'; weekBtn.style.color = '#fff'; weekBtn.style.borderColor = '#333';
            }
        }

        const days = mode === 'week' ? 7 : 30;
        const labels = [];
        const counts = [];
        const totals = [];

        // Build day-by-day buckets
        const now = new Date();
        for (let i = days - 1; i >= 0; i--) {
            const d = new Date(now);
            d.setDate(d.getDate() - i);
            const label = `${d.getDate()}/${d.getMonth() + 1}`;
            labels.push(label);
            counts.push(0);
            totals.push(0);
        }

        salesOrdersData.forEach(doc => {
            const o = doc.data();
            if (!o.timestamp) return;
            const date = o.timestamp.toDate();
            const diffDays = Math.floor((now - date) / (1000 * 60 * 60 * 24));
            if (diffDays < days) {
                const idx = days - 1 - diffDays;
                if (idx >= 0 && idx < days) {
                    counts[idx]++;
                    totals[idx] += o.total || 0;
                }
            }
        });

        const canvas = document.getElementById('sales-chart');
        if (!canvas) return;

        if (salesChartInstance) salesChartInstance.destroy();

        salesChartInstance = new Chart(canvas, {
            type: 'bar',
            data: {
                labels,
                datasets: [
                    {
                        label: 'عدد الطلبات',
                        data: counts,
                        backgroundColor: 'rgba(212,175,55,0.7)',
                        borderColor: '#d4af37',
                        borderWidth: 2,
                        borderRadius: 8,
                        yAxisID: 'y',
                    },
                    {
                        label: 'إجمالي المبيعات (ج.م)',
                        data: totals,
                        type: 'line',
                        borderColor: '#4caf50',
                        backgroundColor: 'rgba(76,175,80,0.1)',
                        borderWidth: 2,
                        pointBackgroundColor: '#4caf50',
                        pointRadius: 4,
                        tension: 0.4,
                        fill: true,
                        yAxisID: 'y1',
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        labels: { color: '#aaa', font: { family: 'Cairo', size: 11 } }
                    }
                },
                scales: {
                    x: {
                        ticks: { color: '#666', font: { family: 'Cairo', size: 10 } },
                        grid: { color: 'rgba(255,255,255,0.04)' }
                    },
                    y: {
                        type: 'linear',
                        position: 'right',
                        ticks: { color: '#d4af37', font: { size: 10 }, stepSize: 1 },
                        grid: { color: 'rgba(255,255,255,0.04)' },
                        title: { display: true, text: 'طلبات', color: '#d4af37', font: { size: 10 } }
                    },
                    y1: {
                        type: 'linear',
                        position: 'left',
                        ticks: { color: '#4caf50', font: { size: 10 } },
                        grid: { display: false },
                        title: { display: true, text: 'ج.م', color: '#4caf50', font: { size: 10 } }
                    }
                }
            }
        });
    };
});
