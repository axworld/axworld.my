import sqlite3
from pathlib import Path

# Laluan dinamik ke data/makan_mana.db
BASE_DIR = Path(__file__).resolve().parent.parent.parent
DB_PATH = BASE_DIR / "data" / "makan_mana.db"

def get_connection():
    """Membuka sambungan SQLite dengan sokongan dictionary (Row)"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    """Membina jadual restaurants dan jadual suggestions"""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    with get_connection() as conn:
        cursor = conn.cursor()
        
        # 1. Jadual Kedai Rasmi (Aktif dalam Roda)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS restaurants (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            slug TEXT UNIQUE NOT NULL,
            category TEXT NOT NULL,
            carb_type TEXT NOT NULL,
            budget_tier TEXT NOT NULL,
            address TEXT NOT NULL,
            latitude REAL NOT NULL,
            longitude REAL NOT NULL,
            maps_url TEXT NOT NULL,
            is_viral BOOLEAN DEFAULT FALSE,
            source_url TEXT,
            is_halal_verified BOOLEAN DEFAULT TRUE,
            is_active BOOLEAN DEFAULT TRUE,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        # 2. Jadual Cadangan Pengguna (Status: Pending)
        cursor.execute("""
        CREATE TABLE IF NOT EXISTS suggestions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            area TEXT NOT NULL,
            carb_type TEXT NOT NULL,
            budget_tier TEXT NOT NULL,
            source_link TEXT,
            status TEXT DEFAULT 'pending',
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        );
        """)

        conn.commit()
    print("✅ Jadual 'restaurants' dan 'suggestions' sedia berkhidmat!")

if __name__ == "__main__":
    init_db()