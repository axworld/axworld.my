/**
 * MAKAN APA? - Official WebApp Engine (Original Wheel Design Edition)
 * Co-Architects: Khairul Azzumie & Mia
 * Domain: axworld.my/makan-apa/
 */

// ==========================================
// 1. DATA RESTORAN & 8 HIRISAN ASAL (ICON + WARNA ASAL)
// ==========================================
let allRestaurants = [];
let filteredRestaurants = [];
let userLocation = null;

let currentArea = 'all';
let currentFood = 'all';
let currentBudget = 'all';
let currentTaste = 'all';
let isCravingMode = false;
let currentTab = 'wheel';
let selectedRestaurant = null;

// 8 HIRISAN MENGIKUT URUTAN GAMBAR ASAL (CLOCKWISE)
const WHEEL_SLICES = [
    { id: "Tomyam", label: "Tomyam", icon: "🍲", color: "#00A896", title: "🍲 HARI INI TEKAK NAK: TOMYAM!" },
    { id: "Kopitiam", label: "Kopitiam", icon: "☕", color: "#6F4E37", title: "☕ HARI INI TEKAK NAK: KOPITIAM!" },
    { id: "Mamak", label: "Mamak", icon: "🍛", color: "#FF7A00", title: "🍛 HARI INI TEKAK NAK: MAMAK!" },
    { id: "KafeHunting", label: "Kafe & Manis", icon: "🍰", color: "#E83E8C", title: "🍰 HARI INI TEKAK NAK: KAFE & DESSERT!" },
    { id: "Nasi", label: "Nasi", icon: "🍚", color: "#00B894", title: "🍚 HARI INI TEKAK NAK: NASI!" },
    { id: "Western", label: "Burger", icon: "🍔", color: "#E84118", title: "🍔 HARI INI TEKAK NAK: BURGER & WESTERN!" },
    { id: "Mi", label: "Mi & Sup", icon: "🍜", color: "#FFC048", title: "🍜 HARI INI TEKAK NAK: MI & SUP!" },
    { id: "Ayam", label: "Ayam Goreng", icon: "🍗", color: "#8854D0", title: "🍗 HARI INI TEKAK NAK: AYAM GORENG!" }
];

// ==========================================
// 2. DOM CACHING
// ==========================================
let canvas, ctx;
let spinBtn, spinBtnText;
let wheelFilterStatus, resultCard;
let resultCraving, resultName, resultCategory, resultBudget, resultTastesBox, resultHours, resultAddress, resultGmapsBtn;
let countTabTop, listCountLabel, restaurantsList, listSearchInput;
let wheelView, listView, toggleWheelBtn, toggleListBtn;
let normalFiltersSec, cravingFiltersSec, toggleCravingBtn, cravingStatusHint;

document.addEventListener("DOMContentLoaded", () => {
    cacheDomElements();
    initTheme();
    initWheelCanvas();
    initGeolocation();
    setupEventListeners();
    fetchRestaurantsData();
});

function cacheDomElements() {
    canvas = document.getElementById("wheel-canvas");
    ctx = canvas ? canvas.getContext("2d") : null;
    spinBtn = document.getElementById("spin-btn");
    spinBtnText = document.getElementById("spin-btn-text");
    wheelFilterStatus = document.getElementById("wheel-filter-status");
    resultCard = document.getElementById("result-card");
    resultCraving = document.getElementById("result-craving");
    resultName = document.getElementById("result-name");
    resultCategory = document.getElementById("result-category");
    resultBudget = document.getElementById("result-budget");
    resultTastesBox = document.getElementById("result-tastes-box");
    resultHours = document.getElementById("result-hours");
    resultAddress = document.getElementById("result-address");
    resultGmapsBtn = document.getElementById("result-gmaps-btn");
    
    countTabTop = document.getElementById("count-tab-top");
    listCountLabel = document.getElementById("list-count-label");
    restaurantsList = document.getElementById("restaurants-list");
    listSearchInput = document.getElementById("list-search-input");
    
    wheelView = document.getElementById("wheel-view");
    listView = document.getElementById("list-view");
    toggleWheelBtn = document.getElementById("toggle-wheel-btn");
    toggleListBtn = document.getElementById("toggle-list-btn");
    
    normalFiltersSec = document.getElementById("normal-filters-section");
    cravingFiltersSec = document.getElementById("craving-filters-section");
    toggleCravingBtn = document.getElementById("toggle-craving-mode-btn");
    cravingStatusHint = document.getElementById("craving-status-hint");
}

// ==========================================
// 3. FETCH DATABASE STATIK (KALIS RALAT)
// ==========================================
async function fetchRestaurantsData() {
    try {
        const response = await fetch("restaurants.json");
        if (!response.ok) throw new Error("Gagal load restaurants.json");
        const data = await response.json();
        
        if (Array.isArray(data)) {
            allRestaurants = data;
        } else if (data.restaurants && Array.isArray(data.restaurants)) {
            allRestaurants = data.restaurants;
        } else if (data.data && Array.isArray(data.data)) {
            allRestaurants = data.data;
        } else {
            allRestaurants = [];
        }

        applyFilters();
    } catch (err) {
        console.error("Mia Ralat Database:", err);
        if (wheelFilterStatus) {
            wheelFilterStatus.textContent = "⚠️ Gagal memuatkan data. Sila refresh!";
            wheelFilterStatus.style.background = "#FEE2E2";
            wheelFilterStatus.style.color = "#DC2626";
        }
    }
}

// ==========================================
// 4. PENAPISAN (KAWASAN, MAKANAN, BAJET, MENGIDAM)
// ==========================================
window.setAreaFilter = function(areaKey, btnElement) {
    currentArea = areaKey;
    document.querySelectorAll(".area-chip").forEach(el => el.classList.remove("active"));
    if (btnElement) btnElement.classList.add("active");
    applyFilters();
};

function matchesArea(item, areaKey) {
    if (areaKey === 'all') return true;
    const itemArea = (item.area || '').toLowerCase();
    const itemAreaKey = (item.area_key || '').toLowerCase();
    const itemAddress = (item.address || '').toLowerCase();

    if (itemAreaKey === areaKey) return true;
    if (areaKey === 'kebun_tpg') return itemArea.includes('kebun') || itemArea.includes('tpg') || itemArea.includes('telok') || itemAddress.includes('kebun');
    if (areaKey === 'shah_alam') return itemArea.includes('shah alam') || itemAddress.includes('shah alam') || itemAddress.includes('seksyen');
    if (areaKey === 'subang') return itemArea.includes('subang') || itemArea.includes('usj') || itemAddress.includes('subang');
    if (areaKey === 'ttdi_damansara') return itemArea.includes('ttdi') || itemArea.includes('damansara') || itemArea.includes('pj') || itemAddress.includes('damansara');
    if (areaKey === 'bangi_kajang') return itemArea.includes('bangi') || itemArea.includes('kajang') || itemAddress.includes('bangi');
    if (areaKey === 'kl') return itemArea.includes('kl') || itemArea.includes('kuala lumpur') || itemArea.includes('kg baru') || itemAddress.includes('kuala lumpur');
    return false;
}

function matchesFood(item, foodKey) {
    if (foodKey === 'all') return true;
    const cat = (item.category || '').toLowerCase();
    const carb = (item.carb || '').toLowerCase();
    const tags = (item.tags || []).map(t => t.toLowerCase());
    const target = foodKey.toLowerCase();
    return cat.includes(target) || carb.includes(target) || tags.includes(target);
}

function matchesBudget(item, budgetKey) {
    if (budgetKey === 'all') return true;
    const b = (item.budget || item.priceRange || '').toLowerCase();
    return b.includes(budgetKey.toLowerCase());
}

function matchesTaste(item, tasteKey) {
    if (tasteKey === 'all') return true;
    const tastes = (item.tastes || []).map(t => t.toLowerCase());
    return tastes.includes(tasteKey.toLowerCase());
}

function applyFilters() {
    filteredRestaurants = allRestaurants.filter(item => {
        const areaOk = matchesArea(item, currentArea);
        const foodOk = isCravingMode ? true : matchesFood(item, currentFood);
        const budgetOk = isCravingMode ? true : matchesBudget(item, currentBudget);
        const tasteOk = isCravingMode ? matchesTaste(item, currentTaste) : true;
        return areaOk && foodOk && budgetOk && tasteOk;
    });

    if (userLocation) {
        sortRestaurantsByDistance();
    } else {
        filteredRestaurants.sort((a, b) => a.name.localeCompare(b.name));
    }

    updateUIStatus();
    renderRestaurantList(filteredRestaurants);
}

function updateUIStatus() {
    const total = filteredRestaurants.length;
    if (countTabTop) countTabTop.textContent = total;
    if (listCountLabel) listCountLabel.textContent = `Menunjukkan ${total} kedai`;

    if (wheelFilterStatus) {
        let areaText = "Semua Kawasan";
        const activeAreaChip = document.querySelector(".area-chip.active");
        if (activeAreaChip) areaText = activeAreaChip.textContent.replace('📍 ', '');

        if (isCravingMode) {
            let tasteText = currentTaste === 'all' ? 'Apa-apa Sahaja' : currentTaste.toUpperCase();
            wheelFilterStatus.textContent = `🤰 Mak Buyung: ${areaText} • ${tasteText} (${total} Kedai)`;
        } else {
            let foodText = currentFood === 'all' ? 'Semua Makanan' : currentFood;
            wheelFilterStatus.textContent = `🎡 Mod Putaran: ${foodText} • ${areaText} (${total} Kedai)`;
        }
    }
}

// ==========================================
// 5. LUKIS RODA ASAL (DENGAN IKON & PUSAT TANDA SOAL "?")
// ==========================================
let currentRotation = 0;
let isSpinning = false;

function initWheelCanvas() {
    if (!canvas || !ctx) return;
    drawOriginalWheel(0);
}

function drawOriginalWheel(rotationAngle) {
    const numSlices = WHEEL_SLICES.length;
    const arc = (2 * Math.PI) / numSlices;
    const centerX = canvas.width / 2;
    const centerY = canvas.height / 2;
    const radius = centerX - 6;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Hirisan bermula tepat di atas (pointer jam 12)
    // Offset asas: -Math.PI / 2 - arc / 2 supaya hirisan 0 (Tomyam) berada tepat di tengah pointer
    const baseOffset = -Math.PI / 2 - (arc / 2);

    WHEEL_SLICES.forEach((slice, i) => {
        const angle = baseOffset + rotationAngle + (i * arc);

        // 1. Lukis Hirisan Warna Asal
        ctx.beginPath();
        ctx.fillStyle = slice.color;
        ctx.moveTo(centerX, centerY);
        ctx.arc(centerX, centerY, radius, angle, angle + arc);
        ctx.lineTo(centerX, centerY);
        ctx.fill();

        // Garisan pemisah putih
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // 2. Lukis Ikon & Teks Asal
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(angle + arc / 2);

        // Ikon Makanan (Bahagian Dalam)
        ctx.font = "18px sans-serif";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(slice.icon, radius * 0.48, 0);

        // Teks Label (Bahagian Luar)
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.textAlign = "right";
        ctx.fillText(slice.label, radius - 14, 4);

        ctx.restore();
    });

    // 3. Rim Luar Putih Tebal (Macam Design Asal)
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
    ctx.strokeStyle = "#FFFFFF";
    ctx.lineWidth = 6;
    ctx.stroke();

    // 4. Center Hub: Bulatan Gelap dengan Tanda Soal "?" Kuning Emas
    const centerRadius = 34;
    ctx.beginPath();
    ctx.arc(centerX, centerY, centerRadius, 0, 2 * Math.PI);
    ctx.fillStyle = "#1E293B"; // Dark slate center
    ctx.fill();
    ctx.strokeStyle = "#F59E0B"; // Amber Gold border
    ctx.lineWidth = 3.5;
    ctx.stroke();

    // Teks "?" Lilita One
    ctx.fillStyle = "#F59E0B";
    ctx.font = "bold 28px 'Lilita One', sans-serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText("?", centerX, centerY + 2);
}

// ==========================================
// 6. ENJIN PUTARAN & PENYELARASAN TAJUK OREN
// ==========================================
function spinWheelAction() {
    if (isSpinning) return;
    if (filteredRestaurants.length === 0) {
        alert("Sayang, tiada kedai dalam penapis ni. Sila tukar kawasan atau makanan dulu ya!");
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    if (spinBtnText) spinBtnText.textContent = "MEMUTAR REZEKI... 🎡";
    if (resultCard) resultCard.classList.add("hidden");

    const extraSpins = 6 + Math.random() * 4; // 6 ke 10 pusingan
    const randomStopDegree = Math.random() * 360;
    const totalRotationDeg = extraSpins * 360 + randomStopDegree;
    const duration = 4000;
    const startTimestamp = performance.now();

    function animate(now) {
        const elapsed = now - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing cubic out
        const ease = 1 - Math.pow(1 - progress, 3);
        const animRotation = (totalRotationDeg * ease) * (Math.PI / 180);

        drawOriginalWheel(animRotation);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            if (spinBtnText) spinBtnText.textContent = "PUTAR KEPUTUSAN! 🎲";
            currentRotation = (totalRotationDeg * (Math.PI / 180)) % (2 * Math.PI);
            calculateAccurateWinner(currentRotation);
        }
    }
    requestAnimationFrame(animate);
}

// PENGIRAAN MATEMATIK TEPAT (POINTER JAM 12)
function calculateAccurateWinner(finalRotation) {
    const numSlices = WHEEL_SLICES.length;
    const arc = (2 * Math.PI) / numSlices;

    // Kerana Tomyam bermula pada baseOffset (-PI/2 - arc/2)
    // Offset pemenang mengikut jarum atas:
    let angleDiff = (2 * Math.PI) - (finalRotation % (2 * Math.PI));
    let winningIndex = Math.floor((angleDiff + (arc / 2)) / arc) % numSlices;

    const winningSlice = WHEEL_SLICES[winningIndex];
    matchAndDisplayShop(winningSlice);
}

function matchAndDisplayShop(winningSlice) {
    // 1. Tapis kedai yang menepati hirisan roda pemenang
    let candidates = filteredRestaurants.filter(item => {
        const cat = (item.category || '').toLowerCase();
        const carb = (item.carb || '').toLowerCase();
        const tags = (item.tags || []).map(t => t.toLowerCase());
        const sId = winningSlice.id.toLowerCase();
        const sLabel = winningSlice.label.toLowerCase();

        return cat.includes(sId) || carb.includes(sId) || tags.includes(sId) || cat.includes(sLabel) || carb.includes(sLabel);
    });

    // 2. Jika tiada kedai spesifik dalam kawasan tertapis, ambil mana-mana kedai dalam senarai
    if (candidates.length === 0) {
        candidates = filteredRestaurants;
    }

    const luckyShop = candidates[Math.floor(Math.random() * candidates.length)];
    renderWinningResult(luckyShop, winningSlice);
}

function renderWinningResult(shop, winningSlice) {
    if (!resultCard || !shop) return;

    // SINKRONISASI TEPAT: Tajuk Oren Wajib Ikut Hirisan Pemenang!
    if (resultCraving) {
        resultCraving.textContent = winningSlice.title;
    }

    if (resultName) resultName.textContent = shop.name;
    if (resultCategory) resultCategory.textContent = shop.category || shop.carb || "Kedai Pilihan";
    if (resultBudget) resultBudget.textContent = shop.budget || shop.priceRange || "Mid (RM10-30)";
    
    // Status Waktu Buka & Cuti
    if (resultHours) {
        const offText = shop.offDay ? ` • 🚫 Cuti: ${shop.offDay}` : " • Buka Setiap Hari";
        resultHours.textContent = `⏰ Waktu: ${shop.hours || "10:00 AM - 10:00 PM"}${offText}`;
    }

    if (resultAddress) resultAddress.textContent = `📍 ${shop.address || "Alamat dalam Google Maps"}`;

    // Deria Rasa Tags
    if (resultTastesBox) {
        resultTastesBox.innerHTML = "";
        if (shop.tastes && Array.isArray(shop.tastes)) {
            shop.tastes.forEach(t => {
                const badge = document.createElement("span");
                badge.className = "tag";
                badge.style.background = "#FEF2F2";
                badge.style.color = "#DC2626";
                badge.style.fontSize = "11px";
                badge.textContent = `🌶️ ${t}`;
                resultTastesBox.appendChild(badge);
            });
        }
    }

    // Google Maps Butang Tunggal Rasmi
    if (resultGmapsBtn) {
        const dest = (shop.lat && shop.lng) 
            ? `${shop.lat},${shop.lng}` 
            : encodeURIComponent(shop.name + " " + (shop.address || ""));
        resultGmapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;
    }

    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// 7. SENARAI KEDAI A-Z & MODAL PROFIL
// ==========================================
function renderRestaurantList(list) {
    if (!restaurantsList) return;
    restaurantsList.innerHTML = "";

    if (list.length === 0) {
        restaurantsList.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:var(--text-muted);">
                <p style="font-size:32px; margin-bottom:6px;">🍽️</p>
                <p style="font-weight:700;">Tiada kedai ditemui untuk pilihan ini.</p>
                <p style="font-size:12px;">Cuba pilih kawasan lain ya Darling!</p>
            </div>
        `;
        return;
    }

    list.forEach(shop => {
        const card = document.createElement("div");
        card.className = "restaurant-card";
        card.style.cursor = "pointer";

        const distTag = (shop.distance && shop.distance !== 999) 
            ? `<span class="badge" style="background:#EEF2FF; color:#4F46E5; font-size:11px; font-weight:800;">📍 ${shop.distance} km</span>` 
            : ``;

        const signatureText = shop.signature 
            ? `<div style="font-size:12px; color:#B45309; font-weight:700; margin-top:3px;">⭐ ${shop.signature}</div>` 
            : ``;

        card.innerHTML = `
            <div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:4px;">
                <h3 style="font-size:15px; font-weight:800; color:var(--text-main); margin:0;">${shop.name}</h3>
                ${distTag}
            </div>
            ${signatureText}
            <div style="display:flex; gap:6px; margin-top:8px; font-size:11px; font-weight:700;">
                <span class="tag tag-cat">${shop.category || 'Makan'}</span>
                <span class="tag tag-budget">${shop.budget || 'Marhaen'}</span>
            </div>
        `;

        card.addEventListener("click", () => openProfileModal(shop));
        restaurantsList.appendChild(card);
    });
}

function openProfileModal(shop) {
    selectedRestaurant = shop;
    document.getElementById("profile-name").textContent = shop.name;
    document.getElementById("profile-category").textContent = shop.category || "Kedai Tempatan";
    document.getElementById("profile-budget").textContent = shop.budget || "Marhaen";
    document.getElementById("profile-carb").textContent = shop.carb || "Menu Pilihan";
    document.getElementById("profile-hours").textContent = shop.hours || "10:00 AM - 10:00 PM";
    document.getElementById("profile-closed").textContent = shop.offDay || "Tiada Cuti";
    document.getElementById("profile-signature-dish").textContent = shop.signature || "Menu padu tempatan!";
    document.getElementById("profile-address").textContent = shop.address || "Alamat dalam aplikasi peta";

    const tastesBox = document.getElementById("profile-tastes-box");
    tastesBox.innerHTML = "";
    if (shop.tastes && Array.isArray(shop.tastes)) {
        shop.tastes.forEach(t => {
            const badge = document.createElement("span");
            badge.className = "tag";
            badge.style.background = "#FEF2F2";
            badge.style.color = "#DC2626";
            badge.style.fontSize = "10px";
            badge.textContent = `#${t}`;
            tastesBox.appendChild(badge);
        });
    }

    const gmapsBtn = document.getElementById("profile-gmaps-btn");
    const dest = (shop.lat && shop.lng) 
        ? `${shop.lat},${shop.lng}` 
        : encodeURIComponent(shop.name + " " + (shop.address || ""));
    gmapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${dest}`;

    document.getElementById("profile-modal").classList.remove("hidden");
}

// ==========================================
// 8. HAVERSINE GPS CALCULATION
// ==========================================
function initGeolocation() {
    if ("geolocation" in navigator) {
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                userLocation = {
                    lat: pos.coords.latitude,
                    lng: pos.coords.longitude
                };
                if (allRestaurants.length > 0) {
                    sortRestaurantsByDistance();
                    renderRestaurantList(filteredRestaurants);
                }
            },
            (err) => console.log("Akses GPS:", err.message),
            { timeout: 6000 }
        );
    }
}

function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371;
    const dLat = (lat2 - lat1) * (Math.PI / 180);
    const dLon = (lon2 - lon1) * (Math.PI / 180);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

function sortRestaurantsByDistance() {
    if (!userLocation) return;
    filteredRestaurants.forEach(shop => {
        if (shop.lat && shop.lng) {
            shop.distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, shop.lat, shop.lng);
        } else {
            shop.distance = 999;
        }
    });
    filteredRestaurants.sort((a, b) => a.distance - b.distance);
}

// ==========================================
// 9. MODAL DERMA KOPI TIER
// ==========================================
window.pilihTierDerma = function(tierName, tierPrice) {
    const label = document.getElementById("selected-tier-label");
    if (label) {
        label.textContent = `Pilihan: ${tierName} (${tierPrice})`;
    }
};

// ==========================================
// 10. SETUP EVENT LISTENERS & MODALS
// ==========================================
function setupEventListeners() {
    if (spinBtn) spinBtn.addEventListener("click", spinWheelAction);

    // Re-roll kedai lain
    const rerollBtn = document.getElementById("btn-reroll-result");
    if (rerollBtn) {
        rerollBtn.addEventListener("click", () => {
            if (filteredRestaurants.length > 0) {
                const randomShop = filteredRestaurants[Math.floor(Math.random() * filteredRestaurants.length)];
                renderWinningResult(randomShop, { title: resultCraving ? resultCraving.textContent : "REZEKI PILIHAN" });
            }
        });
    }

    // Suis Mod Mengidam
    if (toggleCravingBtn) {
        toggleCravingBtn.addEventListener("click", () => {
            isCravingMode = !isCravingMode;
            if (isCravingMode) {
                normalFiltersSec.classList.add("hidden");
                cravingFiltersSec.classList.remove("hidden");
                toggleCravingBtn.style.background = "#E11D48";
                toggleCravingBtn.style.color = "#FFFFFF";
            } else {
                normalFiltersSec.classList.remove("hidden");
                cravingFiltersSec.classList.add("hidden");
                toggleCravingBtn.style.background = "#FFF1F2";
                toggleCravingBtn.style.color = "#E11D48";
            }
            applyFilters();
        });
    }

    // Food Chips (Normal)
    document.querySelectorAll(".food-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".food-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentFood = chip.getAttribute("data-filter");
            applyFilters();
        });
    });

    // Budget Chips (Normal)
    document.querySelectorAll(".budget-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".budget-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentBudget = chip.getAttribute("data-budget");
            applyFilters();
        });
    });

    // Taste Chips (Mak Buyung)
    document.querySelectorAll(".taste-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".taste-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentTaste = chip.getAttribute("data-taste");
            if (cravingStatusHint) cravingStatusHint.textContent = chip.textContent;
            applyFilters();
        });
    });

    // Tab Toggle (Roda vs Senarai)
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

    // Search Input
    if (listSearchInput) {
        listSearchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            const searched = filteredRestaurants.filter(shop => 
                shop.name.toLowerCase().includes(query) ||
                (shop.signature && shop.signature.toLowerCase().includes(query)) ||
                (shop.category && shop.category.toLowerCase().includes(query)) ||
                (shop.address && shop.address.toLowerCase().includes(query))
            );
            renderRestaurantList(searched);
            if (listCountLabel) listCountLabel.textContent = `Menunjukkan ${searched.length} kedai`;
        });
    }

    // Modals
    setupModal("open-suggest-btn", "close-suggest-btn", "suggest-modal");
    setupModal("open-tip-btn", "close-tip-btn", "tip-modal");
    setupModal(null, "close-profile-btn", "profile-modal");
    setupModal(null, "close-report-btn", "report-modal");
    setupModal("open-contact-btn", "close-contact-btn", "contact-modal");

    const btnContinueSpin = document.getElementById("btn-continue-spin");
    if (btnContinueSpin) {
        btnContinueSpin.addEventListener("click", () => {
            document.getElementById("suggest-modal").classList.add("hidden");
        });
    }

    const reportButtons = [document.getElementById("btn-report-result"), document.getElementById("btn-report-profile")];
    reportButtons.forEach(btn => {
        if (btn) {
            btn.addEventListener("click", () => {
                const targetName = selectedRestaurant ? selectedRestaurant.name : (resultName ? resultName.textContent : "Kedai Terpilih");
                document.getElementById("report-shop-name").textContent = `Kedai: ${targetName}`;
                document.getElementById("report-modal").classList.remove("hidden");
            });
        }
    });

    setupFormSubmission("suggest-form", () => {
        document.getElementById("suggest-form-view").classList.add("hidden");
        document.getElementById("suggest-success-view").classList.remove("hidden");
    });

    setupFormSubmission("report-form", () => {
        alert("Terima kasih! Laporan masalah kedai dah diterima untuk tindakan admin.");
        document.getElementById("report-modal").classList.add("hidden");
    });

    setupFormSubmission("contact-form", () => {
        alert("Mesej anda selamat dihantar kepada admin! Terima kasih banyak.");
        document.getElementById("contact-modal").classList.add("hidden");
    });
}

function setupModal(openBtnId, closeBtnId, modalId) {
    const modal = document.getElementById(modalId);
    if (!modal) return;
    if (openBtnId) {
        const btn = document.getElementById(openBtnId);
        if (btn) btn.addEventListener("click", () => modal.classList.remove("hidden"));
    }
    if (closeBtnId) {
        const btn = document.getElementById(closeBtnId);
        if (btn) btn.addEventListener("click", () => modal.classList.add("hidden"));
    }
    modal.addEventListener("click", (e) => {
        if (e.target === modal) modal.classList.add("hidden");
    });
}

function setupFormSubmission(formId, onSuccess) {
    const form = document.getElementById(formId);
    if (form) {
        form.addEventListener("submit", (e) => {
            e.preventDefault();
            onSuccess();
            form.reset();
        });
    }
}

// ==========================================
// 11. SUIS MOD GELAP
// ==========================================
function initTheme() {
    const themeBtn = document.getElementById("theme-toggle-btn");
    const savedTheme = localStorage.getItem("makan_apa_theme");

    if (savedTheme === "dark") {
        document.body.classList.add("dark-mode");
        if (themeBtn) themeBtn.textContent = "☀️";
    }

    if (themeBtn) {
        themeBtn.addEventListener("click", () => {
            document.body.classList.toggle("dark-mode");
            const isDark = document.body.classList.contains("dark-mode");
            themeBtn.textContent = isDark ? "☀️" : "🌙";
            localStorage.setItem("makan_apa_theme", isDark ? "dark" : "light");
        });
    }
}