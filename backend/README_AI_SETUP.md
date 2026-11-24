# NOVELIST AI Setup Guide (Asisten Karya Tulis)

## Overview

NOVELIST AI adalah asisten penulisan yang terintegrasi dalam backend portfolio Anda. Fitur ini memungkinkan admin untuk mengembangkan dan merevisi karya tulis dengan bantuan editor AI profesional.

## Konfigurasi Required

### 1. Install Dependencies

```bash
cd backend
pip install -r requirements.txt
```

### 2. Set Environment Variables (PENTING!)

Choose ONE of the following options:

#### Option A: OPENAI (Recommended)
```bash
OPENAI_API_KEY="sk-or-[your-key]"
AI_MODEL_PROVIDER=openai
AI_MODEL_NAME=gpt-4o-mini
```

Get key from: https://platform.openai.com/api-keys

#### Option B: ANTHROPIC (Best untuk creative writing)
```bash
ANTHROPIC_API_KEY="sk-ant-[your-key]"
AI_MODEL_PROVIDER=anthropic
AI_MODEL_NAME=claude-3-5-sonnet-latest
```

Get key from: https://console.anthropic.com/api/keys

#### Option C: GEMINI/GOOGLE (Good untuk context panjang)
```bash
GEMINI_API_KEY="apikey-[your-key]"
# OR
GOOGLE_API_KEY="your-google-api-key"
AI_MODEL_PROVIDER=gemini
AI_MODEL_NAME=gemini-1.5-pro
```

Get key from: https://aistudio.google.com/app/apikey

#### Option D: EMERGENT (Proxy-based)
```bash
EMERGENT_LLM_KEY="sk-emergent-[your-key]"
AI_MODEL_PROVIDER=openai
LLM_API_BASE=https://api.emergent.llm.com/openai/v1
```

### 3. Restart Backend Server

```bash
pkill -f "uvicorn" || pkill -f "python"
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 8000
```

## Verification

Test endpoint:
```bash
curl http://localhost:8000/api/ai/writing/skills
```

Expected response:
```json
{
  "skills": {"novelist-ai": "1.0.0"},
  "active": "novelist-ai",
  "bots": ["improve", "recommend", "analyze", "upgrade", "chat"],
  "model": "provider/model-name",
  "configured": true
}
```

## Features Available

### Writing Modes:
- `improve` - Koreksi bahasa & EYD V
- `recommend` - Saran pengembangan story
- `analyze` - Penilaian kritis naskah  
- `upgrade` - Tingkatkan mutu sastra
- `chat` - Diskusi santai editing

### Frontend Features:
- UI WritingAssistant.js (already implemented)
- Session persistence & auto-save
- Visual diff highlighting
- Assessment metrics display
- Multiple writing modes quick actions

## Files Created:
- `/backend/skills/novelist-ai.md` - Skill guidance file
- `/backend/skills/__init__.py` - Skill registry loader
- `/backend/.env.example` - Updated with AI configuration options
