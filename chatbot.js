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
    const MAP_LINK = "https://www.google.com/maps/search/?api=1&query=31.2576927,32.2933663";
    const WA_LINK = "https://wa.me/201275460336";

    // ============================================
    // KNOWLEDGE BASE - كل المعلومات عن الطوفان
    // ============================================
    const STORE_INFO = {
        name: "الطوفان ستوك (El Toufan Stock)",
        city: "بورسعيد",
        phone: "01275460336",
        rating: "5/5 على خرائط جوجل",
        specialty: "توكيلات أوروبية وبراندات عالمية بأسعار مصرية",
        branches: [
            { name: "فرع أوت ليت الجديد", address: "سوق أوت ليت الجديد، محل رقم 139، أمام سوق السمك الجديد، حي الشرق", hours: "24 ساعة / 7 أيام في الأسبوع", highlight: true },
            { name: "الفرع الرئيسي", address: "شارع 23 يوليو، أمام ميدان الشهداء (المسلة)", hours: "من الصبح للمساء" },
            { name: "فرع أرض العزب", address: "بجوار محمصة الحطاب", hours: "من الصبح للمساء" }
        ],
        categories: [
            { name: "ملابس رجالي", items: "قمصان، تيشرتات، بنطلونات، ملابس داخلية مستوردة، جواكت" },
            { name: "ملابس حريمي", items: "ملابس خروج وبيتي بأعلى جودة وخامات ممتازة" },
            { name: "ملابس أطفال", items: "تشكيلة متنوعة للأولاد والبنات بكل الأعمار" },
            { name: "أحذية", items: "أحذية رجالي، حريمي، وأطفال - ماركات أصلية" },
            { name: "إكسسوارات", items: "شرابات أصلية، أحزمة، وإكسسوارات متنوعة" }
        ],
        selling: ["جملة", "قطاعي"],
        features: [
            "توكيلات أوروبية أصلية",
            "أسعار بسعر المصري",
            "عروض دمار وتخفيضات مستمرة",
            "شحن لجميع المحافظات",
            "تقييم 5 نجوم على جوجل",
            "فرع يعمل 24 ساعة"
        ]
    };

    // ============================================
    // INTENT MATCHING ENGINE
    // ============================================
    const intents = [
        {
            id: 'greeting',
            patterns: ['سلام', 'السلام', 'مرحبا', 'اهلا', 'أهلا', 'هاي', 'هلو', 'صباح', 'مساء', 'ازيك', 'إزيك', 'عامل ايه', 'كيف حالك', 'كيفك', 'يا باشا', 'يا معلم', 'يا غالي', 'hello', 'hi', 'hey', 'good morning', 'good evening', 'اللهم صل', 'يسعد', 'نهارك', 'تصبح'],
            response: () => {
                const greetings = [
                    "وعليكم السلام ورحمة الله وبركاته! 😊 أهلاً بيك في الطوفان ستوك. إزاي أقدر أساعدك النهارده؟",
                    "أهلاً وسهلاً بيك! 🌟 نورت مساعد الطوفان. محتاج تعرف إيه عن المحل؟",
                    "مرحباً بيك يا غالي! 😊 أنا هنا أساعدك بكل المعلومات عن الطوفان ستوك. اتفضل اسأل!"
                ];
                return greetings[Math.floor(Math.random() * greetings.length)];
            },
            followUp: ["📍 فروعنا وعناوينها", "👕 المنتجات والأقسام", "🕒 مواعيد العمل", "💰 الأسعار والعروض"]
        },
        {
            id: 'branches',
            patterns: ['فرع', 'فروع', 'عنوان', 'عناوين', 'مكان', 'أماكن', 'موقع', 'فين', 'محل', 'وين', 'ازاي اروح', 'إزاي أروح', 'اوصل', 'خريطة', 'ماب', 'map', 'location', 'address', 'اين', 'أين', 'حي', 'شارع', 'سوق', 'اوت ليت', 'أوت ليت', 'المسلة', 'ارض العزب', 'أرض العزب'],
            response: () => {
                let msg = "📍 <b>فروع الطوفان ستوك في بورسعيد:</b><br><br>";
                STORE_INFO.branches.forEach((b, i) => {
                    msg += `${i + 1}️⃣ <b>${b.name}:</b><br>`;
                    msg += `📌 ${b.address}<br>`;
                    msg += `🕒 ${b.hours}<br>`;
                    if (b.highlight) msg += `⭐ <i>أشهر فرع ومفتوح 24 ساعة!</i><br>`;
                    msg += `<br>`;
                });
                msg += `📍 <a href="${MAP_LINK}" target="_blank" style="color:var(--accent); text-decoration:underline;">📌 افتح الموقع على الخريطة</a>`;
                return msg;
            },
            followUp: ["🕒 مواعيد العمل؟", "📞 رقم التواصل؟", "👕 المنتجات المتاحة؟"]
        },
        {
            id: 'hours',
            patterns: ['مواعيد', 'ساعة', 'ساعات', 'تفتحو', 'تقفلو', 'شغالين', 'وقت', 'ميعاد', 'متى', 'بتفتح', 'بتقفل', 'مفتوح', 'بالليل', 'الصبح', 'working hours', 'open', 'close', '24', 'امتى', 'إمتى'],
            response: () => {
                return "🕒 <b>مواعيد العمل:</b><br><br>" +
                    "⭐ <b>فرع أوت ليت الجديد:</b> مفتوح <b>24 ساعة / 7 أيام</b> بدون إجازات! ⚡<br><br>" +
                    "🏪 <b>الفروع الأخرى (23 يوليو وأرض العزب):</b> من الصبح للمساء يومياً.<br><br>" +
                    "يعني في أي وقت تحب تزورنا، فرع أوت ليت مستنيك! 😊";
            },
            followUp: ["📍 عنوان فرع أوت ليت؟", "📞 رقم التواصل؟", "🛒 ازاي أطلب أونلاين؟"]
        },
        {
            id: 'products',
            patterns: ['منتج', 'منتجات', 'ملابس', 'عندكم', 'هدوم', 'رجالي', 'حريمي', 'اطفال', 'أطفال', 'أحذية', 'جزم', 'جزمة', 'شراب', 'شرابات', 'قميص', 'تيشرت', 'بنطلون', 'جاكيت', 'جواكت', 'ملابس داخلية', 'بيجامة', 'بيتي', 'خروج', 'اكسسوار', 'إكسسوار', 'حزام', 'ماركة', 'ماركات', 'براند', 'brand', 'أقسام', 'اقسام', 'products', 'clothes', 'shoes'],
            response: () => {
                let msg = "👕 <b>أقسام ومنتجات الطوفان ستوك:</b><br><br>";
                STORE_INFO.categories.forEach(c => {
                    msg += `🔹 <b>${c.name}:</b> ${c.items}<br><br>`;
                });
                msg += "✨ كل المنتجات <b>توكيلات أوروبية أصلية</b> بأعلى جودة!<br>";
                msg += "🛍️ متاح بيع <b>جملة وقطاعي</b>.";
                return msg;
            },
            followUp: ["💰 الأسعار والعروض؟", "🛒 ازاي أطلب أونلاين؟", "📍 عنوان المحل؟"]
        },
        {
            id: 'prices',
            patterns: ['سعر', 'اسعار', 'أسعار', 'بكم', 'بكام', 'غالي', 'ارخص', 'أرخص', 'رخيص', 'تمن', 'ثمن', 'price', 'كام', 'تكلفة', 'فلوس', 'مبلغ', 'ميزانية'],
            response: () => {
                return "💰 <b>الأسعار والعروض:</b><br><br>" +
                    "الطوفان ستوك معروف إنه بيقدم <b>براندات أوروبية أصلية</b> بأسعار تُوصف بـ <b>\"سعر المصري\"</b> 🔥<br><br>" +
                    "✅ أسعار الجملة مختلفة عن القطاعي<br>" +
                    "✅ عروض دمار وتخفيضات مستمرة<br>" +
                    "✅ أسعار لا تقارن بالسوق<br><br>" +
                    "📱 للاطلاع على أحدث الأسعار والعروض، تابعنا على الفيسبوك أو زورنا في أقرب فرع!";
            },
            followUp: ["📱 لينك الفيسبوك؟", "📍 أقرب فرع؟", "🛒 ازاي أطلب أونلاين؟"]
        },
        {
            id: 'offers',
            patterns: ['عرض', 'عروض', 'تخفيض', 'تخفيضات', 'خصم', 'خصومات', 'تنزيلات', 'اوكازيون', 'sale', 'discount', 'offer', 'كوبون', 'كود خصم'],
            response: () => {
                return "🔥 <b>عروض الطوفان ستوك:</b><br><br>" +
                    "الطوفان مشهور بـ <b>\"عروض الدمار\"</b> والتخفيضات القوية اللي بتنزل بشكل مستمر!<br><br>" +
                    "🎯 العروض بتشمل كل الأقسام (رجالي - حريمي - أطفال - أحذية)<br>" +
                    "📱 تابع صفحتنا على فيسبوك عشان تعرف أحدث العروض أول بأول!<br><br>" +
                    "💡 <b>نصيحة:</b> لو عندك كود خصم، تقدر تستخدمه وأنت بتطلب من الموقع هنا!";
            },
            followUp: ["📱 لينك الفيسبوك؟", "🛒 ازاي أطلب؟", "👕 المنتجات المتاحة؟"]
        },
        {
            id: 'contact',
            patterns: ['تواصل', 'رقم', 'تليفون', 'تلفون', 'موبايل', 'فون', 'اتصال', 'كلم', 'phone', 'call', 'contact', 'number', 'نمرة'],
            response: () => {
                return "📞 <b>أرقام التواصل:</b><br><br>" +
                    "📱 الرقم: <b>01275460336</b><br>" +
                    "💬 واتساب: <a href='" + WA_LINK + "' target='_blank' style='color:#25d366; text-decoration:underline;'>اضغط هنا للمحادثة</a><br><br>" +
                    "أو تقدر تكلمنا مباشرة على واتساب من زر الواتساب الأخضر اللي تحت 👇";
            },
            followUp: ["📱 منصات التواصل الاجتماعي؟", "📍 عنوان المحل؟", "🕒 مواعيد العمل؟"]
        },
        {
            id: 'social',
            patterns: ['فيس', 'فيسبوك', 'facebook', 'تيك توك', 'تيكتوك', 'tiktok', 'انستا', 'انستجرام', 'instagram', 'سوشيال', 'صفحة', 'صفحتكم', 'بيدج', 'page', 'منصات', 'تواصل اجتماعي', 'لينك', 'رابط'],
            response: () => {
                return "📱 <b>تابعنا على السوشيال ميديا:</b><br><br>" +
                    "تابعنا عشان تشوف أحدث العروض والموديلات والأسعار أول بأول:<br>" +
                    "<div class='chat-social-links'>" +
                    "<a href='" + FB_LINK + "' target='_blank' class='chat-social-btn fb' title='فيسبوك'><i data-lucide='facebook'></i></a>" +
                    "<a href='" + TK_LINK + "' target='_blank' class='chat-social-btn tk' title='تيك توك'>" +
                    "<svg viewBox='0 0 24 24' fill='currentColor' width='18' height='18'><path d='M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z'/></svg>" +
                    "</a></div>";
            },
            followUp: ["📞 رقم التواصل؟", "📍 عناوين الفروع؟", "💰 الأسعار؟"]
        },
        {
            id: 'shipping',
            patterns: ['شحن', 'توصيل', 'دليفري', 'delivery', 'shipping', 'بتوصلو', 'محافظ', 'محافظات', 'يوصل', 'ارسال', 'إرسال', 'طلب اونلاين', 'أونلاين', 'اون لاين', 'أطلب', 'اطلب', 'order', 'online'],
            response: () => {
                return "🚚 <b>الشحن والتوصيل:</b><br><br>" +
                    "✅ نوفر شحن لـ <b>جميع محافظات مصر</b>! 🇪🇬<br>" +
                    "✅ تقدر تطلب من الموقع هنا مباشرة وتختار محافظتك.<br>" +
                    "✅ سعر الشحن بيختلف حسب المحافظة.<br>" +
                    "✅ الدفع متاح <b>عند الاستلام</b> أو <b>أونلاين</b>.<br><br>" +
                    "🛒 <b>طريقة الطلب:</b><br>" +
                    "1. اختر المنتج من المتجر<br>" +
                    "2. أضفه للسلة 🛒<br>" +
                    "3. اضغط إتمام الطلب<br>" +
                    "4. ادخل بياناتك وهنتواصل معاك فوراً!";
            },
            followUp: ["💰 أسعار الشحن؟", "📞 اتصل بينا؟", "👕 شوف المنتجات"]
        },
        {
            id: 'payment',
            patterns: ['دفع', 'فلوس', 'فيزا', 'كاش', 'عند الاستلام', 'كارت', 'بطاقة', 'payment', 'visa', 'cash', 'pay', 'ادفع', 'أدفع', 'طريقة الدفع'],
            response: () => {
                return "💳 <b>طرق الدفع المتاحة:</b><br><br>" +
                    "1️⃣ <b>الدفع عند الاستلام (كاش):</b> ادفع لما المندوب يوصلك الطلب 🚚<br><br>" +
                    "2️⃣ <b>الدفع أونلاين (فيزا / كارت):</b> ادفع بالفيزا بأمان تام 💳<br><br>" +
                    "اختار الطريقة اللي تناسبك وأنت بتتمم الطلب!";
            },
            followUp: ["🛒 ازاي أطلب؟", "🚚 تفاصيل الشحن؟", "📞 رقم التواصل؟"]
        },
        {
            id: 'wholesale',
            patterns: ['جملة', 'بالجملة', 'كمية', 'كميات', 'wholesale', 'تاجر', 'تجار', 'موزع', 'سعر جملة', 'قطاعي'],
            response: () => {
                return "🏪 <b>البيع بالجملة والقطاعي:</b><br><br>" +
                    "الطوفان ستوك بيوفر البيع بالطريقتين:<br><br>" +
                    "📦 <b>جملة:</b> أسعار خاصة للتجار والموزعين بكميات كبيرة.<br>" +
                    "🛍️ <b>قطاعي:</b> متاح لأي حد يشتري قطعة واحدة أو أكتر.<br><br>" +
                    "📞 للاستفسار عن أسعار الجملة، كلمنا على: <b>01275460336</b>";
            },
            followUp: ["📞 اتصل بينا؟", "👕 المنتجات المتاحة؟", "📍 عنوان المحل؟"]
        },
        {
            id: 'quality',
            patterns: ['جودة', 'خامة', 'خامات', 'اصلي', 'أصلي', 'تقليد', 'مضروب', 'أوروبي', 'اوروبي', 'ماركة', 'ماركات', 'براند', 'توكيل', 'مستورد', 'quality', 'original', 'brand'],
            response: () => {
                return "✨ <b>الجودة والخامات:</b><br><br>" +
                    "الطوفان ستوك متخصص في <b>التوكيلات الأوروبية والبراندات العالمية الأصلية</b>.<br><br>" +
                    "✅ كل المنتجات مستوردة من أوروبا<br>" +
                    "✅ خامات ممتازة ومضمونة<br>" +
                    "✅ مش هتلاقي تقليد عندنا<br>" +
                    "✅ تقييمنا <b>5/5</b> على خرائط جوجل بيأكد رضا العملاء! ⭐⭐⭐⭐⭐<br><br>" +
                    "تعالى جرب بنفسك! 😊";
            },
            followUp: ["💰 الأسعار؟", "📍 عنوان المحل؟", "👕 المنتجات المتاحة؟"]
        },
        {
            id: 'rating',
            patterns: ['تقييم', 'ريفيو', 'رأي', 'ناس', 'review', 'rating', 'stars', 'نجوم', 'نجمة', 'تجربة', 'آراء'],
            response: () => {
                return "⭐ <b>تقييم الطوفان ستوك:</b><br><br>" +
                    "حاصلين على تقييم <b>5 من 5</b> على خرائط جوجل! 🏆<br><br>" +
                    "العملاء بيشكروا في:<br>" +
                    "• جودة المنتجات العالية<br>" +
                    "• الأسعار المنافسة<br>" +
                    "• المعاملة الممتازة<br>" +
                    "• تنوع التشكيلات<br><br>" +
                    "نورنا وجرب بنفسك! 😊";
            },
            followUp: ["📍 عنوان المحل؟", "👕 المنتجات؟", "📱 تابعنا على فيسبوك"]
        },
        {
            id: 'thanks',
            patterns: ['شكرا', 'شكراً', 'يسلمو', 'يسلموا', 'جزاك', 'الله يعطيك', 'ممنون', 'متشكر', 'thanks', 'thank you', 'thx', 'مشكور'],
            response: () => {
                const thanks = [
                    "العفو يا كبير! 😊 لو محتاج أي حاجة تانية أنا هنا.",
                    "تحت أمرك في أي وقت! 🌟 منورنا.",
                    "ولا يهمك! 😊 نورتنا وبالتوفيق.",
                    "العفو! ده واجبنا 💛 لو عندك أي سؤال تاني، اسأل براحتك."
                ];
                return thanks[Math.floor(Math.random() * thanks.length)];
            }
        },
        {
            id: 'goodbye',
            patterns: ['باي', 'مع السلامة', 'سلام', 'يلا باي', 'bye', 'goodbye', 'في أمان', 'في امان', 'هسيبك', 'خلاص'],
            response: () => {
                const byes = [
                    "مع السلامة! 👋 نورتنا. ولو محتاج أي حاجة ارجعلنا في أي وقت!",
                    "في أمان الله! 🌹 منتظرين زيارتك في أي فرع.",
                    "باي باي! 😊 يلا سلامتك. ومتنساش تتابعنا على فيسبوك!"
                ];
                return byes[Math.floor(Math.random() * byes.length)];
            }
        },
        {
            id: 'compliment',
            patterns: ['حلو', 'جميل', 'ممتاز', 'رائع', 'عظيم', 'تحفة', 'حبيبي', 'يا باشا', 'يا معلم', 'يا غالي', 'يا كبير', 'بطل', 'اسطورة', 'عاش', 'يا نجم'],
            response: () => {
                const compliments = [
                    "تسلم يا غالي! 😊💛 إنت اللي حلو!",
                    "ده من ذوقك يا باشا! 🌟 الطوفان دايماً في خدمتك.",
                    "يا حبيبي! 💛 نورت. محتاج حاجة تانية؟"
                ];
                return compliments[Math.floor(Math.random() * compliments.length)];
            },
            followUp: ["👕 شوف المنتجات", "📍 عنوان المحل؟", "📱 تابعنا"]
        },
        {
            id: 'who_are_you',
            patterns: ['مين انت', 'انت مين', 'ايه انت', 'إيه أنت', 'بوت', 'روبوت', 'ذكاء', 'who are you', 'what are you', 'اسمك ايه', 'اسمك إيه', 'بتعمل ايه'],
            response: () => {
                return "🤖 <b>أنا مساعد الطوفان الذكي!</b><br><br>" +
                    "مصمم عشان أساعدك تعرف كل حاجة عن <b>محل الطوفان ستوك (El Toufan Stock)</b> في بورسعيد:<br><br>" +
                    "• الفروع وعناوينها 📍<br>" +
                    "• مواعيد العمل 🕒<br>" +
                    "• المنتجات والأقسام 👕<br>" +
                    "• الأسعار والعروض 💰<br>" +
                    "• طرق التواصل والشحن 🚚<br><br>" +
                    "اسألني أي حاجة عن المحل وهجاوبك فوراً! 😊";
            },
            followUp: ["📍 فروعنا؟", "👕 المنتجات؟", "📱 منصات التواصل"]
        },
        {
            id: 'return_policy',
            patterns: ['استرجاع', 'ارجاع', 'إرجاع', 'استبدال', 'تبديل', 'ترجيع', 'رجعه', 'غيره', 'return', 'exchange', 'refund', 'مش عاجبني', 'مقاس غلط'],
            response: () => {
                return "🔄 <b>الاستبدال والإرجاع:</b><br><br>" +
                    "للاستفسار عن سياسة الاستبدال والإرجاع، تواصل معانا مباشرة:<br><br>" +
                    "📞 <b>01275460336</b><br>" +
                    "💬 أو على <a href='" + WA_LINK + "' target='_blank' style='color:#25d366;'>واتساب</a><br><br>" +
                    "فريقنا هيساعدك في أسرع وقت! 😊";
            },
            followUp: ["📞 رقم التواصل؟", "📍 عنوان المحل؟"]
        },
        {
            id: 'portsaid',
            patterns: ['بورسعيد', 'port said', 'portsaid', 'المدينة', 'بور سعيد'],
            response: () => {
                return "🏙️ <b>الطوفان ستوك في بورسعيد:</b><br><br>" +
                    "يعتبر محل الطوفان من <b>أشهر محلات الملابس في بورسعيد</b> على الإطلاق!<br><br>" +
                    "📍 عندنا <b>3 فروع</b> في المدينة:<br>" +
                    "• فرع أوت ليت الجديد (24 ساعة)<br>" +
                    "• الفرع الرئيسي - شارع 23 يوليو<br>" +
                    "• فرع أرض العزب<br><br>" +
                    "تقييمنا <b>5/5</b> على جوجل ⭐ ومشهورين بالأسعار الممتازة والعروض القوية!";
            },
            followUp: ["📍 عناوين الفروع بالتفصيل؟", "👕 المنتجات؟", "📞 رقم التواصل؟"]
        },
        {
            id: 'sizes',
            patterns: ['مقاس', 'مقاسات', 'سايز', 'size', 'sizes', 'كبير', 'صغير', 'ميديام', 'لارج', 'اكس لارج', 'xl', 'xxl', 'قياس'],
            response: () => {
                return "📏 <b>المقاسات:</b><br><br>" +
                    "بنوفر مقاسات متنوعة لكل الأعمار والأحجام!<br><br>" +
                    "المقاسات المتاحة بتختلف حسب كل منتج. تقدر تشوف المقاسات المتاحة لكل منتج:<br>" +
                    "• من المتجر هنا (اضغط على أي منتج 🛒)<br>" +
                    "• أو كلمنا على واتساب واحنا نساعدك: <b>01275460336</b>";
            },
            followUp: ["👕 شوف المنتجات", "📞 كلمنا على واتساب"]
        },
        {
            id: 'colors',
            patterns: ['لون', 'ألوان', 'الوان', 'color', 'colors', 'ابيض', 'اسود', 'أحمر', 'أزرق'],
            response: () => {
                return "🎨 <b>الألوان المتاحة:</b><br><br>" +
                    "بنوفر تشكيلة متنوعة من الألوان في كل المنتجات!<br><br>" +
                    "الألوان بتختلف حسب كل منتج. تقدر تشوف الألوان المتاحة:<br>" +
                    "• من المتجر هنا (اضغط على أي منتج تشوف ألوانه)<br>" +
                    "• أو تواصل معانا مباشرة على واتساب 📱";
            },
            followUp: ["👕 شوف المنتجات", "📞 كلمنا على واتساب"]
        }
    ];

    // ============================================
    // MESSAGE PROCESSING
    // ============================================
    function findIntent(text) {
        const normalizedText = text.toLowerCase()
            .replace(/[؟?!.,،؛:]/g, '')
            .replace(/ة/g, 'ه')
            .replace(/أ|إ|آ/g, 'ا')
            .replace(/ى/g, 'ي')
            .trim();

        let bestMatch = null;
        let bestScore = 0;

        for (const intent of intents) {
            let score = 0;
            for (const pattern of intent.patterns) {
                const normalizedPattern = pattern.toLowerCase()
                    .replace(/ة/g, 'ه')
                    .replace(/أ|إ|آ/g, 'ا')
                    .replace(/ى/g, 'ي');

                if (normalizedText.includes(normalizedPattern)) {
                    // Longer pattern = more specific = higher score
                    score = Math.max(score, normalizedPattern.length);
                }
            }
            if (score > bestScore) {
                bestScore = score;
                bestMatch = intent;
            }
        }
        return bestMatch;
    }

    function processMessage(text) {
        const intent = findIntent(text);

        if (intent) {
            const response = typeof intent.response === 'function' ? intent.response() : intent.response;
            sendBotMessage(response);
            if (intent.followUp && intent.followUp.length > 0) {
                showOptions(intent.followUp);
            }
        } else {
            // Fallback - ذكي ومهذب
            sendBotMessage(
                "😊 أهلاً بيك! أنا مساعد <b>الطوفان ستوك</b> وأقدر أساعدك في أي استفسار عن المحل.<br><br>" +
                "جرب تسألني عن حاجة من دول:"
            );
            showOptions([
                "📍 فروعنا وعناوينها",
                "🕒 مواعيد العمل",
                "👕 المنتجات والأقسام",
                "💰 الأسعار والعروض",
                "🚚 الشحن والتوصيل",
                "📞 أرقام التواصل",
                "📱 منصات التواصل"
            ]);
        }
    }

    // ============================================
    // UI FUNCTIONS
    // ============================================
    floatBtn.addEventListener('click', () => {
        windowEl.classList.remove('hidden');
        if (!hasGreeted) {
            sendBotMessage(
                "أهلاً وسهلاً! 😊 أنا <b>مساعد الطوفان الذكي</b>.<br>" +
                "هنا عشان أساعدك تعرف كل حاجة عن <b>الطوفان ستوك (El Toufan Stock)</b> في بورسعيد! 🌟<br><br>" +
                "اسألني أي سؤال أو اختار من الأزرار:"
            );
            showOptions([
                "📍 عناوين الفروع",
                "🕒 مواعيد العمل",
                "👕 المنتجات والأقسام",
                "💰 الأسعار والعروض",
                "🚚 الشحن والتوصيل",
                "📱 منصات التواصل"
            ]);
            hasGreeted = true;
        }
        inputEl.focus();
        if (window.lucide) window.lucide.createIcons();
    });

    closeBtn.addEventListener('click', () => {
        windowEl.classList.add('hidden');
    });

    function sendUserMessage(text) {
        if (!text.trim()) return;

        // Remove previous options
        const allOptions = messagesEl.querySelectorAll('.chat-options');
        allOptions.forEach(o => o.remove());

        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg user';
        msgDiv.textContent = text;
        messagesEl.appendChild(msgDiv);
        inputEl.value = '';
        inputEl.focus();
        scrollToBottom();

        // Typing indicator
        const typingDiv = document.createElement('div');
        typingDiv.className = 'chat-msg bot';
        typingDiv.id = 'typing-indicator';
        typingDiv.innerHTML = '<span style="opacity:0.5;">جاري الكتابة...</span>';
        messagesEl.appendChild(typingDiv);
        scrollToBottom();

        setTimeout(() => {
            const typing = document.getElementById('typing-indicator');
            if (typing) typing.remove();
            processMessage(text);
        }, 600);
    }

    function sendBotMessage(htmlContent) {
        const msgDiv = document.createElement('div');
        msgDiv.className = 'chat-msg bot';
        msgDiv.innerHTML = htmlContent;
        messagesEl.appendChild(msgDiv);
        scrollToBottom();
        if (window.lucide) setTimeout(() => window.lucide.createIcons(), 50);
    }

    function showOptions(optionsArr) {
        const container = document.createElement('div');
        container.className = 'chat-options';
        optionsArr.forEach(opt => {
            const btn = document.createElement('button');
            btn.className = 'chat-option-btn';
            btn.textContent = opt;
            btn.onclick = () => sendUserMessage(opt);
            container.appendChild(btn);
        });
        messagesEl.appendChild(container);
        scrollToBottom();
    }

    function scrollToBottom() {
        setTimeout(() => { messagesEl.scrollTop = messagesEl.scrollHeight; }, 50);
    }

    sendBtn.addEventListener('click', () => sendUserMessage(inputEl.value));
    inputEl.addEventListener('keypress', (e) => { if (e.key === 'Enter') sendUserMessage(inputEl.value); });
});
