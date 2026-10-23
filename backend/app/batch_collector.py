import asyncio
import time
from backend.app.scraper_gmaps import scrape_google_maps

# 1. Matriks Zon Tumpuan (Selangor & KL)
HOTSPOT_ZONES = [
    "Seksyen 7 Shah Alam",
    "Seksyen 13 Shah Alam",
    "Subang Jaya SS15",
    "Damansara Utama Uptown",
    "Bandar Baru Bangi",
    "TTDI Kuala Lumpur",
    "Kampung Baru KL"
]

# 2. Matriks Selera
FOOD_SEARCHES = [
    "Mamak Sedap",
    "Cafe Viral",
    "Nasi Lemak Padu",
    "Mee Tarik Sup",
    "Tomyam Seafood",
    "Burger Bakar Western",
    "Kopitiam Roti Bakar"
]

async def run_batch_pipeline(limit_per_search: int = 5, min_rating: float = 4.0):
    print("=" * 60)
    print("🚀 MEMULAKAN ENJIN SEDUTAN PUKAL 'MAKAN APA?' (FASA SELANGOR & KL)")
    print(f"🎯 Sasaran: {len(HOTSPOT_ZONES)} Zon x {len(FOOD_SEARCHES)} Kategori")
    print(f"⭐ Syarat Kualiti: Rating Minima {min_rating}★ | Had: {limit_per_search} kedai/carian")
    print("=" * 60)

    total_scraped = 0
    start_time = time.time()

    for zone in HOTSPOT_ZONES:
        print(f"\n📍 >>> MEMASUKI ZON: {zone.upper()} <<<")
        for food in FOOD_SEARCHES:
            query = f"{food} {zone}"
            try:
                await scrape_google_maps(
                    search_query=query, 
                    total_limit=limit_per_search, 
                    min_rating=min_rating
                )
                total_scraped += limit_per_search
            except Exception as e:
                print(f"⚠️ Ralat semasa sedut '{query}': {e}")

            # Jeda masa pintar supaya Google tak sekat IP hotspot baby
            print("⏳ Rehat 3 saat sebelum carian seterusnya...\n")
            await asyncio.sleep(3)

    elapsed = round((time.time() - start_time) / 60, 1)
    print("=" * 60)
    print(f"🎉 SELESAI SEMUA! Anggaran {total_scraped} cubaan kedai telah diproses dalam masa {elapsed} minit!")
    print("=" * 60)

if __name__ == "__main__":
    # Jalankan sedutan: Setiap carian ambil 5 kedai Top 4.0★ ke atas
    # (7 Zon x 7 Kategori x 5 = ~245 Kedai Baharu Gred A!)
    asyncio.run(run_batch_pipeline(limit_per_search=5, min_rating=4.0))