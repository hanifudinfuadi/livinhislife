# AI Configuration Setup for NOVELIST AI (Asisten Karya Tulis)

## PENTING! Environment Variables Required

Sebelum menggunakan Asisten Karya Tulis, ANDA HARUSDAKKONFIGURASI provider AI berikut:

### Pilihan Provider (PILIH SALAH SATU!)

#### OPSI 1: OPENAI (Recommended - Paling fleksibel)
```bash
OPENAI_API_KEY=sk-your-openai-key
AI_MODEL_PROVIDER=openai
AI_MODEL_NAME=gpt-4o-mini
```

Dapatkan key: https://platform.openai.com/api-keys

#### OPSI 2: ANTHROPIC (Best untuk creative writing)
```bash
ANTHROPIC_API_KEY=sk-ant-your-anthropic-key
AI_MODEL_PROVIDER=anthropic  
AI_MODEL_NAME=claude-3-5-sonnet-latest
```

Dapatkan key: https://console.anthropic.com/api/keys

#### OPSI 3: GOOGLE/GEMINI (Best untuk context panjang)
```bash
GOOGLE_API_KEY=your-gemini-api-key
AI_MODEL_PROVIDER=gemini
AI_MODEL_NAME=gemini-1.5-pro
```

Dapatkan key: https://aistudio.google.com/app/apikey

## Langkah Konfigurasi:

1. Copy template file: `cp .env.example .env`
2. Edit dengan API key Anda sendiri
3. Restart backend: `pkill -f "uvicorn" && uvicorn main:app --host 0.0.0.0 --port 8000`
4. Test configuration: `curl http://localhost:8000/api/ai/writing/skills`

## Checklist Implementasi:

✅ Skills directory structure created  
✅ Novelist AI skill guidance file (novelist-ai.md)  
✅ Skill registry loader (__init__.py)  
✅ All 5 writing modes supported  
✅ Frontend UI complete  
✅ Admin menu item added  

## Yang Masih Perlu Konfigurasi:

❌ OPENAI_API_KEY / ANTHROPIC_API_KEY / GEMINI_API_KEY - Set satu!
❌ Backend restart setelah setting variables
❌ Verify dengan test API endpoint
