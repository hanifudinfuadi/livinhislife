import mimetypes
import os
import shutil
from datetime import datetime, timezone
from pathlib import Path

from motor.motor_asyncio import AsyncIOMotorGridFSBucket

UPLOAD_DIR = Path(__file__).parent / "uploads"
BUCKET_NAME = "media"
GRIDFS_CHUNK = 256 * 1024


def use_db_storage() -> bool:
    """True when running on Vercel, where the filesystem is read-only except /tmp."""
    return os.getenv("USE_DB_STORAGE", "0").strip().lower() in {"1", "true", "yes"}


def media_url(filename: str) -> str:
    """Public URL for a stored upload."""
    if use_db_storage():
        return f"/api/media/{filename}"
    return f"/uploads/{filename}"


def _bucket(db):
    return AsyncIOMotorGridFSBucket(db, bucket_name=BUCKET_NAME)


async def _delete_gridfs(db, filename: str) -> None:
    bucket = _bucket(db)
    cursor = bucket.find({"filename": filename})
    async for doc in cursor:
        await bucket.delete(doc._id)


def _content_type(filename: str) -> str:
    return mimetypes.guess_type(filename)[0] or "application/octet-stream"


async def save_upload(db, filename: str, data: bytes) -> None:
    """Simpan satu berkas utuh (dipakai untuk gambar kecil)."""
    if use_db_storage():
        await _delete_gridfs(db, filename)
        await _bucket(db).upload_from_stream(
            filename, data, metadata={"content_type": _content_type(filename)}
        )
        return

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    (UPLOAD_DIR / filename).write_bytes(data)


async def save_upload_path(db, filename: str, path: Path) -> None:
    """Simpan berkas dari disk secara mengalir (dipakai untuk video/audio besar)."""
    if use_db_storage():
        await _delete_gridfs(db, filename)
        with open(path, "rb") as handle:
            await _bucket(db).upload_from_stream(
                filename, handle, metadata={"content_type": _content_type(filename)}
            )
        return

    UPLOAD_DIR.mkdir(parents=True, exist_ok=True)
    shutil.copyfile(path, UPLOAD_DIR / filename)


async def upload_size(db, filename: str):
    """Ukuran berkas yang tersimpan (dipakai untuk mendukung Range/seek pemutar media)."""
    if use_db_storage():
        bucket = _bucket(db)
        try:
            grid_out = await bucket.open_download_stream_by_name(filename)
        except Exception:
            grid_out = None
        if grid_out is not None:
            return grid_out.length
        doc = await db.media.find_one({"filename": filename}, {"data": 0})
        if doc and doc.get("size"):
            return int(doc["size"])
        return None
    path = UPLOAD_DIR / filename
    return path.stat().st_size if path.is_file() else None


async def open_upload_range(db, filename: str, start: int, length: int):
    """Kembalikan iterator async untuk potongan berkas [start, start+length)."""
    if use_db_storage():
        bucket = _bucket(db)
        try:
            grid_out = await bucket.open_download_stream_by_name(filename)
        except Exception:
            grid_out = None
        if grid_out is not None:
            grid_out.seek(start)
            remaining = length

            async def grid_range_iter():
                nonlocal remaining
                while remaining > 0:
                    chunk = await grid_out.read(min(GRIDFS_CHUNK, remaining))
                    if not chunk:
                        break
                    remaining -= len(chunk)
                    yield chunk

            return grid_range_iter()
        doc = await db.media.find_one({"filename": filename})
        if not doc or not doc.get("data"):
            return None
        data = doc["data"][start:start + length]

        async def legacy_range_iter():
            yield data

        return legacy_range_iter()

    path = UPLOAD_DIR / filename
    if not path.is_file():
        return None

    async def disk_range_iter():
        with open(path, "rb") as handle:
            handle.seek(start)
            remaining = length
            while remaining > 0:
                chunk = handle.read(min(GRIDFS_CHUNK, remaining))
                if not chunk:
                    break
                remaining -= len(chunk)
                yield chunk

    return disk_range_iter()


async def open_upload(db, filename: str):
    """Kembalikan (iterator async byte, content_type) atau (None, None)."""
    if use_db_storage():
        bucket = _bucket(db)
        grid_out = None
        try:
            grid_out = await bucket.open_download_stream_by_name(filename)
        except Exception:
            grid_out = None

        if grid_out is not None:
            metadata = getattr(grid_out, "metadata", None) or {}
            content_type = metadata.get("content_type") or _content_type(filename)

            async def grid_iter():
                while True:
                    chunk = await grid_out.read(GRIDFS_CHUNK)
                    if not chunk:
                        break
                    yield chunk

            return grid_iter(), content_type

        doc = await db.media.find_one({"filename": filename})
        if not doc or not doc.get("data"):
            return None, None
        data = doc["data"]
        content_type = doc.get("content_type") or "application/octet-stream"

        async def legacy_iter():
            yield data

        return legacy_iter(), content_type

    path = UPLOAD_DIR / filename
    if not path.is_file():
        return None, None
    content_type = _content_type(path.name)

    async def disk_iter():
        with open(path, "rb") as handle:
            while True:
                chunk = handle.read(GRIDFS_CHUNK)
                if not chunk:
                    break
                yield chunk

    return disk_iter(), content_type