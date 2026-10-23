import sqlite3
import re
from backend.app.database import get_connection

def clean_duplicates():
    print("=" * 60)
    print("🧹 MEMULAKAN SAPUAN PINTAR PENDUA KEDAI (V2)...")
    print("=" * 60)

    conn = get_connection()
    cur = conn.cursor()

    cur.execute("SELECT id, name, address FROM restaurants ORDER BY id ASC")
    all_shops = cur.fetchall()

    seen_core_names = {}
    deleted_ids = []

    for s in all_shops:
        # 1. Bersihkan simbol pelik di awal nama (cth: @, #)
        clean = re.sub(r'^[@#\s\-\.]+', '', s['name'].lower())
        
        # 2. Ambil nama teras sebelum simbol tolak, koma, atau kurungan
        core_name = re.split(r'[\-\–\(\|,]', clean)[0].strip()
        
        # 3. Buang perkataan umum macam 'restaurant', 'restoran', 'cafe', 'kafe'
        core_name = re.sub(r'\b(restaurant|restoran|cafe|kafe|stall|warung)\b', '', core_name).strip()
        core_name = re.sub(r'\s+', ' ', core_name)

        # Jika nama teras ini dah wujud dalam kawasan serupa, tandakan untuk dipadam!
        if len(core_name) > 2 and core_name in seen_core_names:
            deleted_ids.append(s['id'])
            print(f"  🗑️ Padam Pendua: \"{s['name']}\" (Sama dengan \"{seen_core_names[core_name]}\")")
        else:
            seen_core_names[core_name] = s['name']

    if deleted_ids:
        cur.executemany("DELETE FROM restaurants WHERE id = ?", [(i,) for i in deleted_ids])
        conn.commit()

    cur.execute("SELECT COUNT(*) FROM restaurants")
    total_left = cur.fetchone()[0]
    
    print("=" * 60)
    print(f"🎉 Selesai! Sebanyak {len(deleted_ids)} kedai pendua berjaya disingkirkan.")
    print(f"📊 Baki kedai berkualiti tanpa duplicate dalam SQLite: {total_left} buah kedai!")
    print("=" * 60)

if __name__ == "__main__":
    clean_duplicates()