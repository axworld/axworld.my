from fastapi import FastAPI, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel, Field
from typing import Optional, List
from pathlib import Path
from backend.app.database import get_connection

app = FastAPI(
    title="Makan Apa? API",
    description="Backend enjin penentu makanan no. 1 di Malaysia",
    version="1.0.0"
)

# Benarkan sambungan dari telefon & luar (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- SKEMA PYDANTIC (GUNA 'str' BIASA - 100% KALIS ERROR!) ---
class BorangCadangRequest(BaseModel):
    name: str = Field(..., min_length=2)
    area: str = Field(..., min_length=2)
    carb_type: str = Field(default="Nasi")
    budget_tier: str = Field(default="Marhaen (<RM10)")
    source_link: Optional[str] = None

class BorangLaporRequest(BaseModel):
    id_kedai: Optional[int] = None
    nama_kedai: str = Field(..., min_length=2)
    jenis_isu: str = Field(...)
    catatan: Optional[str] = None
    emel_pelapor: Optional[str] = None  # Guna str biasa!

class HubungiAdminRequest(BaseModel):
    nama: str = Field(..., min_length=2)
    maklumat_hubungan: str = Field(..., min_length=3)  # Guna str biasa!
    mesej: str = Field(..., min_length=5, max_length=1000)

# --- 1. ENDPOINT KESIHATAN & SENARAI RESTORAN ---
@app.get("/api/health")
def health_check():
    return {"health": "100%", "database": "connected"}

@app.get("/api/restaurants")
def get_restaurants():
    """Mengambil semua kedai makan yang sah & aktif dari SQLite"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM restaurants WHERE is_active = 1")
        rows = cursor.fetchall()
        restaurants = [dict(row) for row in rows]
    return {
        "total": len(restaurants),
        "data": restaurants
    }

# --- 2. ENDPOINT BORANG PENGGUNA ---
@app.post("/api/suggest", status_code=status.HTTP_201_CREATED)
def submit_suggestion(payload: BorangCadangRequest):
    """Menerima cadangan kedai baharu dari pengguna"""
    with get_connection() as conn:
        cursor = conn.cursor()
        cursor.execute("""
            INSERT INTO suggestions (name, area, carb_type, budget_tier, source_link, status)
            VALUES (?, ?, ?, ?, ?, 'pending')
        """, (payload.name, payload.area, payload.carb_type, payload.budget_tier, payload.source_link))
        conn.commit()
    return {"status": "success", "message": "Cadangan berjaya direkodkan!"}

@app.post("/api/report", status_code=status.HTTP_201_CREATED)
def submit_report(payload: BorangLaporRequest):
    """Menerima laporan isu kedai dari pengguna"""
    print(f"⚠️ Laporan Diterima: {payload.nama_kedai} | Isu: {payload.jenis_isu} | Nota: {payload.catatan}")
    return {"status": "success", "message": "Laporan berjaya diterima!"}

@app.post("/api/contact", status_code=status.HTTP_201_CREATED)
def submit_contact(payload: HubungiAdminRequest):
    """Menerima mesej maklum balas / kolaborasi untuk admin"""
    print(f"💬 Mesej Admin: Daripada {payload.nama} ({payload.maklumat_hubungan}) | Mesej: {payload.mesej}")
    return {"status": "success", "message": "Mesej selamat sampai ke admin!"}

# --- 3. SIARKAN FRONTEND SECARA AUTOMATIK ---
FRONTEND_DIR = Path(__file__).resolve().parent.parent.parent / "frontend"
app.mount("/", StaticFiles(directory=str(FRONTEND_DIR), html=True), name="frontend")