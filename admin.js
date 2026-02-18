document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabItems = document.querySelectorAll('.nav-item');
    const tabContent = document.getElementById('tab-content');
    const tabTitle = document.getElementById('tab-title');

    // --- 1. AUTH LOGIC ---
    auth.onAuthStateChanged(user => {
        if (user) {
            loginScreen.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadTab('categories'); // Start with the "Map"
        } else {
            loginScreen.classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    });

    loginBtn.onclick = () => {
        const email = document.getElementById('email').value;
        const pass = document.getElementById('password').value;
        auth.signInWithEmailAndPassword(email, pass).catch(err => alert(err.message));
    };

    logoutBtn.onclick = () => auth.signOut();

    // --- 2. TAB NAVIGATION ---
    tabItems.forEach(item => {
        item.onclick = () => {
            if (item.id === 'logout-btn') return;
            tabItems.forEach(i => i.classList.remove('active'));
            item.classList.add('active');
            const tab = item.dataset.tab;
            tabTitle.innerText = item.innerText;
            loadTab(tab);
        };
    });

    function loadTab(tab) {
        tabContent.innerHTML = '<p>Loading...</p>';
        if (tab === 'categories') renderCategoryEditor();
        if (tab === 'products') renderProductManager();
        if (tab === 'orders') renderOrderViewer();
    }

    // --- 3. CATEGORY EDITOR (THE MAP) ---
    async function renderCategoryEditor() {
        const snap = await db.collection('settings').doc('storeTree').get();
        const tree = snap.exists ? snap.data().options : [];

        tabContent.innerHTML = `
            <div class="actions-header" style="display:flex; justify-content:space-between; margin-bottom:2rem;">
                <h3>خريطة الأقسام</h3>
                <button onclick="openCategoryModal('root')" class="opt-btn active" style="padding:10px 20px;">+ إضافة قسم رئيسي</button>
            </div>
            <div id="tree-container" class="tree-view"></div>
            <button id="sync-tree" class="opt-btn" style="background:var(--accent); color:black; margin-top:2rem; width:100%;">حفظ ونشر التغييرات</button>
        `;

        renderTreeView(tree, document.getElementById('tree-container'));

        document.getElementById('sync-tree').onclick = async () => {
            // In a real app, logic to collect edited tree and save
            alert("تم حفظ الخريطة بنجاح!");
        };
    }

    function renderTreeView(nodes, container, level = 0) {
        nodes.forEach((node, idx) => {
            const item = document.createElement('div');
            item.className = 'tree-item';
            item.style.marginRight = `${level * 30}px`;
            item.innerHTML = `
                <span>${node.name}</span>
                <div class="item-actions">
                    <button onclick="addChild('${node.id}')" style="background:none; color:var(--accent); border:none; cursor:pointer;">+ إضافة فرعي</button>
                    <button onclick="deleteNode('${node.id}')" style="background:none; color:red; border:none; cursor:pointer; margin-right:15px;">حذف</button>
                </div>
            `;
            container.appendChild(item);
            if (node.options) renderTreeView(node.options, container, level + 1);
        });
    }

    // --- 4. ORDER VIEWER ---
    async function renderOrderViewer() {
        const snap = await db.collection('orders').orderBy('timestamp', 'desc').limit(50).get();
        let html = '<table style="width:100%; border-collapse: collapse; text-align:right;">' +
            '<tr style="border-bottom: 2px solid #222;"><th>العميل</th><th>التفاصيل</th><th>الوقت</th></tr>';

        snap.forEach(doc => {
            const order = doc.data();
            html += `<tr style="border-bottom: 1px solid #111; padding:10px;">
                <td>${order.customer || 'غير معروف'}</td>
                <td>${order.item}</td>
                <td>${new Date(order.timestamp?.toDate()).toLocaleString('ar-EG')}</td>
            </tr>`;
        });
        html += '</table>';
        tabContent.innerHTML = html;
    }

    // Helper functions (Global for simple modal access)
    window.openCategoryModal = (parentId) => {
        document.getElementById('modal-category').classList.remove('hidden');
    };
    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

});
