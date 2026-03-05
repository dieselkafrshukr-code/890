document.addEventListener('DOMContentLoaded', () => {
    const floatBtn = document.getElementById('chatbot-float-btn');
    const windowEl = document.getElementById('chatbot-window');
    const closeBtn = document.getElementById('close-chatbot-btn');
    const messagesEl = document.getElementById('chatbot-messages');
    const inputEl = document.getElementById('chatbot-input');
    const sendBtn = document.getElementById('chatbot-send-btn');

    let hasGreeted = false;

    // Social Links
    const FB_LINK = "https://www.facebook.com/share/1FBVWWwdd4/?mibextid=wwXIfr";
    const TK_LINK = "https://www.tiktok.com/@eltoufanstock?_r=1&_t=ZS-9441eoT93DN";

    floatBtn.addEventListener('click', () => {
        windowEl.classList.remove('hidden');
        if (!hasGreeted) {
            sendBotMessage("مرحباً بك في خدمة عملاء <b>إل طوفان ستوك (El Toufan Stock)</b> في بورسعيد! 🌹<br><br>اسألني عن الفروع، المواعيد، الأسعار، أو المنتجات المتاحة لدينا.");
            showOptions([
                "📍 ما هي عناوين الفروع؟",
                "🕒 مواعيد العمل؟",
                "👕 ما هي المنتجات المتاحة؟",
                "📱 منصات التواصل"
            ]);
            hasGreeted = true;
        }
        if (window.lucide) window.lucide.createIcons();
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('hidden');
    });

    function sendUserMessage(text) {
        if (!text.trim()) return;

        // Remove options if any
        const optionsDiv = messagesEl.querySelector('.chat-options');
        if (optionsDiv) optionsDiv.remove();

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg user';
        msgDiv.textContent = text;
        messagesEl.appendChild(msgDiv);
        inputEl.value = '';
        inputEl.focus();
        scrollToBottom();

        // Process message
        setTimeout(() => processMessage(text), 500);
    }

    function sendBotMessage(htmlContent) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg bot';
        msgDiv.innerHTML = htmlContent;
        messagesEl.appendChild(msgDiv);
        scrollToBottom();
        if (window.lucide) window.lucide.createIcons();
    }

    function showOptions(optionsArr) {
        const container = document.createElement('div');
        container.className = 'chat-options';
        optionsArr.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-option-btn';
            btn.textContent = opt;
            btn.onclick = () => {
                sendUserMessage(opt);
            };
            container.appendChild(btn);
        });
        messagesEl.appendChild(container);
        scrollToBottom();
    }

    function scrollToBottom() {
        messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function processMessage(text) {
        const lowerText = text.toLowerCase();

        // Keywords Matching
        const matchesWords = (...words) => words.some(w => lowerText.includes(w));

        if (matchesWords('فرع', 'عناوين', 'عنوان', 'مكان', 'موقع', 'فين', 'محل', 'فروع')) {
            sendBotMessage(
                "📍 <b>فروع الطوفان ستوك بـ بورسعيد:</b><br><br>" +
                "1️⃣ <b>فرع أوت ليت:</b> سوق أوت ليت الجديد (محل 139) أمام سوق السمك الجديد.<br>" +
                "2️⃣ <b>الفرع الرئيسي:</b> شارع 23 يوليو (أمام ميدان الشهداء / المسلة).<br>" +
                "3️⃣ <b>فرع أرض العزب:</b> بجوار محمصة الحطاب."
            );
        }
        else if (matchesWords('مواعيد', 'ساعة', 'تفتحو', 'شغالين', 'وقت', 'ميعاد', 'متى')) {
            sendBotMessage("🕒 <b>مواعيد العمل:</b><br>يسعدنا إخبارك أن فرع <b>أوت ليت الجديد</b> يعمل على مدار <b>24 ساعة</b> طوال أيام الأسبوع لخدمتكم بأي وقت! ⚡");
        }
        else if (matchesWords('منتج', 'ملابس', 'عندكم ايه', 'هدوم', 'رجالي', 'حريمي', 'اطفال', 'أحذية', 'جزم')) {
            sendBotMessage(
                "👕 <b>أقسام الطوفان:</b><br><br>" +
                "نوفر توكيلات أوروبية وبراندات أصلية (جملة وقطاعي):<br>" +
                "• <b>قسم الرجالي:</b> قمصان، تيشرتات، وملابس داخلية مستوردة.<br>" +
                "• <b>قسم الحريمي والأطفالي:</b> ملابس خروج وبيتي عالية الجودة.<br>" +
                "• <b>أحذية وإكسسوارات:</b> أحذية أصلية (رجالي/حريمي/أطفال) وجوارب (شرابات)."
            );
        }
        else if (matchesWords('اسعار', 'سعر', 'بكم', 'بكام', 'غالي', 'ارخص')) {
            sendBotMessage("🔥 <b>أسعارنا:</b><br><br>نحن متخصصون في بيع البراندات العالمية بـ <b>\"سعر المصري\"</b>! ونوفر دائماً <b>عروض دمار</b> وتخفيضات مستمرة، تفضل بزيارتنا أو تصفح المنتجات في المتجر هنا.");
        }
        else if (matchesWords('تواصل', 'رقم', 'تليفون', 'فيس', 'تيك توك', 'تيكتوك', 'واتس', 'للتواصل', 'منصات')) {
            sendBotMessage(
                "📞 <b>للتواصل معنا:</b><br><br>" +
                "• رقم الهاتف والواتساب: <b>01275460336</b><br>" +
                "• لا تنسَ متابعتنا على وسائل التواصل لمعرفة أحدث العروض والموديلات:<br>" +
                "<div class='chat-social-links'>" +
                "<a href='" + FB_LINK + "' target='_blank' class='chat-social-btn fb' title='فيسبوك'><i data-lucide='facebook'></i></a>" +
                "<a href='" + TK_LINK + "' target='_blank' class='chat-social-btn tk' title='تيك توك'>" +
                "<svg viewBox='0 0 24 24' fill='currentColor' width='18' height='18'><path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z'/></svg>" +
                "</a></div>"
            );
        }
        else if (matchesWords('شكرا', 'يسلمو', 'جزاك', 'تمام', 'حبيبي')) {
            sendBotMessage("العفو! تحت أمرك في أي وقت. 😊");
        }
        else {
            // Guard against out-of-scope questions
            sendBotMessage(
                "عذراً! أنا مساعد ذكي مخصص فقط للإجابة عن أسئلة تخص <b>محل الطوفان (El Toufan Stock)</b> في بورسعيد (الفروع، الأسعار، المواعيد، أو المنتجات).<br><br>كيف يمكنني مساعدتك بخصوص المحل؟"
            );
        }
    }

    sendBtn.addEventListener('click', () => {
        sendUserMessage(inputEl.value);
    });

    inputEl.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') {
            sendUserMessage(inputEl.value);
        }
    });
});
