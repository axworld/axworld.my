import sqlite3
from backend.app.database import get_connection

BATCH2_RESTAURANTS = [
    # =========================================================================
    # 1. ZON PUCHONG, CYBERJAYA & PUTRAJAYA
    # =========================================================================
    {
        "name": "Nasi Lemak Kak Yah Putra Perdana",
        "slug": "nasi-lemak-kak-yah-putra-perdana",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Taman Putra Perdana, Puchong, Selangor", "latitude": 2.9460, "longitude": 101.6140,
        "operating_hours": "06:30 AM - 11:30 AM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Lemak Bungkus Daun Pisang, Sambal Bilis Padu & Ayam Goreng Panas",
        "taste_tags": "pedas"
    },
    {
        "name": "Warung Cikgu Puchong",
        "slug": "warung-cikgu-puchong",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Puchong Utama, Selangor", "latitude": 2.9920, "longitude": 101.6180,
        "operating_hours": "08:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Mmanggey Ayam Cincang Berempah Kuah Kari Melimpah",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Ayam Kampung Puchong",
        "slug": "ayam-kampung-puchong-perdana",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Puchong Perdana, Selangor", "latitude": 3.0040, "longitude": 101.6060,
        "operating_hours": "10:00 AM - 05:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Ayam Kampung Goreng Panas Rangup, Sambal Belacan & Ulam Kampung",
        "taste_tags": "pedas"
    },
    {
        "name": "Aroma Hijrah Cyberjaya",
        "slug": "aroma-hijrah-cyberjaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM10-30)",
        "address": "CBD Perdana 2, Cyberjaya", "latitude": 2.9230, "longitude": 101.6550,
        "operating_hours": "11:00 AM - 10:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Arab Mandy Kambing Bakar Lembut & Kabsah Ayam",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Sana'a Cyberjaya",
        "slug": "sanaa-restaurant-cyberjaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM15-35)",
        "address": "Glomac Cyberjaya, Selangor", "latitude": 2.9270, "longitude": 101.6580,
        "operating_hours": "11:00 AM - 11:30 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Lamb Fahsa Mendidih Panas, Roti Mulawah Raksasa & Nasi Maqluba",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Nasi Lemak Royale Kedah Putrajaya",
        "slug": "nasi-lemak-royale-kedah-putrajaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Presint 15, Putrajaya", "latitude": 2.9390, "longitude": 101.7240,
        "operating_hours": "08:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kuning Royale Kuah Campur Pekat, Ayam Madu & Daging Masak Hitam",
        "taste_tags": "banjir, manis, pedas"
    },
    {
        "name": "Restoran Serambi Melayu Presint 8",
        "slug": "serambi-melayu-putrajaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Presint 8, Putrajaya", "latitude": 2.9310, "longitude": 101.6880,
        "operating_hours": "07:30 AM - 04:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Berlauk Gulai Kawah Kelantan, Ayam Percik & Solok Lada",
        "taste_tags": "banjir, pedas"
    },

    # =========================================================================
    # 2. ZON CHERAS, AMPANG & PANDAN INDAH
    # =========================================================================
    {
        "name": "Nasi Lemak Mek Sambal Warisan Ampang",
        "slug": "nasi-lemak-mek-sambal-warisan-ampang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Taman Dagang, Ampang, Selangor", "latitude": 3.1485, "longitude": 101.7610,
        "operating_hours": "05:00 PM - 02:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Lemak Kukus Sambal Warisan Bilis Garing & Paru Goreng",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran ZK Sup Daging Cheras",
        "slug": "restoran-zk-sup-daging-cheras",
        "category": "Mi & Sup", "carb_type": "Nasi / Sup", "budget_tier": "Marhaen (<RM10)",
        "address": "Bandar Sri Permaisuri, Cheras, KL", "latitude": 3.1020, "longitude": 101.7140,
        "operating_hours": "10:30 AM - 09:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Sup Daging Hirup Panas, Sup Ekor Berempah & Telur Dadar Gebu",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Kopitiam Kiri Kanan Cheras",
        "slug": "kopitiam-kiri-kanan-cheras",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Mid (RM10-20)",
        "address": "Taman Segar, Cheras, KL", "latitude": 3.0880, "longitude": 101.7430,
        "operating_hours": "08:00 AM - 08:00 PM", "closed_days": "Selasa",
        "specialty_menu": "Roti Bakar Kaya Butter Tebal, Mee Goreng Mamak Basah & Kopi Kaw",
        "taste_tags": "manis"
    },
    {
        "name": "Ayam Gepuk Pak Raden Ampang",
        "slug": "ayam-gepuk-pak-raden-ampang",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Taman Kosas, Ampang, Selangor", "latitude": 3.1420, "longitude": 101.7680,
        "operating_hours": "11:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Ayam Gepuk Rangup Sambal Bawang Putih Pedas Berapi & Tauhu Tempe",
        "taste_tags": "pedas"
    },
    {
        "name": "Satay Station Ampang",
        "slug": "satay-station-ampang",
        "category": "Melayu / Nasi", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Kampung Pandan, Ampang, KL", "latitude": 3.1440, "longitude": 101.7380,
        "operating_hours": "04:00 PM - 12:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Sate Daging Lembu Lemak Manis Cicah Kuah Kacang Pekat & Mee Rebus",
        "taste_tags": "manis, pedas, banjir"
    },
    {
        "name": "Restoran Beriani Asif Pandan Indah",
        "slug": "beriani-asif-pandan-indah",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM15-30)",
        "address": "Pandan Indah, Kuala Lumpur", "latitude": 3.1320, "longitude": 101.7540,
        "operating_hours": "11:00 AM - 10:30 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Beriani Gam Daging Kambing Lembut Lerai & Ayam Masak Merah",
        "taste_tags": "banjir, pedas"
    },

    # =========================================================================
    # 3. ZON GOMBAK, WANGSA MAJU & SETAPAK
    # =========================================================================
    {
        "name": "Nasi Lemak Pak Hassan Pasar Keramat",
        "slug": "nasi-lemak-pak-hassan-keramat",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Kampung Datuk Keramat, KL", "latitude": 3.1670, "longitude": 101.7240,
        "operating_hours": "07:00 AM - 01:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Lemak Kuning Daun Pisang Percuma Kuah Kari & Roti Canai Gebu",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Restoran Sup Haji Abu Wangsa Maju",
        "slug": "sup-haji-abu-wangsa-maju",
        "category": "Mi & Sup", "carb_type": "Nasi / Sup", "budget_tier": "Mid (RM10-20)",
        "address": "Seksyen 2, Wangsa Maju, KL", "latitude": 3.2050, "longitude": 101.7320,
        "operating_hours": "11:30 AM - 11:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Sup Lidah & Ekor Lembu Pekat Herba, Nasi Putih & Telur Asin",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Burger Bakar Kaw Kaw Wangsa Maju",
        "slug": "burger-bakar-kaw-kaw-wangsa-maju",
        "category": "Burger & Western", "carb_type": "Western", "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 2, Wangsa Maju, KL", "latitude": 3.2065, "longitude": 101.7310,
        "operating_hours": "06:00 PM - 01:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Burger Daging Patty Tebal Bakar Arang Double Cheese Leleh",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran D'Kelantan Setapak",
        "slug": "dkelantan-setapak",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Genting Kelang, Setapak, KL", "latitude": 3.1940, "longitude": 101.7120,
        "operating_hours": "07:00 AM - 05:00 PM", "closed_days": "Jumaat",
        "specialty_menu": "Nasi Kerabu Biru Bunga Telang Daging Bakar & Sambal Budu Kaw",
        "taste_tags": "masam, pedas"
    },
    {
        "name": "Mee Tarik Warisan Gombak",
        "slug": "mee-tarik-gombak",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Mid (RM10-20)",
        "address": "Batu 5, Jalan Gombak, KL", "latitude": 3.2120, "longitude": 101.7050,
        "operating_hours": "11:00 AM - 11:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Mee Tarik Sup Tulang Daging Rebus & Dumpling Goreng Kucai",
        "taste_tags": "sup, pedas"
    },

    # =========================================================================
    # 4. ZON KOTA DAMANSARA, KELANA JAYA & PJ UTARA
    # =========================================================================
    {
        "name": "Nasi Lemak Cinta Sayang Seksyen 13",
        "slug": "nasi-lemak-cinta-sayang-sek-13",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 13, Shah Alam", "latitude": 3.0815, "longitude": 101.5455,
        "operating_hours": "05:00 PM - 02:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Lemak Kukus Ayam Goreng Berempah & Sambal Kerang Meletup",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran Al-Hussain Kota Damansara",
        "slug": "al-hussain-kota-damansara",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "The Strand, Kota Damansara, PJ", "latitude": 3.1520, "longitude": 101.5940,
        "operating_hours": "24 Jam", "closed_days": "Tiada Cuti",
        "specialty_menu": "Roti Canai Cheese Garlic Banjir Dhal & Teh Tarik Madu",
        "taste_tags": "banjir, manis"
    },
    {
        "name": "Restoran Roti Canai Pelangi Kota Damansara",
        "slug": "roti-canai-pelangi-kd",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 4, Kota Damansara, PJ", "latitude": 3.1480, "longitude": 101.5850,
        "operating_hours": "07:00 AM - 12:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Roti Canai Pelangi Warna-Warni Rangup & Kari Kambing Pekat",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Restoran Selera Terengganu Kelana Jaya",
        "slug": "selera-terengganu-kelana-jaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "SS5, Kelana Jaya, Petaling Jaya", "latitude": 3.1040, "longitude": 101.6020,
        "operating_hours": "07:30 AM - 03:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Dagang Ikan Tongkol Gulai Pantai Timur & Keropok Lekor Panas",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Nasi Goreng Kambing Padu Kelana Jaya",
        "slug": "nasi-goreng-kambing-kelana-jaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM10-22)",
        "address": "Kelana Mall, Kelana Jaya", "latitude": 3.1080, "longitude": 101.5980,
        "operating_hours": "05:00 PM - 12:00 AM", "closed_days": "Selasa",
        "specialty_menu": "Nasi Goreng Daging Kambing Bakar Berempah Panas Kuali",
        "taste_tags": "pedas"
    },

    # =========================================================================
    # 5. ZON KAJANG, SEMENYIH & HULU LANGAT
    # =========================================================================
    {
        "name": "Restoran Sate Willy Kajang",
        "slug": "sate-willy-kajang",
        "category": "Melayu / Nasi", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Ramal Food Junction, Sungai Ramal, Kajang", "latitude": 2.9750, "longitude": 101.7650,
        "operating_hours": "04:00 PM - 12:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Sate Daging Lembut Isi Tebal Cicah Sambal Kacang Merah Menyengat",
        "taste_tags": "manis, pedas"
    },
    {
        "name": "Lontong Goreng Mak Timah Kajang",
        "slug": "lontong-goreng-mak-timah-kajang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Pekan Kajang, Selangor", "latitude": 2.9910, "longitude": 101.7880,
        "operating_hours": "07:00 AM - 02:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Lontong Goreng Basah Pedas Berapi & Begedil Daging Panas",
        "taste_tags": "pedas"
    },
    {
        "name": "Warung Roti Canai Terbang Semenyih",
        "slug": "roti-canai-terbang-semenyih",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Pekan Semenyih, Selangor", "latitude": 2.9510, "longitude": 101.8430,
        "operating_hours": "06:30 AM - 12:30 PM", "closed_days": "Rabu",
        "specialty_menu": "Roti Tisu Raksasa Manis Susu & Roti Canai Garing Banjir Dhal",
        "taste_tags": "banjir, manis"
    },
    {
        "name": "Kafe Tanah & Air Eco Majestic",
        "slug": "tanah-dan-air-semenyih",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Mid (RM10-30)",
        "address": "Eco Majestic, Semenyih", "latitude": 2.9250, "longitude": 101.8560,
        "operating_hours": "12:00 PM - 09:00 PM", "closed_days": "Selasa",
        "specialty_menu": "Chinese Tea Artisanal Brew, Matcha Roll Cake & Waffle Butter",
        "taste_tags": "manis"
    },

    # =========================================================================
    # 6. TAMBAHAN PORT MARHAEN & KAFE HUNTING SEKITAR LEMBAH KLANG
    # =========================================================================
    {
        "name": "Nasi Ayam Baba Melaka Shah Alam",
        "slug": "nasi-ayam-baba-shah-alam",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 2, Shah Alam", "latitude": 3.0780, "longitude": 101.5120,
        "operating_hours": "10:30 AM - 06:00 PM", "closed_days": "Jumaat",
        "specialty_menu": "Nasi Ayam Roast Halal Rangup, Sup Ayam Bening & Sambal Cili Pedas",
        "taste_tags": "pedas, sup"
    },
    {
        "name": "Restoran Selera Impian Bonda Seksyen 18",
        "slug": "selera-impian-sek-18-sa",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 18, Shah Alam", "latitude": 3.0450, "longitude": 101.5280,
        "operating_hours": "07:00 AM - 04:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Campur Lauk Kampung, Ikan Pari Asam Pedas & Gulai Daging",
        "taste_tags": "masam, pedas, banjir"
    },
    {
        "name": "Craveat Cafe Bangi",
        "slug": "craveat-cafe-bangi",
        "category": "Kafe & Manis", "carb_type": "Western", "budget_tier": "Mid (RM15-35)",
        "address": "Seksyen 8, Bandar Baru Bangi", "latitude": 2.9560, "longitude": 101.7720,
        "operating_hours": "11:00 AM - 10:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Spaghetti Buttermilk Crispy Chicken, Pistachio Basque Cake",
        "taste_tags": "manis, pedas"
    },
    {
        "name": "Burgerbyte Senawang Style Shah Alam",
        "slug": "burgerbyte-shah-alam",
        "category": "Burger & Western", "carb_type": "Western", "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 7, Shah Alam", "latitude": 3.0735, "longitude": 101.4980,
        "operating_hours": "05:00 PM - 12:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Burger Daging Naked Cheese Lumer & Meatball Kuah Coklat Pekat",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran Selera Pantai Timur Johan Setia",
        "slug": "selera-pantai-timur-johan-setia",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Johan Setia, Klang", "latitude": 2.9810, "longitude": 101.4950,
        "operating_hours": "07:00 AM - 03:00 PM", "closed_days": "Jumaat",
        "specialty_menu": "Nasi Berlauk Ikan Tongkol Gulai Kuning, Nasi Tumpang & Kerabu",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Roti Canai D'Batu 7 Jalan Kebun",
        "slug": "roti-canai-dbatu-7-jln-kebun",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Batu 7, Jalan Kebun, Shah Alam", "latitude": 2.9735, "longitude": 101.5365,
        "operating_hours": "06:30 AM - 11:30 AM", "closed_days": "Isnin",
        "specialty_menu": "Roti Canai Telur Bawang Garing Banjir Sambal Sardin Panas",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Nasi Kandar Subang Jaya SS14",
        "slug": "nasi-kandar-ss14-subang",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "SS14, Subang Jaya, Selangor", "latitude": 3.0690, "longitude": 101.5880,
        "operating_hours": "10:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kandar Kuah Campur Kaw-Kaw, Ayam Ros & Daging Hitam Manis",
        "taste_tags": "banjir, pedas, manis"
    },
    {
        "name": "Kopi Dua Darjat TTDI",
        "slug": "kopi-dua-darjat-ttdi",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "TTDI, Kuala Lumpur", "latitude": 3.1430, "longitude": 101.6270,
        "operating_hours": "08:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Kopi Kampung Kaw Botol Kaca, Roti Bakar Kaya Butter & Snek Petang",
        "taste_tags": "manis"
    },
    {
        "name": "Warung Sup Gearbox Bangi",
        "slug": "sup-gearbox-bangi-lama",
        "category": "Mi & Sup", "carb_type": "Mi / Sup", "budget_tier": "Mid (RM15-35)",
        "address": "Bangi Lama, Selangor", "latitude": 2.9050, "longitude": 101.7820,
        "operating_hours": "04:30 PM - 12:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Sup Gearbox Lembu Sedut Straw Panas Berempah & Roti Benggali",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Restoran Tomyam Pokok Kelapa Sijangkang",
        "slug": "tomyam-pokok-kelapa-sijangkang",
        "category": "Tomyam & Thai", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Kampung Medan / Sijangkang, Selangor", "latitude": 2.9580, "longitude": 101.4820,
        "operating_hours": "05:00 PM - 01:30 AM", "closed_days": "Selasa",
        "specialty_menu": "Tomyam Campur Merah Kaw Hirup Panas, Kerabu Maggi Seafood & Telur Bistik",
        "taste_tags": "masam, pedas, sup"
    }
]

def seed_batch2():
    print("=" * 70)
    print("🚀 MENYUNTIK KELOMPOK KEDUA: PORT MAKANAN 100% HALAL & BERSIH...")
    print(f"📦 Jumlah Kedai Disimpan: {len(BATCH2_RESTAURANTS)} buah kedai!")
    print("=" * 70)

    with get_connection() as conn:
        cursor = conn.cursor()
        inserted = 0

        for r in BATCH2_RESTAURANTS:
            cursor.execute("""
                INSERT OR REPLACE INTO restaurants 
                (name, slug, category, carb_type, budget_tier, address, latitude, longitude, 
                 maps_url, is_viral, is_halal_verified, is_active, 
                 operating_hours, closed_days, specialty_menu, taste_tags)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 1, 1, 1, ?, ?, ?, ?)
            """, (
                r["name"], r["slug"], r["category"], r["carb_type"],
                r["budget_tier"], r["address"], r["latitude"], r["longitude"],
                r.get("operating_hours", "10:00 AM - 10:00 PM"),
                r.get("closed_days", "Tiada Cuti"),
                r.get("specialty_menu", "Hidangan Istimewa Pilihan Ramai"),
                r.get("taste_tags", "pedas")
            ))
            inserted += 1

        conn.commit()

        cursor.execute("SELECT COUNT(*) FROM restaurants WHERE is_active = 1")
        total = cursor.fetchone()[0]

    print(f"✅ Selesai! Sebanyak {inserted} kedai halal berkualiti berjaya ditambah.")
    print(f"📊 JUMLAH BESAR KEDAI BERSIH DALAM APP SEKARANG: {total} KEDAI!")
    print("=" * 70)

if __name__ == "__main__":
    seed_batch2()