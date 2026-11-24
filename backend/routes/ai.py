from fastapi import APIRouter, HTTPException, Request, Depends
from fastapi.responses import StreamingResponse
from pydantic import BaseModel, Field

try:
    from emergentintegrations.llm.chat import LlmChat, UserMessage, TextDelta, StreamDone
except ImportError:  # package is not published on PyPI; AI helper is optional
    LlmChat = UserMessage = TextDelta = StreamDone = None

import json
import os
import uuid
from typing import Optional, List, Dict

from routes.auth import get_current_user
from routes import llm
from skills import novelist_skill, registered_skills

router = APIRouter(prefix="/ai", tags=["ai"])

# Model yang dipakai ditentukan di routes/llm.py dari key yang tersedia
# (OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY / EMERGENT_LLM_KEY).
EMERGENT_LLM_KEY = os.environ.get('EMERGENT_LLM_KEY')

# Provider default hanya dipakai bila AI_MODEL_PROVIDER/AI_MODEL_NAME di-set.
LLM_PROVIDER = os.environ.get('AI_MODEL_PROVIDER', '').strip()
LLM_MODEL = os.environ.get('AI_MODEL_NAME', '').strip()


class DescriptionRequest(BaseModel):
    project_title: str
    project_type: str  # "photography" or "writing"
    brief: Optional[str] = ""
    tone: Optional[str] = "professional"  # professional, creative, casual


@router.post("/generate-description")
async def generate_project_description(request: DescriptionRequest):
    """
    Generate AI-powered project description for portfolio items (streamed as SSE).
    """
    _require_ai()

    # Create system message based on project type
    if request.project_type == "photography":
        system_msg = """You are an expert photography curator and writer. 
        Write compelling, artistic descriptions for photography projects that capture the essence, 
        emotion, and technical excellence of the work. Use vivid, evocative language.
        Keep descriptions between 2-3 sentences, maximum 100 words."""
    else:  # writing/novel
        system_msg = """You are a literary critic and book reviewer. 
        Write engaging descriptions for written works and novels that intrigue readers 
        and capture the narrative essence. Use literary, sophisticated language.
        Keep descriptions between 2-3 sentences, maximum 100 words."""

    # Create user prompt
    prompt = f"""Project Title: {request.project_title}
Type: {request.project_type}
{'Brief: ' + request.brief if request.brief else ''}

Write a {request.tone} description for this project."""

    messages = [
        {"role": "system", "content": system_msg},
        {"role": "user", "content": prompt},
    ]
    config = llm.resolve_model()

    # Stream the response
    async def event_generator():
        try:
            async for delta in llm.stream_complete(config, messages):
                yield f"data: {delta}\n\n"
            yield "data: [DONE]\n\n"
        except Exception as e:
            yield f"data: [ERROR: {str(e)}]\n\n"

    return StreamingResponse(
        event_generator(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive"
        }
    )


# ==============================================================================
# Asisten Karya Tulis (NOVELIST AI)
# ==============================================================================

SESSION_TITLE_FALLBACK = "Tanpa judul"
MAX_HISTORY_MESSAGES = 40


class WritingAssistRequest(BaseModel):
    text: str = ""
    mode: str = Field(default="improve", pattern="^(improve|recommend|chat|analyze|upgrade)$")
    instruction: Optional[str] = ""
    history: Optional[List[Dict]] = []
    session_id: Optional[str] = None


class WritingSessionCreate(BaseModel):
    title: Optional[str] = ""
    text: Optional[str] = ""


class WritingSessionUpdate(BaseModel):
    title: Optional[str] = None
    text: Optional[str] = None
    messages: Optional[List[Dict]] = None


BOT_MODE = "chat"

# Setiap "bot" punya peran sendiri, supaya prompt yang diinput pengguna
# benar-benar dieksekusi sesuai jenis bantuannya.
BOT_ROLES = {
    "improve": (
        "BOT: EDITOR BAHASA (koreksi). Tugas utama Anda mengoreksi naskah: ejaan EYD V, "
        "tanda baca, kalimat canggung, diksi lemah, dan konsistensi sudut pandang. "
        "Jangan mengubah plot, maksud, atau suara penulis — perbaiki bahasanya saja. "
        "Kembalikan SELURUH naskah hasil koreksi di `revised_text`, bukan cuplikan."
    ),
    "recommend": (
        "BOT: EDITOR IDE & PENGEMBANGAN. Tugas utama Anda memberi ide segar dan saran "
        "pengembangan: arah cerita, konflik, karakter, atmosfer, struktur adegan, "
        "dan alternatif kalimat. Setiap saran harus spesifik dan bisa langsung "
        "dieksekusi, bukan nasihat umum. Set `has_revision` false kecuali diminta "
        "menulis ulang."
    ),
    "analyze": (
        "BOT: EDITOR PENILAI (kritikus sastra). Lakukan penilaian jujur dan profesional: "
        "kekuatan, kelemahan, dan prioritas perbaikan yang diurutkan dari yang paling "
        "penting. Isi `assessment` dengan penilaian kualitatif singkat. Set "
        "`has_revision` false."
    ),
    "chat": (
        "BOT: REKAN EDITOR. Anda berdiskusi santai dengan penulis — jawab pertanyaan, "
        "jelaskan alasan sebuah kalimat lemah, dan tawarkan opsi revisi. Bila penulis "
        "secara eksplisit meminta versi perbaikan, barulah isi `revised_text`. "
        "Jika tidak, set `has_revision` false."
    ),
    "upgrade": (
        "BOT: PENINGKAT MUTU NASKAH (upgrade). Tugas utama Anda menaikkan kualitas "
        "naskah satu tingkat lebih tinggi: pertajam imaji, ritme kalimat, kedalaman "
        "emosi, dan kesan sastrawi — namun karakter cerita dan maksud penulis tetap "
        "utuh. Kembalikan SELURUH naskah hasil upgrade di `revised_text`."
    ),
}


def _build_system_prompt(mode: str) -> str:
    """Compose the NOVELIST AI skill guidance with the active bot role."""
    guidance = novelist_skill()
    role = BOT_ROLES.get(mode) or BOT_ROLES[BOT_MODE]

    return f"""{guidance}

## PERAN BOT AKTIF

{role}

## KONTRAK KELUARAN MESIN (WAJIB)

Selain penjelasan dalam bahasa Indonesia yang natural, setiap balasan HARUS diakhiri
dengan tepat satu blok JSON di dalam fenced code block ```json ... ``` dengan bentuk:

{{
  "reply": "penjelasan editorial singkat dan ramah, boleh multi-paragraf",
  "revised_text": "teks lengkap hasil revisi (string kosong bila tidak ada revisi)",
  "has_revision": true atau false,
  "editorial_notes": ["poin perubahan penting"],
  "alternatives": ["alternatif kalimat/paragraf bila bernilai"],
  "assessment": {{"clarity": "...", "emotion": "...", "literary": "...", "readability": "...", "language": "..."}},
  "suggested_title": "judul singkat bila relevan, selain itu string kosong"
}}

Aturan blok JSON:
- `revised_text` harus utuh dari awal sampai akhir naskah, bukan cuplikan.
- Bila penulis belum meminta revisi (mis. sekadar bertanya), set `has_revision` false
  dan `revised_text` kosong.
- Jangan mengarang skor numerik. Isi assessment dengan penilaian kualitatif ringkas.
- Jangan pernah menulis JSON di luar fenced code block terakhir."""


def _require_ai() -> None:
    if not llm.is_configured():
        raise HTTPException(
            status_code=503,
            detail=(
                "Layanan AI belum dikonfigurasi. Set GEMINI_API_KEY "
                "(atau OPENAI_API_KEY) di environment server lalu deploy ulang."
            ),
        )


def _sessions(request: Request):
    return request.app.state.get_db().writing_sessions


def _password_subject(user) -> str:
    """Stable owner key so sessions follow the admin account, not the email alone."""
    email = getattr(user, "email", "") or ""
    return email.strip().lower() or "admin"


def _now():
    from datetime import datetime, timezone

    return datetime.now(timezone.utc).isoformat()


MODE_INTENTS = {
    "improve": "Koreksi dan rapikan teks saya.",
    "recommend": "Berikan ide dan saran pengembangan untuk teks saya.",
    "analyze": "Nilai naskah saya dan sebutkan prioritas perbaikannya.",
    "upgrade": "Tingkatkan mutu tulisan saya agar lebih kuat dan sastrawi.",
    "chat": "Mari diskusikan teks saya.",
}


def _build_turn_prompt(payload: WritingAssistRequest) -> str:
    """Susun pesan pengguna: permintaan/arahan penulis + naskah yang sedang dibuka.

    Prompt yang diinput pengguna HARUS ikut dikirim — inilah inti dari asisten.
    """
    text = (payload.text or "").strip()
    instruction = (payload.instruction or "").strip()
    request = instruction or MODE_INTENTS.get(payload.mode, MODE_INTENTS["chat"])

    parts = [f"PERMINTAAN SAYA:\n{request}"]
    if text:
        parts.append(f"NASKAH YANG SEDANG SAYA KERJAKAN:\n\"\"\"\n{text}\n\"\"\"")
        parts.append(
            "Ikuti PERMINTAAN SAYA di atas terhadap naskah tersebut. Bila saya meminta "
            "revisi, kembalikan naskah lengkap di `revised_text`."
        )
    else:
        parts.append(
            "Naskah masih kosong. Bila saya meminta revisi atau upgrade, tulis draf utuh "
            "sesuai permintaan saya di `revised_text`; jika tidak, bantu saya merencanakan "
            "tulisan lewat `reply`."
        )
    return "\n\n".join(parts)


def _parse_assistant_output(raw: str) -> Dict:
    """Extract the trailing ```json block; fall back to plain-prose answer."""
    import re

    result: Dict = {
        "reply": (raw or "").strip(),
        "revised_text": "",
        "explicit_revision": False,
        "has_revision": False,
        "editorial_notes": [],
        "alternatives": [],
        "assessment": {},
        "suggested_title": "",
    }
    if not raw:
        return result

    blocks = re.findall(r"```json\s*(\{.*?\})\s*```", raw, flags=re.DOTALL | re.IGNORECASE)
    if not blocks:
        return result

    try:
        data = json.loads(blocks[-1])
    except json.JSONDecodeError:
        return result

    if isinstance(data, dict):
        result["reply"] = (data.get("reply") or "").strip() or result["reply"]
        result["revised_text"] = data.get("revised_text") or ""
        wants_revision = bool(data.get("has_revision"))
        result["explicit_revision"] = wants_revision
        result["has_revision"] = wants_revision and bool(str(result["revised_text"]).strip())
        for key in ("editorial_notes", "alternatives"):
            value = data.get(key)
            if isinstance(value, list):
                result[key] = [str(item).strip() for item in value if str(item).strip()]
        if isinstance(data.get("assessment"), dict):
            result["assessment"] = {
                str(k): str(v) for k, v in data["assessment"].items() if v
            }
        result["suggested_title"] = (data.get("suggested_title") or "").strip()
    return result


async def _prepare(request: Request, session_id: Optional[str]) -> tuple[str, Dict]:
    """Resolve (or create) the writing session owned by the current admin."""
    user = await get_current_user(request, request.cookies.get("session_token"))
    owner = _password_subject(user)
    sid = (session_id or "").strip() or uuid.uuid4().hex
    doc = await _sessions(request).find_one({"session_id": sid, "owner": owner}, {"_id": 0})
    if not doc:
        doc = {
            "session_id": sid,
            "owner": owner,
            "title": SESSION_TITLE_FALLBACK,
            "text": "",
            "messages": [],
            "created_at": _now(),
            "updated_at": _now(),
        }
        await _sessions(request).insert_one(dict(doc))
    return sid, doc


def _public_session(doc: Dict) -> Dict:
    return {
        "session_id": doc.get("session_id"),
        "title": doc.get("title") or SESSION_TITLE_FALLBACK,
        "text": doc.get("text") or "",
        "messages": doc.get("messages") or [],
        "updated_at": doc.get("updated_at"),
        "created_at": doc.get("created_at"),
    }


@router.get("/writing/skills")
async def writing_skills(user=Depends(get_current_user)):
    """Expose which skills and model back the writing assistant (audit friendly)."""
    return {
        "skills": registered_skills(),
        "active": "novelist-ai",
        "bots": list(BOT_ROLES.keys()),
        "model": llm.provider_label(),
        "configured": llm.is_configured(),
    }


@router.get("/writing/sessions")
async def list_writing_sessions(request: Request, user=Depends(get_current_user)):
    owner = _password_subject(user)
    docs = await _sessions(request).find(
        {"owner": owner}, {"_id": 0, "messages": 0}
    ).sort("updated_at", -1).to_list(50)
    return [
        {
            "session_id": d.get("session_id"),
            "title": d.get("title") or SESSION_TITLE_FALLBACK,
            "updated_at": d.get("updated_at"),
            "preview": (d.get("text") or "")[:160],
        }
        for d in docs
    ]


@router.get("/writing/sessions/{session_id}")
async def get_writing_session(request: Request, session_id: str, user=Depends(get_current_user)):
    owner = _password_subject(user)
    doc = await _sessions(request).find_one(
        {"session_id": session_id, "owner": owner}, {"_id": 0}
    )
    if not doc:
        raise HTTPException(status_code=404, detail="Sesi tidak ditemukan")
    return _public_session(doc)


@router.put("/writing/sessions/{session_id}")
async def save_writing_session(
    request: Request, session_id: str, data: WritingSessionUpdate,
    user=Depends(get_current_user),
):
    owner = _password_subject(user)
    update: Dict = {"updated_at": _now()}
    if data.title is not None:
        update["title"] = data.title.strip()[:160] or SESSION_TITLE_FALLBACK
    if data.text is not None:
        update["text"] = data.text
    if data.messages is not None:
        update["messages"] = data.messages[-MAX_HISTORY_MESSAGES:]
    result = await _sessions(request).find_one_and_update(
        {"session_id": session_id, "owner": owner},
        {"$set": update},
        projection={"_id": 0},
        return_document=True,
        upsert=True,
    )
    return _public_session(result)


@router.delete("/writing/sessions/{session_id}")
async def delete_writing_session(request: Request, session_id: str, user=Depends(get_current_user)):
    owner = _password_subject(user)
    await _sessions(request).delete_one({"session_id": session_id, "owner": owner})
    return {"deleted": True}


@router.post("/assist-writing")
async def assist_writing(
    request: Request, payload: WritingAssistRequest, user=Depends(get_current_user)
):
    """NOVELIST AI writing assistant: koreksi, ide, penilaian, upgrade + chat 2 arah.

    Returns JSON so the UI can offer "Terapkan revisi" as a real one-click action.
    """
    _require_ai()

    session_id, doc = await _prepare(request, payload.session_id)

    history = (payload.history or doc.get("messages") or [])[-MAX_HISTORY_MESSAGES:]
    messages: List[Dict] = [{"role": "system", "content": _build_system_prompt(payload.mode)}]
    messages += [
        {"role": m["role"], "content": m.get("content", "")}
        for m in history
        if m.get("role") in {"user", "assistant"}
    ]
    # Permintaan + naskah yang diinput pengguna selalu menjadi pesan terakhir.
    prompt = _build_turn_prompt(payload)
    messages.append({"role": "user", "content": prompt})

    try:
        raw = await llm.complete(None, messages)
    except llm.LLMError as exc:  # network / auth / model error
        raise HTTPException(status_code=502, detail=f"Model gagal merespons: {exc}") from exc

    parsed = _parse_assistant_output(raw)

    user_text = (payload.instruction or "").strip() or MODE_INTENTS.get(
        payload.mode, MODE_INTENTS["chat"]
    )

    now = _now()
    user_msg = {"role": "user", "content": user_text, "mode": payload.mode, "at": now}
    assistant_msg = {
        "role": "assistant",
        "content": parsed["reply"],
        "revision": parsed["revised_text"] if parsed["has_revision"] else "",
        "notes": parsed["editorial_notes"],
        "alternatives": parsed["alternatives"],
        "assessment": parsed["assessment"],
        "at": _now(),
    }

    new_messages = (history + [user_msg, assistant_msg])[-MAX_HISTORY_MESSAGES:]
    title = doc.get("title") or SESSION_TITLE_FALLBACK
    if title == SESSION_TITLE_FALLBACK:
        first_line = next(
            (ln.strip() for ln in (payload.text or "").splitlines() if ln.strip()), ""
        )
        title = (parsed["suggested_title"] or first_line)[:120] or SESSION_TITLE_FALLBACK

    # Sesi boleh belum ada (dibuat lewat /writing/sessions) — jangan buat duplikat.
    await _sessions(request).update_one(
        {"session_id": session_id, "owner": _password_subject(user)},
        {
            "$set": {
                "title": title,
                "text": payload.text if payload.text else doc.get("text", ""),
                "messages": new_messages,
                "updated_at": now,
            },
            "$setOnInsert": {"created_at": now},
        },
        upsert=True,
    )

    return {
        "session_id": session_id,
        "title": title,
        "reply": parsed["reply"],
        "revised_text": parsed["revised_text"] if parsed["has_revision"] else "",
        "has_revision": parsed["has_revision"],
        "editorial_notes": parsed["editorial_notes"],
        "alternatives": parsed["alternatives"],
        "assessment": parsed["assessment"],
        "suggested_title": parsed["suggested_title"],
        "message": assistant_msg,
        "model": llm.provider_label(),
    }
