from backend.app.database import get_connection

LOCAL_SPOTS = [
    # Port TikTok Ena Kunyah
    {
        "name": "Mari Steamboat & Grill",
        "slug": "mari-steamboat-grill-shah-alam",
        "category": "Steamboat & Grill",
        "carb_type": "Mi / Western",
        "budget_tier": "Mid (RM15-35)",
        "address": "Shah Alam, Selangor",
        "latitude": 3.0738, "longitude": 101.4998
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
        "name": "Bungaa & Gula Cafe",
        "slug": "bungaa-dan-gula-cafe-semenyih",
        "category": "Kafe & Manis",
        "carb_type": "Western / Pastry",
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

    # --- KHAS UNTUK RADIUS < 5KM RUMAH BABY DI JALAN KEBUN! ---
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
        "name": "Suatu Perjalanan Cafe",
        "slug": "suatu-perjalanan-jln-kebun-real",
        "category": "Kafe & Manis",
        "carb_type": "Western / Roti",
        "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Kebun, Seksyen 30, Shah Alam",
        "latitude": 2.9740, "longitude": 101.5365
    },
    {
        "name": "Aboy Cafe Jalan Kebun",
        "slug": "aboy-cafe-jln-kebun-real",
        "category": "Burger & Western",
        "carb_type": "Western / Nasi",
        "budget_tier": "Mid (RM10-25)",
        "address": "Jalan Kebun, Shah Alam",
        "latitude": 2.9710, "longitude": 101.5350
    },
    {
        "name": "Warung Wak Jasman Sijangkang",
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
    }
]

def inject():
    with get_connection() as conn:
        cursor = conn.cursor()
        count = 0
        for s in LOCAL_SPOTS:
            cursor.execute("""
                INSERT OR REPLACE INTO restaurants 
                (name, slug, category, carb_type, budget_tier, address, latitude, longitude, maps_url, is_viral, is_halal_verified, is_active)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, '', 1, 1, 1)
            """, (s["name"], s["slug"], s["category"], s["carb_type"], s["budget_tier"], s["address"], s["latitude"], s["longitude"]))
            count += 1
        conn.commit()
    print(f"🎉 Berjaya suntik {count} kedai tempatan Jalan Kebun & TikTok ke dalam SQLite!")

if __name__ == "__main__":
    inject()