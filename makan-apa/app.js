/**
 * MAKAN APA? - Official WebApp Engine (Final Handover Edition)
 * Co-Architects: Khairul Azzumie & Mia
 * Domain: axworld.my/makan-apa/
 */

// ==========================================
// 1. GLOBAL STATE & DATA
// ==========================================
let allRestaurants = [];
let filteredRestaurants = [];
let userLocation = null;

let currentArea = 'all';
let currentFood = 'all';
let currentBudget = 'all';
let currentTaste = 'all';
let isCravingMode = false;
let currentTab = 'wheel'; // 'wheel' | 'list'
let selectedRestaurant = null;

// 8 HIRISAN RODA SEIMBANG (Diselaraskan tepat dengan sudut putaran)
const WHEEL_SLICES = [
    { id: "Nasi", label: "🍚 Nasi & Lauk", color: "#FF5722", title: "🍚 ANEKA NASI" },
    { id: "Western", label: "🍔 Western & Burger", color: "#FF9800", title: "🍔 BURGER & WESTERN" },
    { id: "Tomyam", label: "🌶️ Tomyam & Thai", color: "#E91E63", title: "🌶️ TOMYAM & THAI" },
    { id: "Mamak", label: "🍛 Mamak & Roti", color: "#4CAF50", title: "🍛 MAMAK & ROTI" },
    { id: "Mi", label: "🍜 Mi & Sup", color: "#00BCD4", title: "🍜 MEE & SUP" },
    { id: "Ayam", label: "🍗 Fast Food", color: "#9C27B0", title: "🍗 FAST FOOD & AYAM" },
    { id: "KafeHunting", label: "🍰 Kafe & Dessert", color: "#EC4899", title: "🍰 KAFE & DESSERT" },
    { id: "Kopitiam", label: "☕ Kopitiam & Toast", color: "#795548", title: "☕ KOPITIAM & TOAST" }
];

// ==========================================
// 2. DOM ELEMENTS CACHE
// ==========================================
let canvas, ctx;
let spinBtn, spinBtnText;
let wheelFilterStatus, resultCard;
let resultCraving, resultName, resultCategory, resultBudget, resultTastesBox, resultHours, resultAddress, resultGmapsBtn;
let countTabTop, listCountLabel, restaurantsList, listSearchInput;
let wheelView, listView, toggleWheelBtn, toggleListBtn;
let normalFiltersSec, cravingFiltersSec, toggleCravingBtn, cravingStatusHint;

// ==========================================
// 3. INITIALIZATION
// ==========================================
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
// 4. FETCH RESTAURANTS (KALIS BENTUK JSON)
// ==========================================
async function fetchRestaurantsData() {
    try {
        const response = await fetch("restaurants.json");
        if (!response.ok) throw new Error("Gagal load restaurants.json");
        const data = await response.json();
        
        // Menampung sama ada JSON berbentuk Array terus atau dibungkus dalam { restaurants: [...] }
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
            wheelFilterStatus.textContent = "⚠️ Gagal memuatkan rekod kedai. Sila refresh!";
            wheelFilterStatus.style.background = "#FEE2E2";
            wheelFilterStatus.style.color = "#DC2626";
        }
    }
}

// ==========================================
// 5. SISTEM PENAPISAN (KAWASAN, MAKANAN, BAJET, MENGIDAM)
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
    if (areaKey === 'kebun_tpg') return itemArea.includes('kebun') || itemArea.includes('tpg') || itemArea.includes('telok') || itemAddress.includes('kebun') || itemAddress.includes('telok');
    if (areaKey === 'shah_alam') return itemArea.includes('shah alam') || itemAddress.includes('shah alam') || itemAddress.includes('seksyen');
    if (areaKey === 'subang') return itemArea.includes('subang') || itemArea.includes('usj') || itemAddress.includes('subang') || itemAddress.includes('usj') || itemAddress.includes('sunway');
    if (areaKey === 'ttdi_damansara') return itemArea.includes('ttdi') || itemArea.includes('damansara') || itemArea.includes('pj') || itemAddress.includes('damansara') || itemAddress.includes('ttdi');
    if (areaKey === 'bangi_kajang') return itemArea.includes('bangi') || itemArea.includes('kajang') || itemAddress.includes('bangi') || itemAddress.includes('kajang');
    if (areaKey === 'kl') return itemArea.includes('kl') || itemArea.includes('kuala lumpur') || itemArea.includes('kg baru') || itemAddress.includes('kuala lumpur') || itemAddress.includes('kampung baru');
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
    const target = budgetKey.toLowerCase();
    return b.includes(target);
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

    // Susun mengikut jarak jika GPS dibenarkan, jika tidak susun A - Z
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
            let tasteText = currentTaste === 'all' ? 'Apa-apa Rasa' : currentTaste.toUpperCase();
            wheelFilterStatus.textContent = `🤰 Mak Buyung: ${areaText} • ${tasteText} (${total} Kedai)`;
        } else {
            let foodText = currentFood === 'all' ? 'Semua Makanan' : currentFood;
            wheelFilterStatus.textContent = `🎡 Pilihan: ${areaText} • ${foodText} (${total} Kedai)`;
        }
    }
}

// ==========================================
// 6. ENJIN RODA PUTARAN 8-HIRISAN (PHYSICS & SYNC)
// ==========================================
let currentRotation = 0;
let isSpinning = false;

function initWheelCanvas() {
    if (!canvas || !ctx) return;
    drawWheel(0);
}

function drawWheel(angleOffset) {
    const numSlices = WHEEL_SLICES.length;
    const arc = (2 * Math.PI) / numSlices;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    WHEEL_SLICES.forEach((slice, i) => {
        const angle = angleOffset + i * arc;

        // Hirisan
        ctx.beginPath();
        ctx.fillStyle = slice.color;
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arc);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2.5;
        ctx.stroke();

        // Teks Atas Hirisan
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 13px 'Plus Jakarta Sans', sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.6)";
        ctx.shadowBlur = 4;
        ctx.fillText(slice.label, radius - 18, 5);
        ctx.restore();
    });
}

function spinWheelAction() {
    if (isSpinning) return;
    if (filteredRestaurants.length === 0) {
        alert("Sayang, tiada kedai ditemui untuk tapisan sekarang. Cuba tukar kawasan atau makanan ya!");
        return;
    }

    isSpinning = true;
    spinBtn.disabled = true;
    if (spinBtnText) spinBtnText.textContent = "MEMUTAR REZEKI... 🎡";
    if (resultCard) resultCard.classList.add("hidden");

    const extraSpins = 5 + Math.random() * 5; // 5 hingga 10 pusingan lengkap
    const randomStopDegree = Math.random() * 360;
    const totalDegree = extraSpins * 360 + randomStopDegree;
    const duration = 4000;
    const startTimestamp = performance.now();

    function animate(now) {
        const elapsed = now - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        
        // Cubic easing out
        const ease = 1 - Math.pow(1 - progress, 3);
        const animRotation = (totalDegree * ease) * (Math.PI / 180);

        drawWheel(animRotation);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            if (spinBtnText) spinBtnText.textContent = "PUTAR KEPUTUSAN! 🎲";
            currentRotation = (totalDegree * (Math.PI / 180)) % (2 * Math.PI);
            calculateWheelWinner(currentRotation);
        }
    }
    requestAnimationFrame(animate);
}

// PENGIRAAN TEPAT MENGIKUT POINTER JAM 12 (270 DARJAH / 1.5 PI)
function calculateWheelWinner(finalRotation) {
    const numSlices = WHEEL_SLICES.length;
    const arc = (2 * Math.PI) / numSlices;
    
    // Pointer statik berada di atas sekali (1.5 * PI)
    const pointerAngle = 1.5 * Math.PI;
    let localPointer = (pointerAngle - (finalRotation % (2 * Math.PI))) % (2 * Math.PI);
    if (localPointer < 0) localPointer += (2 * Math.PI);

    const winningSliceIndex = Math.floor(localPointer / arc) % numSlices;
    const winningSlice = WHEEL_SLICES[winningSliceIndex];

    pickWinningRestaurant(winningSlice);
}

function pickWinningRestaurant(winningSlice) {
    // 1. Cuba cari kedai dalam senarai tertapis yang menepati hirisan roda
    let matchedCandidates = filteredRestaurants.filter(item => {
        const cat = (item.category || '').toLowerCase();
        const carb = (item.carb || '').toLowerCase();
        const tags = (item.tags || []).map(t => t.toLowerCase());
        const sId = winningSlice.id.toLowerCase();
        return cat.includes(sId) || carb.includes(sId) || tags.includes(sId);
    });

    // 2. Jika tiada, ambil daripada mana-mana kedai dalam senarai tertapis semasa
    if (matchedCandidates.length === 0) {
        matchedCandidates = filteredRestaurants;
    }

    const luckyShop = matchedCandidates[Math.floor(Math.random() * matchedCandidates.length)];
    displayWinningCard(luckyShop, winningSlice);
}

function displayWinningCard(shop, winningSlice) {
    if (!resultCard || !shop) return;

    // Selaraskan Tajuk Oren Hasil Pendaratan Roda (Tomyam vs Burger tepat!)
    if (resultCraving) {
        resultCraving.textContent = winningSlice ? winningSlice.title : (shop.category || "PILIHAN HARI INI");
    }

    if (resultName) resultName.textContent = shop.name;
    if (resultCategory) resultCategory.textContent = shop.category || "Kedai Tempatan";
    if (resultBudget) resultBudget.textContent = shop.budget || shop.priceRange || "RM Marhaen";
    if (resultHours) resultHours.textContent = `⏰ Waktu: ${shop.hours || "Waktu Biasa"}`;
    if (resultAddress) resultAddress.textContent = shop.address || "Alamat dalam Google Maps";

    // Deria Rasa Tags
    if (resultTastesBox) {
        resultTastesBox.innerHTML = "";
        if (shop.tastes && Array.isArray(shop.tastes)) {
            shop.tastes.forEach(t => {
                const badge = document.createElement("span");
                badge.className = "tag";
                badge.style.background = "#FEF2F2";
                badge.style.color = "#DC2626";
                badge.style.fontSize = "10px";
                badge.textContent = `#${t}`;
                resultTastesBox.appendChild(badge);
            });
        }
    }

    // Google Maps Butang Tunggal
    if (resultGmapsBtn) {
        const gmapsDest = (shop.lat && shop.lng) 
            ? `${shop.lat},${shop.lng}` 
            : encodeURIComponent(shop.name + " " + (shop.address || ""));
        resultGmapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${gmapsDest}`;
    }

    resultCard.classList.remove("hidden");
    resultCard.scrollIntoView({ behavior: "smooth", block: "nearest" });
}

// ==========================================
// 7. MOD SENARAI KEDAI A-Z & MODAL PROFIL
// ==========================================
function renderRestaurantList(list) {
    if (!restaurantsList) return;
    restaurantsList.innerHTML = "";

    if (list.length === 0) {
        restaurantsList.innerHTML = `
            <div style="text-align:center; padding:30px 10px; color:var(--text-muted);">
                <p style="font-size:32px; margin-bottom:6px;">🍽️</p>
                <p style="font-weight:700;">Tiada kedai ditemui untuk kombinasi ini.</p>
                <p style="font-size:12px;">Cuba tukar penapis kawasan atau jenis makanan ya Darling!</p>
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
            ? `<div style="font-size:12px; color:#B45309; font-weight:700; margin-top:2px;">⭐ ${shop.signature}</div>` 
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
    document.getElementById("profile-carb").textContent = shop.carb || "Menu Lazat";
    document.getElementById("profile-hours").textContent = shop.hours || "10:00 AM - 10:00 PM";
    document.getElementById("profile-closed").textContent = shop.offDay || "Tiada Cuti";
    document.getElementById("profile-signature-dish").textContent = shop.signature || "Aneka menu tempatan padu!";
    document.getElementById("profile-address").textContent = shop.address || "Alamat dalam aplikasi peta";

    // Tastes Badges
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

    // Google Maps Single Button
    const gmapsBtn = document.getElementById("profile-gmaps-btn");
    const gmapsDest = (shop.lat && shop.lng) 
        ? `${shop.lat},${shop.lng}` 
        : encodeURIComponent(shop.name + " " + (shop.address || ""));
    gmapsBtn.href = `https://www.google.com/maps/dir/?api=1&destination=${gmapsDest}`;

    document.getElementById("profile-modal").classList.remove("hidden");
}

// ==========================================
// 8. GPS HAVERSINE & JARAK
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
            (err) => console.log("GPS pasif atau tidak aktif:", err.message),
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
// 9. MODAL BELANJA KOPI (GOOGLE PLAY TIER)
// ==========================================
window.pilihTierDerma = function(tierName, tierPrice) {
    const label = document.getElementById("selected-tier-label");
    if (label) {
        label.textContent = `Pilihan: ${tierName} (${tierPrice})`;
    }
};

// ==========================================
// 10. EVENT LISTENERS & SETUP
// ==========================================
function setupEventListeners() {
    // 1. Putar Roda
    if (spinBtn) spinBtn.addEventListener("click", spinWheelAction);

    // 2. Putar Semula (Re-roll)
    const rerollBtn = document.getElementById("btn-reroll-result");
    if (rerollBtn) {
        rerollBtn.addEventListener("click", () => {
            if (filteredRestaurants.length > 0) {
                const randomShop = filteredRestaurants[Math.floor(Math.random() * filteredRestaurants.length)];
                displayWinningCard(randomShop, null);
            }
        });
    }

    // 3. Suis Mod Mengidam (Mak Buyung)
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

    // 4. Makanan Chips (Normal)
    document.querySelectorAll(".food-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".food-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentFood = chip.getAttribute("data-filter");
            applyFilters();
        });
    });

    // 5. Bajet Chips (Normal)
    document.querySelectorAll(".budget-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".budget-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentBudget = chip.getAttribute("data-budget");
            applyFilters();
        });
    });

    // 6. Taste Chips (Mak Buyung)
    document.querySelectorAll(".taste-chip").forEach(chip => {
        chip.addEventListener("click", () => {
            document.querySelectorAll(".taste-chip").forEach(c => c.classList.remove("active"));
            chip.classList.add("active");
            currentTaste = chip.getAttribute("data-taste");
            if (cravingStatusHint) {
                cravingStatusHint.textContent = chip.textContent;
            }
            applyFilters();
        });
    });

    // 7. Tab Penukar View (Roda vs Senarai)
    if (toggleWheelBtn && toggleListBtn) {
        toggleWheelBtn.addEventListener("click", () => {
            currentTab = 'wheel';
            toggleWheelBtn.classList.add("active");
            toggleListBtn.classList.remove("active");
            wheelView.classList.remove("hidden");
            listView.classList.add("hidden");
        });

        toggleListBtn.addEventListener("click", () => {
            currentTab = 'list';
            toggleListBtn.classList.add("active");
            toggleWheelBtn.classList.remove("active");
            listView.classList.remove("hidden");
            wheelView.classList.add("hidden");
        });
    }

    // 8. Carian Teks Senarai A-Z
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

    // 9. Modals (Buka & Tutup)
    setupModal("open-suggest-btn", "close-suggest-btn", "suggest-modal");
    setupModal("open-tip-btn", "close-tip-btn", "tip-modal");
    setupModal(null, "close-profile-btn", "profile-modal");
    setupModal(null, "close-report-btn", "report-modal");
    setupModal("open-contact-btn", "close-contact-btn", "contact-modal");

    // Modal Cadang Lagi / Sambung Putar
    const btnContinueSpin = document.getElementById("btn-continue-spin");
    if (btnContinueSpin) {
        btnContinueSpin.addEventListener("click", () => {
            document.getElementById("suggest-modal").classList.add("hidden");
        });
    }

    // Butang Lapor Kedai (dari Kad Keputusan & Profil)
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

    // Form Submissions
    setupFormSubmission("suggest-form", () => {
        document.getElementById("suggest-form-view").classList.add("hidden");
        document.getElementById("suggest-success-view").classList.remove("hidden");
    });

    setupFormSubmission("report-form", () => {
        alert("Terima kasih Darling! Laporan masalah kedai dah diterima untuk tindakan admin.");
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
        const openBtn = document.getElementById(openBtnId);
        if (openBtn) openBtn.addEventListener("click", () => modal.classList.remove("hidden"));
    }

    if (closeBtnId) {
        const closeBtn = document.getElementById(closeBtnId);
        if (closeBtn) closeBtn.addEventListener("click", () => modal.classList.add("hidden"));
    }

    // Klik di luar modal card untuk tutup
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
// 11. SUIS MOD GELAP (PERSISTED KE LOCALSTORAGE)
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