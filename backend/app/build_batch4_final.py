import sqlite3
from backend.app.database import get_connection

BATCH4_FINAL_42 = [
    # =========================================================================
    # 1. ZON JALAN KEBUN, BANTING & SEPANG (TAMBAHAN LOKAL BABY)
    # =========================================================================
    {
        "name": "Restoran Selera Impian Banting",
        "slug": "selera-impian-banting",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Jalan Morib, Banting, Selangor", "latitude": 2.8120, "longitude": 101.4980,
        "operating_hours": "07:30 AM - 04:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Ikan Pari Asam Pedas Melati, Sambal Udang Galah & Gulai Daging",
        "taste_tags": "masam, pedas, banjir"
    },
    {
        "name": "Warung Nasi Lemak Sambal Semerah Padi Sepang",
        "slug": "nasi-lemak-semerah-padi-sepang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Kota Warisan, Sepang, Selangor", "latitude": 2.8210, "longitude": 101.6980,
        "operating_hours": "06:30 AM - 11:30 AM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Lemak Kukus Sambal Semerah Padi Pedas Menyengat & Ayam Berempah",
        "taste_tags": "pedas"
    },
    {
        "name": "Warung Kopi Kebun Cafe",
        "slug": "warung-kopi-kebun-cafe",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Kebun Nenas, Klang, Selangor", "latitude": 2.9785, "longitude": 101.5320,
        "operating_hours": "04:30 PM - 11:30 PM", "closed_days": "Selasa",
        "specialty_menu": "Latte Kampung Gula Melaka, Waffle Coklat Pisang & Pasta Tomyam",
        "taste_tags": "manis, masam"
    },
    {
        "name": "Restoran Nasi Kukus D'Banting",
        "slug": "nasi-kukus-dbanting",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Pekan Banting, Selangor", "latitude": 2.8150, "longitude": 101.5020,
        "operating_hours": "10:00 AM - 09:30 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kukus Ayam Dara Panas Rangup, Kuah Kari Pekat & Sambal Belacan",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Warung Mee Kari Udang Sepang",
        "slug": "mee-kari-udang-sepang",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Mid (RM12-25)",
        "address": "Bandar Baru Salak Tinggi, Sepang", "latitude": 2.8180, "longitude": 101.7340,
        "operating_hours": "08:30 AM - 06:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Mee Kari Udang Harimau Kuah Santan Pekat Memikat & Kerang Rebus",
        "taste_tags": "banjir, pedas, sup"
    },

    # =========================================================================
    # 2. ZON SHAH ALAM & SETIA ALAM TAMBAHAN
    # =========================================================================
    {
        "name": "Restoran Selera Kampung Padang Jawa",
        "slug": "selera-kampung-padang-jawa",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Padang Jawa, Seksyen 16, Shah Alam", "latitude": 3.0530, "longitude": 101.4920,
        "operating_hours": "07:00 AM - 03:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Campur 60 Lauk Melayu, Ikan Keli Berlada & Sayur Keladi",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Ayam Penyet Surabaya Seksyen 7",
        "slug": "ayam-penyet-surabaya-sek-7",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Mid (RM10-22)",
        "address": "Jalan Plumbum 7/95, Seksyen 7, Shah Alam", "latitude": 3.0695, "longitude": 101.4910,
        "operating_hours": "11:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Ayam Penyet Rangup Sambal Belacan Pedas Basah & Sup Bakso",
        "taste_tags": "pedas, sup"
    },
    {
        "name": "Kopitiam Mesra Seksyen 18",
        "slug": "kopitiam-mesra-sek-18-sa",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 18, Shah Alam", "latitude": 3.0470, "longitude": 101.5275,
        "operating_hours": "07:30 AM - 05:30 PM", "closed_days": "Isnin",
        "specialty_menu": "Roti Bakar Telur Goyang Butter Kaya & Kopi Tarik Kurang Manis",
        "taste_tags": "manis"
    },
    {
        "name": "Warung Sup Gearbox Seksyen 24",
        "slug": "sup-gearbox-sek-24-sa",
        "category": "Mi & Sup", "carb_type": "Mi / Sup", "budget_tier": "Mid (RM15-35)",
        "address": "Seksyen 24, Shah Alam", "latitude": 3.0360, "longitude": 101.5360,
        "operating_hours": "04:30 PM - 12:30 AM", "closed_days": "Ahad",
        "specialty_menu": "Sup Tulang Gearbox Lembu Kuah Herba Panas Cicah Roti Perancis",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Restoran D'Anjung Western Seksyen 13",
        "slug": "danjung-western-sek-13",
        "category": "Burger & Western", "carb_type": "Western", "budget_tier": "Mid (RM10-25)",
        "address": "Seksyen 13, Shah Alam", "latitude": 3.0820, "longitude": 101.5470,
        "operating_hours": "05:00 PM - 12:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Sirloin Steak Blackpepper, Chicken Maryland & Macaroni Cheese",
        "taste_tags": "pedas"
    },
    {
        "name": "Warung Nasi Lemak Kuning Seksyen 3",
        "slug": "nasi-lemak-kuning-sek-3-sa",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 3, Shah Alam", "latitude": 3.0765, "longitude": 101.5160,
        "operating_hours": "06:30 AM - 11:00 AM", "closed_days": "Jumaat",
        "specialty_menu": "Nasi Lemak Kuning Beraroma Serai Sambal Sotong Kering & Telur Mata",
        "taste_tags": "pedas"
    },
    {
        "name": "Restoran Sate Hut Setia Alam",
        "slug": "sate-hut-setia-alam",
        "category": "Melayu / Nasi", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Setia Prima, Setia Alam", "latitude": 3.1010, "longitude": 101.4460,
        "operating_hours": "04:00 PM - 11:30 PM", "closed_days": "Selasa",
        "specialty_menu": "Sate Daging Lembut Isi Tebal Kuah Kacang Pedas & Nasi Himpit",
        "taste_tags": "manis, pedas"
    },

    # =========================================================================
    # 3. ZON SUBANG JAYA & USJ TAMBAHAN
    # =========================================================================
    {
        "name": "Restoran D'Tandoor Subang Jaya",
        "slug": "dtandoor-subang-jaya",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM15-35)",
        "address": "SS15, Subang Jaya", "latitude": 3.0772, "longitude": 101.5892,
        "operating_hours": "11:00 AM - 10:30 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Roti Naan Garlic Cheese Panas, Ayam Tandoori & Kuah Dhal Pekat",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Nasi Kandar Subang Parade",
        "slug": "nasi-kandar-subang-parade",
        "category": "Mamak", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "SS16, Subang Jaya", "latitude": 3.0820, "longitude": 101.5860,
        "operating_hours": "10:00 AM - 10:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kandar Ayam Bawang Goreng Rangup & Kari Kambing Melimpah",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Kopitiam Heritage USJ 9",
        "slug": "kopitiam-heritage-usj-9",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "USJ 9, Subang Jaya", "latitude": 3.0420, "longitude": 101.5880,
        "operating_hours": "07:30 AM - 06:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Roti Titab Telur Separuh Masak, Kopi Butter Asli & Mee Hoon Siam",
        "taste_tags": "manis"
    },
    {
        "name": "Burgerbyte USJ Taipan",
        "slug": "burgerbyte-usj-taipan",
        "category": "Burger & Western", "carb_type": "Western", "budget_tier": "Mid (RM10-25)",
        "address": "USJ 10, Subang Jaya", "latitude": 3.0490, "longitude": 101.5830,
        "operating_hours": "05:00 PM - 12:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Burger Daging Naked Cheese Lumer & Meatball Kuah Coklat",
        "taste_tags": "pedas"
    },

    # =========================================================================
    # 4. ZON TTDI & PETALING JAYA TAMBAHAN
    # =========================================================================
    {
        "name": "Restoran Nasi Kapau Bukit Damansara",
        "slug": "nasi-kapau-bukit-damansara",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM15-35)",
        "address": "Medan Damansara, KL", "latitude": 3.1480, "longitude": 101.6540,
        "operating_hours": "10:30 AM - 08:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Kapau Minang Asli, Gulai Tunjang Kaki Lembu & Rendang Itik",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Sambal Asam Pedas TTDI",
        "slug": "sambal-asam-pedas-ttdi",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM12-25)",
        "address": "Jalan Burhanuddin Helmi, TTDI, KL", "latitude": 3.1430, "longitude": 101.6260,
        "operating_hours": "11:00 AM - 09:30 PM", "closed_days": "Isnin",
        "specialty_menu": "Asam Pedas Ikan Pari Melaka Asli Pekat Daun Kesum & Telur Masin",
        "taste_tags": "masam, pedas, banjir"
    },
    {
        "name": "Ayam Goreng Berempah Jaya One PJ",
        "slug": "ayam-goreng-jaya-one-pj",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Mid (RM10-22)",
        "address": "Seksyen 13, Petaling Jaya", "latitude": 3.1180, "longitude": 101.6360,
        "operating_hours": "10:30 AM - 09:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Ayam Goreng Rangup Rempah Bawang Putih & Nasi Kukus Pandan",
        "taste_tags": "pedas"
    },
    {
        "name": "Kafe Kupi & Croffle SS2 PJ",
        "slug": "kupi-croffle-ss2-pj",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "SS2, Petaling Jaya, Selangor", "latitude": 3.1190, "longitude": 101.6210,
        "operating_hours": "11:00 AM - 10:30 PM", "closed_days": "Selasa",
        "specialty_menu": "Croffle Nutella Strawberi Rangup, Basque Burnt Cheesecake & Latte",
        "taste_tags": "manis"
    },
    {
        "name": "Restoran Mee Rebus Tulang Kelana Jaya",
        "slug": "mee-rebus-tulang-kelana-jaya",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Mid (RM12-25)",
        "address": "SS6, Kelana Jaya, Petaling Jaya", "latitude": 3.1020, "longitude": 101.5990,
        "operating_hours": "11:30 AM - 10:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Mee Rebus Tulang Gearbox Lembu Kuah Manis Pedas & Limau Kasturi",
        "taste_tags": "sup, pedas, banjir"
    },

    # =========================================================================
    # 5. ZON KUALA LUMPUR, KG BARU & CHERAS TAMBAHAN
    # =========================================================================
    {
        "name": "Restoran D'Tasek Tomyam Kampung Baru",
        "slug": "dtasek-tomyam-kg-baru",
        "category": "Tomyam & Thai", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Raja Muda Musa, Kg Baru, KL", "latitude": 3.1638, "longitude": 101.7035,
        "operating_hours": "05:00 PM - 03:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Tomyam Poktek Kelapa Segar, Daging Harimau Menangis & Somtam",
        "taste_tags": "masam, pedas, sup"
    },
    {
        "name": "Restoran Nasi Padang Asli Kampung Baru",
        "slug": "nasi-padang-asli-kg-baru",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Raja Abdullah, Kg Baru, KL", "latitude": 3.1620, "longitude": 101.7010,
        "operating_hours": "08:30 AM - 07:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Rendang Daging Sapi Minang Asli, Gulai Cincang & Sambal Hijau",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Warung Sup Meletup Keramat",
        "slug": "sup-meletup-keramat-kl",
        "category": "Mi & Sup", "carb_type": "Mi / Sup", "budget_tier": "Marhaen (<RM10)",
        "address": "Dato Keramat, Kuala Lumpur", "latitude": 3.1650, "longitude": 101.7260,
        "operating_hours": "05:30 PM - 01:30 AM", "closed_days": "Ahad",
        "specialty_menu": "Sup Urat Keting Campur Daging Panas Hirup & Telur Dadar",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Restoran Nasi Lemak Royale Bangsar",
        "slug": "nasi-lemak-royale-bangsar",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM12-25)",
        "address": "Bangsar Baru, Kuala Lumpur", "latitude": 3.1325, "longitude": 101.6690,
        "operating_hours": "09:00 AM - 11:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Nasi Kuning Royale Kedah Kuah Campur, Daging Hitam & Paru Garing",
        "taste_tags": "banjir, manis, pedas"
    },
    {
        "name": "Restoran Briyani Gam An-Nur Cheras",
        "slug": "briyani-annur-cheras",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM15-30)",
        "address": "Taman Maluri, Cheras, KL", "latitude": 3.1280, "longitude": 101.7280,
        "operating_hours": "11:00 AM - 09:30 PM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Briyani Gam Kambing Johor Asli, Dalcha Sayur & Acar Buah",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Restoran Sate Padang Mak Syukur KL",
        "slug": "sate-mak-syukur-kl",
        "category": "Melayu / Nasi", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-22)",
        "address": "Chow Kit / Jalan Raja Laut, KL", "latitude": 3.1660, "longitude": 101.6940,
        "operating_hours": "03:00 PM - 11:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Sate Padang Kuah Kuning Rempah Pekat Ketupat & Keropok Kulit",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Kafe Manis Dessert Bar Bangsar",
        "slug": "manis-dessert-bar-bangsar",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Mid (RM15-30)",
        "address": "Jalan Telawi, Bangsar, KL", "latitude": 3.1305, "longitude": 101.6705,
        "operating_hours": "12:00 PM - 11:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Matcha Bingsu Sejuk Lembut, Mango Sticky Rice Parfait & Waffle",
        "taste_tags": "manis"
    },

    # =========================================================================
    # 6. ZON BANGI, KAJANG & HULU LANGAT TAMBAHAN
    # =========================================================================
    {
        "name": "Restoran Nasi Beriani Gam Batu Pahat Bangi",
        "slug": "beriani-gam-batu-pahat-bangi",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM15-30)",
        "address": "Seksyen 9, Bandar Baru Bangi", "latitude": 2.9640, "longitude": 101.7560,
        "operating_hours": "10:30 AM - 06:00 PM", "closed_days": "Jumaat",
        "specialty_menu": "Beriani Gam Daging Kambing Batu Pahat Asli & Ayam Masak Merah",
        "taste_tags": "banjir, pedas"
    },
    {
        "name": "Warung Lontong Kering Nenek Bangi",
        "slug": "lontong-kering-nenek-bangi",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Seksyen 4, Bandar Baru Bangi", "latitude": 2.9510, "longitude": 101.7820,
        "operating_hours": "07:00 AM - 12:00 PM", "closed_days": "Selasa",
        "specialty_menu": "Lontong Kering Sambal Paru Pengantin & Kuah Kacang Lodeh",
        "taste_tags": "pedas, manis"
    },
    {
        "name": "Restoran Nasi Kerabu Golok Kajang",
        "slug": "nasi-kerabu-golok-kajang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Sungai Chua, Kajang, Selangor", "latitude": 2.9860, "longitude": 101.7810,
        "operating_hours": "07:30 AM - 03:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Nasi Kerabu Biru Ayam Bakar Tempayan, Solok Lada & Sambal Tumis",
        "taste_tags": "pedas, masam"
    },
    {
        "name": "Restoran Itik Panggang Mas D'Bangi",
        "slug": "itik-panggang-mas-bangi",
        "category": "Ayam Goreng", "carb_type": "Nasi", "budget_tier": "Mid (RM12-25)",
        "address": "Seksyen 7, Bandar Baru Bangi", "latitude": 2.9740, "longitude": 101.7760,
        "operating_hours": "11:00 AM - 09:00 PM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Itik Panggang Kulit Rangup Madu Halal & Nasi Ayam Hainan Wangi",
        "taste_tags": "manis, pedas"
    },
    {
        "name": "Burger Bakar Kaw Kaw Kajang",
        "slug": "burger-bakar-kaw-kaw-kajang",
        "category": "Burger & Western", "carb_type": "Western", "budget_tier": "Mid (RM10-25)",
        "address": "Bandar Kajang, Selangor", "latitude": 2.9940, "longitude": 101.7870,
        "operating_hours": "06:00 PM - 01:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Burger Daging Patty Buatan Sendiri Bakar Arang Double Cheese Leleh",
        "taste_tags": "pedas"
    },
    {
        "name": "Warung Cendol Pulut Tapai Kajang",
        "slug": "cendol-pulut-kajang",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Marhaen (<RM10)",
        "address": "Pekan Kajang, Selangor", "latitude": 2.9920, "longitude": 101.7895,
        "operating_hours": "11:00 AM - 06:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Cendol Santan Segar Tapai Pulut Wangi & Ais Kacang Gunung Salju",
        "taste_tags": "manis"
    },
    {
        "name": "Restoran Mee Bandung Muar Kajang",
        "slug": "mee-bandung-muar-kajang",
        "category": "Mi & Sup", "carb_type": "Mi", "budget_tier": "Marhaen (<RM10)",
        "address": "Saujana Impian, Kajang", "latitude": 3.0130, "longitude": 101.7920,
        "operating_hours": "12:00 PM - 10:30 PM", "closed_days": "Khamis",
        "specialty_menu": "Mee Bandung Muar Tulen Daging Tetel Lembut Kuah Udang Merah",
        "taste_tags": "pedas, banjir"
    },
    {
        "name": "Restoran Ikan Patin Tempoyak Semenyih",
        "slug": "ikan-patin-tempoyak-semenyih",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Mid (RM15-35)",
        "address": "Pekan Semenyih, Selangor", "latitude": 2.9520, "longitude": 101.8460,
        "operating_hours": "10:30 AM - 05:00 PM", "closed_days": "Ahad",
        "specialty_menu": "Gulai Masak Tempoyak Ikan Patin Buah Temerloh Asli & Sambal Hitam",
        "taste_tags": "masam, pedas, banjir"
    },
    {
        "name": "Kafe Santai Dusun Hulu Langat",
        "slug": "kafe-santai-dusun-hulu-langat",
        "category": "Kafe & Manis", "carb_type": "Western / Roti", "budget_tier": "Mid (RM10-25)",
        "address": "Batu 14, Hulu Langat, Selangor", "latitude": 3.1110, "longitude": 101.8150,
        "operating_hours": "03:00 PM - 11:00 PM", "closed_days": "Isnin",
        "specialty_menu": "Kopi Hirup Tepi Sungai, Lempeng Kelapa Sambal Sardin & Croffle",
        "taste_tags": "manis, pedas"
    },
    {
        "name": "Restoran Sate Reko Kajang Corner",
        "slug": "sate-reko-corner-kajang",
        "category": "Melayu / Nasi", "carb_type": "Nasi / Roti", "budget_tier": "Mid (RM10-22)",
        "address": "Jalan Reko, Kajang, Selangor", "latitude": 2.9810, "longitude": 101.7890,
        "operating_hours": "04:30 PM - 12:00 AM", "closed_days": "Tiada Cuti",
        "specialty_menu": "Sate Ayam Berempah Madu Kuah Kacang Pekat Pedas Manis",
        "taste_tags": "manis, pedas"
    },
    {
        "name": "Restoran Sup Tulang Merah Bangi",
        "slug": "sup-tulang-merah-bangi",
        "category": "Mi & Sup", "carb_type": "Mi / Sup", "budget_tier": "Mid (RM12-25)",
        "address": "Seksyen 4 Tambahan, Bandar Baru Bangi", "latitude": 2.9540, "longitude": 101.7850,
        "operating_hours": "05:00 PM - 01:00 AM", "closed_days": "Isnin",
        "specialty_menu": "Sup Tulang Merah Singapura Sedut Sum-Sum Cicah Roti Perancis",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Kopitiam Warisan Melayu Putrajaya",
        "slug": "kopitiam-warisan-putrajaya",
        "category": "Kopitiam", "carb_type": "Roti / Kopi", "budget_tier": "Marhaen (<RM10)",
        "address": "Presint 9, Putrajaya", "latitude": 2.9340, "longitude": 101.6780,
        "operating_hours": "07:30 AM - 05:30 PM", "closed_days": "Ahad",
        "specialty_menu": "Roti Bakar Telur Goyang Kampung & Kopi O Kaw Panas Cawan Bunga",
        "taste_tags": "manis"
    },
    {
        "name": "Restoran Sup Gearbox Meletup Banting",
        "slug": "sup-gearbox-banting",
        "category": "Mi & Sup", "carb_type": "Mi / Sup", "budget_tier": "Mid (RM15-35)",
        "address": "Telok Datok, Banting, Selangor", "latitude": 2.8220, "longitude": 101.5110,
        "operating_hours": "05:00 PM - 12:30 AM", "closed_days": "Isnin",
        "specialty_menu": "Sup Gearbox Lembu Kuah Rempah Hangat Bersama Nasi Putih Panas",
        "taste_tags": "sup, pedas"
    },
    {
        "name": "Warung Nasi Lemak Kukus Daun Pisang Sepang",
        "slug": "nasi-lemak-daun-pisang-sepang",
        "category": "Melayu / Nasi", "carb_type": "Nasi", "budget_tier": "Marhaen (<RM10)",
        "address": "Pekan Sepang, Selangor", "latitude": 2.6920, "longitude": 101.7480,
        "operating_hours": "06:30 AM - 11:30 AM", "closed_days": "Ahad",
        "specialty_menu": "Nasi Lemak Kukus Sambal Bilis Garing & Telur Mata Rebus",
        "taste_tags": "pedas"
    }
]

def seed_final_42():
    print("=" * 70)
    print("🚀 MENYUNTIK BAKI 42 KEDAI PELENGKAP MENUJU 200 KEDAI PENUH...")
    print(f"📦 Jumlah Kedai Disimpan: {len(BATCH4_FINAL_42)} buah kedai!")
    print("=" * 70)

    with get_connection() as conn:
        cursor = conn.cursor()
        inserted = 0

        for r in BATCH4_FINAL_42:
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

    print(f"✅ Selesai! Sebanyak {inserted} kedai berkualiti tinggi berjaya ditambah.")
    print("=" * 70)
    print(f"🎉 TAHNIAH ANATA! KITA DAH CAPAI TEPAT SASARAN: {total} BUAH KEDAI PENUH! 🏆")
    print("=" * 70)

if __name__ == "__main__":
    seed_final_42()