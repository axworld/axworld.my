import sqlite3
import re
from pathlib import Path
from backend.app.database import get_connection

BASE_DIR = Path(__file__).resolve().parent.parent.parent
BACKUP_DB = BASE_DIR / "data" / "makan_mana_backup.db"

# 1. Senarai Hitam Ketat (Non-Halal & Minuman Keras)
NON_HALAL_PATTERNS = [
    r"\bpork\b", r"\bbabi\b", r"\bnon[- ]?halal\b", r"\bbar\b", r"\bpub\b",
    r"\bbeer\b", r"\bwine\b", r"\bbistro & bar\b", r"\bbrewery\b",
    r"\bbak kut teh\b", r"\bchar siew\b", r"\bsiew yuk\b", r"\blard\b",
    r"\broast pork\b", r"\bchinese wine\b"
]

def restore_and_clean():
    print("=" * 65)
    print("🛡️ MEMULAKAN PROSES RESTORE & SANITASI DARI BACKUP...")
    print("=" * 65)

    if not BACKUP_DB.exists():
        print(f"❌ Fail backup tidak dijumpai di: {BACKUP_DB}")
        return

    # Sambung ke backup (Read-Only)
    conn_bak = sqlite3.connect(BACKUP_DB)
    conn_bak.row_factory = sqlite3.Row
    cur_bak = conn_bak.cursor()

    try:
        cur_bak.execute("SELECT * FROM restaurants")
        old_shops = cur_bak.fetchall()
        print(f"📦 Menemui {len(old_shops)} rekod kedai dalam fail backup.")
    except Exception as e:
        print(f"⚠️ Gagal membaca jadual restaurants dalam backup: {e}")
        conn_bak.close()
        return

    # Sambung ke database hidup kita
    conn_live = get_connection()
    cur_live = conn_live.cursor()

    # Dapatkan nama kedai yang sedia ada (supaya tak bertindih dengan 9 kedai tadi)
    cur_live.execute("SELECT name FROM restaurants")
    existing_names = set(r['name'].lower() for r in cur_live.fetchall())

    seen_core_names = set()
    inserted_count = 0
    rejected_non_halal = 0
    rejected_duplicates = 0

    for s in old_shops:
        name = s['name'].strip()
        cat = s['category'] if 'category' in s.keys() else ''
        addr = s['address'] if 'address' in s.keys() else ''
        full_text = f"{name} {cat} {addr}".lower()

        # A. Saringan Halal
        is_non_halal = any(re.search(p, full_text) for p in NON_HALAL_PATTERNS)
        if is_non_halal:
            rejected_non_halal += 1
            print(f"  🚫 Tolak (Non-Halal): {name}")
            continue

        # B. Bersihkan Nama Teras untuk Saringan Pendua
        clean = re.sub(r'^[@#\s\-\.]+', '', name.lower())
        core_name = re.split(r'[\-\–\(\|,]', clean)[0].strip()
        core_name = re.sub(r'\b(restaurant|restoran|cafe|kafe|stall|warung)\b', '', core_name).strip()
        core_name = re.sub(r'\s+', ' ', core_name)

        if name.lower() in existing_names or (len(core_name) > 2 and core_name in seen_core_names):
            rejected_duplicates += 1
            continue
        
        seen_core_names.add(core_name)
        existing_names.add(name.lower())

        # C. Masukkan ke Database Hidup
        slug = s['slug'] if 'slug' in s.keys() and s['slug'] else re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')
        carb = s['carb_type'] if 'carb_type' in s.keys() else 'Nasi'
        budget = s['budget_tier'] if 'budget_tier' in s.keys() else 'Marhaen (<RM10)'
        lat = s['latitude'] if 'latitude' in s.keys() else 0.0
        lon = s['longitude'] if 'longitude' in s.keys() else 0.0
        maps_url = s['maps_url'] if 'maps_url' in s.keys() else ''

        cur_live.execute("""
            INSERT OR IGNORE INTO restaurants 
            (name, slug, category, carb_type, budget_tier, address, latitude, longitude, maps_url, is_viral, is_halal_verified, is_active)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, 1)
        """, (name, slug, cat, carb, budget, addr, lat, lon, maps_url))
        
        if cur_live.rowcount > 0:
            inserted_count += 1

    conn_live.commit()
    conn_bak.close()

    # Dapatkan jumlah akhir
    cur_live.execute("SELECT COUNT(*) FROM restaurants WHERE is_active = 1")
    total_live = cur_live.fetchone()[0]

    print("=" * 65)
    print(f"✅ Selesai! Sebanyak {inserted_count} kedai bersih berjaya dimasukkan semula.")
    print(f"🚫 Ditolak: {rejected_non_halal} kedai berisiko non-halal.")
    print(f"♻️ Ditolak: {rejected_duplicates} kedai pendua.")
    print(f"📊 JUMLAH KEDAI HALAL & BERSIH DALAM APP SEKARANG: {total_live} KEDAI!")
    print("=" * 65)

if __name__ == "__main__":
    restore_and_clean()