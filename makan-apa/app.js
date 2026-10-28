/**
 * MAKAN APA? - Official WebApp Engine (Master Batch-Resolved Edition)
 * Co-Architects: Khairul Azzumie & Mia
 * Domain: axworld.my/makan-apa/
 */

// --- KONFIGURASI 100% STATIK & LIVE SYNC ---
const API_URL = "restaurants.json";

// 8 Kategori Makanan Ikonik (Simetri Sempurna 45° - Reka Bentuk Asal Kemas)
const FOOD_CATEGORIES = [
    { label: "Nasi", icon: "🍚", color: "#10B981" },
    { label: "Burger", icon: "🍔", color: "#EF4444" },
    { label: "Mi & Sup", icon: "🍜", color: "#F59E0B" },
    { label: "Ayam Goreng", icon: "🍗", color: "#8B5CF6"},
    { label: "Tomyam", icon: "🍲", color: "#06B6D4" },
    { label: "Kopitiam", icon: "☕", color: "#92400E" },
    { label: "Mamak", icon: "🍛", color: "#F97316" },
    { label: "Kafe & Manis", icon: "🍰", color: "#EC4899" }
];

let allRestaurants = [];
let filteredRestaurants = [];
let searchFilteredRestaurants = [];
let activeFoodFilter = "all";
let activeBudgetFilter = "all";
let activeAreaFilter = "all";
let activeTasteFilter = "all";
let isCravingModeActive = false;
let listSearchQuery = "";

let currentAngle = 0;
let isSpinning = false;
let currentSelectedShop = null;
let lastWinningCategory = null;

// Kawalan Sistem Muka Surat (Pagination 10 Kedai)
let currentPage = 1;
const ITEMS_PER_PAGE = 10;

// DOM Elemen Cache
const canvas = document.getElementById("wheel-canvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const spinBtn = document.getElementById("spin-btn");
const spinBtnText = document.getElementById("spin-btn-text");
const wheelFilterStatus = document.getElementById("wheel-filter-status");
const themeToggleBtn = document.getElementById("theme-toggle-btn");

const normalFiltersSection = document.getElementById("normal-filters-section");
const cravingFiltersSection = document.getElementById("craving-filters-section");
const toggleCravingModeBtn = document.getElementById("toggle-craving-mode-btn");
const cravingStatusHint = document.getElementById("craving-status-hint");

const resultCard = document.getElementById("result-card");
const resultCraving = document.getElementById("result-craving");
const resultName = document.getElementById("result-name");
const resultCategory = document.getElementById("result-category");
const resultBudget = document.getElementById("result-budget");
const resultAddress = document.getElementById("result-address");
const resultHours = document.getElementById("result-hours");
const resultTastesBox = document.getElementById("result-tastes-box");
const resultGmapsBtn = document.getElementById("result-gmaps-btn");
const btnRerollResult = document.getElementById("btn-reroll-result");
const btnReportResult = document.getElementById("btn-report-result");

const toggleWheelBtn = document.getElementById("toggle-wheel-btn");
const toggleListBtn = document.getElementById("toggle-list-btn");
const wheelView = document.getElementById("wheel-view");
const listView = document.getElementById("list-view");
const restaurantsList = document.getElementById("restaurants-list");
const listSearchInput = document.getElementById("list-search-input");
const listCountLabel = document.getElementById("list-count-label");
const countTabTop = document.getElementById("count-tab-top");

const foodChips = document.querySelectorAll(".food-chip");
const budgetChips = document.querySelectorAll(".budget-chip");
const tasteChips = document.querySelectorAll(".taste-chip");

// Modal Elemen
const suggestModal = document.getElementById("suggest-modal");
const openSuggestBtn = document.getElementById("open-suggest-btn");
const closeSuggestBtn = document.getElementById("close-suggest-btn");
const suggestForm = document.getElementById("suggest-form");
const suggestFormView = document.getElementById("suggest-form-view");
const suggestSuccessView = document.getElementById("suggest-success-view");
const successMessage = document.getElementById("success-message");
const btnContinueSpin = document.getElementById("btn-continue-spin");
const btnSuggestAnother = document.getElementById("btn-suggest-another");

const tipModal = document.getElementById("tip-modal");
const openTipBtn = document.getElementById("open-tip-btn");
const closeTipBtn = document.getElementById("close-tip-btn");

const profileModal = document.getElementById("profile-modal");
const closeProfileBtn = document.getElementById("close-profile-btn");
const profileName = document.getElementById("profile-name");
const profileCategory = document.getElementById("profile-category");
const profileBudget = document.getElementById("profile-budget");
const profileCarb = document.getElementById("profile-carb");
const profileAddress = document.getElementById("profile-address");
const profileHours = document.getElementById("profile-hours");
const profileClosed = document.getElementById("profile-closed");
const profileTastesBox = document.getElementById("profile-tastes-box");
const profileSignatureDish = document.getElementById("profile-signature-dish");
const profileGmapsBtn = document.getElementById("profile-gmaps-btn");
const btnReportProfile = document.getElementById("btn-report-profile");

const reportModal = document.getElementById("report-modal");
const closeReportBtn = document.getElementById("close-report-btn");
const reportForm = document.getElementById("report-form");
const reportShopName = document.getElementById("report-shop-name");

const contactModal = document.getElementById("contact-modal");
const openContactBtn = document.getElementById("open-contact-btn");
const closeContactBtn = document.getElementById("close-contact-btn");
const contactForm = document.getElementById("contact-form");

// --- 1. PENGURUSAN TEMA MOD GELAP (DARK MODE) ---
function initTheme() {
    const savedTheme = localStorage.getItem("makan_apa_theme");
    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        if (themeToggleBtn) themeToggleBtn.innerText = "☀️";
    } else {
        document.body.classList.remove("dark-mode");
        if (themeToggleBtn) themeToggleBtn.innerText = "🌙";
    }
}

if (themeToggleBtn) {
    themeToggleBtn.addEventListener("click", () => {
        document.body.classList.toggle("dark-mode");
        const isDark = document.body.classList.contains("dark-mode");
        localStorage.setItem("makan_apa_theme", isDark ? "dark" : "light");
        themeToggleBtn.innerText = isDark ? "☀️" : "🌙";
    });
}

initTheme();

// --- 2. MUAT TURUN DATA (DENGAN CACHE 30 MINIT) ---
async function fetchRestaurants() {
    drawWheel();

    const possibleUrls = [
        "restaurants.json",
        "./restaurants.json",
        "/makan-apa/restaurants.json"
    ];

    for (const url of possibleUrls) {
        try {
            const response = await fetch(url);
            if (response.ok) {
                const json = await response.json();
                
                if (Array.isArray(json)) {
                    allRestaurants = json;
                } else if (json.data && Array.isArray(json.data)) {
                    allRestaurants = json.data;
                } else if (json.restaurants && Array.isArray(json.restaurants)) {
                    allRestaurants = json.restaurants;
                } else {
                    allRestaurants = [];
                }

                const uniqueMap = new Map();
                allRestaurants.forEach(r => {
                    const clean = (r.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
                    if (clean && !uniqueMap.has(clean)) {
                        uniqueMap.set(clean, r);
                    }
                });
                allRestaurants = Array.from(uniqueMap.values());

                console.log(`✅ Berjaya memuatkan ${allRestaurants.length} kedai dari: ${url}`);
                applyFilters();
                drawWheel();
                return;
            }
        } catch (err) {
            // Cuba URL seterusnya
        }
    }
    console.warn("⚠️ Fail restaurants.json tidak ditemui.");
}

// --- 3. LUKIS RODA ASAL (HIRISAN SIMETRI 45° DUA TINGKAT) ---
function drawWheel() {
    if (!canvas || !ctx) return;
    const numSegments = FOOD_CATEGORIES.length;
    const arcSize = (2 * Math.PI) / numSegments;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 12;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    for (let i = 0; i < numSegments; i++) {
        const cat = FOOD_CATEGORIES[i];
        const angle = currentAngle + i * arcSize;

        ctx.beginPath();
        ctx.fillStyle = cat.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arcSize);
        ctx.lineTo(centerX, centerY);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 4;
        ctx.stroke();

        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arcSize / 2);
        
        const textRadius = radius * 0.65;

        // Ikon Atas (24px)
        ctx.font = "24px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cat.icon, textRadius, -8);

        // Teks Bawah (9px Bold)
        ctx.font = "bold 9px 'Plus Jakarta Sans', sans-serif";
        ctx.fillStyle = "#FFFFFF";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(cat.label, textRadius, 14);
        
        ctx.restore();
    }

    // Pusat Tanda Soal "?" Emas Asal
    ctx.beginPath();
    ctx.arc(centerX, centerY, 32, 0, 2 * Math.PI);
    ctx.fillStyle = "#1F2937";
    ctx.fill();
    ctx.lineWidth = 5;
    ctx.strokeStyle = "#F59E0B";
    ctx.stroke();

    ctx.font = "bold 32px 'Lilita One', cursive, sans-serif";
    ctx.fillStyle = "#F59E0B";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", centerX, centerY + 2);
}

// --- FUNGSI SEMAKAN KATEGORI TEPAT (BURGER BAKAR TIADA LAGI DALAM TOMYAM!) ---
function isShopMatchCategory(shop, categoryLabel) {
    const cat = (shop.category || "").toLowerCase();
    const carb = (shop.carb_type || "").toLowerCase();
    const name = (shop.name || "").toLowerCase();
    const fullText = `${name} ${cat} ${carb}`;

    if (categoryLabel === "Nasi") {
        return (carb.includes("nasi") || cat.includes("melayu") || cat.includes("padang")) && 
               !cat.includes("kopi") && !cat.includes("cafe") && !cat.includes("tandoor");
    }
    if (categoryLabel === "Burger") {
        return fullText.includes("burger") || fullText.includes("western") || fullText.includes("pasta") || fullText.includes("steak") || fullText.includes("grill");
    }
    if (categoryLabel === "Mi & Sup") {
        const isMi = /\b(mi|mee|bihun|kuey teow|laksa|sup|soup|ramen)\b/.test(fullText);
        return isMi && !cat.includes("kopitiam") && !cat.includes("kopi");
    }
    if (categoryLabel === "Ayam Goreng") {
        return fullText.includes("ayam") || fullText.includes("gepuk") || fullText.includes("crispy");
    }
    if (categoryLabel === "Tomyam") {
        // Sekat Western / Burger daripada masuk Tomyam
        if (fullText.includes("burger") || cat.includes("western") || fullText.includes("grill") || fullText.includes("pasta")) {
            return false;
        }
        return fullText.includes("tomyam") || fullText.includes("thai") || fullText.includes("seafood") || fullText.includes("ikan bakar");
    }
    if (categoryLabel === "Kopitiam") {
        return cat.includes("kopi") || cat.includes("kopitiam") || name.includes("kopi") || carb.includes("roti");
    }
    if (categoryLabel === "Mamak") {
        return cat.includes("mamak") || name.includes("mamak") || name.includes("kandar") || fullText.includes("roti canai") || name.includes("mamu") || fullText.includes("tandoor");
    }
    if (categoryLabel === "Kafe & Manis") {
        return cat.includes("cafe") || cat.includes("kafe") || fullText.includes("dessert") || fullText.includes("bakery") || fullText.includes("santai");
    }
    return false;
}

function isShopMatchTaste(shop, taste) {
    if (!taste || taste === "all") return true;
    const text = `${shop.name} ${shop.category} ${shop.carb_type} ${shop.address} ${shop.taste_tags || ''}`.toLowerCase();

    if (taste === "masam") {
        return text.includes("tomyam") || text.includes("thai") || text.includes("asam") || text.includes("kerabu") || text.includes("somtam") || text.includes("mangga");
    }
    if (taste === "pedas") {
        return text.includes("gepuk") || text.includes("cili") || text.includes("pedas") || text.includes("belacan") || text.includes("padang") || text.includes("sambal") || text.includes("berapi") || text.includes("tandoor");
    }
    if (taste === "manis") {
    return text.includes("manis") || text.includes("sejuk") || text.includes("dessert") || text.includes("bingsu") || text.includes("croffle") || text.includes("cendol") || text.includes("waffle") || text.includes("kek") || text.includes("pancake") || text.includes("kuih") || text.includes("bakery") || text.includes("sweet") || text.includes("cafe") || text.includes("kopi");
    }
    if (taste === "sup") {
        return text.includes("sup") || text.includes("soup") || text.includes("bakso") || text.includes("tarik") || text.includes("soto") || text.includes("shabu") || text.includes("steamboat");
    }
    if (taste === "banjir") {
        return text.includes("kandar") || text.includes("banjir") || text.includes("gulai") || text.includes("kari") || text.includes("canai") || text.includes("lauk");
    }
    return true;
}

function mapFilterToCategory(filter) {
    if (filter === "Nasi") return "Nasi";
    if (filter === "Western") return "Burger";
    if (filter === "Mi") return "Mi & Sup";
    if (filter === "Kopitiam") return "Kopitiam";
    if (filter === "Mamak") return "Mamak";
    if (filter === "KafeHunting") return "Kafe & Manis";
    return null;
}

function renderTasteBadges(tagsString) {
    if (!tagsString) return '';
    const tags = tagsString.split(',').map(t => t.trim().toLowerCase());
    let html = '';
    tags.forEach(t => {
        if (t === 'masam') html += `<span class="tag" style="background:#FEF9C3; color:#854D0E;">🍋 Masam-Masam</span>`;
        if (t === 'pedas') html += `<span class="tag" style="background:#FEE2E2; color:#991B1B;">🌶️ Pedas Berapi</span>`;
        if (t === 'manis') html += `<span class="tag" style="background:#FCE7F3; color:#9D174D;">🍧 Manis & Sejuk</span>`;
        if (t === 'sup') html += `<span class="tag" style="background:#E0F2FE; color:#075985;">🍲 Sup Panas</span>`;
        if (t === 'banjir') html += `<span class="tag" style="background:#FFEDD5; color:#9A3412;">🍛 Kuah Banjir</span>`;
    });
    return html;
}

function getSignatureDish(shop) {
    if (shop.specialty_menu && shop.specialty_menu.trim() !== "" && shop.specialty_menu !== "Hidangan Istimewa") {
        return shop.specialty_menu;
    }
    const text = `${shop.name} ${shop.category} ${shop.carb_type}`.toLowerCase();
    if (text.includes("ss mee jawa")) return "Mee Jawa Daging Tetel Padu & Rojak Sotong Kuah Pekat 🍜";
    if (text.includes("lapar haus")) return "Smash Burger Double Cheese, Loaded Fries & Aneka Gulai Kawah 🍔🍛";
    if (text.includes("burung hantu")) return "Nasi Lemak Ayam Berempah Crispy & Sambal Kerang Manis 🍗";
    if (text.includes("village park")) return "Nasi Lemak Ayam Goreng Berempah Juara Lembah Klang ⭐";
    if (text.includes("wanjo")) return "Nasi Lemak Sambal Sotong & Paru Goreng Rangup 🔥";
    if (text.includes("aboy cafe")) return "Western Platter Portion Besar & Cheesy Loaded Fries 🍔";
    if (text.includes("suatu perjalanan")) return "Specialty Coffee Barista, Croffle & Pasta Santai ☕🍰";
    if (text.includes("hakim")) return "Roti Canai Tsunami Banjir & Ayam Goreng Berempah Panas 🫓";
    if (text.includes("tandoor")) return "Roti Naan Garlic Cheese Panas & Ayam Tandoori Berempah 🫓🍗";
    return "Hidangan Istimewa Pilihan Ramai (Paling Disyorkan!) ✨";
}

// --- PENAPIS KAWASAN KALIS BOCOR (IKUT KOLUM ZON 100% TEPAT) ---
function matchShopArea(shop, area) {
    if (!area || area === "all") return true;
    const z = String(shop.zon || "").toLowerCase().trim();

    if (area === "kebun_tpg") return z === "zon 1" || z === "1";
    if (area === "shah_alam") return z === "zon 2" || z === "2";
    if (area === "kl") return z === "zon 3" || z === "3";
    if (area === "ttdi_damansara") return z === "zon 4" || z === "4";
    if (area === "bangi_kajang") return z === "zon 5" || z === "5";
    
    // Sekat dan padam terus Subang yang dah diganti
    if (area === "subang") return false;

    return true;
}

// Auto-sorok butang pill Subang lama dari paparan skrin
document.addEventListener("DOMContentLoaded", () => {
    document.querySelectorAll(".area-chip").forEach(chip => {
        if (chip.textContent.toLowerCase().includes("subang")) {
            chip.style.display = "none";
        }
    });
});

// --- 4. LOGIK PENAPIS UTAMA ---
function applyFilters() {
    filteredRestaurants = allRestaurants.filter(r => {
        if (!matchShopArea(r, activeAreaFilter)) return false;

        if (isCravingModeActive) {
            if (!isShopMatchTaste(r, activeTasteFilter)) return false;
        } else {
            const mappedCat = mapFilterToCategory(activeFoodFilter);
            if (mappedCat && !isShopMatchCategory(r, mappedCat)) return false;
        }

        const bTier = r.budget_tier || "";
        if (activeBudgetFilter === "Marhaen") {
            if (!bTier.includes("Marhaen") && !bTier.includes("<RM10")) return false;
        } else if (activeBudgetFilter === "Mid") {
            if (!bTier.includes("Mid") && !bTier.includes("RM10-30")) return false;
        } else if (activeBudgetFilter === "Kayangan") {
            if (!bTier.includes("Kayangan") && !bTier.includes(">RM30")) return false;
        }

        return true;
    });

    filteredRestaurants.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ms', { sensitivity: 'base' }));

    if (wheelFilterStatus) {
        let areaLabel = "Semua Kawasan";
        if (activeAreaFilter === "kebun_tpg") areaLabel = "Jln Kebun/TPG";
        if (activeAreaFilter === "shah_alam") areaLabel = "Shah Alam";
        if (activeAreaFilter === "subang") areaLabel = "Subang";
        if (activeAreaFilter === "ttdi_damansara") areaLabel = "TTDI/Damansara";
        if (activeAreaFilter === "bangi_kajang") areaLabel = "Bangi/Kajang";
        if (activeAreaFilter === "kl") areaLabel = "KL/Kg Baru";

        if (isCravingModeActive) {
            const tasteName = activeTasteFilter === "all" ? "Semua Rasa" : activeTasteFilter.toUpperCase();
            wheelFilterStatus.innerText = `🤰 Mod Mengidam: ${tasteName} • ${areaLabel} (${filteredRestaurants.length} Kedai)`;
        } else {
            const foodLabel = activeFoodFilter === "all" ? "Semua Makanan" : activeFoodFilter;
            const budgetLabel = activeBudgetFilter === "all" ? "Semua Bajet" : activeBudgetFilter;
            wheelFilterStatus.innerText = `🎯 Mod Putaran: ${foodLabel} • ${budgetLabel} • ${areaLabel} (${filteredRestaurants.length} Kedai)`;
        }
    }

    if (countTabTop) {
        countTabTop.innerText = filteredRestaurants.length;
    }

    applySearchToList();
}

function applySearchToList() {
    let result = [...filteredRestaurants];

    if (listSearchQuery.trim()) {
        const q = listSearchQuery.toLowerCase();
        result = result.filter(r => 
            (r.name && r.name.toLowerCase().includes(q)) || 
            (r.address && r.address.toLowerCase().includes(q)) || 
            (r.category && r.category.toLowerCase().includes(q)) ||
            (r.specialty_menu && r.specialty_menu.toLowerCase().includes(q))
        );
    }

    result.sort((a, b) => (a.name || '').localeCompare(b.name || '', 'ms', { sensitivity: 'base' }));
    searchFilteredRestaurants = result;

    if (listCountLabel) {
        listCountLabel.innerText = `Menunjukkan ${searchFilteredRestaurants.length} kedai`;
    }

    currentPage = 1;
    renderListView();
}

// --- 5. LOGIK PUTARAN RODA PINTAR & TEPAT MENGIKUT POINTER JAM 12 ---
function spinWheel() {
    if (isSpinning) return;

    if (filteredRestaurants.length === 0) {
        alert("Alamak! Tiada kedai yang padan dengan gabungan pilihan ini. Sila ubah kawasan atau selera ya!");
        return;
    }

    isSpinning = true;
    if (resultCard) {
        resultCard.classList.add("hidden");
        resultCard.style.display = "none";
    }
    spinBtn.disabled = true;

    const numSegments = FOOD_CATEGORIES.length;
    const arcSize = (2 * Math.PI) / numSegments;

    let targetSegmentIndex = Math.floor(Math.random() * numSegments);

    const mappedCat = mapFilterToCategory(activeFoodFilter);
    if (mappedCat && !isCravingModeActive) {
        const foundIdx = FOOD_CATEGORIES.findIndex(c => c.label === mappedCat);
        if (foundIdx !== -1) targetSegmentIndex = foundIdx;
    }

    const winningCat = FOOD_CATEGORIES[targetSegmentIndex];

    const segmentCenterAngle = (targetSegmentIndex * arcSize) + (arcSize / 2);
    const pointerAngle = 1.5 * Math.PI;
    
    let stopAngle = (pointerAngle - segmentCenterAngle) % (2 * Math.PI);
    if (stopAngle < 0) stopAngle += 2 * Math.PI;

    const extraRounds = (6 + Math.floor(Math.random() * 3)) * (2 * Math.PI);
    const startAngle = currentAngle;
    let currentAngleNormalized = currentAngle % (2 * Math.PI);
    if (currentAngleNormalized < 0) currentAngleNormalized += 2 * Math.PI;
    
    let delta = stopAngle - currentAngleNormalized;
    if (delta < 0) delta += 2 * Math.PI;

    const targetAngle = currentAngle + extraRounds + delta;
    const spinDuration = 3500;
    const startTime = performance.now();

    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / spinDuration, 1);
        
        const easeOut = 1 - Math.pow(1 - progress, 3);
        currentAngle = startAngle + (targetAngle - startAngle) * easeOut;
        drawWheel();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            lastWinningCategory = winningCat;
            determineWinner(winningCat);
        }
    }

    requestAnimationFrame(animate);
}

function determineWinner(winningCategory, excludeShopId = null) {
    let matchingShops = filteredRestaurants.filter(r => isShopMatchCategory(r, winningCategory.label));

    if (matchingShops.length === 0) {
        matchingShops = allRestaurants.filter(r => isShopMatchCategory(r, winningCategory.label));
    }

    if (excludeShopId && matchingShops.length > 1) {
        matchingShops = matchingShops.filter(r => r.id !== excludeShopId);
    }

    if (matchingShops.length === 0) {
        alert(`Tiada kedai sepadan untuk ${winningCategory.label}. Sila cuba putar lagi!`);
        return;
    }

    const selectedShop = matchingShops[Math.floor(Math.random() * matchingShops.length)];
    currentSelectedShop = selectedShop;

    displayWinnerCard(selectedShop, winningCategory);
}

// BINA PAUTAN GOOGLE MAPS KALIS AIR (TIADA LAGI TERJUN TASIK/SUNGAI)
// Pengendali Klik Butang Google Maps Pintar & Kalis Luar Talian
function setupSafeNavigationListener(buttonElement, shopGetter) {
  if (!buttonElement) return;

  buttonElement.addEventListener('click', (e) => {
    // Semak sama ada peranti ada talian internet
    if (!navigator.onLine) {
      e.preventDefault(); // Sekat browser dari buka pautan yang akan gagal
      const shop = shopGetter();
      const shopName = shop ? shop.name : "kedai ini";
      const shopAddress = shop ? shop.address : "alamat yang tertera";

      alert(`📴 Anda sedang di luar talian (Offline)!\n\nGoogle Maps memerlukan internet untuk arah pemanduan langsung. Tapi jangan risau, nama & alamat dah ada di sini:\n\n📍 ${shopName}\n${shopAddress}\n\n(Arah navigasi akan berfungsi semula sebaik sahaja anda keluar ke kawasan bertalian internet! 😉)`);
    }
  });
}

// Pasangkan perlindungan ini kepada butang peta Kad Keputusan & Kad Profil
setupSafeNavigationListener(resultGmapsBtn, () => currentSelectedShop);
setupSafeNavigationListener(profileGmapsBtn, () => currentSelectedShop);
function buildSafeGoogleMapsUrl(shop) {
    const query = encodeURIComponent(`${shop.name}, ${shop.address}`);
    return `https://www.google.com/maps/dir/?api=1&destination=${query}`;
}

function displayWinnerCard(shop, category) {
    if (!shop) return;

    const cravingTitle = isCravingModeActive 
        ? `🤰 REZEKI MAK BUYUNG: ${activeTasteFilter.toUpperCase()}!` 
        : `${category.icon} HARI INI TEKAK NAK: ${category.label.toUpperCase()}!`;

    if (resultCraving) resultCraving.innerText = cravingTitle;
    if (resultName) resultName.innerText = shop.name;
    if (resultCategory) resultCategory.innerText = shop.category;
    if (resultBudget) resultBudget.innerText = shop.budget_tier;
    
    const hours = shop.operating_hours || "10:00 AM - 10:00 PM";
    const closed = shop.closed_days || "Tiada Cuti";
    if (resultHours) {
        resultHours.innerHTML = `⏰ Buka: <b>${hours}</b> • <span style="color:#DC2626;">🚫 Cuti: ${closed}</span>`;
    }

    if (resultTastesBox) {
        resultTastesBox.innerHTML = renderTasteBadges(shop.taste_tags);
    }

    if (resultAddress) resultAddress.innerText = `📍 ${shop.address}`;
    
    // Pautan Google Maps Pintar Kalis Air
    if (resultGmapsBtn) {
        resultGmapsBtn.href = buildSafeGoogleMapsUrl(shop);
    }

    if (btnRerollResult) btnRerollResult.style.display = "block";
    
    if (resultCard) {
        resultCard.classList.remove("hidden");
        resultCard.style.display = "block";
        resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
}

// --- 6. RENDER SENARAI KEDAI DENGAN NAVIGASI 10 KEDAI ---
function renderListView() {
    if (!restaurantsList) return;
    restaurantsList.innerHTML = "";
    if (searchFilteredRestaurants.length === 0) {
        restaurantsList.innerHTML = "<p style='text-align:center; color:#9CA3AF; padding:20px; font-weight:600;'>Tiada kedai sepadan dengan tapisan kawasan ini.</p>";
        return;
    }

    const totalPages = Math.ceil(searchFilteredRestaurants.length / ITEMS_PER_PAGE);
    if (currentPage > totalPages) currentPage = totalPages;
    if (currentPage < 1) currentPage = 1;

    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const endIndex = startIndex + ITEMS_PER_PAGE;
    const pageShops = searchFilteredRestaurants.slice(startIndex, endIndex);

    pageShops.forEach(r => {
        const item = document.createElement("div");
        item.className = "restaurant-item";

        const hoursText = r.operating_hours ? `⏰ ${r.operating_hours}` : '⏰ 10:00 AM - 10:00 PM';
        const closedText = (r.closed_days && r.closed_days !== 'Tiada Cuti') ? ` • <span style="color:#DC2626;">Cuti: ${r.closed_days}</span>` : '';
        const tasteBadges = renderTasteBadges(r.taste_tags);

        item.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:start;">
                <h3 class="restaurant-item-title">${r.name}</h3>
                <span class="tag tag-budget" style="font-size:10px;">${r.budget_tier}</span>
            </div>
            <p class="restaurant-item-sub">📍 ${r.address}</p>
            <div style="font-size:11px; font-weight:700; color:#059669; margin-top:4px;">
                ${hoursText}${closedText}
            </div>
            <div style="margin-top:6px; display:flex; gap:4px; flex-wrap:wrap;">
                <span class="tag tag-cat" style="font-size:10px;">${r.category}</span>
                <span class="tag" style="background:#F3F4F6; color:#4B5563; font-size:10px;">${r.carb_type}</span>
                ${tasteBadges}
            </div>
        `;
        
        item.addEventListener("click", () => {
            currentSelectedShop = r;
            openStoreProfile(r);
        });

        restaurantsList.appendChild(item);
    });

    if (totalPages > 1) {
        const paginationBox = document.createElement("div");
        paginationBox.style.cssText = "display:flex; justify-content:space-between; align-items:center; margin-top:12px; padding:8px 4px; border-top:1px solid var(--border-color);";

        const prevBtn = document.createElement("button");
        prevBtn.className = "btn-suggest";
        prevBtn.style.cssText = "width:auto; padding:8px 14px; font-size:12px; margin:0;";
        prevBtn.innerText = "⬅️ Sebelum";
        prevBtn.disabled = (currentPage === 1);
        if (currentPage === 1) prevBtn.style.opacity = "0.5";
        prevBtn.addEventListener("click", () => {
            if (currentPage > 1) {
                currentPage--;
                renderListView();
                restaurantsList.scrollTop = 0;
            }
        });

        const pageLabel = document.createElement("span");
        pageLabel.style.cssText = "font-size:12px; font-weight:800; color:var(--text-muted);";
        pageLabel.innerText = `Halaman ${currentPage} / ${totalPages}`;

        const nextBtn = document.createElement("button");
        nextBtn.className = "btn-suggest";
        nextBtn.style.cssText = "width:auto; padding:8px 14px; font-size:12px; margin:0;";
        nextBtn.innerText = "Seterusnya ➡️";
        nextBtn.disabled = (currentPage === totalPages);
        if (currentPage === totalPages) nextBtn.style.opacity = "0.5";
        nextBtn.addEventListener("click", () => {
            if (currentPage < totalPages) {
                currentPage++;
                renderListView();
                restaurantsList.scrollTop = 0;
            }
        });

        paginationBox.appendChild(prevBtn);
        paginationBox.appendChild(pageLabel);
        paginationBox.appendChild(nextBtn);
        restaurantsList.appendChild(paginationBox);
    }
}

// Buka Modal Profil Kedai (Google Maps Tunggal Kalis Air)
function openStoreProfile(shop) {
    if (!shop) return;
    currentSelectedShop = shop;

    if (profileName) profileName.innerText = shop.name;
    if (profileCategory) profileCategory.innerText = shop.category;
    if (profileBudget) profileBudget.innerText = shop.budget_tier;
    if (profileCarb) profileCarb.innerText = shop.carb_type;
    if (profileAddress) profileAddress.innerText = shop.address;
    
    if (profileHours) profileHours.innerText = shop.operating_hours || "10:00 AM - 10:00 PM";
    if (profileClosed) profileClosed.innerText = shop.closed_days || "Tiada Cuti";

    if (profileTastesBox) {
        profileTastesBox.innerHTML = renderTasteBadges(shop.taste_tags);
    }

    if (profileSignatureDish) {
        profileSignatureDish.innerText = getSignatureDish(shop);
    }

    if (profileGmapsBtn) {
        profileGmapsBtn.href = buildSafeGoogleMapsUrl(shop);
    }

    if (profileModal) profileModal.classList.remove("hidden");
}

if (closeProfileBtn) {
    closeProfileBtn.addEventListener("click", () => profileModal.classList.add("hidden"));
}
if (profileModal) {
    profileModal.addEventListener("click", (e) => {
        if (e.target === profileModal) profileModal.classList.add("hidden");
    });
}

// --- 7. TOGGLE VIEW ---
if (toggleWheelBtn && toggleListBtn) {
    toggleWheelBtn.addEventListener("click", () => {
        toggleWheelBtn.classList.add("active");
        toggleListBtn.classList.remove("active");
        wheelView.classList.remove("hidden");
        listView.classList.add("hidden");
    });

    toggleListBtn.addEventListener("click", () => {
        toggleListBtn.classList.add("active");
        toggleWheelBtn.classList.remove("active");
        listView.classList.remove("hidden");
        wheelView.classList.add("hidden");
    });
}

// --- 8. TOGGLE & LISTENER MOD MENGIDAM ---
if (toggleCravingModeBtn) {
    toggleCravingModeBtn.addEventListener("click", () => {
        isCravingModeActive = !isCravingModeActive;

        if (isCravingModeActive) {
            toggleCravingModeBtn.style.background = "#E11D48";
            toggleCravingModeBtn.style.color = "#FFF";
            normalFiltersSection.classList.add("hidden");
            cravingFiltersSection.classList.remove("hidden");
            if (spinBtnText) spinBtnText.innerText = "IKUT TEKAK MENGIDAM! 🤰🎲";
        } else {
            toggleCravingModeBtn.style.background = "#FFF1F2";
            toggleCravingModeBtn.style.color = "#E11D48";
            normalFiltersSection.classList.remove("hidden");
            cravingFiltersSection.classList.add("hidden");
            if (spinBtnText) spinBtnText.innerText = "PUTAR KEPUTUSAN! 🎲";
        }

        applyFilters();
    });
}

// Listener Cip Deria Rasa Mengidam
tasteChips.forEach(chip => {
    chip.addEventListener("click", () => {
        tasteChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeTasteFilter = chip.getAttribute("data-taste");
        if (cravingStatusHint) {
            cravingStatusHint.innerText = chip.innerText;
        }
        applyFilters();
    });
});

// Listener Penapis Normal
foodChips.forEach(chip => {
    chip.addEventListener("click", () => {
        foodChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeFoodFilter = chip.getAttribute("data-filter");
        applyFilters();
    });
});

budgetChips.forEach(chip => {
    chip.addEventListener("click", () => {
        budgetChips.forEach(c => c.classList.remove("active"));
        chip.classList.add("active");
        activeBudgetFilter = chip.getAttribute("data-budget");
        applyFilters();
    });
});

if (listSearchInput) {
    listSearchInput.addEventListener("input", (e) => {
        listSearchQuery = e.target.value;
        applySearchToList();
    });
}

// Butang Reroll
if (btnRerollResult) {
    btnRerollResult.addEventListener("click", () => {
        spinWheel();
    });
}

// Penapis Kawasan Senarai & Roda (Aktif Global)
window.setAreaFilter = function(area, btn) {
    document.querySelectorAll(".area-chip").forEach(c => c.classList.remove("active"));
    btn.classList.add("active");
    activeAreaFilter = area;
    applyFilters();
};

window.pilihTierDerma = function(tierName, amount) {
    const label = document.getElementById("selected-tier-label");
    if (label) {
        label.innerText = `Pilihan: ${tierName} (${amount})`;
    }
};

// --- 9. MODAL SOKONGAN & INTEGRASI GOOGLE APPS SCRIPT (LIVE SYNC) ---
const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzBEzpI3MMWW9vZhsMG8-ikFZLqzqJuFZW14QG34D-Y3iI_lI8RP6unVOjBqbLweN0L/exec";

// Enjin Penghantaran Kalis CORS
async function sendToGoogleAppsScript(payload) {
    try {
        await fetch(GOOGLE_SCRIPT_URL, {
            method: "POST",
            mode: "no-cors",
            cache: "no-cache",
            headers: {
                "Content-Type": "text/plain;charset=utf-8"
            },
            body: JSON.stringify(payload)
        });
        return true;
    } catch (err) {
        console.error("Ralat tembak Google Apps Script:", err);
        return false;
    }
}

// A. BORANG 1: CADANGKAN KEDAI (Tab: Cadangan_Kedai)
if (openSuggestBtn) {
    openSuggestBtn.addEventListener("click", () => {
        suggestFormView.classList.remove("hidden");
        suggestSuccessView.classList.add("hidden");
        suggestModal.classList.remove("hidden");
    });
}
if (closeSuggestBtn) closeSuggestBtn.addEventListener("click", () => suggestModal.classList.add("hidden"));
if (suggestModal) {
    suggestModal.addEventListener("click", (e) => {
        if (e.target === suggestModal) suggestModal.classList.add("hidden");
    });
}

if (suggestForm) {
    suggestForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = suggestForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerText : "Hantar Cadangan 🚀";
        if (submitBtn) {
            submitBtn.innerText = "Menghantar Cadangan... ⏳";
            submitBtn.disabled = true;
        }

        const name = document.getElementById("suggest-name").value;
        const area = document.getElementById("suggest-area").value;
        const carb = document.getElementById("suggest-carb").value;
        const budget = document.getElementById("suggest-budget").value;
        const link = document.getElementById("suggest-link").value || "";

        // Tembak Data Sepadan Tepat dengan Code.gs
        await sendToGoogleAppsScript({
            form_type: "suggest",
            shop_name: name,
            area: area,
            carb_type: carb,
            budget: budget,
            link: link
        });

        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }

        successMessage.innerText = `Cadangan kedai '${name}' dah selamat sampai ke Google Sheets kami! Nanti kami semak kelayakan sebelum masukkan ke roda ya. ❤️`;
        suggestFormView.classList.add("hidden");
        suggestSuccessView.classList.remove("hidden");
        suggestForm.reset();
    });
}

if (btnContinueSpin) btnContinueSpin.addEventListener("click", () => suggestModal.classList.add("hidden"));
if (btnSuggestAnother) {
    btnSuggestAnother.addEventListener("click", () => {
        suggestSuccessView.classList.add("hidden");
        suggestFormView.classList.remove("hidden");
    });
}

// B. BORANG 2: LAPOR ISU KEDAI (Tab: Laporan_Masalah)
function triggerReportModal() {
    const targetName = currentSelectedShop ? currentSelectedShop.name : (resultName ? resultName.innerText : "Kedai");
    reportShopName.innerText = `Kedai: ${targetName}`;
    reportModal.classList.remove("hidden");
}

if (btnReportResult) btnReportResult.addEventListener("click", triggerReportModal);
if (btnReportProfile) btnReportProfile.addEventListener("click", triggerReportModal);

if (closeReportBtn) closeReportBtn.addEventListener("click", () => reportModal.classList.add("hidden"));
if (reportModal) {
    reportModal.addEventListener("click", (e) => {
        if (e.target === reportModal) reportModal.classList.add("hidden");
    });
}

if (reportForm) {
    reportForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = reportForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerText : "Hantar Laporan 🚨";
        if (submitBtn) {
            submitBtn.innerText = "Merekod Laporan... ⏳";
            submitBtn.disabled = true;
        }

        const shopName = currentSelectedShop ? currentSelectedShop.name : (resultName ? resultName.innerText : "Kedai");
        const issueType = document.getElementById("report-issue-type").value;
        const notes = document.getElementById("report-notes").value || "";

        // Tembak Data Sepadan Tepat dengan Code.gs
        await sendToGoogleAppsScript({
            form_type: "report",
            shop_name: shopName,
            issue_type: issueType,
            notes: notes
        });

        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }

        alert(`Terima kasih! Laporan mengenai '${shopName}' berjaya direkodkan terus ke sistem semakan admin. 🛡️`);
        reportForm.reset();
        reportModal.classList.add("hidden");
    });
}

// C. BORANG 3: HUBUNGI ADMIN (Tab: Mesej_Admin)
if (openContactBtn) openContactBtn.addEventListener("click", () => contactModal.classList.remove("hidden"));
if (closeContactBtn) closeContactBtn.addEventListener("click", () => contactModal.classList.add("hidden"));
if (contactModal) {
    contactModal.addEventListener("click", (e) => {
        if (e.target === contactModal) contactModal.classList.add("hidden");
    });
}

if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        const submitBtn = contactForm.querySelector("button[type='submit']");
        const originalText = submitBtn ? submitBtn.innerText : "Hantar Mesej ✉️";
        if (submitBtn) {
            submitBtn.innerText = "Menghantar Mesej... ⏳";
            submitBtn.disabled = true;
        }

        const name = document.getElementById("contact-name").value;
        const reach = document.getElementById("contact-reach").value;
        const message = document.getElementById("contact-message").value;

        // Tembak Data Sepadan Tepat dengan Code.gs (sender_name & contact_info)
        await sendToGoogleAppsScript({
            form_type: "contact",
            sender_name: name,
            contact_info: reach,
            message: message
        });

        if (submitBtn) {
            submitBtn.innerText = originalText;
            submitBtn.disabled = false;
        }

        alert(`Terima kasih ${name}! Mesej anda dah selamat sampai ke peti masuk admin. Kami akan balas secepat mungkin! ✉️❤️`);
        contactForm.reset();
        contactModal.classList.add("hidden");
    });
}

// MODAL TIP / DERMA KOPI
if (openTipBtn) openTipBtn.addEventListener("click", () => tipModal.classList.remove("hidden"));
if (closeTipBtn) closeTipBtn.addEventListener("click", () => tipModal.classList.add("hidden"));
if (tipModal) {
    tipModal.addEventListener("click", (e) => {
        if (e.target === tipModal) tipModal.classList.add("hidden");
    });
}

// MODAL PENAFIAN (DISCLAIMER)
const disclaimerModal = document.getElementById("disclaimer-modal");
const openDisclaimerBtn = document.getElementById("open-disclaimer-btn");
const closeDisclaimerBtn = document.getElementById("close-disclaimer-btn");
const btnOkDisclaimer = document.getElementById("btn-ok-disclaimer");

if (openDisclaimerBtn) openDisclaimerBtn.addEventListener("click", () => disclaimerModal.classList.remove("hidden"));
if (closeDisclaimerBtn) closeDisclaimerBtn.addEventListener("click", () => disclaimerModal.classList.add("hidden"));
if (btnOkDisclaimer) btnOkDisclaimer.addEventListener("click", () => disclaimerModal.classList.add("hidden"));
if (disclaimerModal) {
    disclaimerModal.addEventListener("click", (e) => {
        if (e.target === disclaimerModal) disclaimerModal.classList.add("hidden");
    });
}

// Mulakan butang putar & muat turun data (Sekali sahaja!)
if (spinBtn) spinBtn.addEventListener("click", spinWheel);
fetchRestaurants();