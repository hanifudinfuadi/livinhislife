from datetime import datetime, timezone
from pathlib import Path
from typing import Optional
import re
import shutil
import tempfile
import time
import uuid

from fastapi import APIRouter, Depends, File, Form, HTTPException, Request, UploadFile
from pydantic import BaseModel
from routes.auth import get_current_user, get_db
from storage import media_url, save_upload, save_upload_path

router = APIRouter(prefix="/portfolio", tags=["portfolio"])

CHUNK_TMP = Path(tempfile.gettempdir()) / "portfolio-uploads"
MAX_IMAGE_BYTES = 14 * 1024 * 1024
MAX_VIDEO_BYTES = 100 * 1024 * 1024
MAX_AUDIO_BYTES = 30 * 1024 * 1024

MAX_UPLOAD_BYTES = {
    "image": MAX_IMAGE_BYTES,
    "video": MAX_VIDEO_BYTES,
    "audio": MAX_AUDIO_BYTES,
}
# Peramban kadang mengirim MIME generik (octet-stream, video/quicktime, dll).
GENERIC_MIMES = {"", "application/octet-stream", "binary/octet-stream", "video/quicktime", "audio/x-m4a", "audio/mp4"}
ALLOWED_KINDS = {"documentation", "creative", "novel", "media"}


class ContentInput(BaseModel):
    title: str
    category: str
    description: Optional[str] = ""
    body: Optional[str] = ""
    images: list[str] = []
    metadata: dict = {}
    published: bool = False
    music_url: Optional[str] = ""
    music_title: Optional[str] = ""
    intro_video: Optional[str] = ""
    font: Optional[str] = ""


@router.get("/content")
async def list_content(request: Request, kind: Optional[str] = None, published_only: bool = True):
    if not published_only:
        await get_current_user(request, request.cookies.get("session_token"))
    query = {"published": True} if published_only else {}
    if kind:
        query["kind"] = kind
    return await request.app.state.db.portfolio_content.find(query, {"_id": 0}).sort("updated_at", -1).to_list(2000)


@router.get("/content/{content_id}")
async def get_content(request: Request, content_id: str):
    doc = await request.app.state.db.portfolio_content.find_one({"content_id": content_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    if not doc.get("published"):
        await get_current_user(request, request.cookies.get("session_token"))
    return doc


@router.post("/content")
async def create_content(request: Request, data: ContentInput, kind: str, user=Depends(get_current_user)):
    if kind not in ALLOWED_KINDS:
        raise HTTPException(status_code=400, detail="Jenis konten tidak dikenal")
    doc = {**data.dict(), "kind": kind, "content_id": str(uuid.uuid4()), "created_at": datetime.now(timezone.utc), "updated_at": datetime.now(timezone.utc)}
    await request.app.state.db.portfolio_content.insert_one(doc)
    return {key: value for key, value in doc.items() if key != "_id"}


@router.put("/content/{content_id}")
async def update_content(request: Request, content_id: str, data: ContentInput, user=Depends(get_current_user)):
    db = request.app.state.db.portfolio_content
    result = await db.update_one({"content_id": content_id}, {"$set": {**data.dict(), "updated_at": datetime.now(timezone.utc)}})
    if not result.matched_count:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return await db.find_one({"content_id": content_id}, {"_id": 0})


@router.delete("/content/{content_id}")
async def delete_content(request: Request, content_id: str, user=Depends(get_current_user)):
    result = await request.app.state.db.portfolio_content.delete_one({"content_id": content_id})
    if not result.deleted_count:
        raise HTTPException(status_code=404, detail="Konten tidak ditemukan")
    return {"deleted": True}


@router.post("/upload")
async def upload_media(
    request: Request,
    files: list[UploadFile] = File(...),
    user=Depends(get_current_user),
):
    db = get_db(request)
    results = []
    for file in files:
        if not file.content_type or not file.content_type.startswith("image/"):
            raise HTTPException(status_code=400, detail="Semua berkas harus berupa gambar")
        ext = Path(file.filename or "image.jpg").suffix.lower()
        if ext not in {".jpg", ".jpeg", ".png", ".webp", ".gif"}:
            raise HTTPException(status_code=400, detail="Format gambar tidak didukung")
        data = await file.read()
        if len(data) > MAX_IMAGE_BYTES:
            raise HTTPException(
                status_code=413,
                detail=f"Ukuran gambar melebihi batas {MAX_IMAGE_BYTES // (1024 * 1024)} MB",
            )
        filename = f"{uuid.uuid4().hex}{ext}"
        await save_upload(db, filename, data)
        results.append({"url": media_url(filename), "name": file.filename})
    return results


ALLOWED_EXT = {
    "image": {".jpg", ".jpeg", ".png", ".webp", ".gif"},
    "video": {".mp4", ".m4v", ".mov", ".webm", ".ogg", ".ogv"},
    "audio": {".mp3", ".ogg", ".oga", ".wav", ".m4a", ".aac"},
}
# Ekstensi yang disimpan; .mov/.m4v/.ogv tetap diputar sebagai MP4/Ogg di peramban.
STORE_EXT = {"video": {".mov": ".mp4", ".m4v": ".mp4", ".ogv": ".ogg"}, "audio": {".oga": ".ogg"}}

ALLOWED_MIME = {
    "image": ("image/",),
    "video": ("video/",),
    "audio": ("audio/",),
}


class FinishUpload(BaseModel):
    upload_id: str
    kind: str
    filename: str
    content_type: Optional[str] = ""


def _chunk_dir(upload_id: str) -> Path:
    safe = re.sub(r"[^A-Za-z0-9_-]", "", upload_id or "")[:80]
    if not safe:
        raise HTTPException(status_code=400, detail="ID unggah tidak valid")
    return CHUNK_TMP / safe


def _prune_chunks(max_age_seconds: int = 7200) -> None:
    now = time.time()
    try:
        entries = list(CHUNK_TMP.iterdir())
    except OSError:
        return
    for entry in entries:
        try:
            if entry.is_dir() and now - entry.stat().st_mtime > max_age_seconds:
                shutil.rmtree(entry, ignore_errors=True)
        except OSError:
            continue


@router.post("/upload-part")
async def upload_part(
    request: Request,
    upload_id: str = Form(...),
    index: int = Form(...),
    file: UploadFile = File(...),
    user=Depends(get_current_user),
):
    if index < 0 or index > 5000:
        raise HTTPException(status_code=400, detail="Indeks bagian tidak valid")
    data = await file.read()
    if not data:
        raise HTTPException(status_code=400, detail="Bagian unggahan kosong")
    _prune_chunks()
    target = _chunk_dir(upload_id) / f"{index:05d}.part"
    target.parent.mkdir(parents=True, exist_ok=True)
    target.write_bytes(data)
    return {"ok": True, "index": index, "size": len(data)}


@router.post("/upload-finish")
async def upload_finish(
    request: Request,
    payload: FinishUpload,
    user=Depends(get_current_user),
):
    kind = payload.kind
    ext = Path(payload.filename or "").suffix.lower()
    if kind not in ALLOWED_EXT:
        raise HTTPException(status_code=400, detail="Jenis unggahan tidak valid")
    if ext not in ALLOWED_EXT[kind]:
        raise HTTPException(status_code=400, detail=f"Format {kind} tidak didukung")
    mime = (payload.content_type or "").lower()
    if mime and mime not in GENERIC_MIMES and not any(mime.startswith(prefix) for prefix in ALLOWED_MIME[kind]):
        raise HTTPException(status_code=400, detail=f"Berkas harus berupa {kind}")
    ext = STORE_EXT.get(kind, {}).get(ext, ext)

    folder = _chunk_dir(payload.upload_id)
    parts = sorted(folder.glob("*.part")) if folder.is_dir() else []
    if not parts:
        raise HTTPException(status_code=400, detail="Sesi unggah tidak ditemukan atau kosong")

    limit = MAX_UPLOAD_BYTES[kind]
    total = sum(part.stat().st_size for part in parts)
    if total > limit:
        shutil.rmtree(folder, ignore_errors=True)
        raise HTTPException(
            status_code=413,
            detail=f"Ukuran berkas melebihi batas {limit // (1024 * 1024)} MB untuk {kind}",
        )

    assembled = folder / "assembled.bin"
    with open(assembled, "wb") as handle:
        for part in parts:
            with open(part, "rb") as chunk:
                shutil.copyfileobj(chunk, handle)

    filename = f"{uuid.uuid4().hex}{ext}"
    try:
        await save_upload_path(get_db(request), filename, assembled)
    finally:
        shutil.rmtree(folder, ignore_errors=True)
    return {"url": media_url(filename), "name": payload.filename, "size": total}


@router.get("/settings")
async def get_settings(request: Request):
    doc = await request.app.state.db.portfolio_settings.find_one({"key": "main"}, {"_id": 0})
    return doc or {"key": "main", "hero_title": "Cerita visual dan tertulis.", "hero_subtitle": "Fotografi, dokumentasi, dan karya tulis.", "about_text": "", "contact_email": ""}


@router.put("/settings")
async def save_settings(request: Request, data: dict, user=Depends(get_current_user)):
    data.pop("_id", None)
    data["key"] = "main"
    data["updated_at"] = datetime.now(timezone.utc)
    await request.app.state.db.portfolio_settings.update_one({"key": "main"}, {"$set": data}, upsert=True)
    return data


@router.post("/inquiries")
async def create_inquiry(request: Request, data: dict):
    doc = {"inquiry_id": str(uuid.uuid4()), "name": str(data.get("name", ""))[:160], "email": str(data.get("email", ""))[:254], "message": str(data.get("message", ""))[:10000], "created_at": datetime.now(timezone.utc), "read": False}
    if not doc["name"] or not doc["email"] or not doc["message"]:
        raise HTTPException(status_code=400, detail="Nama, email, dan pesan wajib diisi")
    await request.app.state.db.portfolio_inquiries.insert_one(doc)
    return {"received": True}


@router.get("/inquiries")
async def list_inquiries(request: Request, user=Depends(get_current_user)):
    return await request.app.state.db.portfolio_inquiries.find({}, {"_id": 0}).sort("created_at", -1).to_list(1000)
