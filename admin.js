document.addEventListener('DOMContentLoaded', () => {
    lucide.createIcons();

    const loginScreen = document.getElementById('login-screen');
    const adminPanel = document.getElementById('admin-panel');
    const loginBtn = document.getElementById('login-btn');
    const logoutBtn = document.getElementById('logout-btn');
    const tabItems = document.querySelectorAll('.nav-item:not(.logout)');
    const tabContent = document.getElementById('tab-content');
    const tabTitle = document.getElementById('tab-title');

    // State
    let storeTreeData = [];
    let currentModalTarget = null;

    // --- AUTH & PERMISSIONS ---
    const PERMISSIONS = {
        'mm12@gmail.com': 'ALL', // Super Admin
        'orders@eltoufan.com': ['orders'], // Orders Only
        'store@eltoufan.com': ['products', 'categories', 'governorates', 'coupons'] // Content Manager
    };

    auth.onAuthStateChanged(user => {
        if (user) {
            const userEmail = user.email.toLowerCase();
            const allowedTabs = PERMISSIONS[userEmail];

            if (!allowedTabs) {
                // Unknown user - no access
                alert("⛔ ليس لديك صلاحية للدخول إلى لوحة التحكم.");
                auth.signOut();
                loginScreen.classList.remove('hidden');
                adminPanel.classList.add('hidden');
                return;
            }

            if (allowedTabs === 'ALL') {
                tabItems.forEach(item => item.style.display = 'flex');
            } else {
                let firstValidTab = null;
                tabItems.forEach(item => {
                    const tabName = item.dataset.tab;
                    if (allowedTabs.includes(tabName)) {
                        item.style.display = 'flex';
                        if (!firstValidTab) firstValidTab = tabName;
                    } else {
                        item.style.display = 'none';
                    }
                });
                loadTab(firstValidTab);
                loginScreen.classList.add('hidden');
                adminPanel.classList.remove('hidden');
                return;
            }

            loginScreen.classList.add('hidden');
            adminPanel.classList.remove('hidden');
            loadTab('orders');
        } else {
            loginScreen.classList.remove('hidden');
            adminPanel.classList.add('hidden');
        }
    });

    loginBtn.onclick = () => {
        const email = document.getElementById('email').value.trim().toLowerCase();
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
            if (window.innerWidth <= 900) {
                sidebar.classList.remove('active');
                sidebarOverlay.classList.remove('active');
            }
        };
    });

    function loadTab(tab) {
        if (!tabContent) return;

        // Security Check for Tab Access
        const user = auth.currentUser;
        if (user) {
            const userEmail = user.email.toLowerCase();
            const allowed = PERMISSIONS[userEmail];
            if (allowed !== 'ALL' && (!Array.isArray(allowed) || !allowed.includes(tab))) {
                tabContent.innerHTML = '<div style="text-align:center; padding:50px; color:red;">⛔ غير مصرح لك الدخول لهذا القسم</div>';
                return;
            }
        }

        tabContent.innerHTML = '<div style="text-align:center; padding:100px; color:var(--accent);">⭐ جاري تحميل البيانات...</div>';
        if (tab === 'orders') renderOrders();
        if (tab === 'categories') renderCategories();
        if (tab === 'products') renderProducts();
        if (tab === 'governorates') renderGovernorates();
        if (tab === 'coupons') renderCoupons();
        if (tab === 'settings') renderSettings();
    }

    // --- NOTIFICATIONS ---
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
            toast.style.cssText = `position:fixed; top:20px; left:50%; transform:translateX(-50%); background:linear-gradient(135deg,#d4af37,#b8942e); color:#000; padding:14px 28px; border-radius:16px; font-weight:900; font-size:1rem; font-family:'Cairo',sans-serif; z-index:99999; box-shadow:0 10px 40px rgba(212,175,55,0.5); animation: toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1);`;
            document.head.insertAdjacentHTML('beforeend', `<style>@keyframes toastIn { from{transform:translateX(-50%) translateY(-40px);opacity:0} to{transform:translateX(-50%) translateY(0);opacity:1} } @keyframes toastOut { from{opacity:1} to{opacity:0;transform:translateX(-50%) translateY(-20px)} }</style>`);
            document.body.appendChild(toast);
        }
        toast.innerText = '🛖 طلب جديد وصل!';
        toast.style.animation = 'toastIn 0.4s cubic-bezier(0.34,1.56,0.64,1)';
        clearTimeout(toast._timer);
        toast._timer = setTimeout(() => { toast.style.animation = 'toastOut 0.4s ease forwards'; }, 3000);
    }

    db.collection('orders').onSnapshot(snap => {
        if (lastOrderCount === null) { lastOrderCount = snap.size; return; }
        if (snap.size > lastOrderCount) { playNotifSound(); showNewOrderToast(); }
        lastOrderCount = snap.size;
    });

    // --- 1. ORDERS ---
    async function renderOrders() {
        const snap = await db.collection('orders').orderBy('timestamp', 'desc').get();

        // Calculate Stats
        let todaySales = 0, todayCount = 0;
        let weekSales = 0, weekCount = 0;
        let monthSales = 0, monthCount = 0;

        const now = new Date();
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay())); // Sunday
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

        const allOrders = [];
        snap.forEach(doc => {
            const o = { id: doc.id, ...doc.data() };
            allOrders.push(o);

            const date = o.timestamp ? o.timestamp.toDate() : new Date();
            const total = parseFloat(o.total) || 0;

            if (date >= startOfDay) { todaySales += total; todayCount++; }
            if (date >= startOfWeek) { weekSales += total; weekCount++; }
            if (date >= startOfMonth) { monthSales += total; monthCount++; }
        });

        // Stats HTML
        const statsHtml = `
            <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap:15px; margin-bottom:1.5rem;">
                <div class="stat-card" style="background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--border); position:relative; overflow:hidden;">
                    <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:8px;">مبيعات اليوم</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#4caf50;">${todaySales.toLocaleString()} ج.م</div>
                    <div style="font-size:0.8rem; color:var(--text); margin-top:4px;">${todayCount} طلب</div>
                    <i data-lucide="calendar" style="position:absolute; top:20px; left:20px; color:rgba(76,175,80,0.1); width:40px; height:40px;"></i>
                </div>
                <div class="stat-card" style="background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--border); position:relative; overflow:hidden;">
                    <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:8px;">مبيعات هذا الأسبوع</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#2196f3;">${weekSales.toLocaleString()} ج.م</div>
                    <div style="font-size:0.8rem; color:var(--text); margin-top:4px;">${weekCount} طلب</div>
                    <i data-lucide="bar-chart-2" style="position:absolute; top:20px; left:20px; color:rgba(33,150,243,0.1); width:40px; height:40px;"></i>
                </div>
                <div class="stat-card" style="background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--border); position:relative; overflow:hidden;">
                    <div style="font-size:0.85rem; color:var(--text-dim); margin-bottom:8px;">مبيعات هذا الشهر</div>
                    <div style="font-size:1.8rem; font-weight:800; color:#ff9800;">${monthSales.toLocaleString()} ج.م</div>
                    <div style="font-size:0.8rem; color:var(--text); margin-top:4px;">${monthCount} طلب</div>
                    <i data-lucide="trending-up" style="position:absolute; top:20px; left:20px; color:rgba(255,152,0,0.1); width:40px; height:40px;"></i>
                </div>
            </div>`;

        tabContent.innerHTML = `
            ${statsHtml}
            <div class="actions-header">
                <h3>الطلبات الواردة <span style="color:var(--accent);" id="orders-count">(${snap.size})</span></h3>
                <button id="delete-all-orders" class="action-link del" style="background:rgba(255,68,68,0.1); padding:10px 20px; border-radius:12px;">
                    <i data-lucide="trash-2"></i> مسح الكل
                </button>
            </div>
            <div style="margin-bottom:1rem;">
                <div style="position:relative;">
                    <i data-lucide="search" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--text-dim); width:18px;"></i>
                    <input id="orders-search" type="text" placeholder="🔍 بحث برقم التليفون أو اسم العميل..." 
                        style="width:100%; padding:12px 44px 12px 16px; background:var(--card); border:1px solid var(--border); border-radius:12px; color:var(--text); font-family:inherit; font-size:0.95rem;">
                </div>
            </div>
            <div id="orders-list-container"></div>`;

        function renderOrdersTable(orders) {
            const container = document.getElementById('orders-list-container');
            if (!orders.length) {
                container.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">لا توجد نتائج</div>';
                return;
            }
            let html = `<div class="orders-table-wrapper"><table class="orders-table">
                <thead><tr>
                    <th>العميل</th><th>التليفون</th><th class="mobile-hide">العنوان</th><th class="mobile-hide">المحافظة</th>
                    <th class="mobile-hide">المنتجات</th><th>الإجمالي</th><th class="mobile-hide">الدفع</th><th class="mobile-hide">الوقت</th><th>الحالة</th><th>إجراءات</th>
                </tr></thead><tbody>`;
            orders.forEach(o => {
                const date = o.timestamp ? new Date(o.timestamp.toDate()).toLocaleString('ar-EG') : 'قيد المعالجة';
                // Build product thumbnails
                const imgs = (o.images || []).map(img =>
                    `<img src="${img}" style="width:40px; height:40px; border-radius:8px; object-fit:cover; border:1px solid var(--border);">`
                ).join('');
                const itemText = `<div style="display:flex; align-items:center; gap:6px; flex-wrap:wrap;">
                    ${imgs}
                    <span style="font-size:0.78rem; color:var(--text-dim);">${o.item || ''}</span>
                </div>`;
                html += `<tr id="order-${o.id}" onclick="window.viewOrder('${o.id}')" style="cursor:pointer;">
                    <td data-label="العميل"><div style="font-weight:900;">${o.customer || '-'}</div></td>
                    <td data-label="التليفون">
                        <div style="font-size:0.85rem; direction:ltr; font-family:monospace;">${o.phone || '-'}</div>
                        ${o.phone2 ? `<div style="font-size:0.7rem; direction:ltr; font-family:monospace; color:var(--accent);">${o.phone2}</div>` : ''}
                    </td>
                    <td data-label="العنوان" class="mobile-hide" style="font-size:0.8rem; color:var(--text-dim);">${o.address || '-'}</td>
                    <td data-label="المحافظة" class="mobile-hide"><div style="font-weight:700; color:var(--accent);">${o.governorate || '-'}</div></td>
                    <td data-label="المنتجات" class="mobile-hide">${itemText}</td>
                    <td data-label="الإجمالي" style="font-weight:900; color:#4caf50;">${o.total || '-'} ج.م</td>
                    <td data-label="الدفع" class="mobile-hide"><span class="status-badge" style="background:${o.paymentMethod === 'online' ? 'rgba(33,150,243,0.2)' : 'rgba(76,175,80,0.2)'}; color:${o.paymentMethod === 'online' ? '#2196f3' : '#4caf50'}; border: 1px solid ${o.paymentMethod === 'online' ? '#2196f3' : '#4caf50'};">${o.paymentMethod === 'online' ? 'اون لاين' : 'كاش'}</span></td>
                    <td data-label="الوقت" class="mobile-hide" style="font-size:0.8rem;">${date}</td>
                    <td data-label="الحالة"><span class="status-badge">${o.status || 'جديد'}</span></td>
                    <td data-label="إجراءات" onclick="event.stopPropagation()">
                        <button onclick="window.deleteOrder('${o.id}')" class="action-link del" style="padding:8px; border-radius:8px;">
                            <i data-lucide="trash-2" style="width:18px;"></i>
                        </button>
                    </td>
                </tr>`;
            });
            html += '</tbody></table></div>';
            container.innerHTML = html;
            lucide.createIcons();
        }

        renderOrdersTable(allOrders);

        // Search by phone or name
        document.getElementById('orders-search').addEventListener('input', (e) => {
            const q = e.target.value.trim().toLowerCase();
            if (!q) { renderOrdersTable(allOrders); return; }
            renderOrdersTable(allOrders.filter(o =>
                (o.phone || '').includes(q) ||
                (o.customer || '').toLowerCase().includes(q)
            ));
        });

        document.getElementById('delete-all-orders').onclick = async () => {
            if (!confirm('⚠️ هل أنت متأكد تماماً من حذف جميع الطلبات؟')) return;
            const batch = db.batch();
            snap.docs.forEach(doc => batch.delete(doc.ref));
            await batch.commit();
            alert('✅ تم مسح جميع الطلبات بنجاح');
            renderOrders();
        };
        lucide.createIcons();
    }

    window.deleteOrder = async (id) => {
        if (!confirm("هل تريد حذف هذا الطلب؟")) return;
        await db.collection('orders').doc(id).delete();
        document.getElementById(`order-${id}`)?.remove();
        closeModal('modal-order-detail');
    };

    window.viewOrder = async (id) => {
        const doc = await db.collection('orders').doc(id).get();
        if (!doc.exists) return;
        const o = doc.data();
        const date = o.timestamp ? new Date(o.timestamp.toDate()).toLocaleString('ar-EG') : 'قيد المعالجة';
        const images = o.images || [];

        // Parse products - actual stored format: "هودي (لون: أسود) (مقاس: L) [‪SKU-001‬]"
        const rawItems = (o.item || '').split(' | ');
        const productsHtml = rawItems.map((itemStr, idx) => {
            const colorMatch = itemStr.match(/\(لون:\s*([^)]+)\)/);
            const sizeMatch = itemStr.match(/\(مقاس:\s*([^)]+)\)/);
            const skuMatch = itemStr.match(/\[[\u202a\u202c]*([^\]‪‬]+)[\u202a\u202c]*\]/);

            const color = colorMatch ? colorMatch[1].trim() : null;
            const size = sizeMatch ? sizeMatch[1].trim() : null;
            const sku = skuMatch ? skuMatch[1].trim() : null;

            // Clean product name
            const cleanName = itemStr
                .replace(/\(لون:[^)]+\)/g, '')
                .replace(/\(مقاس:[^)]+\)/g, '')
                .replace(/\[[\u202a\u202c]*[^\]‪‬]+[\u202a\u202c]*\]/g, '')
                .trim();

            const img = images[idx] || null;

            return `<div style="display:flex; align-items:center; gap:12px; background:#0a0a0a; border:1px solid #222; border-radius:12px; padding:12px;">
                ${img
                    ? `<img src="${img}" alt="" onclick="window.openImageModal('${img}')"
                        style="width:72px; height:72px; object-fit:cover; border-radius:10px; border:2px solid var(--border); cursor:zoom-in; flex-shrink:0; transition:transform 0.2s;"
                        onmouseover="this.style.transform='scale(1.08)'" onmouseout="this.style.transform='scale(1)'">`
                    : `<div style="width:72px;height:72px;border-radius:10px;border:2px dashed #333;display:flex;align-items:center;justify-content:center;flex-shrink:0;color:#555;font-size:1.8rem;">📦</div>`
                }
                <div style="flex:1; min-width:0;">
                    <div style="font-weight:900; font-size:0.95rem; margin-bottom:8px; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;">${cleanName || itemStr}</div>
                    <div style="display:flex; flex-wrap:wrap; gap:6px;">
                        ${color ? `<span style="background:rgba(212,175,55,0.15); color:#d4af37; border:1px solid rgba(212,175,55,0.3); padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:700;">🎨 ${color}</span>` : ''}
                        ${size ? `<span style="background:rgba(33,150,243,0.15); color:#64b5f6; border:1px solid rgba(33,150,243,0.3); padding:3px 10px; border-radius:20px; font-size:0.75rem; font-weight:700;">📐 ${size}</span>` : ''}
                        ${sku ? `<span style="background:rgba(255,255,255,0.05); color:#888; border:1px solid #333; padding:3px 10px; border-radius:20px; font-size:0.72rem; font-family:monospace; letter-spacing:1px;">${sku}</span>` : ''}
                    </div>
                </div>
            </div>`;
        }).join('');

        const content = document.getElementById('order-detail-content');
        content.innerHTML = `
            <div style="display:flex; flex-direction:column; gap:14px; font-family:'Cairo', sans-serif;">
                <div style="background:var(--glass); padding:15px; border-radius:12px; border:1px solid var(--border);">
                    <div style="color:var(--accent); font-weight:900; margin-bottom:6px;">👤 بيانات العميل:</div>
                    <div style="font-size:1.1rem; font-weight:700;">${o.customer || '-'}</div>
                    <div style="margin-top:4px; direction:ltr; font-family:monospace; font-size:0.95rem;">${o.phone || '-'}</div>
                    ${o.phone2 ? `<div style="margin-top:3px; direction:ltr; font-family:monospace; color:var(--accent); font-size:0.9rem;">📞 ${o.phone2}</div>` : ''}
                </div>

                <div style="background:var(--glass); padding:15px; border-radius:12px; border:1px solid var(--border);">
                    <div style="color:var(--accent); font-weight:900; margin-bottom:6px;">📍 العنوان والمحافظة:</div>
                    <div style="font-weight:700;">${o.governorate || '-'}</div>
                    <div style="font-size:0.9rem; color:var(--text-dim); margin-top:4px;">${o.address || '-'}</div>
                </div>

                <div style="background:var(--glass); padding:15px; border-radius:12px; border:1px solid var(--border);">
                    <div style="color:var(--accent); font-weight:900; margin-bottom:12px;">📦 المنتجات المطلوبة (${rawItems.length}):</div>
                    <div style="display:flex; flex-direction:column; gap:10px;">
                        ${productsHtml || '<div style="color:var(--text-dim);">لا توجد بيانات.</div>'}
                    </div>
                </div>

                <div style="display:grid; grid-template-columns:1fr 1fr; gap:10px;">
                    <div style="background:var(--glass); padding:15px; border-radius:12px; border:1px solid var(--border);">
                        <div style="color:var(--accent); font-weight:900; margin-bottom:4px;">💰 الإجمالي:</div>
                        <div style="font-size:1.2rem; font-weight:900; color:#4caf50;">${o.total || '-'} ج.م</div>
                        ${o.shipping ? `<div style="font-size:0.8rem; color:var(--text-dim); margin-top:2px;">شحن: ${o.shipping} ج.م</div>` : ''}
                    </div>
                    <div style="background:var(--glass); padding:15px; border-radius:12px; border:1px solid var(--border);">
                        <div style="color:var(--accent); font-weight:900; margin-bottom:4px;">💳 الدفع:</div>
                        <div style="font-weight:700; font-size:0.9rem;">${o.paymentMethod === 'online' ? '🔵 فيزا / اون لاين' : '💵 عند الاستلام'}</div>
                    </div>
                </div>

                <div style="background:var(--glass); padding:12px 15px; border-radius:12px; border:1px solid var(--border); font-size:0.85rem; color:var(--text-dim);">
                    🕒 ${date}
                </div>

                <div id="order-actions-container" style="display:flex; gap:10px; padding-top:4px;">
                    <button onclick="window.deleteOrder('${id}')" class="add-btn" style="flex:1; background:#ff4444; color:#fff; justify-content:center; padding:12px;">🗑️ حذف الطلب</button>
                    <button id="wa-admin-contact" class="add-btn" style="flex:2; background:#25d366; color:#fff; justify-content:center; padding:12px; font-weight:700;">
                        <i data-lucide="message-circle" style="width:18px; margin-left:8px;"></i> تواصل واتساب
                    </button>
                </div>
            </div>
        `;

        // Handle Admin WhatsApp Contact with Template
        const contactBtn = document.getElementById('wa-admin-contact');
        if (contactBtn) {
            contactBtn.onclick = async () => {
                if (!o.phone) return alert("❌ لم يتم العثور على رقم هاتف لهذا العميل!");

                try {
                    const msgSnap = await db.collection('settings').doc('adminWaMessage').get();
                    let template = msgSnap.exists ? msgSnap.data().template : "مرحباً {customer}، بخصوص طلبك رقم {id}:\n\nالمنتجات:\n{items}";

                    // Format items list for message
                    const itemDetails = rawItems.map(str => "- " + str.replace(/\[.*?\]/g, '').trim()).join('\n');

                    let finalMsg = template
                        .replace(/{customer}/g, o.customer || 'عميلنا العزيز')
                        .replace(/{id}/g, id.slice(-6).toUpperCase())
                        .replace(/{items}/g, itemDetails);

                    const phone = o.phone.startsWith('0') ? '2' + o.phone : o.phone;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(finalMsg)}`, '_blank');
                } catch (e) {
                    console.error("WA Template Error:", e);
                    const phone = o.phone.startsWith('0') ? '2' + o.phone : o.phone;
                    window.open(`https://wa.me/${phone}?text=${encodeURIComponent(`مرحباً ${o.customer || ''}، بخصوص طلبك رقم: ${id}`)}`, '_blank');
                }
            };
        }

        document.getElementById('modal-order-detail').classList.remove('hidden');
        lucide.createIcons();
    };

    window.openImageModal = (imageUrl) => {
        const modal = document.getElementById('image-modal');
        const modalImg = document.getElementById('image-modal-content');
        modal.style.display = 'block';
        modalImg.src = imageUrl;
        const span = document.getElementsByClassName('close-image-modal')[0];
        span.onclick = () => {
            modal.style.display = 'none';
        };
        modal.onclick = (event) => {
            if (event.target === modal) {
                modal.style.display = 'none';
            }
        };
    };

    // Add the image modal HTML to the body if it doesn't exist
    if (!document.getElementById('image-modal')) {
        document.body.insertAdjacentHTML('beforeend', `
            <div id="image-modal" style="display:none; position:fixed; z-index:100000; padding-top:100px; left:0; top:0; width:100%; height:100%; overflow:auto; background-color:rgba(0,0,0,0.9);">
                <span class="close-image-modal" style="position:absolute; top:15px; right:35px; color:#f1f1f1; font-size:40px; font-weight:bold; transition:0.3s; cursor:pointer;">&times;</span>
                <img class="modal-content" id="image-modal-content" style="margin:auto; display:block; width:80%; max-width:700px;">
            </div>
        `);
    }

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
            
            <div style="margin-bottom:1.5rem; position:relative;">
                <i data-lucide="search" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--text-dim); width:18px;"></i>
                <input id="cat-search" type="text" placeholder="🔍 بحث عن قسم محدد..." 
                    style="width:100%; padding:12px 44px 12px 16px; background:var(--card); border:1px solid var(--border); border-radius:12px; color:var(--text); font-family:inherit;">
            </div>

            <div id="tree-container"></div>
            
            <div style="margin-top:2rem; background:rgba(212,175,55,0.05); border:1px solid rgba(212,175,55,0.2); padding:1rem; border-radius:12px; margin-bottom:1rem;">
                <p style="color:var(--accent); font-size:0.9rem; font-weight:700;">💡 ملاحظة: التغييرات التي تجريها هنا (إضافة أو حذف) تكون "مؤقتة" حتى تضغط على زر الحفظ بالأسفل لتعميمها على الموقع.</p>
            </div>
            
            <button id="sync-tree" class="add-btn" style="width:100%; justify-content:center; height:60px;"><i data-lucide="save"></i> حفظ ونشر كوردات الموقع الآن</button>
        `;

        const container = document.getElementById('tree-container');
        const searchInput = document.getElementById('cat-search');

        const performRender = (query = '') => {
            container.innerHTML = '';
            if (storeTreeData.length === 0) {
                container.innerHTML = '<p style="text-align:center; padding:3rem; color:var(--text-dim);">لم يتم إضافة أقسام بعد.</p>';
            } else {
                const filteredData = query ? searchInTree(storeTreeData, query.toLowerCase()) : storeTreeData;
                renderTreeView(filteredData, container, 0, !!query);
            }
            lucide.createIcons();
        };

        searchInput.oninput = (e) => performRender(e.target.value);

        performRender();

        document.getElementById('sync-tree').onclick = async () => {
            await db.collection('settings').doc('storeTree').set({ options: storeTreeData });
            alert("✅ تم تحديث ونشر خريطة الأقسام بنجاح!");
        };
        lucide.createIcons();
    }

    function searchInTree(nodes, query) {
        let results = [];
        nodes.forEach(node => {
            const matches = node.name.toLowerCase().includes(query) || (node.nameEn && node.nameEn.toLowerCase().includes(query));
            let subResults = [];
            if (node.options) subResults = searchInTree(node.options, query);

            if (matches || subResults.length > 0) {
                // If it matches or has children that match, keep it
                results.push({ ...node, options: subResults });
            }
        });
        return results;
    }

    function renderTreeView(nodes, container, level = 0, query = '') {
        nodes.forEach(node => {
            const el = document.createElement('div');
            el.className = 'tree-item';
            el.style.marginRight = `${level * 15}px`;

            let displayName = node.name;
            let displayEn = node.nameEn || '';

            if (query) {
                const regex = new RegExp(`(${query})`, 'gi');
                displayName = node.name.replace(regex, '<mark style="background:var(--accent); color:#000; border-radius:4px; padding:0 2px;">$1</mark>');
                if (displayEn) displayEn = displayEn.replace(regex, '<mark style="background:var(--accent); color:#000; border-radius:4px; padding:0 2px;">$1</mark>');
                el.style.borderRight = "2px solid var(--accent)";
            }

            el.innerHTML = `
                <div style="flex-grow:1; display:flex; align-items:center; gap:10px;">
                    <i data-lucide="${level === 0 ? 'folder' : 'chevron-left'}" style="width:18px; color:var(--accent);"></i>
                    <span class="name">${displayName} <span style="color:var(--text-dim); font-size:0.8rem;">(${displayEn || 'No EN'})</span></span>
                </div>
                <div class="item-actions">
                    <button onclick="window.openCategoryModal('${node.id}')" class="action-link add"><i data-lucide="plus-square"></i> فرعي</button>
                    <button onclick="window.deleteNode('${node.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                </div>
            `;
            container.appendChild(el);
            if (node.options) renderTreeView(node.options, container, level + 1, query);
        });
    }

    window.openCategoryModal = (id) => {
        currentModalTarget = id;
        document.getElementById('cat-name').value = '';
        document.getElementById('cat-name-en').value = '';
        document.getElementById('modal-category').classList.remove('hidden');
        document.getElementById('save-cat').onclick = () => {
            const name = document.getElementById('cat-name').value.trim();
            const nameEn = document.getElementById('cat-name-en').value.trim();
            if (!name) return;
            const newNode = { id: 'c_' + Date.now(), name, nameEn: nameEn || name, options: [] };
            if (currentModalTarget === 'root') storeTreeData.push(newNode); else findAndAdd(storeTreeData, currentModalTarget, newNode);
            window.closeModal('modal-category'); renderCategories();
        };
    };

    function findAndAdd(nodes, targetId, newNode) {
        for (let n of nodes) { if (n.id === targetId) { n.options.push(newNode); return true; } if (n.options && findAndAdd(n.options, targetId, newNode)) return true; }
    }

    window.deleteNode = (id) => { if (confirm("هل تريد حذف هذا القسم وكل تفرعاته؟")) { storeTreeData = filterNodes(storeTreeData, id); renderCategories(); } };
    function filterNodes(nodes, targetId) { return nodes.filter(n => { if (n.id === targetId) return false; if (n.options) n.options = filterNodes(n.options, targetId); return true; }); }

    window.closeModal = (id) => document.getElementById(id).classList.add('hidden');

    // --- 3. PRODUCTS ---
    async function renderProducts() {
        // Show loading state initially
        tabContent.innerHTML = `<div style="text-align:center; padding:5rem; color:var(--accent);">
            <i data-lucide="loader" class="spin" style="width:40px; height:40px; margin-bottom:1rem;"></i>
            <div style="font-weight:700;">جاري تحميل لوحة التحكم...</div>
        </div>`;
        lucide.createIcons();

        let prodsSnap = { size: 0, forEach: () => { } };
        let ordersSnap = { size: 0, forEach: () => { } };
        let settingsSnap = { exists: false, data: () => ({}) };
        let couponsSnap = { size: 0 };

        // Fetch data individually
        try { prodsSnap = await db.collection('products').orderBy('timestamp', 'desc').get(); } catch (e) { console.error("Error fetching products:", e); }
        try { ordersSnap = await db.collection('orders').orderBy('timestamp', 'desc').get(); } catch (e) { console.error("Error fetching orders:", e); }
        try { settingsSnap = await db.collection('settings').doc('storeTree').get(); } catch (e) { console.warn("Store tree not found:", e); }
        try { couponsSnap = await db.collection('coupons').get(); } catch (e) { console.warn("Coupons not found:", e); }

        // Calculate Sales Stats safely
        let todaySales = 0, weekSales = 0, monthSales = 0;
        try {
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
            const startOfWeek = new Date(now.setDate(now.getDate() - now.getDay()));
            const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

            ordersSnap.forEach(doc => {
                const o = doc.data();
                const date = o.timestamp ? o.timestamp.toDate() : new Date();
                const total = parseFloat(o.total) || 0;
                if (date >= startOfDay) todaySales += total;
                if (date >= startOfWeek) weekSales += total;
                if (date >= startOfMonth) monthSales += total;
            });
        } catch (e) { console.error("Error calculating stats:", e); }

        const countNodes = (nodes) => nodes.reduce((acc, n) => acc + 1 + (n.options ? countNodes(n.options) : 0), 0);
        let catsCount = 0;
        if (settingsSnap.exists && settingsSnap.data().options) {
            catsCount = countNodes(settingsSnap.data().options);
        } else {
            catsCount = storeTreeData.length || 0;
        }

        tabContent.innerHTML = `
            <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:15px; margin-bottom:1.5rem;">
                <div class="stat-card" style="background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--border); text-align:center;">
                    <div style="font-size:1.8rem; font-weight:900; color:var(--accent);">${prodsSnap.size}</div>
                    <div style="color:var(--text-dim); font-size:0.8rem;">منتج</div>
                </div>
                <div class="stat-card" style="background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--border); text-align:center;">
                    <div style="font-size:1.8rem; font-weight:900; color:#fff;">${catsCount}</div>
                    <div style="color:var(--text-dim); font-size:0.8rem;">قسم</div>
                </div>
                <div class="stat-card" style="background:var(--card); padding:20px; border-radius:16px; border:1px solid var(--border); text-align:center;">
                    <div style="font-size:1.8rem; font-weight:900; color:#4caf50;">${ordersSnap.size}</div>
                    <div style="color:var(--text-dim); font-size:0.8rem;">طلب</div>
                </div>
            </div>

            <!-- Financial Stats -->
            <div class="stats-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(140px, 1fr)); gap:15px; margin-bottom:2rem;">
                <div class="stat-card" style="background:rgba(76,175,80,0.1); padding:15px; border-radius:12px; border:1px solid rgba(76,175,80,0.3); text-align:center;">
                    <div style="font-size:1.2rem; font-weight:800; color:#4caf50;">${todaySales.toLocaleString()}</div>
                    <div style="color:var(--text-dim); font-size:0.75rem;">مبيعات اليوم</div>
                </div>
                <div class="stat-card" style="background:rgba(33,150,243,0.1); padding:15px; border-radius:12px; border:1px solid rgba(33,150,243,0.3); text-align:center;">
                    <div style="font-size:1.2rem; font-weight:800; color:#2196f3;">${weekSales.toLocaleString()}</div>
                    <div style="color:var(--text-dim); font-size:0.75rem;">الأسبوع</div>
                </div>
                <div class="stat-card" style="background:rgba(255,152,0,0.1); padding:15px; border-radius:12px; border:1px solid rgba(255,152,0,0.3); text-align:center;">
                    <div style="font-size:1.2rem; font-weight:800; color:#ff9800;">${monthSales.toLocaleString()}</div>
                    <div style="color:var(--text-dim); font-size:0.75rem;">الشهر</div>
                </div>
            </div>

            <div class="actions-header">
                <h3>إدارة المنتجات</h3>
                <button onclick="window.openProductModal()" class="add-btn"><i data-lucide="plus-circle"></i> إضافة منتج جديد</button>
            </div>
            <div style="margin-bottom:1rem;">
                <div style="position:relative;">
                    <i data-lucide="search" style="position:absolute; right:14px; top:50%; transform:translateY(-50%); color:var(--text-dim); width:18px;"></i>
                    <input id="prods-search" type="text" placeholder="🔍 بحث باسم المنتج أو الكود SKU..."
                        style="width:100%; padding:12px 44px 12px 16px; background:var(--card); border:1px solid var(--border); border-radius:12px; color:var(--text); font-family:inherit; font-size:0.95rem;">
                </div>
            </div>
            <div id="products-grid" style="display:grid; grid-template-columns: repeat(auto-fill, minmax(320px, 1fr)); gap:20px;"></div>`;

        const allProds = [];
        prodsSnap.forEach(doc => allProds.push({ id: doc.id, ...doc.data() }));

        function renderProdsGrid(prods) {
            const grid = document.getElementById('products-grid');
            grid.innerHTML = '';
            if (!prods.length) { grid.innerHTML = '<div style="color:var(--text-dim); text-align:center; padding:3rem; grid-column:1/-1;">لا توجد منتجات حالياً. أضف منتجك الأول!</div>'; return; }
            prods.forEach(p => {
                const isHidden = p.hidden === true;
                const div = document.createElement('div');
                div.className = 'product-item-card';
                div.id = `prod-card-${p.id}`;
                if (isHidden) div.style.opacity = '0.5';
                div.innerHTML = `
                    <div style="display:flex; gap:12px; align-items:center;">
                        <div style="position:relative; flex-shrink:0;">
                            <img src="${p.mainImage}" style="width:70px; height:70px; border-radius:15px; object-fit:cover;">
                            ${isHidden ? '<div style="position:absolute;inset:0;background:rgba(0,0,0,0.5);border-radius:15px;display:flex;align-items:center;justify-content:center;"><i data-lucide="eye-off" style="width:20px;color:#fff;"></i></div>' : ''}
                        </div>
                        <div style="flex-grow:1; min-width:0;">
                            <div style="font-weight:900; overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">${p.name} <span style="color:var(--text-dim); font-size:0.8rem;">(${p.nameEn || ''})</span></div>
                            <div style="color:var(--accent); font-weight:800;">${p.price} ج.م</div>
                            <div style="display:flex; gap:6px; align-items:center; margin-top:4px; flex-wrap:wrap;">
                                ${p.sku ? `<span style="font-family:monospace; font-size:0.75rem; color:var(--text-dim); background:rgba(255,255,255,0.05); padding:2px 8px; border-radius:6px; letter-spacing:1px;">🏷️ ${p.sku}</span>` : ''}
                                ${isHidden ? '<span style="font-size:0.7rem; background:rgba(255,80,80,0.15); color:#ff6b6b; border:1px solid rgba(255,80,80,0.3); padding:2px 8px; border-radius:6px;">مخفي من الموقع</span>' : '<span style="font-size:0.7rem; background:rgba(76,175,80,0.15); color:#4caf50; border:1px solid rgba(76,175,80,0.3); padding:2px 8px; border-radius:6px;">ظاهر</span>'}
                            </div>
                        </div>
                    </div>
                    <div class="item-actions" style="margin-top:10px;">
                        <button onclick="window.toggleProductVisibility('${p.id}', ${isHidden})" class="action-link" title="${isHidden ? 'إظهار في الموقع' : 'إخفاء من الموقع'}" style="color:${isHidden ? '#4caf50' : '#ff9800'};">
                            <i data-lucide="${isHidden ? 'eye' : 'eye-off'}"></i>
                        </button>
                        <button onclick="window.editProduct('${p.id}')" class="action-link add"><i data-lucide="edit"></i></button>
                        <button onclick="window.deleteProduct('${p.id}')" class="action-link del"><i data-lucide="trash-2"></i></button>
                    </div>`;
                grid.appendChild(div);
            });
            lucide.createIcons();
        }

        renderProdsGrid(allProds);

        // Search products
        const searchInput = document.getElementById('prods-search');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => {
                const q = e.target.value.trim().toLowerCase();
                if (!q) { renderProdsGrid(allProds); return; }
                renderProdsGrid(allProds.filter(p =>
                    (p.name || '').toLowerCase().includes(q) ||
                    (p.nameEn || '').toLowerCase().includes(q) ||
                    (p.sku || '').toLowerCase().includes(q)
                ));
            });
        }
        lucide.createIcons();
    }

    function generateSKU() {
        // Just a fallback - sequential SKUs are generated in openProductModal
        return String(Date.now()).slice(-4);
    }

    async function getNextSKU() {
        try {
            const snap = await db.collection('products').get();
            let maxNum = 0;
            snap.forEach(doc => {
                const sku = doc.data().sku || '';
                const num = parseInt(sku);
                if (!isNaN(num) && num > maxNum) maxNum = num;
            });
            return String(maxNum + 1);
        } catch (e) {
            return String(Date.now()).slice(-3);
        }
    }

    window.openProductModal = async (prefillSku) => {
        document.getElementById('editing-prod-id').value = '';
        document.getElementById('prod-name').value = '';
        document.getElementById('prod-name-en').value = '';
        document.getElementById('prod-price').value = '';
        document.getElementById('prod-sku').value = prefillSku || await getNextSKU();
        document.getElementById('prod-main-sizes').value = '';
        document.getElementById('prod-main-color').value = '';
        document.getElementById('prod-main-color-en').value = '';
        document.getElementById('prod-main-img').value = '';
        document.getElementById('color-variants-container').innerHTML = '';

        // Always fetch fresh categories from Firestore
        const select = document.getElementById('prod-category');
        select.innerHTML = '<option value="">⏳ جاري تحميل الأقسام...</option>';
        try {
            const snap = await db.collection('settings').doc('storeTree').get();
            const treeData = snap.exists ? (snap.data().options || []) : storeTreeData;
            select.innerHTML = '<option value="">-- اختر القسم --</option>';
            const flatten = (nodes, path = "") => {
                nodes.forEach(n => {
                    const fullPath = path ? `${path} > ${n.name}` : n.name;
                    const opt = document.createElement('option');
                    opt.value = n.id;
                    opt.dataset.name = fullPath;
                    opt.innerText = fullPath;
                    select.appendChild(opt);
                    if (n.options) flatten(n.options, fullPath);
                });
            };
            flatten(treeData);
        } catch (e) {
            select.innerHTML = '<option value="">⚠️ تعذر تحميل الأقسام</option>';
        }
        document.getElementById('modal-product').classList.remove('hidden');
    };

    window.closeProductModal = () => document.getElementById('modal-product').classList.add('hidden');

    window.addColorVariant = () => {
        const id = 'v_' + Date.now();
        const div = document.createElement('div');
        div.className = 'variant-card';
        div.id = id;
        div.innerHTML = `
            <div class="variant-top" style="grid-template-columns: 1fr 1fr 1fr 2fr auto; gap:10px;">
                <input type="text" placeholder="اسم اللون (عربي)" class="v-name">
                <input type="text" placeholder="Color (EN)" class="v-name-en">
                <input type="file" accept="image/*" class="v-img">
                <input type="text" placeholder="المقاسات (Sizes)" class="v-sizes-text">
                <button type="button" onclick="document.getElementById('${id}').remove()" class="action-link del"><i data-lucide="trash-2"></i></button>
            </div>`;
        document.getElementById('color-variants-container').appendChild(div);
        lucide.createIcons();
    };

    const fileToBase64 = (file) => new Promise((resolve) => {
        const reader = new FileReader(); reader.readAsDataURL(file);
        reader.onload = (e) => {
            const img = new Image(); img.src = e.target.result;
            img.onload = () => {
                const canvas = document.createElement('canvas'); const MAX = 800; let w = img.width, h = img.height;
                if (w > MAX) { h *= MAX / w; w = MAX; } canvas.width = w; canvas.height = h;
                const ctx = canvas.getContext('2d'); ctx.drawImage(img, 0, 0, w, h); resolve(canvas.toDataURL('image/jpeg', 0.7));
            };
        };
    });

    document.getElementById('save-product').onclick = async () => {
        const editingId = document.getElementById('editing-prod-id').value;
        const name = document.getElementById('prod-name').value.trim();
        const nameEn = document.getElementById('prod-name-en').value.trim();
        const price = document.getElementById('prod-price').value;
        const catSelect = document.getElementById('prod-category');
        const mainImg = document.getElementById('prod-main-img').files[0];

        if (!name || !price || !catSelect.value) return alert("❌ بيانات ناقصة");

        const btn = document.getElementById('save-product');
        btn.disabled = true;
        btn.innerText = "⏳ جاري الحفظ...";

        try {
            const productData = {
                name,
                nameEn: nameEn || name,
                price: parseFloat(price),
                sku: (document.getElementById('prod-sku').value || '').trim().toUpperCase() || generateSKU(),
                categoryId: catSelect.value,
                categoryName: catSelect.options[catSelect.selectedIndex].dataset.name,
                mainColor: document.getElementById('prod-main-color').value,
                mainColorEn: document.getElementById('prod-main-color-en').value || document.getElementById('prod-main-color').value,
                mainSizes: document.getElementById('prod-main-sizes').value.split(',').map(s => s.trim()).filter(s => s),
                timestamp: firebase.firestore.FieldValue.serverTimestamp()
            };

            if (mainImg) productData.mainImage = await fileToBase64(mainImg);

            const variants = [];
            for (let row of document.querySelectorAll('.variant-card')) {
                const vName = row.querySelector('.v-name').value;
                const vNameEn = row.querySelector('.v-name-en').value || vName;
                const vFile = row.querySelector('.v-img').files[0];

                if (vName) {
                    let imgData = row.dataset.existingImg;
                    if (vFile) {
                        try { imgData = await fileToBase64(vFile); } catch (e) { console.warn("Failed to process image:", vName); }
                    }

                    variants.push({
                        name: vName,
                        nameEn: vNameEn,
                        image: imgData,
                        sizes: row.querySelector('.v-sizes-text').value.split(',').map(s => s.trim()).filter(s => s)
                    });
                }
            }
            productData.colors = variants;

            if (editingId) {
                await db.collection('products').doc(editingId).update(productData);
                alert('✅ تم تحديث المنتج بنجاح');
            } else {
                await db.collection('products').add(productData);
                alert('✅ تم إضافة المنتج بنجاح');
            }
            window.closeProductModal();
            renderProducts();
        } catch (e) {
            console.error(e);
            alert("❌ خطأ: " + e.message);
        } finally {
            btn.disabled = false;
            btn.innerText = "حفظ ونشر";
        }
    };

    window.editProduct = async (id) => {
        try {
            const doc = await db.collection('products').doc(id).get();
            if (!doc.exists) return;
            const p = doc.data();

            // openProductModal is async - await it so category dropdown is populated
            await window.openProductModal(p.sku || '');

            const mTitle = document.querySelector('#modal-product .modal-header h3');
            if (mTitle) mTitle.innerText = 'تعديل المنتج';
            document.getElementById('editing-prod-id').value = id;
            document.getElementById('prod-name').value = p.name || '';
            document.getElementById('prod-name-en').value = p.nameEn || '';
            document.getElementById('prod-price').value = p.price || '';
            document.getElementById('prod-main-color').value = p.mainColor || '';
            document.getElementById('prod-main-color-en').value = p.mainColorEn || '';
            document.getElementById('prod-sku').value = p.sku || '';
            document.getElementById('prod-main-sizes').value = (p.mainSizes || []).join(', ');

            // Set category - dropdown is now populated because openProductModal was awaited
            if (p.categoryId) {
                document.getElementById('prod-category').value = p.categoryId;
            }

            const container = document.getElementById('color-variants-container');
            container.innerHTML = '';
            if (p.colors && Array.isArray(p.colors)) {
                p.colors.forEach(v => {
                    const rid = 'v_' + Math.random().toString(36).substr(2, 9);
                    const div = document.createElement('div');
                    div.className = 'variant-card';
                    div.id = rid;
                    div.dataset.existingImg = v.image || '';
                    div.innerHTML = `
                        <div class="variant-top" style="grid-template-columns: 1fr 1fr 1fr 2fr auto; gap:10px;">
                            <input type="text" class="v-name" value="${v.name || ''}" placeholder="اسم اللون (عربي)">
                            <input type="text" class="v-name-en" value="${v.nameEn || ''}" placeholder="Color (EN)">
                            <div style="font-size:0.6rem; display:flex; flex-direction:column; align-items:center; justify-content:center;">
                                ${v.image ? `<img src="${v.image}" style="width:30px; height:30px; object-fit:cover; border-radius:4px; margin-bottom:4px;">` : 'No Img'}
                                <span style="color:#aaa;">صورة</span>
                            </div>
                            <input type="file" class="v-img" style="font-size:0.7rem;">
                            <input type="text" class="v-sizes-text" value="${(v.sizes || []).join(', ')}">
                            <button type="button" onclick="document.getElementById('${rid}').remove()" class="action-link del"><i data-lucide="trash-2"></i></button>
                        </div>`;
                    container.appendChild(div);
                });
            }
            lucide.createIcons();
        } catch (e) {
            console.error('Error editing product:', e);
            alert('❌ خطأ في تحميل بيانات المنتج: ' + e.message);
        }
    };

    window.toggleProductVisibility = async (id, currentlyHidden) => {
        try {
            const newHidden = !currentlyHidden;
            await db.collection('products').doc(id).update({ hidden: newHidden });
            renderProducts();
        } catch (e) {
            alert('❌ خطأ: ' + e.message);
        }
    };

    window.deleteProduct = async (id) => {
        if (confirm('⚠️ هل أنت متأكد تماماً من حذف هذا المنتج؟')) {
            try {
                await db.collection('products').doc(id).delete();
                renderProducts();
            } catch (e) { console.error(e); }
        }
    };
    // --- 4. GOVERNORATES ---
    async function renderGovernorates() {
        tabContent.innerHTML = `<div class="actions-header"><h3>🗺️ أسعار الشحن للمحافظات</h3></div><div id="gov-container"></div><button id="save-gov-prices" class="add-btn" style="width:100%; justify-content:center; margin-top:2rem; height:60px;"><i data-lucide="save"></i> حفظ أسعار الشحن</button>`;
        const snap = await db.collection('settings').doc('governoratesPricing').get();
        const govData = snap.exists ? snap.data().prices : {};
        const govs = ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية", "البحر الأحمر", "البحيرة", "الفيوم", "الغربية", "الإسماعيلية", "المنوفية", "المنيا", "القليوبية", "الوادي الجديد", "السويس", "أسوان", "أسيوط", "بني سويف", "بورسعيد", "دمياط", "الشرقية", "جنوب سيناء", "كفر الشيخ", "مطروح", "الأقصر", "قنا", "شمال سيناء", "سوهاج"];
        let html = '<table style="width:100%;"><thead><tr><th>المحافظة</th><th>السعر</th></tr></thead><tbody>';
        govs.forEach(g => { html += `<tr><td>${g}</td><td><input type="number" id="gov_${g.replace(/\s/g, '_')}" value="${govData[g] || 0}"></td></tr>`; });
        document.getElementById('gov-container').innerHTML = html + '</tbody></table>';
        document.getElementById('save-gov-prices').onclick = async () => {
            const prices = {}; govs.forEach(g => { prices[g] = parseFloat(document.getElementById(`gov_${g.replace(/\s/g, '_')}`).value) || 0; });
            await db.collection('settings').doc('governoratesPricing').set({ prices }); alert("✅ تم الحفظ");
        };
    }

    // --- 5. COUPONS ---
    async function renderCoupons() {
        tabContent.innerHTML = `
            <div class="actions-header">
                <h3>🎫 إدارة الكوبونات</h3>
                <button onclick="window.openCouponModal()" class="add-btn"><i data-lucide="plus"></i> إضافة كوبون</button>
            </div>
            <div id="coupons-list" style="display:grid; gap:15px; margin-top:1rem;"></div>
            <div id="coupon-modal" class="admin-modal hidden">
                <div class="modal-card" style="max-width:420px; width:100%;">
                    <div class="modal-header">
                        <h3>🎫 كوبون جديد</h3>
                        <button onclick="window.closeCouponModal()" class="close-modal"><i data-lucide="x"></i></button>
                    </div>
                    <div class="input-group">
                        <label>الكود (بالأحرف الكبيرة):</label>
                        <input id="cp-code" placeholder="مثال: SAVE20" style="text-transform:uppercase; letter-spacing:2px;">
                    </div>
                    <div class="input-group">
                        <label>نوع الخصم:</label>
                        <select id="cp-type">
                            <option value="percent">نسبة مئوية (%)</option>
                            <option value="fixed">مبلغ ثابت (ج.م)</option>
                        </select>
                    </div>
                    <div class="input-group">
                        <label>قيمة الخصم:</label>
                        <input id="cp-value" type="number" placeholder="مثال: 20" min="0">
                    </div>
                    <div class="input-group">
                        <label>الحد الأقصى للاستخدام (0 = بلا حد):</label>
                        <input id="cp-limit" type="number" value="0" min="0">
                    </div>
                    <div class="modal-btns">
                        <button onclick="window.saveCoupon()" class="save-btn">حفظ الكوبون</button>
                        <button onclick="window.closeCouponModal()" class="cancel-btn">إلغاء</button>
                    </div>
                </div>
            </div>`;

        const snap = await db.collection('coupons').get();
        const list = document.getElementById('coupons-list');

        if (snap.empty) {
            list.innerHTML = '<div style="text-align:center; padding:3rem; color:var(--text-dim);">لا توجد كوبونات بعد.</div>';
            lucide.createIcons();
            return;
        }

        snap.forEach(doc => {
            const c = doc.data();
            const usage = c.usageCount || 0;
            const limit = c.limit || 0;
            const limitText = limit > 0 ? `${usage} / ${limit}` : `${usage} / ∞`;
            const isExhausted = limit > 0 && usage >= limit;
            const typeLabel = c.type === 'percent' ? `${c.value}%` : `${c.value} ج.م`;

            const d = document.createElement('div');
            d.style.cssText = `background:var(--card, #111); border:1px solid ${isExhausted ? '#ff4444' : 'var(--border)'}; border-radius:16px; padding:18px 20px; display:flex; align-items:center; gap:16px; flex-wrap:wrap;`;
            d.innerHTML = `
                <div style="flex:1; min-width:150px;">
                    <div style="font-size:1.3rem; font-weight:900; font-family:monospace; color:var(--accent); letter-spacing:3px;">${doc.id}</div>
                    <div style="color:var(--text-dim); font-size:0.85rem; margin-top:4px;">خصم: <span style="color:#4caf50; font-weight:700;">${typeLabel}</span></div>
                </div>
                <div style="text-align:center;">
                    <div style="font-size:1.2rem; font-weight:900; color:${isExhausted ? '#ff4444' : '#fff'};">${limitText}</div>
                    <div style="color:var(--text-dim); font-size:0.8rem;">مرات الاستخدام</div>
                    ${isExhausted ? '<div style="color:#ff4444; font-size:0.75rem; font-weight:700;">⛔ منتهي</div>' : ''}
                </div>
                <div style="display:flex; gap:8px;">
                    <button onclick="window.resetCouponUsage('${doc.id}')" class="action-link add" title="إعادة تعيين العداد" style="padding:8px; border-radius:8px;">
                        <i data-lucide="refresh-cw" style="width:18px;"></i>
                    </button>
                    <button onclick="window.deleteCoupon('${doc.id}')" class="action-link del" style="padding:8px; border-radius:8px;">
                        <i data-lucide="trash-2" style="width:18px;"></i>
                    </button>
                </div>`;
            list.appendChild(d);
        });

        lucide.createIcons();
    }

    window.openCouponModal = () => document.getElementById('coupon-modal').classList.remove('hidden');
    window.closeCouponModal = () => document.getElementById('coupon-modal').classList.add('hidden');

    window.saveCoupon = async () => {
        const code = (document.getElementById('cp-code').value || '').trim().toUpperCase();
        const type = document.getElementById('cp-type').value;
        const value = parseFloat(document.getElementById('cp-value').value);
        const limit = parseInt(document.getElementById('cp-limit').value) || 0;

        if (!code) return alert('❌ يرجى إدخال الكود!');
        if (isNaN(value) || value <= 0) return alert('❌ يرجى إدخال قيمة صحيحة للخصم!');

        try {
            await db.collection('coupons').doc(code).set({
                type: type,
                value: value,
                limit: limit,
                usageCount: 0,
                createdAt: firebase.firestore.FieldValue.serverTimestamp()
            });
            alert(`✅ تم حفظ الكوبون: ${code}`);
            window.closeCouponModal();
            renderCoupons();
        } catch (e) {
            alert('❌ خطأ في الحفظ: ' + e.message);
        }
    };

    window.resetCouponUsage = async (id) => {
        if (!confirm(`إعادة تعيين عداد الكوبون "${id}" إلى صفر؟`)) return;
        await db.collection('coupons').doc(id).update({ usageCount: 0 });
        alert('✅ تم إعادة التعيين');
        renderCoupons();
    };

    window.deleteCoupon = async (id) => {
        if (!confirm(`حذف الكوبون "${id}"؟`)) return;
        await db.collection('coupons').doc(id).delete();
        renderCoupons();
    };

    // --- 6. GENERAL SETTINGS ---
    async function renderSettings() {
        tabContent.innerHTML = `
            <div class="actions-header"><h3>⚙️ إعدادات المتجر العامة</h3></div>
            <div class="settings-grid" style="display:grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap:20px; margin-top:2rem;">
                
                <div class="settings-card" style="background:var(--card); padding:24px; border-radius:20px; border:1px solid var(--border);">
                    <div style="font-weight:900; font-size:1.1rem; margin-bottom:20px; color:var(--accent); display:flex; align-items:center; gap:10px;">
                        <i data-lucide="phone"></i> أرقام الواتساب (استقبال الطلبات)
                    </div>
                    <div class="input-group" style="margin-bottom:15px;">
                        <label>الرقم الأول (مثال: 201012345678):</label>
                        <input id="set-wa-1" type="text" placeholder="2010xxxxxxxx">
                    </div>
                    <div class="input-group" style="margin-bottom:15px;">
                        <label>الرقم الثاني (اختياري):</label>
                        <input id="set-wa-2" type="text" placeholder="2010xxxxxxxx">
                    </div>
                    <button id="save-wa-settings" class="save-btn" style="width:100%; margin-top:10px; height:50px;">حفظ الأرقام</button>
                </div>

                <div class="settings-card" style="background:var(--card); padding:24px; border-radius:20px; border:1px solid var(--border);">
                    <div style="font-weight:900; font-size:1.1rem; margin-bottom:20px; color:var(--accent); display:flex; align-items:center; gap:10px;">
                        <i data-lucide="message-square"></i> رسالة التواصل الإدارية (واتساب)
                    </div>
                    <div class="input-group" style="margin-bottom:15px;">
                        <label>القالب الافتراضي للرسالة:</label>
                        <textarea id="set-wa-template" style="width:100%; height:120px; background:var(--bg-admin); border:1px solid var(--border); color:#fff; border-radius:12px; padding:12px; font-family:inherit; resize:none;"></textarea>
                        <p style="color:var(--text-dim); font-size:0.75rem; margin-top:8px; line-height:1.4;">
                            استخدم الكلمات التالية ليتم استبدالها تلقائياً:<br>
                            <b>{customer}</b> : اسم العميل<br>
                            <b>{id}</b> : رقم الطلب<br>
                            <b>{items}</b> : تفاصيل المنتجات (اسم، لون، مقاس)
                        </p>
                    </div>
                    <button id="save-msg-settings" class="save-btn" style="width:100%; height:50px;">حفظ قالب الرسالة</button>
                </div>

            </div>`;

        lucide.createIcons();

        // Load existing
        try {
            const waSnap = await db.collection('settings').doc('whatsappNumbers').get();
            if (waSnap.exists) {
                const data = waSnap.data();
                document.getElementById('set-wa-1').value = data.wa1 || '';
                document.getElementById('set-wa-2').value = data.wa2 || '';
            }
            const msgSnap = await db.collection('settings').doc('adminWaMessage').get();
            const defaultMsg = "مرحباً {customer}، بخصوص طلبك رقم {id}:\n\nالمنتجات:\n{items}";
            document.getElementById('set-wa-template').value = msgSnap.exists ? msgSnap.data().template : defaultMsg;
        } catch (e) { console.error(e); }

        document.getElementById('save-wa-settings').onclick = async () => {
            const wa1 = document.getElementById('set-wa-1').value.trim();
            const wa2 = document.getElementById('set-wa-2').value.trim();
            if (!wa1) return alert("❌ يجب إدخال الرقم الأول على الأقل!");
            try {
                await db.collection('settings').doc('whatsappNumbers').set({ wa1, wa2 });
                alert("✅ تم حفظ أرقام الواتساب بنجاح");
            } catch (e) { alert("❌ خطأ في الحفظ: " + e.message); }
        };

        document.getElementById('save-msg-settings').onclick = async () => {
            const template = document.getElementById('set-wa-template').value.trim();
            if (!template) return alert("❌ لا يمكن ترك القالب فارغاً!");
            try {
                await db.collection('settings').doc('adminWaMessage').set({ template });
                alert("✅ تم حفظ قالب الرسالة بنجاح");
            } catch (e) { alert("❌ خطأ في الحفظ: " + e.message); }
        };
    }

});
