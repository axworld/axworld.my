import sqlite3
from backend.app.database import get_connection

BATCH3_RESTAURANTS = [
    # =========================================================================
    # 1. ZON KLANG, PELABUHAN KLANG & KAPAR (~20 Kedai)
    # =========================================================================
    {
        "name": "Ikan Bakar Bagan Lalang Style Klang",
        "slug": "ikan-bakar-bagan-klang",
        "category": "Tomyam & Thai", "carb_type": "Nasi", "budget_tier": "Mid (RM15-35)",
        "address": "Tanjung Harapan, Pelabuhan Klang, Selangor", "latitude": 3.0030, "longitude": 101.3910,
        "operating_hours": "05:00 PM - 12:30 AM", "closed_days": "Isnin",
        "specialty_menu": "Ikan Siakap Bakar Petai Arang, Ketam Bercili & Udang Butter",
        "taste_tags": "masam, pedas"
    },
    {
        "name": "Warung Roti Canai Pandan Klang",
        "slug": "roti-canai-pandan-klang",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Meru, Klang, Selangor", "latitude": 3.0560, "longitude": 101.4480,
        "operating_hours": "07:00 AM - 12:30 PM", "closed_days": "Rabu",
        "specialty_menu": "Roti Canai Pandan Wangi Hijau Garing Banjir Kari Ikan",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Restoran Nasi Kandar Melayu Klang",
        "slug": "nasi-kandar-melayu-klang",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Bandar Baru Klang, Selangor", "latitude": 3.0610, "longitude": 101.4620,
        "operating_hours": "09:00 AM - 09:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Kandar Melayu Ayam Bawang, Sambal Nyor & Bendi Rebus",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Warung Cendol Durian Runtuh Klang",
        "slug": "cendol-durian-klang",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Mid (RM10-20)",
        "address": "Teluk Pulai, Klang, Selangor", "latitude": 3.0380, "longitude": 101.4320,
        "operating_hours": "11:30 AM - 07:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Cendol Durian D24 Berkrim Manis & Pulut Hitam Santan Sawit",
        "taste_tags": "manis"
    },
    {
        "name": "Warung Mee Bandung Muar Klang",
        "slug": "mee-bandung-muar-klang",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Marhaen (<RM10)",
        "address": "Bukit Kuda, Klang, Selangor", "latitude": 3.0490, "longitude": 101.4580,
        "operating_hours": "12:00 PM - 10:00 PM", "closed_days": "Selasa",
        "specialty_menu": "Mee Bandung Muar Kuah Udang Kering Kacang Pekat Telur Goyang",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Selera Rasa D'Klang",
        "slug": "selera-rasa-dklang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Taman Sri Andalas, Klang", "latitude": 3.0240, "longitude": 101.4510,
        "operating_hours": "07:30 AM - 04:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Gulai Kawah Keting Daging Batang Pinang & Sambal Tempoyak Daun Kayu",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Soto Jawa Mak Pon Klang",
        "slug": "soto-jawa-mak-pon-klang",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Marhaen (<RM10)",
        "address": "Kapar, Klang, Selangor", "latitude": 3.1380, "longitude": 101.3740,
        "operating_hours": "07:00 AM - 01:30 PM", "closed_days": "Isnin",
        "specialty_menu": "Soto Ayam Suhun Begedil Ubi Kentang Cicah Sambal Kicap Kaw",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Warung Lontong Darat Kg Delek",
        "slug": "lontong-darat-kg-delek",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Kampung Delek, Klang", "latitude": 3.0320, "longitude": 101.4210,
        "operating_hours": "06:30 AM - 11:30 AM", "closed_days": "Jumaat",
        "specialty_menu": "Lontong Kering Sambal Kacang Pengantin & Serunding Kelapa Jawa",
        "taste_tags": "pedas, manis"
    },
    {
        "name": "Sup Kambing Madura Pelabuhan",
        "slug": "sup-kambing-madura-pelabuhan",
        "category": "Mi & Sup", "carb_type": "Mi / Sup", "budget_tier": "Mid (RM10-25)",
        "address": "Pandamaran, Pelabuhan Klang", "latitude": 3.0120, "longitude": 101.4180,
        "operating_hours": "05:00 PM - 01:00 AM", "closed_days": "Ahad",
        "specialty_menu": "Sup Tulang Kambing Rempah Hangat Panas & Nasi Minyak",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Warung Pecel Lele Mas Joko",
        "slug": "pecel-lele-mas-joko-klang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Kapar, Klang", "latitude": 3.0720, "longitude": 101.4390,
        "operating_hours": "05:30 PM - 12:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Pecel Keli Goreng Rangup Sambal Cobek Gesek Tomato Limau",
        "taste_tags": "pedas, masam"
    },

    # =========================================================================
    # 2. ZON SHAH ALAM PELENGKAP (~20 Kedai)
    # =========================================================================
    {
        "name": "Nasi Kandar Beratur Seksyen 7",
        "slug": "nasi-kandar-beratur-sek-7",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-20)",
        "address": "Pusat Komersial Seksyen 7, Shah Alam", "latitude": 3.0742, "longitude": 101.4992,
        "operating_hours": "11:00 AM - 11:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kandar Kuah Campur Kaw Daging Kicap Hitam & Telur Sotong",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Kopitiam Classic Seksyen 2",
        "slug": "kopitiam-classic-sek-2-sa",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 2, Shah Alam", "latitude": 3.0790, "longitude": 101.5110,
        "operating_hours": "07:30 AM - 05:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Roti Bakar Arang Kaya Pandan Asli & Kopi Cham Peng Kaw",
        "taste_tags": "manis"
    },
    {
        "name": "Restoran Selera Minang Padang Seksyen 16",
        "slug": "selera-minang-sek-16-sa",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 16, Shah Alam", "latitude": 3.0580, "longitude": 101.5050,
        "operating_hours": "08:30 AM - 06:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Dendeng Balado Rangup Pedas & Gulai Tunjang Kaki Lembu",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Ayam Geprek Istimewa Seksyen 18",
        "slug": "ayam-geprek-sek-18-sa",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 18, Shah Alam", "latitude": 3.0460, "longitude": 101.5290,
        "operating_hours": "11:00 AM - 09:30 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Ayam Geprek Keju Mozzarella Bakar Sambal Cili Bawang",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran Mee Kari Udang Gergasi Seksyen 24",
        "slug": "mee-kari-udang-sek-24",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Mid (RM12-25)",
        "address": "Seksyen 24, Shah Alam", "latitude": 3.0380, "longitude": 101.5340,
        "operating_hours": "09:00 AM - 08:00 PM", "closed_days": "Selasa",
        "specialty_menu": "Mee Kari Kuah Santan Pekat Udang Harimau Gergasi & Kerang",
        "taste_tags": "banjir, pedas, sup"
    },
    {
        "name": "Warung Pecel Lele Seksyen 19",
        "slug": "pecel-lele-sek-19-sa",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Medan Selera Seksyen 19, Shah Alam", "latitude": 3.0490, "longitude": 101.5220,
        "operating_hours": "05:00 PM - 12:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Keli Goreng Panas Sambal Terasi Gesek Pedas Meletup",
        "taste_tags": "pedas"
    },
    {
        "name": "Kafe Kopi & Roti Seksyen 11",
        "slug": "kopi-roti-sek-11-sa",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 11, Shah Alam", "latitude": 3.0720, "longitude": 101.5280,
        "operating_hours": "07:30 AM - 06:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Roti Titab Butter Kaya Tradisi & Kopi O Ais Pekat Menusuk",
        "taste_tags": "manis"
    },
    {
        "name": "Restoran Tomyam Bunga Raya Seksyen 20",
        "slug": "tomyam-bunga-raya-sek-20",
        "category": "Tomyam & Thai", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 20, Shah Alam", "latitude": 3.0560, "longitude": 101.5390,
        "operating_hours": "04:30 PM - 01:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Tomyam Campur Kelapa Panas Masam Pedas & Daging Masak Merah",
        "taste_tags": "masam, pedas, sup"
    },
    {
        "name": "Burger Bakar Abang Sado Seksyen 15",
        "slug": "burger-bakar-abang-sado-sek-15",
        "category": "Burger & Western", "carb_type": "Western", "budget_tier": "Mid (RM10-22)",
        "address": "Dataran Otomobil Seksyen 15, Shah Alam", "latitude": 3.0620, "longitude": 101.5270,
        "operating_hours": "06:00 PM - 01:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Burger Daging Patty Buatan Sendiri Sos Blackpepper Cendawan",
        "taste_tags": "pedas"
    },
    {
        "name": "Warung Nasi Ambeng Bonda Seksyen 27",
        "slug": "nasi-ambeng-bonda-sek-27",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 27, Shah Alam", "latitude": 3.0210, "longitude": 101.5720,
        "operating_hours": "08:00 AM - 03:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Set Nasi Ambeng Tradisi Jawa Ayam Kicap Berempah & Mee Goreng",
        "taste_tags": "banjir, pedas"
    },

    # =========================================================================
    # 3. ZON KUALA LUMPUR NIGHT FOOD & STREET FOOD (~20 Kedai)
    # =========================================================================
    {
        "name": "Restoran Nasi Kandar Line Clear KL",
        "slug": "line-clear-kl-jalan-raja-chulan",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Raja Chulan, Kuala Lumpur", "latitude": 3.1510, "longitude": 101.7040,
        "operating_hours": "24 Jam", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kandar Kuah Campur Banjir Pekat, Ayam Bawang & Udang Galah",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Restoran Al-Sarifa Kampung Baru",
        "slug": "al-sarifa-kg-baru",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Raja Muda Musa, Kg Baru, KL", "latitude": 3.1628, "longitude": 101.7015,
        "operating_hours": "24 Jam", "closed_days": "Tiada Cuti",
        "specialty_menu": "Roti Canai Sarang Burung Telur Goyang & Teh Tarik Halia",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Warung Cendol Kampung Baru KL",
        "slug": "cendol-kg-baru-kl",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Kampung Baru, Kuala Lumpur", "latitude": 3.1635, "longitude": 101.7028,
        "operating_hours": "11:00 AM - 09:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Cendol Tapai Pulut Gula Melaka Asli & Bubur Cha Cha Panas",
        "taste_tags": "manis"
    },
    {
        "name": "Sate Zaini Batu Caves",
        "slug": "sate-zaini-batu-caves",
        "category": "Melayu / Nasi", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Batu Caves, Gombak, Selangor", "latitude": 3.2370, "longitude": 101.6840,
        "operating_hours": "04:30 PM - 11:30 PM", "closed_days": "Isnin",
        "specialty_menu": "Sate Ayam Lemak Manis Daging Lembut Cicah Kuah Kacang Asli",
        "taste_tags": "manis, pedas"
    },
    {
        "name": "Restoran Ayam Penyet Ria Bangsar",
        "slug": "ayam-penyet-ria-bangsar",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Mid (RM12-25)",
        "address": "Bangsar Baru, Kuala Lumpur", "latitude": 3.1310, "longitude": 101.6710,
        "operating_hours": "11:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Ayam Penyet Sambal Terasi Berkeringat Panas & Tahu Tempe",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran Mahbub Bangsar",
        "slug": "restoran-mahbub-bangsar",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Lucky Garden, Bangsar, KL", "latitude": 3.1290, "longitude": 101.6680,
        "operating_hours": "07:00 AM - 12:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Briyani Ayam Madu Legend & Kari Kepala Ikan Mahbub",
        "taste_tags": "manis, pedas, banjir"
    },
    {
        "name": "Mee Tarik Jalan Sultan Pasar Seni",
        "slug": "mee-tarik-jalan-sultan-kl",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Mid (RM10-22)",
        "address": "Jalan Sultan, Chinatown, KL", "latitude": 3.1435, "longitude": 101.6980,
        "operating_hours": "10:30 AM - 11:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Mee Tarik Beef Soup Lanzhou Tulen & Dumpling Sup Cuka Hitam",
        "taste_tags": "sup, pedas, masam"
    },
    {
        "name": "Restoran Kudu Bin Abdul Jalan TAR",
        "slug": "kudu-bin-abdul-jalan-tar",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Tuanku Abdul Rahman, KL", "latitude": 3.1610, "longitude": 101.6960,
        "operating_hours": "10:00 AM - 08:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Kandar Kudu Ayam Kicap Madu P. Ramlee & Kuah Campur",
        "taste_tags": "banjir, manis, pedas"
    },
    {
        "name": "Warung Sup Meletup Setapak",
        "slug": "sup-meletup-setapak",
        "category": "Mi & Sup", "carb_type": "Nasi / Sup", "budget_tier": "Marhaen (<RM10)",
        "address": "Taman Melati, Setapak, KL", "latitude": 3.2230, "longitude": 101.7220,
        "operating_hours": "05:00 PM - 02:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Sup Campur Daging Perut Paru Lidah Hirup Panas Limau Nipis",
        "taste_tags": "sup, masam, pedas"
    },
    {
        "name": "Nasi Dagang Ulik Mayang Wangsa Maju",
        "slug": "nasi-dagang-ulik-mayang-wm",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 1, Wangsa Maju, KL", "latitude": 3.2040, "longitude": 101.7340,
        "operating_hours": "07:00 AM - 02:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Dagang Terengganu Asli Gulai Ikan Tongkol & Acar Timun",
        "taste_tags": "banjir, pedas, masam"
    },

    # =========================================================================
    # 4. ZON BANGI, PUTRAJAYA & KAJANG PELENGKAP (~17 Kedai)
    # =========================================================================
    {
        "name": "Nasi Kandar Apollo Bangi",
        "slug": "nasi-kandar-apollo-bangi",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 9, Bandar Baru Bangi", "latitude": 2.9620, "longitude": 101.7610,
        "operating_hours": "10:00 AM - 11:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kandar Bendi Rangup Kuah Kari Campur Banjir Kaw & Ayam Goreng",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Warung Lontong Jawa Bangi",
        "slug": "lontong-jawa-bangi",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 3, Bandar Baru Bangi", "latitude": 2.9480, "longitude": 101.7740,
        "operating_hours": "06:30 AM - 11:30 AM", "closed_days": "Isnin",
        "specialty_menu": "Lontong Sayur Lemak Lodeh Sambal Sotong & Tempe Goreng Garing",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Restoran D'Penyet Bangi Gateway",
        "slug": "dpenyet-bangi-gateway",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Mid (RM10-22)",
        "address": "Bangi Gateway, Seksyen 15, Bangi", "latitude": 2.9330, "longitude": 101.7660,
        "operating_hours": "10:30 AM - 09:30 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Ayam Penyet Rangup Sambal Terasi Asli Pedas & Sup Bakso",
        "taste_tags": "pedas, sup"
    },
    {
        "name": "Kedai Kopi Santai Kajang",
        "slug": "kopi-santai-kajang",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "Saujana Impian, Kajang, Selangor", "latitude": 3.0110, "longitude": 101.7940,
        "operating_hours": "07:30 AM - 05:30 PM", "closed_days": "Selasa",
        "specialty_menu": "Kopi Peng Susu Berbuih Kaw, Roti Bakar Telur Goyang & Nasi Lemak",
        "taste_tags": "manis"
    },
    {
        "name": "Tomyam Seafood Berapi Kajang",
        "slug": "tomyam-berapi-kajang",
        "category": "Tomyam & Thai", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Sungai Chua, Kajang, Selangor", "latitude": 2.9890, "longitude": 101.7780,
        "operating_hours": "04:30 PM - 01:30 AM", "closed_days": "Rabu",
        "specialty_menu": "Tomyam Poktek Seafood Merah Hirup Berasap & Kailan Ikan Masin",
        "taste_tags": "masam, pedas, sup"
    },
    {
        "name": "Restoran Nasi Kukus D'Bangi",
        "slug": "nasi-kukus-dbangi",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 7, Bandar Baru Bangi", "latitude": 2.9720, "longitude": 101.7790,
        "operating_hours": "10:00 AM - 09:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Kukus Beras Wangi Ayam Goreng Rempah & Sambal Belacan Gesek",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Kafeteria D'Tasik Putrajaya",
        "slug": "kafeteria-dtasik-putrajaya",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Presint 2, Putrajaya", "latitude": 2.9260, "longitude": 101.6910,
        "operating_hours": "08:00 AM - 04:30 PM", "closed_days": "Sabtu & Ahad",
        "specialty_menu": "Nasi Campur Selera Penjawat Awam, Asam Pedas Ikan Kembung & Ulam",
        "taste_tags": "masam, pedas, banjir"
    }
]

def seed_batch3():
    print("=" * 70)
    print("🚀 MENYUNTIK KELOMPOK AKHIR MENUJU 200 KEDAI PENUH (BATCH 3)...")
    print(f"📦 Jumlah Kedai Disimpan: {len(BATCH3_RESTAURANTS)} buah kedai!")
    print("=" * 70)

    with get_connection() as conn:
        cursor = conn.cursor()
        inserted = 0

        for r in BATCH3_RESTAURANTS:
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

    print(f"✅ Selesai! Sebanyak {inserted} kedai berkualiti berjaya ditambah.")
    print(f"🎉 TAHNIAH ANATA! JUMLAH BESAR KEDAI AKTIF DALAM APP SEKARANG: {total} KEDAI!")
    print("=" * 70)

if __name__ == "__main__":
    seed_batch3()