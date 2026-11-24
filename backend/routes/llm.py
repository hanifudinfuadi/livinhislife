"""Klien LLM langsung ke provider (tanpa proxy Emergent).

Kenapa file ini ada: `emergentintegrations.LlmChat` hanya berfungsi bila
diberi key `sk-emergent-...` — key selain itu dikirim apa adanya ke provider
dan model harus ditulis lengkap dengan prefix provider. Alih-alih bergantung
pada satu jenis key, modul ini memilih key apa pun yang tersedia di
environment:

    OPENAI_API_KEY                 -> openai/gpt-4o-mini
    ANTHROPIC_API_KEY              -> anthropic/claude-3-5-sonnet-latest
    GEMINI_API_KEY / GOOGLE_API_KEY  -> gemini/gemini-1.5-pro
    EMERGENT_LLM_KEY               -> tetap didukung lewat LlmChat (proxy)

Variabel opsional:
    AI_MODEL_PROVIDER + AI_MODEL_NAME  -> paksa provider/model tertentu
    AI_FALLBACK_PROVIDERS              -> urutan fallback antar-provider
                                          (mis. "openai,anthropic,gemini")
    OPENAI_MODEL / ANTHROPIC_MODEL / GEMINI_MODEL -> nama model per provider

Jika KETIGA key dipasang sekaligus, sistem memakai fallback berantai:
openai -> anthropic -> gemini. Kalau satu gagal (quota, error jaringan,
model off), otomatis pindah ke provider berikutnya tanpa perlu
intervensi admin.
"""

import asyncio
import json
import os
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Dict, List, Optional

try:
    import litellm
except ImportError:  # litellm tidak terpasang
    litellm = None


def _max_output_tokens() -> int:
    try:
        return int(os.getenv("AI_MAX_TOKENS", "8192"))
    except (TypeError, ValueError):
        return 8192


class LLMNotConfigured(Exception):
    """Tidak ada key/model yang bisa dipakai."""


class LLMError(Exception):
    """Provider menolak atau gagal merespons."""


@dataclass
class ModelConfig:
    provider: str
    model: str
    api_key: str
    api_base: Optional[str] = None

    @property
    def label(self) -> str:
        return f"{self.provider}/{self.model}"


# Urutan prioritas pencarian key. Yang pertama ditemukan dipakai.
_KEY_SOURCES = (
    ("openai", "OPENAI_API_KEY", "gpt-4o-mini"),
    ("anthropic", "ANTHROPIC_API_KEY", "claude-3-5-sonnet-latest"),
    ("gemini", "GEMINI_API_KEY", "gemini-1.5-pro"),
    ("gemini", "GOOGLE_API_KEY", "gemini-1.5-pro"),
    # Provider OpenAI-compatible lain (Groq, Together, DeepSeek, OpenRouter…)
    ("openai", "LLM_API_KEY", "gpt-4o-mini"),
)

# Nama env untuk model khusus per-provider (opsional, menimpa default).
_MODEL_ENV = {
    "openai": "OPENAI_MODEL",
    "anthropic": "ANTHROPIC_MODEL",
    "gemini": "GEMINI_MODEL",
}


def _fallback_chain() -> List[tuple]:
    """Baca AI_FALLBACK_PROVIDERS (mis. 'openai,anthropic,gemini').

    Kalau tidak di-set, pakai urutan default: openai -> anthropic -> gemini.
    """
    raw = _env("AI_FALLBACK_PROVIDERS")
    if not raw:
        return [("openai", "OPENAI_API_KEY", "gpt-4o-mini"),
                ("anthropic", "ANTHROPIC_API_KEY", "claude-3-5-sonnet-latest"),
                ("gemini", "GEMINI_API_KEY", "gemini-1.5-pro")]
    chain = []
    for name in [p.strip().lower() for p in raw.split(",") if p.strip()]:
        for provider, env_name, default_model in _KEY_SOURCES:
            if provider == name and env_name not in [c[1] for c in chain]:
                chain.append((provider, env_name, default_model))
    return chain or [("openai", "OPENAI_API_KEY", "gpt-4o-mini")]


def resolve_all_models() -> List[ModelConfig]:
    """Kembalikan SEMUA kombinasi provider+key yang tersedia di environment.

    Dipakai untuk fallback berantai: kalau provider pertama gagal,
    coba berikutnya secara otomatis.
    """
    configs: List[ModelConfig] = []
    forced_provider = _env("AI_MODEL_PROVIDER")
    forced_model = _env("AI_MODEL_NAME")
    base_url = _env("LLM_API_BASE") or None

    seen = set()
    # Provider yang dipaksa AI_MODEL_PROVIDER selalu paling depan.
    if forced_provider:
        key_map = {
            "openai": _env("OPENAI_API_KEY") or _env("LLM_API_KEY"),
            "anthropic": _env("ANTHROPIC_API_KEY"),
            "gemini": _env("GEMINI_API_KEY") or _env("GOOGLE_API_KEY"),
        }
        key = key_map.get(forced_provider, "")
        if key and not key.startswith("sk-emergent-"):
            model = (forced_model
                     or _env(_MODEL_ENV.get(forced_provider, ""))
                     or _DEFAULT_MODELS.get(forced_provider, "gpt-4o-mini"))
            configs.append(ModelConfig(forced_provider, model, key, base_url))
            seen.add(forced_provider)

    # Sisanya ikuti urutan fallback chain, hanya yang belum masuk daftar.
    for provider, env_name, default_model in _fallback_chain():
        if provider in seen:
            continue
        key = _env(env_name)
        if key and not key.startswith("sk-emergent-"):
            model = _env(_MODEL_ENV.get(provider, "")) or default_model
            configs.append(ModelConfig(provider, model, key, base_url))
            seen.add(provider)

    # Pastikan provider dengan key yang ada tapi tidak ada di fallback chain
    # tetap ikut sebagai kandidat terakhir.
    for provider, env_name, default_model in _KEY_SOURCES:
        if provider in seen:
            continue
        key = _env(env_name)
        if key and not key.startswith("sk-emergent-"):
            model = _env(_MODEL_ENV.get(provider, "")) or default_model
            configs.append(ModelConfig(provider, model, key, base_url))
            seen.add(provider)
    return configs


_DEFAULT_MODELS = {
    "openai": "gpt-4o-mini",
    "anthropic": "claude-3-5-sonnet-latest",
    "gemini": "gemini-1.5-pro",
}


def _env(name: str) -> str:
    return (os.environ.get(name) or "").strip()


def resolve_model() -> ModelConfig:
    """Tentukan provider/model/key yang akan dipakai, atau lempar LLMNotConfigured."""
    forced_provider = _env("AI_MODEL_PROVIDER")
    forced_model = _env("AI_MODEL_NAME")
    base_url = _env("LLM_API_BASE") or None

    if forced_provider and forced_model:
        key = {
            "openai": _env("OPENAI_API_KEY") or _env("LLM_API_KEY"),
            "anthropic": _env("ANTHROPIC_API_KEY"),
            "gemini": _env("GEMINI_API_KEY") or _env("GOOGLE_API_KEY"),
        }.get(forced_provider) or ""
        if key:
            return ModelConfig(forced_provider, forced_model, key, base_url)

    for provider, env_name, default_model in _KEY_SOURCES:
        key = _env(env_name)
        if key and not key.startswith("sk-emergent-"):
            return ModelConfig(
                forced_provider or provider,
                forced_model or default_model,
                key,
                base_url,
            )

    emergent = _env("EMERGENT_LLM_KEY")
    if emergent:
        return ModelConfig(
            forced_provider or "openai",
            forced_model or "gpt-4o-mini",
            emergent,
            None,
        )

    raise LLMNotConfigured(
        "Layanan AI belum dikonfigurasi. Set OPENAI_API_KEY (atau "
        "ANTHROPIC_API_KEY / GEMINI_API_KEY) di environment server, lalu restart backend."
    )


def is_configured() -> bool:
    try:
        models = resolve_all_models()
    except LLMNotConfigured:
        return False
    if not models:
        return False
    # litellm mendukung semua provider; tanpa litellm, Gemini tetap bisa via REST.
    if litellm is not None:
        return True
    return any(model.provider == "gemini" for model in models)


def provider_label() -> str:
    try:
        models = resolve_all_models()
        return " -> ".join(m.label for m in models) if models else "unconfigured"
    except LLMNotConfigured:
        return "unconfigured"


def _completion_kwargs(config: ModelConfig, messages: List[Dict], stream: bool) -> Dict:
    kwargs: Dict = {
        "model": f"{config.provider}/{config.model}",
        "messages": messages,
        "api_key": config.api_key,
        "stream": stream,
        "max_tokens": _max_output_tokens(),
    }
    if config.api_base:
        kwargs["api_base"] = config.api_base
    # Key berformat Emergent harus lewat proxy Emergent.
    if config.api_key.startswith("sk-emergent-"):
        from emergentintegrations.llm.utils import get_integration_proxy_url

        kwargs["api_base"] = get_integration_proxy_url() + "/llm"
        kwargs["custom_llm_provider"] = "openai"
        kwargs["model"] = config.model
    return kwargs


def _to_gemini_payload(messages: List[Dict]) -> Dict:
    """Konversi pesan gaya OpenAI (system/user/assistant) ke format Gemini REST."""
    system_texts: List[str] = []
    contents: List[Dict] = []
    for message in messages:
        role = (message.get("role") or "user").lower()
        text = message.get("content") or ""
        if not text:
            continue
        if role == "system":
            system_texts.append(text)
        elif role in ("assistant", "model"):
            contents.append({"role": "model", "parts": [{"text": text}]})
        else:
            contents.append({"role": "user", "parts": [{"text": text}]})
    payload: Dict = {
        "contents": contents,
        "generationConfig": {
            "maxOutputTokens": _max_output_tokens(),
            "temperature": 0.7,
        },
    }
    if system_texts:
        payload["systemInstruction"] = {"parts": [{"text": "\n\n".join(system_texts)}]}
    return payload


def _gemini_rest_generate(config: "ModelConfig", messages: List[Dict], timeout: float) -> str:
    """Panggil Gemini langsung via REST (tanpa litellm).

    Dipakai di serverless (Vercel) di mana litellm tidak dipasang. Hanya butuh
    standard library, jadi bundle fungsi tetap kecil dan cold start cepat.
    """
    url = (
        "https://generativelanguage.googleapis.com/v1beta/models/"
        f"{config.model}:generateContent"
    )
    data = json.dumps(_to_gemini_payload(messages)).encode("utf-8")
    request = urllib.request.Request(
        url,
        data=data,
        headers={"Content-Type": "application/json", "x-goog-api-key": config.api_key},
        method="POST",
    )
    try:
        with urllib.request.urlopen(request, timeout=timeout) as response:
            payload = json.load(response)
    except urllib.error.HTTPError as exc:
        detail = exc.read().decode("utf-8", "ignore")[:300]
        raise LLMError(f"Gemini HTTP {exc.code}: {detail}") from exc
    except urllib.error.URLError as exc:
        raise LLMError(f"Gemini tidak dapat dihubungi: {exc.reason}") from exc

    candidates = payload.get("candidates") or []
    if not candidates:
        feedback = (payload.get("promptFeedback") or {}).get("blockReason")
        raise LLMError(f"Gemini tidak mengembalikan kandidat (blockReason={feedback}).")
    parts = (candidates[0].get("content") or {}).get("parts") or []
    return "".join(p.get("text", "") for p in parts if isinstance(p, dict))


async def complete(config: Optional[ModelConfig] = None, messages: List[Dict] = None, timeout: float = 120.0) -> str:
    """Kirim percakapan ke model dengan FALLBACK antar-provider.

    Bila `config` tidak diberikan, sistem akan mencoba semua provider yang
    tersedia sesuai urutan `AI_FALLBACK_PROVIDERS` (default:
    openai -> anthropic -> gemini). Provider pertama yang berhasil
    dipakai; kalau gagal, lanjut ke provider berikutnya.
    """
    if messages is None:
        messages = []
    candidates: List[ModelConfig] = [config] if config is not None else resolve_all_models()
    if not candidates:
        raise LLMNotConfigured(
            "Tidak ada API key AI yang terkonfigurasi. Set minimal satu dari "
            "OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY di .env lalu restart backend."
        )

    last_error: Optional[Exception] = None
    for candidate in candidates:
        try:
            if litellm is not None:
                response = await litellm.acompletion(
                    **_completion_kwargs(candidate, messages, stream=False), timeout=timeout
                )
                content = response.choices[0].message.content
            elif candidate.provider == "gemini":
                content = await asyncio.to_thread(
                    _gemini_rest_generate, candidate, messages, timeout
                )
            else:
                last_error = LLMError(
                    f"Provider {candidate.provider} butuh litellm yang tidak terpasang."
                )
                continue
            if content:
                return content
            raise LLMError("Model mengembalikan respons kosong.")
        except LLMNotConfigured:
            raise
        except Exception as exc:  # network / auth / quota / model error
            last_error = exc
            print(f"[llm] {candidate.label} gagal: {exc} — coba provider berikutnya...")
            continue

    raise LLMError(f"Semua provider gagal. Error terakhir: {last_error}")


async def stream_complete(config: ModelConfig, messages: List[Dict]):
    """Async generator berisi potongan teks dari model."""
    if litellm is None:
        # Serverless (Vercel) tanpa litellm: kirim hasil lengkap sekaligus.
        text = await complete(config, messages)
        if text:
            yield text
        return

    try:
        response = await litellm.acompletion(**_completion_kwargs(config, messages, stream=True))
        async for chunk in response:
            try:
                delta = chunk.choices[0].delta.content
            except (AttributeError, IndexError):
                delta = None
            if delta:
                yield delta
    except Exception as exc:
        raise LLMError(str(exc)) from exc
