"""Skill registry for AI assistant.

Setiap skill disimpan sebagai file markdown berisi *guidance* (persona, prinsip, aturan, format keluaran) yang dimuat ke system prompt model. File markdown adalah sumber kebenaran; kode di sini hanya loader agar mudah diaudit dan diperbarui.
"""
from pathlib import Path
from typing import Dict, List, Optional

SKILLS_DIR = Path(__file__).parent


def load_skill(slug: str) -> Optional[str]:
    """Baca guidance markdown untuk slug tertentu (mis. 'novelist-ai')."""
    path = SKILLS_DIR / f"{slug.replace('-', '_')}.md"
    if not path.is_file():
        return None
    return path.read_text(encoding="utf-8").strip()


def skill_version(guidance: str) -> str:
    """Ambil nomor versi sederhana dari guidance untuk audit/telemetri."""
    for line in guidance.splitlines():
        if line.lower().startswith("version:"):
            return line.split(":", 1)[1].strip()
    return "unknown"


NOVELIST_SKILL_SLUG = "novelist-ai"


def novelist_skill() -> str:
    """Load and return the NOVELIST AI guidance."""
    guidance = load_skill(NOVELIST_SKILL_SLUG)
    if not guidance:
        # Fail loud in logs but never break the request: fallback minimal.
        import logging
        logging.warning("NOVELIST AI skill file not found, using fallback guidance")
        return (
            "Anda adalah NOVELIST AI, editor sastra Indonesia. Jaga maksud dan suara penulis, "
            "koreksi ejaan sesuai EYD V, dan hindari prose generik. Anda membantu penulis "
            "tulis lebih baik tanpa mengubah karakter dan nada ceritanya."
        )
    return guidance


def registered_skills() -> Dict[str, str]:
    """Daftar skill yang tersedia beserta versinya (untuk endpoint/health)."""
    skills = {
        "novelist-ai": skill_version(load_skill("novelist-ai"))
    }
    # Add other discovered skills
    for path in SKILLS_DIR.glob("*.md"):
        stem = path.stem.replace("_", "-")
        if stem not in skills:
            skills[stem] = skill_version(path.read_text(encoding="utf-8"))
    return skills
