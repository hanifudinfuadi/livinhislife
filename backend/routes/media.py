from fastapi import APIRouter, Request, HTTPException, Response
from fastapi.responses import StreamingResponse
from motor.motor_asyncio import AsyncIOMotorDatabase
from storage import open_upload, open_upload_range, upload_size
import re

router = APIRouter(prefix="/media", tags=["media"])


def get_db(request: Request) -> AsyncIOMotorDatabase:
    return request.app.state.get_db()


@router.get("/{filename:path}")
async def serve_media(request: Request, filename: str):
    """Serve media files from storage backend (Cloudinary, GridFS, or local)."""
    db = get_db(request)
    
    # Get file info
    size = await upload_size(db, filename)
    if size is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    # Handle Range requests for video/audio streaming
    range_header = request.headers.get("Range")
    if range_header:
        # Parse Range header: "bytes=start-end"
        match = re.match(r"bytes=(\d+)-(\d*)", range_header)
        if match:
            start = int(match.group(1))
            end = int(match.group(2)) if match.group(2) else size - 1
            length = end - start + 1
            
            iterator = await open_upload_range(db, filename, start, length)
            if iterator is None:
                raise HTTPException(status_code=404, detail="File not found")
            
            content_type = _get_content_type(filename)
            headers = {
                "Content-Range": f"bytes {start}-{end}/{size}",
                "Accept-Ranges": "bytes",
                "Content-Length": str(length),
                "Content-Type": content_type,
            }
            return StreamingResponse(iterator, status_code=206, headers=headers)
    
    # Full file response
    iterator, content_type = await open_upload(db, filename)
    if iterator is None:
        raise HTTPException(status_code=404, detail="File not found")
    
    headers = {
        "Content-Length": str(size),
        "Content-Type": content_type,
        "Accept-Ranges": "bytes",
        "Cache-Control": "public, max-age=31536000, immutable",
    }
    return StreamingResponse(iterator, headers=headers)


@router.get("/cloudinary/{filename:path}")
async def serve_cloudinary_media(request: Request, filename: str):
    """Redirect to Cloudinary URL for Cloudinary-stored files."""
    db = get_db(request)
    
    # Get Cloudinary URL from metadata
    doc = await db.media_metadata.find_one({"filename": filename}, {"_id": 0})
    if not doc or not doc.get("cloudinary_url"):
        raise HTTPException(status_code=404, detail="File not found")
    
    # Redirect to Cloudinary URL
    from fastapi.responses import RedirectResponse
    return RedirectResponse(url=doc["cloudinary_url"], status_code=302)


def _get_content_type(filename: str) -> str:
    import mimetypes
    return mimetypes.guess_type(filename)[0] or "application/octet-stream"