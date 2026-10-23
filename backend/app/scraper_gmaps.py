import asyncio
import re
from playwright.async_api import async_playwright
from backend.app.database import get_connection

async def scrape_google_maps(search_query: str, total_limit: int = 10, min_rating: float = 4.0):
    """
    Mencari kedai di Google Maps dan HANYA mengambil kedai TOP RANKING (Rating >= min_rating).
    """
    print(f"\n🔍 Mencari kedai TOP RANKING untuk: '{search_query}' (Minima ⭐ {min_rating})...")
    
    scraped_data = []

    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        url = f"https://www.google.com/maps/search/{search_query.replace(' ', '+')}"
        await page.goto(url, timeout=60000)

        try:
            await page.wait_for_selector('div[role="feed"]', timeout=15000)
        except Exception:
            print("⚠️ Senarai feed tidak dijumpai.")
            await browser.close()
            return

        # Skrol senarai untuk dapatkan lebih banyak pilihan berkualiti
        for _ in range(4):
            await page.mouse.wheel(0, 4000)
            await asyncio.sleep(1.5)

        elements = await page.query_selector_all('div[role="feed"] > div > div[jsaction]')

        for el in elements:
            if len(scraped_data) >= total_limit:
                break

            try:
                # 1. Nama Kedai
                name_el = await el.query_selector('.qBF1Pd')
                if not name_el:
                    continue
                name = (await name_el.inner_text()).strip()

                # 2. Rating Bintang
                rating = 0.0
                rating_el = await el.query_selector('.MW4etd')
                if rating_el:
                    try:
                        rating = float((await rating_el.inner_text()).strip())
                    except ValueError:
                        rating = 0.0

                # 🛑 TAPISAN TOP RANKING: Kalau rating bawah min_rating, TOLAK serta-merta!
                if rating < min_rating:
                    continue

                # 3. Kategori & Jenis Makanan
                category = "Mamak / Melayu"
                sub_info = await el.query_selector_all('.W4Efsd')
                if len(sub_info) > 1:
                    info_text = (await sub_info[1].inner_text()).strip()
                    parts = [p.strip() for p in info_text.split("·") if not re.match(r'^\d+(\.\d+)?$', p.strip())]
                    if len(parts) > 0:
                        category = parts[0]

                text_check = (name + " " + category).lower()
                carb_type = "Nasi / Roti"
                if any(x in text_check for x in ["mee", "mi", "laksa", "ramen", "soup"]):
                    carb_type = "Mi"
                elif any(x in text_check for x in ["burger", "pizza", "western", "pasta"]):
                    carb_type = "Western"
                elif any(x in text_check for x in ["kopi", "cafe", "kafe", "coffee"]):
                    carb_type = "Roti / Kopi"

                budget_tier = "Marhaen (<RM10)"
                if any(x in text_check for x in ["cafe", "kafe", "western", "bistro", "grill"]):
                    budget_tier = "Mid (RM10-30)"

                slug = re.sub(r'[^a-zA-Z0-9]+', '-', name.lower()).strip('-')

                scraped_data.append({
                    "name": name,
                    "slug": slug,
                    "category": category,
                    "carb_type": carb_type,
                    "budget_tier": budget_tier,
                    "address": f"{search_query}, Selangor",
                    "rating": rating
                })
                print(f"  ⭐ LULUS TOP RANKING: {name} | Rating: {rating}★")

            except Exception:
                continue

        await browser.close()

    # Susun senarai dari rating tertinggi ke terendah (Descending)
    scraped_data.sort(key=lambda x: x["rating"], reverse=True)

    # --- SIMPAN KE DALAM SQLITE ---
    if scraped_data:
        print(f"\n📥 Menyuntik {len(scraped_data)} kedai TOP RANKING ke dalam SQLite...")
        with get_connection() as conn:
            cursor = conn.cursor()
            inserted_count = 0
            for r in scraped_data:
                cursor.execute("""
                    INSERT OR IGNORE INTO restaurants 
                    (name, slug, category, carb_type, budget_tier, address, latitude, longitude, maps_url, is_viral, is_halal_verified)
                    VALUES (?, ?, ?, ?, ?, ?, 0.0, 0.0, '', 1, 1)
                """, (
                    r["name"], r["slug"], r["category"], r["carb_type"],
                    r["budget_tier"], r["address"]
                ))
                if cursor.rowcount > 0:
                    inserted_count += 1
            conn.commit()
        print(f"🎉 Selesai! Sebanyak {inserted_count} kedai Top Ranking berjaya disimpan!\n")
    else:
        print("❌ Tiada kedai yang melepasi piawaian minima rating.")

if __name__ == "__main__":
    # Boleh ubah min_rating ikut suka hati baby (cth: 4.0 atau 4.2)
    asyncio.run(scrape_google_maps("Cafe Viral Bangi", total_limit=8, min_rating=4.0))