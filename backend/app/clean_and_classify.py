import sqlite3
import re
from backend.app.database import get_connection

# 1. Senarai Hitam Non-Halal (Sensitiviti Tinggi)
NON_HALAL_KEYWORDS = [
    r"\bpork\b", r"\bbabi\b", r"\bnon-halal\b", r"\bnon halal\b",
    r"\bbar\b", r"\bpub\b", r"\bbeer\b", r"\bwine\b", r"\bbistro & bar\b",
    r"\bbak kut teh\b", r"\bchar siew\b", r"\bsiew yuk\b", r"\blard\b"
]

# 2. Peta Koordinat GPS Mengikut Zon Hotspot (Untuk Selesaikan Isu Radius Jalan Kebun)
ZONE_COORDINATES = {
    "seksyen 7": (3.0738, 101.4998, "Shah Alam"),
    "seksyen 13": (3.0792, 101.5456, "Shah Alam"),
    "shah alam": (3.0733, 101.5185, "Shah Alam"),
    "jalan kebun": (2.9735, 101.5367, "Shah Alam / Klang"),
    "ss15": (3.0763, 101.5898, "Subang Jaya"),
    "subang jaya": (3.0567, 101.5851, "Subang Jaya"),
    "damansara utama": (3.1357, 101.6225, "Petaling Jaya"),
    "uptown": (3.1357, 101.6225, "Petaling Jaya"),
    "bangi": (2.9569, 101.7797, "Bangi"),
    "ttdi": (3.1415, 101.6294, "Kuala Lumpur"),
    "kampung baru": (3.1633, 101.7032, "Kuala Lumpur"),
    "cheras": (3.1068, 101.7258, "Kuala Lumpur"),
    "ampang": (3.1485, 101.7610, "Selangor / KL")
}

def clean_database():
    print("=" * 60)
    print("🧹 MEMULAKAN PROSES PEMBERSIHAN PANGKALAN DATA 'MAKAN APA?'")
    print("=" * 60)

    with get_connection() as conn:
        cursor = conn.cursor()

        # --- A. BUANG KEDAI BERISIKO NON-HALAL ---
        cursor.execute("SELECT id, name, category FROM restaurants")
        rows = cursor.fetchall()

        deleted_halal = 0
        for r in rows:
            text = f"{r['name']} {r['category']}".lower()
            if any(re.search(pattern, text) for pattern in NON_HALAL_KEYWORDS):
                cursor.execute("DELETE FROM restaurants WHERE id = ?", (r['id'],))
                deleted_halal += 1
                print(f"  🚫 Dibuang (Non-Halal Flag): {r['name']}")

        conn.commit()
        print(f"\n✅ Selesai saringan halal: {deleted_halal} kedai berisiko disingkirkan.")

        # --- B. BUANG PENDUA (REMOVE DUPLICATES) ---
        cursor.execute("SELECT id, name, address FROM restaurants ORDER BY id ASC")
        all_shops = cursor.fetchall()

        seen_names = set()
        deleted_duplicates = 0

        for s in all_shops:
            # Format pembersihan nama asas untuk pengesanan pendua
            clean_name = re.sub(r'[^a-zA-Z0-9]', '', s['name'].lower())
            
            # Jika kedai dengan nama bersih ini sudah wujud, padam rekod baharu
            if clean_name in seen_names:
                cursor.execute("DELETE FROM restaurants WHERE id = ?", (s['id'],))
                deleted_duplicates += 1
                print(f"  ♻️ Dibuang (Pendua): {s['name']}")
            else:
                seen_names.add(clean_name)

        conn.commit()
        print(f"✅ Selesai pembersihan pendua: {deleted_duplicates} rekod bertindih dipadam.")

        # --- C. KEMAS KINI KATEGORI & KOORDINAT GPS (GEO-TAGGING) ---
        cursor.execute("SELECT id, name, category, carb_type, address, latitude, longitude FROM restaurants")
        remaining_shops = cursor.fetchall()

        updated_count = 0
        for s in remaining_shops:
            name = s['name'].lower()
            cat = s['category'].lower()
            addr = s['address'].lower()
            full_text = f"{name} {cat} {addr}"

            # 1. Pengelasan Kategori 8 Roda
            new_cat = s['category']
            new_carb = s['carb_type']

            if any(x in full_text for x in ["mamak", "kandar", "pelita", "hakim", "roti canai", "mamu"]):
                new_cat = "Mamak"
                new_carb = "Nasi / Roti"
            elif any(x in full_text for x in ["mee", "mi", "laksa", "sup", "soup", "ramen", "bihun"]):
                new_cat = "Mi & Sup"
                new_carb = "Mi"
            elif any(x in full_text for x in ["cafe", "kafe", "dessert", "bakery", "pastry", "waffle", "bingsu"]):
                new_cat = "Kafe & Manis"
                new_carb = "Western / Roti"
            elif any(x in full_text for x in ["kopitiam", "kopi", "toast", "cham"]):
                new_cat = "Kopitiam"
                new_carb = "Roti / Kopi"
            elif any(x in full_text for x in ["burger", "pizza", "western", "steak", "pasta"]):
                new_cat = "Burger & Western"
                new_carb = "Western"
            elif any(x in full_text for x in ["ayam", "gepuk", "crispy"]):
                new_cat = "Ayam Goreng"
                new_carb = "Nasi"
            elif any(x in full_text for x in ["tomyam", "thai", "seafood", "ikan bakar"]):
                new_cat = "Tomyam & Thai"
                new_carb = "Nasi"
            elif any(x in full_text for x in ["nasi", "melayu", "padang", "campur", "kukus"]):
                new_cat = "Melayu / Nasi"
                new_carb = "Nasi"

            # 2. Kemas Kini Koordinat GPS Berdasarkan Zon
            new_lat = s['latitude']
            new_lon = s['longitude']

            if new_lat == 0.0 or new_lon == 0.0:
                for zone_key, (z_lat, z_lon, zone_city) in ZONE_COORDINATES.items():
                    if zone_key in full_text:
                        # Tambah sedikit variasi rawak mikro (~100m) supaya kedai tidak bertindih pada satu titik tepat
                        new_lat = round(z_lat + (hash(name) % 100) * 0.0001, 5)
                        new_lon = round(z_lon + (hash(name) % 100) * 0.0001, 5)
                        break

            cursor.execute("""
                UPDATE restaurants 
                SET category = ?, carb_type = ?, latitude = ?, longitude = ?
                WHERE id = ?
            """, (new_cat, new_carb, new_lat, new_lon, s['id']))
            updated_count += 1

        conn.commit()

        # Statistik Akhir
        cursor.execute("SELECT COUNT(*) as total FROM restaurants")
        final_total = cursor.fetchone()['total']

    print("=" * 60)
    print(f"🎉 PEMBERSIHAN SELESAI! {updated_count} kedai berjaya dikategorikan & diberi koordinat.")
    print(f"📊 JUMLAH KEDAI BERSIH & SAHIH DALAM DATABASE SEKARANG: {final_total} BUAH KEDAI!")
    print("=" * 60)

if __name__ == "__main__":
    clean_database()