import sqlite3
import re
from backend.app.database import get_connection

# SENARAI MEGA KEDAI MAKANAN 100% HALAL & BERSIH (LEMBAH KLANG, SHAH ALAM, JLN KEBUN, BANGI, TTDI)
MEGA_RESTAURANTS = [
    # ==========================================
    # 1. ZON JALAN KEBUN, TPG & SIJANGKANG (DEKAT RUMAH BABY!)
    # ==========================================
    {
        "name": "Lapar Haus",
        "slug": "lapar-haus-tropicana-aman",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "12A-G, Jalan Aman Sinaria 3, Bandar Tropicana Aman, Telok Panglima Garang",
        "latitude": 2.9525, "longitude": 101.5392
    },
    {
        "name": "Suatu Perjalanan Cafe",
        "slug": "suatu-perjalanan-jln-kebun",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Mid (RM10-25)",
        "address": "Batu 7, Jalan Kebun, Seksyen 30, Shah Alam",
        "latitude": 2.9740, "longitude": 101.5365
    },
    {
        "name": "Aboy Cafe",
        "slug": "aboy-cafe-jln-kebun",
        "category": "Burger & Western",
        "carb_type": "Western",
        "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Kebun, Shah Alam, Selangor",
        "latitude": 2.9710, "longitude": 101.5350
    },
    {
        "name": "Warung Nasi Lemak D'Desa",
        "slug": "warung-nasi-lemak-ddesa-jln-kebun",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Batu 7, Jalan Kebun, Shah Alam",
        "latitude": 2.9730, "longitude": 101.5360
    },
    {
        "name": "Warung Wak Jasman",
        "slug": "warung-wak-jasman-sijangkang",
        "category": "Mi & Sup",
        "carb_type": "Mi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Kampung Sijangkang, Telok Panglima Garang",
        "latitude": 2.9680, "longitude": 101.5120
    },
    {
        "name": "Restoran D'Kebun Corner",
        "slug": "restoran-dkebun-corner",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Simpang 4, Jalan Kebun, Shah Alam",
        "latitude": 2.9755, "longitude": 101.5372
    },

    # ==========================================
    # 2. ZON SHAH ALAM (SEKSYEN 7, 9, 13, ALAM IMPIAN)
    # ==========================================
    {
        "name": "Mios & Co",
        "slug": "mios-and-co-shah-alam",
        "category": "Burger & Western",
        "carb_type": "Western",
        "budget_tier": "Mid (RM10-30)",
        "address": "Seksyen 13, Shah Alam, Selangor",
        "latitude": 3.0785, "longitude": 101.5460
    },
    {
        "name": "Restoran Hakim",
        "slug": "restoran-hakim-sek-7",
        "category": "Mamak",
        "carb_type": "Nasi / Roti",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Kristal AS7/AS, Seksyen 7, Shah Alam",
        "latitude": 3.0738, "longitude": 101.4998
    },
    {
        "name": "Chicken Rice Guys (CRG)",
        "slug": "crg-chicken-rice-guys-sek-7",
        "category": "Ayam Goreng",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-20)",
        "address": "Seksyen 7, Shah Alam, Selangor",
        "latitude": 3.0722, "longitude": 101.4985
    },
    {
        "name": "Nasi Kukus RZ",
        "slug": "nasi-kukus-rz-sek-7",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 7, Shah Alam, Selangor",
        "latitude": 3.0745, "longitude": 101.4990
    },
    {
        "name": "Nasi Lemak Mimpi",
        "slug": "nasi-lemak-mimpi-alam-impian",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-25)",
        "address": "LakePoint Central, Alam Impian, Shah Alam",
        "latitude": 3.0315, "longitude": 101.5120
    },
    {
        "name": "KAYA Cafe",
        "slug": "kaya-cafe-sek-9",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Mid (RM10-30)",
        "address": "Seksyen 9, Shah Alam, Selangor",
        "latitude": 3.0820, "longitude": 101.5230
    },
    {
        "name": "Ubud Cafe",
        "slug": "ubud-cafe-sek-17",
        "category": "Kafe & Manis",
        "carb_type": "Western",
        "budget_tier": "Mid (RM10-30)",
        "address": "Seksyen 17, Shah Alam, Selangor",
        "latitude": 3.0510, "longitude": 101.5030
    },
    {
        "name": "Love Is Here Cafe",
        "slug": "love-is-here-sek-17",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 17, Shah Alam, Selangor",
        "latitude": 3.0520, "longitude": 101.5040
    },
    {
        "name": "Warung Nasi Lemak Pak Ayob",
        "slug": "warung-nasi-lemak-pak-ayob-sek-20",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 20, Shah Alam, Selangor",
        "latitude": 3.0550, "longitude": 101.5380
    },
    {
        "name": "Restoran Jelita Bumbu Babah",
        "slug": "restoran-jelita-bumbu-babah-sa",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-25)",
        "address": "Shah Alam, Selangor",
        "latitude": 3.0710, "longitude": 101.5150
    },
    {
        "name": "Sup Glepar",
        "slug": "sup-glepar-shah-alam",
        "category": "Mi & Sup",
        "carb_type": "Nasi / Sup",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 7, Shah Alam, Selangor",
        "latitude": 3.0760, "longitude": 101.5020
    },
    {
        "name": "Mee Mamu Penang",
        "slug": "mee-mamu-penang-shah-alam",
        "category": "Mamak",
        "carb_type": "Mi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Shah Alam, Selangor",
        "latitude": 3.0680, "longitude": 101.5090
    },
    {
        "name": "Restoran Minang Megah",
        "slug": "restoran-minang-megah-sek-28",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 28, Shah Alam",
        "latitude": 3.0180, "longitude": 101.5640
    },
    {
        "name": "Guan's Kopitiam",
        "slug": "guans-kopitiam-sek-13",
        "category": "Kopitiam",
        "carb_type": "Roti / Kopi",
        "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 13, Shah Alam, Selangor",
        "latitude": 3.0805, "longitude": 101.5435
    },
    {
        "name": "Kedai Kopi Maneh",
        "slug": "kedai-kopi-maneh-sek-13",
        "category": "Kopitiam",
        "carb_type": "Roti / Kopi",
        "budget_tier": "Mid (RM10-20)",
        "address": "Seksyen 13, Shah Alam",
        "latitude": 3.0790, "longitude": 101.5440
    },
    {
        "name": "Dapur Darling",
        "slug": "dapur-darling-sek-9",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-20)",
        "address": "Seksyen 9, Shah Alam, Selangor",
        "latitude": 3.0830, "longitude": 101.5240
    },
    {
        "name": "Mari Steamboat & Grill",
        "slug": "mari-steamboat-grill-sa",
        "category": "Mi & Sup",
        "carb_type": "Mi / Western",
        "budget_tier": "Mid (RM10-30)",
        "address": "Shah Alam, Selangor",
        "latitude": 3.0750, "longitude": 101.5220
    },
    {
        "name": "Restoran Mawaddah",
        "slug": "restoran-mawaddah-sek-4",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-30)",
        "address": "Seksyen 4, Shah Alam, Selangor",
        "latitude": 3.0715, "longitude": 101.5190
    },
    {
        "name": "Nasi Bajet Medan Selera Seksyen 15",
        "slug": "nasi-bajet-sek-15-sa",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Medan Selera MBSA Seksyen 15, Shah Alam",
        "latitude": 3.0610, "longitude": 101.5290
    },
    {
        "name": "Cikgu Adie Ikan Bakar",
        "slug": "cikgu-adie-ikan-bakar-subang",
        "category": "Tomyam & Thai",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-30)",
        "address": "Subang Bestari, Shah Alam",
        "latitude": 3.1550, "longitude": 101.5450
    },

    # ==========================================
    # 3. ZON SUBANG JAYA & SUNWAY
    # ==========================================
    {
        "name": "Mee Tarik Pasar Seni SS15",
        "slug": "mee-tarik-ss15-subang",
        "category": "Mi & Sup",
        "carb_type": "Mi",
        "budget_tier": "Mid (RM10-25)",
        "address": "SS15, Subang Jaya, Selangor",
        "latitude": 3.0763, "longitude": 101.5898
    },
    {
        "name": "Rojak & Cendol Best SS15",
        "slug": "rojak-cendol-ss15-subang",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Marhaen (<RM10)",
        "address": "SS15, Subang Jaya, Selangor",
        "latitude": 3.0750, "longitude": 101.5880
    },
    {
        "name": "Uncle Best Fried Chicken SS15",
        "slug": "uncle-best-chicken-ss15",
        "category": "Ayam Goreng",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "SS15, Subang Jaya, Selangor",
        "latitude": 3.0770, "longitude": 101.5905
    },

    # ==========================================
    # 4. ZON TTDI & DAMANSARA UPTOWN
    # ==========================================
    {
        "name": "Nasi Lemak Burung Hantu",
        "slug": "nasi-lemak-burung-hantu-ttdi-real",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-25)",
        "address": "19, Lorong Rahim Kajai 13, TTDI, Kuala Lumpur",
        "latitude": 3.1415, "longitude": 101.6294
    },
    {
        "name": "Village Park Restaurant",
        "slug": "village-park-uptown-real",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-25)",
        "address": "5, Jalan SS 21/37, Damansara Utama Uptown, Petaling Jaya",
        "latitude": 3.1378, "longitude": 101.6234
    },
    {
        "name": "Nasi Lemak Panas 223",
        "slug": "nasi-lemak-panas-223-pj",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 51a, Petaling Jaya, Selangor",
        "latitude": 3.0980, "longitude": 101.6280
    },
    {
        "name": "Nasi Lemak Viral Sg Penchala",
        "slug": "nasi-lemak-viral-sg-penchala-ttdi",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Kg Sg Penchala, TTDI, Kuala Lumpur",
        "latitude": 3.1610, "longitude": 101.6250
    },

    # ==========================================
    # 5. ZON KUALA LUMPUR & KAMPUNG BARU
    # ==========================================
    {
        "name": "Nasi Lemak Wanjo",
        "slug": "nasi-lemak-wanjo-kg-baru-real",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "8, Jalan Raja Muda Musa, Kampung Baru, Kuala Lumpur",
        "latitude": 3.1633, "longitude": 101.7032
    },
    {
        "name": "Nasi Lemak Pak Aji",
        "slug": "nasi-lemak-pak-aji-kg-baru",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Kampung Baru, Kuala Lumpur",
        "latitude": 3.1640, "longitude": 101.7025
    },
    {
        "name": "Nasi Lemak Antarabangsa",
        "slug": "nasi-lemak-antarabangsa-kg-baru",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Kampung Baru, Kuala Lumpur",
        "latitude": 3.1630, "longitude": 101.7040
    },
    {
        "name": "Yummy Coin Pancake",
        "slug": "yummy-coin-pancake-kg-baru",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Marhaen (<RM10)",
        "address": "12, Jalan Raja Muda Musa, Kampung Baru, KL",
        "latitude": 3.1633, "longitude": 101.7032
    },
    {
        "name": "Ikan Bakar Malaya AU2",
        "slug": "ikan-bakar-malaya-au2-keramat",
        "category": "Tomyam & Thai",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-30)",
        "address": "AU2 Keramat, Kuala Lumpur",
        "latitude": 3.1750, "longitude": 101.7510
    },
    {
        "name": "Nasi Lemak Saleha",
        "slug": "nasi-lemak-saleha-ampang",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Mid (RM10-20)",
        "address": "Ampang & Sri Rampai, Kuala Lumpur",
        "latitude": 3.1590, "longitude": 101.7580
    },
    {
        "name": "Nasi Lemak Ujang Corner",
        "slug": "nasi-lemak-ujang-corner-gombak",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Gombak, Selangor",
        "latitude": 3.2180, "longitude": 101.7120
    },
    {
        "name": "Warung Rindu Nasi Lemak",
        "slug": "warung-rindu-nasi-lemak-kl",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Taman Bukit Angkasa, Kuala Lumpur",
        "latitude": 3.1120, "longitude": 101.6680
    },

    # ==========================================
    # 6. ZON BANGI, KAJANG & SEMENYIH
    # ==========================================
    {
        "name": "Nasi Lemak Sedap Sg Merab",
        "slug": "nasi-lemak-sedap-sg-merab-bangi",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Sungai Merab, Kajang / Bangi, Selangor",
        "latitude": 2.9420, "longitude": 101.7380
    },
    {
        "name": "Bungaa & Gula Cafe",
        "slug": "bungaa-dan-gula-cafe-semenyih",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Mid (RM10-30)",
        "address": "Majestic Labs, Eco Majestic, Semenyih",
        "latitude": 2.9234, "longitude": 101.8543
    },
    {
        "name": "Quatro Gusto Tacos",
        "slug": "quatro-gusto-tacos-semenyih",
        "category": "Burger & Western",
        "carb_type": "Western",
        "budget_tier": "Mid (RM10-25)",
        "address": "Eco Majestic, Semenyih",
        "latitude": 2.9240, "longitude": 101.8550
    },
    {
        "name": "Warung Sate & Lempeng Minang",
        "slug": "sate-lempeng-downtown-reko-kajang",
        "category": "Melayu / Nasi",
        "carb_type": "Nasi / Roti",
        "budget_tier": "Marhaen (<RM10)",
        "address": "Downtown Jalan Reko, Kajang, Selangor",
        "latitude": 2.9780, "longitude": 101.7920
    }
]

def plant_mega_seeds():
    print("=" * 65)
    print("🌱 MEMULAKAN PENANAMAN BENIH MEGA (100% HALAL & BERSIH)...")
    print("=" * 65)

    with get_connection() as conn:
        cursor = conn.cursor()
        inserted = 0

        for r in MEGA_RESTAURANTS:
            cursor.execute("""
                INSERT OR REPLACE INTO restaurants 
                (name, slug, category, carb_type, budget_tier, address, latitude, longitude, maps_url, is_viral, is_halal_verified, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 1, 1, 1)
            """, (
                r["name"], r["slug"], r["category"], r["carb_type"],
                r["budget_tier"], r["address"], r["latitude"], r["longitude"]
            ))
            inserted += 1

        conn.commit()

        cursor.execute("SELECT COUNT(*) FROM restaurants WHERE is_active = 1")
        total = cursor.fetchone()[0]

    print(f"🎉 Berjaya menanam {inserted} kedai halal gred A ke dalam pangkalan data!")
    print(f"📊 JUMLAH KEDAI AKTIF DALAM APP SEKARANG: {total} KEDAI!")
    print("=" * 65)

if __name__ == "__main__":
    plant_mega_seeds()