import yt_dlp

TIKTOK_USER_URL = "https://www.tiktok.com/@en4kunyah"

def get_full_tiktok_captions(limit=8):
    print("=" * 60)
    print(f"🎬 MENCUNGKIL ALAMAT & CAPTION PENUH @en4kunyah (Had: {limit} video)")
    print("=" * 60)

    # 1. Dapatkan senarai pautan video
    ydl_opts_flat = {
        'extract_flat': True,
        'playlistend': limit,
        'quiet': True,
    }

    video_urls = []
    with yt_dlp.YoutubeDL(ydl_opts_flat) as ydl:
        info = ydl.extract_info(TIKTOK_USER_URL, download=False)
        entries = info.get('entries', [])
        for item in entries:
            if item and item.get('url'):
                video_urls.append(item.get('url'))

    print(f"📦 Menemui {len(video_urls)} video. Membaca perincian penuh...\n")

    # 2. Baca perincian dan caption penuh setiap video
    ydl_opts_detail = {
        'quiet': True,
        'no_warnings': True,
        'ignoreerrors': True,
    }

    with yt_dlp.YoutubeDL(ydl_opts_detail) as ydl:
        for idx, url in enumerate(video_urls, 1):
            try:
                v_info = ydl.extract_info(url, download=False)
                desc = v_info.get('description', '') or v_info.get('title', '')
                print(f"[{idx}] 📌 CAPTION PENUH:\n{desc.strip()}")
                print(f"🔗 URL: {url}\n" + "-" * 50)
            except Exception as e:
                print(f"[{idx}] ⚠️ Ralat baca video: {e}")

if __name__ == "__main__":
    get_full_tiktok_captions(limit=8)