/**
 * MAKAN APA? - Official WebApp Engine
 * Architect: Khairul Azzumie & Mia
 * Domain: axworld.my/makan-apa
 */

// 1. DATA RESTORAN & STATE PENGGUNA
let allRestaurants = [];
let filteredRestaurants = [];
let userLocation = null; // { lat: null, lng: null }

// 8 KATEGORI RODA (Selaras dengan Tag Kedai)
const WHEEL_SECTORS = [
    { label: "Nasi Campur & Melayu", tag: "melayu", color: "#FF5722" },
    { label: "Burger & Western", tag: "western", color: "#FF9800" },
    { label: "Tomyam & Thai", tag: "thai", color: "#E91E63" },
    { label: "Mamak & Roti", tag: "mamak", color: "#4CAF50" },
    { label: "Mee & Sup", tag: "mee", color: "#00BCD4" },
    { label: "Ayam Goreng & Fast Food", tag: "fastfood", color: "#9C27B0" },
    { label: "Cafe & Dessert", tag: "cafe", color: "#795548" },
    { label: "Marhaen & Bajet", tag: "bajet", color: "#607D8B" }
];

// DOM ELEMENTS
const canvas = document.getElementById("wheelCanvas");
const ctx = canvas ? canvas.getContext("2d") : null;
const spinBtn = document.getElementById("spinBtn");
const restaurantListEl = document.getElementById("restaurantList");
const resultBanner = document.getElementById("resultBanner");
const resultTitle = document.getElementById("resultTitle");
const searchInput = document.getElementById("searchInput");
const filterPills = document.querySelectorAll(".filter-pill");

// 2. INITIALIZATION
document.addEventListener("DOMContentLoaded", () => {
    initWheel();
    fetchRestaurants();
    initGeolocation();
    setupEventListeners();
});

// 3. FETCH DATABASE STATIK (restaurants.json)
async function fetchRestaurants() {
    try {
        const response = await fetch("restaurants.json");
        if (!response.ok) throw new Error("Gagal memuatkan data restoran.");
        allRestaurants = await response.json();
        filteredRestaurants = [...allRestaurants];
        renderRestaurantList(filteredRestaurants);
    } catch (err) {
        console.error("Mia Ralat Database:", err);
        if (restaurantListEl) {
            restaurantListEl.innerHTML = `<p style="text-align:center; color:#FF5252;">Aduh Darling, data tak dapat dimuatkan. Sila refresh ya!</p>`;
        }
    }
}

// 4. LUKIS RODA 8-HIRISAN (CANVAS)
let currentAngle = 0;
let isSpinning = false;

function initWheel() {
    if (!canvas || !ctx) return;
    drawWheel(0);
}

function drawWheel(offsetAngle) {
    const numSlices = WHEEL_SECTORS.length;
    const arc = (2 * Math.PI) / numSlices;
    const radius = canvas.width / 2;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    WHEEL_SECTORS.forEach((sector, i) => {
        const angle = offsetAngle + i * arc;

        // Lukis Hirisan
        ctx.beginPath();
        ctx.fillStyle = sector.color;
        ctx.moveTo(radius, radius);
        ctx.arc(radius, radius, radius, angle, angle + arc);
        ctx.lineTo(radius, radius);
        ctx.fill();
        ctx.strokeStyle = "#FFFFFF";
        ctx.lineWidth = 2;
        ctx.stroke();

        // Teks Atas Hirisan
        ctx.save();
        ctx.translate(radius, radius);
        ctx.rotate(angle + arc / 2);
        ctx.textAlign = "right";
        ctx.fillStyle = "#FFFFFF";
        ctx.font = "bold 13px sans-serif";
        ctx.shadowColor = "rgba(0,0,0,0.5)";
        ctx.shadowBlur = 4;
        ctx.fillText(sector.label, radius - 15, 5);
        ctx.restore();
    });
}

// 5. ENJIN PUTARAN RODA (SPIN ENGINE)
function spinWheel() {
    if (isSpinning) return;
    isSpinning = true;
    spinBtn.disabled = true;

    // Reset banner lama
    if (resultBanner) resultBanner.style.display = "none";

    const spinRotations = 5 + Math.random() * 5; // 5 hingga 10 pusingan
    const extraDegrees = Math.random() * 360;
    const totalRotation = spinRotations * 360 + extraDegrees;
    const duration = 4000; // 4 saat putaran
    const startTimestamp = performance.now();

    function animate(time) {
        const elapsed = time - startTimestamp;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing cubic out (berhenti perlahan-lahan)
        const easeOut = 1 - Math.pow(1 - progress, 3);
        const currentRot = (totalRotation * easeOut) * (Math.PI / 180);

        drawWheel(currentRot);

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            isSpinning = false;
            spinBtn.disabled = false;
            currentAngle = (totalRotation * (Math.PI / 180)) % (2 * Math.PI);
            calculateWinner(currentAngle);
        }
    }
    requestAnimationFrame(animate);
}

// KIRA PEMENANG (POINTER DI SEBELAH ATAS / JAM 12: 270 DARJAH / 1.5 PI)
function calculateWinner(finalAngle) {
    const numSlices = WHEEL_SECTORS.length;
    const arc = (2 * Math.PI) / numSlices;
    
    // Pointer statik berada di atas (3 * Math.PI / 2)
    const pointerAngle = (3 * Math.PI / 2);
    let relativeAngle = (pointerAngle - (finalAngle % (2 * Math.PI))) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += (2 * Math.PI);

    const winningIndex = Math.floor(relativeAngle / arc);
    const selectedSector = WHEEL_SECTORS[winningIndex];

    displayLandingResult(selectedSector);
}

// 6. PAPARKAN HASIL PENDARATAN & TAPIS SENARAI SERTA-MERTA
function displayLandingResult(sector) {
    if (resultBanner && resultTitle) {
        resultBanner.style.display = "block";
        resultTitle.textContent = sector.label;
        resultBanner.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }

    // Tapis kedai ikut tag pemenang
    filteredRestaurants = allRestaurants.filter(item => {
        const tags = (item.tags || []).map(t => t.toLowerCase());
        const cuisine = (item.cuisine || "").toLowerCase();
        return tags.includes(sector.tag) || cuisine.includes(sector.tag);
    });

    // Susun mengikut jarak terdekat jika lokasi diaktifkan
    if (userLocation) {
        sortRestaurantsByDistance();
    }

    renderRestaurantList(filteredRestaurants);
}

// 7. FORMULA HAVERSINE (PENGIRAAN JARAK KM GPS)
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
    const R = 6371; // Radius bumi (KM)
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
        Math.sin(dLat / 2) * Math.sin(dLat / 2) +
        Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
        Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return parseFloat((R * c).toFixed(1));
}

function deg2rad(deg) {
    return deg * (Math.PI / 180);
}

// DAPATKAN LOKASI PENGGUNA
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
            (err) => {
                console.warn("Akses GPS ditolak/tidak aktif:", err.message);
            },
            { enableHighAccuracy: true, timeout: 5000 }
        );
    }
}

function sortRestaurantsByDistance() {
    if (!userLocation) return;
    filteredRestaurants.forEach(item => {
        if (item.lat && item.lng) {
            item.distance = getDistanceFromLatLonInKm(userLocation.lat, userLocation.lng, item.lat, item.lng);
        } else {
            item.distance = 999;
        }
    });
    filteredRestaurants.sort((a, b) => a.distance - b.distance);
}

// 8. RENDER SENARAI KEDAI & BUTANG GOOGLE MAPS TUNGGAL
function renderRestaurantList(list) {
    if (!restaurantListEl) return;
    restaurantListEl.innerHTML = "";

    if (list.length === 0) {
        restaurantListEl.innerHTML = `
            <div style="text-align: center; padding: 20px; color: #888;">
                <p>Tiada kedai ditemui untuk pilihan ini, Darling.</p>
            </div>
        `;
        return;
    }

    list.forEach(item => {
        const card = document.createElement("div");
        card.className = "restaurant-card";

        // URL Google Maps navigasi terus
        const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${item.lat},${item.lng}`;

        // Status Jarak
        const distanceBadge = item.distance && item.distance !== 999 
            ? `<span class="badge badge-dist">📍 ${item.distance} km</span>` 
            : ``;

        // Status Buka/Tutup
        const isOpen = checkIfOpen(item.hours, item.offDay);
        const statusBadge = isOpen
            ? `<span class="badge badge-open">Buka</span>`
            : `<span class="badge badge-closed">Tutup</span>`;

        card.innerHTML = `
            <div class="card-header">
                <div>
                    <h3 class="card-name">${item.name}</h3>
                    <p class="card-signature">✨ Menu: <strong>${item.signature || "Menu Tempatan"}</strong></p>
                </div>
                ${distanceBadge}
            </div>

            <div class="card-meta">
                <span>💰 ${item.priceRange || "RM Marhaen"}</span>
                <span>⏰ ${item.hours || "Waktu biasa"}</span>
                ${statusBadge}
            </div>

            <div class="card-actions">
                <a href="${googleMapsUrl}" target="_blank" rel="noopener noreferrer" class="btn-gmaps">
                    🗺️ Buka Google Maps
                </a>
            </div>
        `;
        restaurantListEl.appendChild(card);
    });
}

// 9. LOGIK SEMAKAN WAKTU BUKA/TUTUP
function checkIfOpen(hoursStr, offDay) {
    if (!hoursStr) return true; // Anggap buka jika tiada jadual
    const now = new Date();
    const days = ["Ahad", "Isnin", "Selasa", "Rabu", "Khamis", "Jumaat", "Sabtu"];
    const currentDay = days[now.getDay()];

    if (offDay && offDay.toLowerCase().includes(currentDay.toLowerCase())) {
        return false;
    }
    return true;
}

// 10. EVENT LISTENERS (TAPISAN MENGIADAM & CARIAN A-Z)
function setupEventListeners() {
    if (spinBtn) {
        spinBtn.addEventListener("click", spinWheel);
    }

    // Input Carian
    if (searchInput) {
        searchInput.addEventListener("input", (e) => {
            const query = e.target.value.toLowerCase();
            filteredRestaurants = allRestaurants.filter(item => 
                item.name.toLowerCase().includes(query) ||
                (item.signature && item.signature.toLowerCase().includes(query)) ||
                (item.cuisine && item.cuisine.toLowerCase().includes(query))
            );
            renderRestaurantList(filteredRestaurants);
        });
    }

    // Butang Filter Pills
    filterPills.forEach(pill => {
        pill.addEventListener("click", () => {
            filterPills.forEach(p => p.classList.remove("active"));
            pill.classList.add("active");

            const selectedTag = pill.getAttribute("data-tag");
            if (resultBanner) resultBanner.style.display = "none"; // Sorok banner putaran

            if (selectedTag === "all") {
                filteredRestaurants = [...allRestaurants];
            } else {
                filteredRestaurants = allRestaurants.filter(item => {
                    const tags = (item.tags || []).map(t => t.toLowerCase());
                    const cuisine = (item.cuisine || "").toLowerCase();
                    return tags.includes(selectedTag.toLowerCase()) || cuisine.includes(selectedTag.toLowerCase());
                });
            }

            if (userLocation) sortRestaurantsByDistance();
            renderRestaurantList(filteredRestaurants);
        });
    });
}