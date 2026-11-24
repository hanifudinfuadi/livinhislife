import React, { useEffect, useMemo, useRef, useState } from 'react';
import './WritingAssistant.css';

const API_URL = (typeof window !== 'undefined' ? window.location.origin : '');
const SESSION_KEY = 'hanif.writing.session';

const QUICK_ACTIONS = [
  { id: 'analyze', icon: '🔍', label: 'Nilai naskah', prompt: 'Tolong nilai naskah ini: kekuatan, kelemahan, dan prioritas perbaikannya.' },
  { id: 'improve', icon: '✍️', label: 'Perbaiki gaya', prompt: 'Perbaiki diksi, ritme, dan resonansi emosinya tanpa mengubah maksud saya.' },
  { id: 'upgrade', icon: '⬆️', label: 'Upgrade tulisan', prompt: 'Naikkan mutu naskah ini: pertajam imaji, ritme, dan kedalaman emosinya tanpa mengubah karakter dan maksud cerita saya.' },
  { id: 'recommend', icon: '🧭', label: 'Saran struktur', prompt: 'Berikan rekomendasi struktur, karakter, dan konflik untuk naskah ini.' },
];

const WELCOME = {
  role: 'assistant',
  content:
    'Selamat datang di Asisten Karya Tulis. Tempel atau tulis naskah Anda di panel kiri, lalu ajak saya mengobrol seperti editor: minta perbaikan, tanya kenapa sebuah kalimat lemah, atau minta alternatif ungkapan. Setiap revisi bisa Anda terapkan atau tolak dengan satu klik.',
};

const readText = async (response) => {
  const raw = await response.text();
  try {
    return raw ? JSON.parse(raw) : {};
  } catch {
    return { detail: raw };
  }
};

/* Highlights added / removed words so 2-way editing stays transparent. */
const diffTokens = (before, after) => {
  const tokenize = (value) => (value || '').match(/\S+\s*|\s+/g) || [];
  const a = tokenize(before);
  const b = tokenize(after);
  if (a.length * b.length > 900000) {
    return { removed: a, kept: [], added: b };
  }
  const table = Array.from({ length: a.length + 1 }, () => new Uint16Array(b.length + 1));
  for (let i = a.length - 1; i >= 0; i -= 1) {
    for (let j = b.length - 1; j >= 0; j -= 1) {
      table[i][j] = a[i] === b[j]
        ? table[i + 1][j + 1] + 1
        : Math.max(table[i + 1][j], table[i][j + 1]);
    }
  }
  const removed = [];
  const kept = [];
  const added = [];
  let i = 0;
  let j = 0;
  while (i < a.length && j < b.length) {
    if (a[i] === b[j]) {
      kept.push(a[i]);
      i += 1;
      j += 1;
    } else if (table[i + 1][j] >= table[i][j + 1]) {
      removed.push(a[i]);
      i += 1;
    } else {
      added.push(b[j]);
      j += 1;
    }
  }
  removed.push(...a.slice(i));
  added.push(...b.slice(j));
  return { removed, kept, added };
};

/* Capitalize the first letter of each sentence; leaves the rest lowercase. */
const toSentenceCase = (value) =>
  value
    .toLowerCase()
    .replace(/(^|[.!?]\s+)(\p{L})/gu, (_match, sep, chr) => sep + chr.toUpperCase());

const DiffText = ({ before, after }) => {
  const diff = useMemo(() => diffTokens(before, after), [before, after]);
  const [copied, setCopied] = useState(false);
  const copyRevised = async () => {
    try {
      await navigator.clipboard.writeText(after || '');
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1600);
    } catch {
      setCopied(false);
    }
  };
  return (
    <div className="wa-diff" aria-label="Perbandingan teks lama dan revisi">
      <div className="wa-diff-col">
        <span className="wa-diff-head">Teks lama</span>
        <p>{diff.removed.join('')}</p>
      </div>
      <div className="wa-diff-col wa-diff-new">
        <div className="wa-diff-head-row">
          <span className="wa-diff-head">Teks revisi</span>
          <button
            type="button"
            className="wa-diff-copy"
            onClick={copyRevised}
            disabled={!after}
            title="Salin seluruh teks revisi ke clipboard"
          >
            {copied ? 'Tersalin ✓' : 'Salin'}
          </button>
        </div>
        {diff.added.length ? (
          <p>{diff.added.map((chunk, idx) => <mark key={idx}>{chunk}</mark>)}</p>
        ) : (
          <p className="wa-diff-empty">Tidak ada kalimat baru — revisi berupa pemangkasan.</p>
        )}
      </div>
    </div>
  );
};

const Assessment = ({ data }) => {
  const entries = Object.entries(data || {});
  if (!entries.length) return null;
  const labels = {
    clarity: 'Kejelasan',
    emotion: 'Emosi',
    literary: 'Kualitas sastra',
    readability: 'Keterbacaan',
    language: 'Kebahasaan',
  };
  return (
    <dl className="wa-assessment">
      {entries.map(([key, value]) => (
        <div key={key}>
          <dt>{labels[key] || key}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  );
};

const MessageBubble = ({ message, draft, onApply, onDismiss, onAlternative }) => {
  const isUser = message.role === 'user';
  const revision = message.revision || '';
  const pending = Boolean(revision) && !message.pending;
  return (
    <article className={`wa-msg ${isUser ? 'wa-msg-user' : 'wa-msg-ai'}`}>
      <span className="wa-msg-role">{isUser ? 'Anda' : 'Novelist AI'}</span>
      <div className="wa-msg-body">{message.content}</div>

      {!isUser && message.notes?.length > 0 && (
        <ul className="wa-notes">
          {message.notes.map((note, idx) => <li key={idx}>{note}</li>)}
        </ul>
      )}

      {!isUser && message.alternatives?.length > 0 && (
        <div className="wa-alts">
          {message.alternatives.map((alt, idx) => (
            <button
              type="button"
              key={idx}
              className="wa-alt"
              title="Klik untuk memuat alternatif ini ke kotak naskah"
              onClick={() => onAlternative(alt)}
            >
              <span>Alternatif {idx + 1}</span>
              {alt}
            </button>
          ))}
        </div>
      )}

      {!isUser && revision && (
        <div className="wa-revision">
          <DiffText before={message.baseText ?? draft} after={revision} />
          <div className="wa-revision-actions">
            <button type="button" className="wa-btn wa-btn-primary" onClick={() => onApply(revision)} disabled={!pending}>
              Terapkan revisi
            </button>
            <button type="button" className="wa-btn wa-btn-ghost" onClick={onDismiss} disabled={message.applied || message.dismissed}>
              {message.applied ? 'Sudah diterapkan' : message.dismissed ? 'Ditolak' : 'Tolak'}
            </button>
          </div>
        </div>
      )}

      {!isUser && <Assessment data={message.assessment} />}
    </article>
  );
};

const WritingAssistant = () => {
  const [draft, setDraft] = useState('');
  const [messages, setMessages] = useState([WELCOME]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState(() => {
    try { return window.localStorage.getItem(SESSION_KEY) || ''; } catch { return ''; }
  });
  const [title, setTitle] = useState('Naskah baru');
  const [status, setStatus] = useState('');
  const [busy, setBusy] = useState(false);
  const [savedAt, setSavedAt] = useState('');
  const [showDiff, setShowDiff] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [showLibrary, setShowLibrary] = useState(false);
  const threadRef = useRef(null);
  const textareaRef = useRef(null);

  const stats = useMemo(() => {
    const words = draft.trim() ? draft.trim().split(/\s+/).length : 0;
    return { words, chars: draft.length, paragraphs: draft.trim() ? draft.split(/\n{2,}/).length : 0 };
  }, [draft]);

  const autosize = (el) => {
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.max(el.scrollHeight, 320)}px`;
  };

  useEffect(() => { autosize(textareaRef.current); }, [draft]);
  useEffect(() => {
    if (threadRef.current) threadRef.current.scrollTop = threadRef.current.scrollHeight;
  }, [messages, busy]);

  // Load an existing session on mount
  useEffect(() => {
    if (!sessionId) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`${API_URL}/api/ai/writing/sessions/${sessionId}`, { credentials: 'include' });
        if (!res.ok) throw new Error();
        const data = await readText(res);
        if (cancelled) return;
        setTitle(data.title || 'Naskah baru');
        setDraft(data.text || '');
        if (data.messages?.length) setMessages([WELCOME, ...data.messages]);
      } catch {
        try { window.localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
        setSessionId('');
      }
    })();
    return () => { cancelled = true; };
  }, [sessionId]);

  const persist = async (nextDraft = draft, nextTitle = title) => {
    if (!sessionId) return;
    try {
      await fetch(`${API_URL}/api/ai/writing/sessions/${sessionId}`, {
        method: 'PUT',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: nextDraft, title: nextTitle }),
      });
      setSavedAt(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }));
    } catch {
      setStatus('Gagal menyimpan draf. Periksa koneksi.');
    }
  };

  // Debounced autosave so long manuscripts never get lost
  useEffect(() => {
    if (!sessionId) return undefined;
    const timer = setTimeout(() => { persist(); }, 1500);
    return () => clearTimeout(timer);
  }, [draft, sessionId]);

  const adoptSession = (nextId) => {
    try { window.localStorage.setItem(SESSION_KEY, nextId); } catch { /* ignore */ }
    setSessionId(nextId);
  };

  const loadLibrary = async () => {
    try {
      const res = await fetch(`${API_URL}/api/ai/writing/sessions`, { credentials: 'include' });
      setSessions(res.ok ? await res.json() : []);
    } catch {
      setSessions([]);
    }
    setShowLibrary((prev) => !prev);
  };

  const openSession = async (id) => {
    setShowLibrary(false);
    if (id === sessionId) return;
    setMessages([WELCOME]);
    adoptSession(id);
  };

  const newSession = () => {
    try { window.localStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setSessionId('');
    setDraft('');
    setMessages([WELCOME]);
    setTitle('Naskah baru');
    setStatus('');
    setInput('');
  };

  const deleteSession = async (id) => {
    try {
      await fetch(`${API_URL}/api/ai/writing/sessions/${id}`, { method: 'DELETE', credentials: 'include' });
      setSessions((prev) => prev.filter((s) => s.session_id !== id));
      if (id === sessionId) newSession();
    } catch {
      setStatus('Gagal menghapus sesi.');
    }
  };

  const send = async (mode, text) => {
    const prompt = (text || input).trim();
    if (busy) return;
    if (!prompt && !draft.trim()) {
      setStatus('Tulis naskah atau pertanyaan terlebih dahulu.');
      return;
    }
    if (!prompt) {
      setStatus('Ketik arahan untuk asisten, atau pakai tombol cepat di atas.');
      return;
    }
    setStatus('');
    const outgoing = { role: 'user', content: prompt, mode };
    const history = messages.filter((m) => m.role === 'user' || m.role === 'assistant').slice(-20)
      .map((m) => ({ role: m.role, content: m.content }));
    const baseText = draft;
    setMessages((prev) => [...prev, outgoing]);
    setInput('');
    setBusy(true);

    try {
      const res = await fetch(`${API_URL}/api/ai/assist-writing`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: baseText,
          mode,
          instruction: prompt,
          history,
          session_id: sessionId || undefined,
        }),
      });
      const data = await readText(res);
      if (!res.ok) throw new Error(data.detail || 'Asisten gagal merespons.');
      if (!sessionId && data.session_id) adoptSession(data.session_id);
      if (data.title) setTitle(data.title);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: data.reply || '(Tidak ada balasan)',
        revision: data.revised_text || '',
        notes: data.editorial_notes || [],
        alternatives: data.alternatives || [],
        assessment: data.assessment || {},
        baseText,
      }]);
    } catch (error) {
      setStatus(error.message);
      setMessages((prev) => [...prev, {
        role: 'assistant',
        content: `Maaf, terjadi kendala saat menghubungi asisten: ${error.message}`,
      }]);
    } finally {
      setBusy(false);
    }
  };

  const applyRevision = (revision) => {
    const previous = draft;
    setMessages((prev) => {
      const lastIndex = prev.findLastIndex ? prev.findLastIndex((m) => m.revision === revision)
        : prev.map((m) => m.revision).lastIndexOf(revision);
      return prev.map((m, idx) => (idx === lastIndex ? { ...m, applied: true, baseText: previous } : m));
    });
    setDraft(revision);
    setStatus('Revisi diterapkan. Anda bisa meminta perubahan lanjutan kapan saja.');
    persist(revision);
  };

  const dismissRevision = (revision) => {
    setMessages((prev) => {
      const lastIndex = prev.findLastIndex ? prev.findLastIndex((m) => m.revision === revision)
        : prev.map((m) => m.revision).lastIndexOf(revision);
      return prev.map((m, idx) => (idx === lastIndex ? { ...m, dismissed: true } : m));
    });
    setStatus('Revisi ditolak. Suara asli Anda dipertahankan.');
  };

  const useAlternative = (alt) => {
    setDraft(alt);
    setStatus('Alternatif dimuat ke kotak naskah. Sunting seperlunya sebelum dipakai.');
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      send('chat');
    }
  };

  const copyDraft = async () => {
    try {
      await navigator.clipboard.writeText(draft);
      setStatus('Naskah disalin ke clipboard.');
    } catch {
      setStatus('Browser menolak akses clipboard.');
    }
  };

  const applyCase = (mode) => {
    if (!draft) return;
    let next = draft;
    if (mode === 'upper') next = draft.toUpperCase();
    else if (mode === 'lower') next = draft.toLowerCase();
    else if (mode === 'sentence') next = toSentenceCase(draft);
    if (next === draft) return;
    setDraft(next);
    setStatus(
      mode === 'upper'
        ? 'Teks diubah ke HURUF BESAR.'
        : mode === 'lower'
          ? 'Teks diubah ke huruf kecil.'
          : 'Teks dijadikan Sentence case.'
    );
    persist(next);
  };

  const downloadDraft = () => {
    const blob = new Blob([draft], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${(title || 'naskah').replace(/[^\w\-]+/g, '-').toLowerCase()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <section className="writing-assistant" aria-label="Asisten Karya Tulis">
      <header className="wa-head">
        <div>
          <p className="wa-eyebrow">NOVELIST AI · SKILL: EDITORIAL SASTRA</p>
          <h2>Asisten Karya Tulis</h2>
          <p className="wa-sub">
            Tulis sebebas yang Anda mau — tidak ada batas karakter. Lalu ajak asisten mengedit,
            merekomendasikan, dan berdebat sopan soal kalimat Anda.
          </p>
        </div>
        <div className="wa-head-actions">
          <button type="button" className="wa-btn wa-btn-ghost" onClick={loadLibrary}>
            {showLibrary ? 'Tutup riwayat' : 'Riwayat naskah'}
          </button>
          <button type="button" className="wa-btn wa-btn-ghost" onClick={newSession}>+ Naskah baru</button>
        </div>
      </header>

      {showLibrary && (
        <div className="wa-library">
          {sessions.length === 0 && <p className="wa-muted">Belum ada naskah tersimpan.</p>}
          {sessions.map((item) => (
            <div className="wa-library-item" key={item.session_id}>
              <button type="button" onClick={() => openSession(item.session_id)}>
                <strong>{item.title}</strong>
                <span>{item.preview || 'Kosong'}</span>
              </button>
              <button type="button" className="wa-library-del" onClick={() => deleteSession(item.session_id)} aria-label="Hapus naskah">
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="wa-grid">
        {/* ── Manuscript panel ───────────────────────────── */}
        <div className="wa-panel wa-manuscript">
          <div className="wa-panel-head">
            <input
              className="wa-title-input"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              onBlur={() => persist(draft, title)}
              aria-label="Judul naskah"
            />
            <div className="wa-panel-tools">
              <button type="button" className="wa-link" onClick={() => setShowDiff((v) => !v)}>
                {showDiff ? 'Sembunyikan beda' : 'Lihat beda'}
              </button>
              <button type="button" className="wa-link" onClick={copyDraft}>Salin</button>
              <button type="button" className="wa-link" onClick={downloadDraft}>.txt</button>
            </div>
          </div>

          <div className="wa-case-bar" role="group" aria-label="Aturan huruf naskah">
            <span className="wa-case-label">Aturan huruf</span>
            <button type="button" className="wa-case-btn" onClick={() => applyCase('sentence')} disabled={!draft.trim()} title="Huruf awal tiap kalimat kapital (Sentence case)">Aa</button>
            <button type="button" className="wa-case-btn" onClick={() => applyCase('upper')} disabled={!draft.trim()} title="Ubah semua menjadi HURUF BESAR">AA</button>
            <button type="button" className="wa-case-btn" onClick={() => applyCase('lower')} disabled={!draft.trim()} title="Ubah semua menjadi huruf kecil">aa</button>
          </div>

          <textarea
            ref={textareaRef}
            className="wa-textarea"
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Mulai menulis di sini. Bisa bab penuh, satu paragraf, atau satu kalimat yang mengganggu Anda sejak tadi malam…"
            spellCheck="false"
          />

          <footer className="wa-manuscript-foot">
            <span>{stats.words.toLocaleString('id-ID')} kata · {stats.chars.toLocaleString('id-ID')} karakter · {stats.paragraphs} paragraf</span>
            <span>{savedAt ? `Tersimpan ${savedAt}` : 'Simpan otomatis aktif'}</span>
          </footer>

          {showDiff && (
            <div className="wa-manuscript-diff">
              {messages.filter((m) => m.revision).slice(-1).map((m, idx) => (
                <DiffText key={idx} before={m.baseText ?? draft} after={m.revision} />
              ))}
              {!messages.some((m) => m.revision) && <p className="wa-muted">Belum ada revisi untuk dibandingkan.</p>}
            </div>
          )}
        </div>

        {/* ── Conversation panel ─────────────────────────── */}
        <div className="wa-panel wa-chat">
          <div className="wa-quick">
            {QUICK_ACTIONS.map((action) => (
              <button
                type="button"
                key={action.id}
                className="wa-quick-btn"
                disabled={busy || !draft.trim()}
                onClick={() => send(action.id, action.prompt)}
              >
                <span aria-hidden="true">{action.icon}</span>{action.label}
              </button>
            ))}
          </div>

          <div className="wa-thread" ref={threadRef}>
            {messages.map((message, idx) => (
              <MessageBubble
                key={idx}
                message={message}
                draft={draft}
                onApply={applyRevision}
                onDismiss={() => dismissRevision(message.revision)}
                onAlternative={useAlternative}
              />
            ))}
            {busy && (
              <article className="wa-msg wa-msg-ai">
                <span className="wa-msg-role">Novelist AI</span>
                <div className="wa-typing"><i /><i /><i /></div>
              </article>
            )}
          </div>

          <div className="wa-composer">
            <textarea
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={handleKeyDown}
              rows={2}
              placeholder="Bicara bebas, mis. “paragraf kedua terlalu menjelaskan, bikin lebih diam-diam”"
              aria-label="Pesan untuk asisten"
            />
            <button type="button" className="wa-btn wa-btn-primary wa-send" disabled={busy} onClick={() => send('chat')}>
              {busy ? '…' : 'Kirim'}
            </button>
          </div>
          {status && <p className="wa-status" role="status">{status}</p>}
          <p className="wa-hint">⌘/Ctrl + Enter untuk kirim. Asisten mengikuti EYD V, KBBI, dan menjaga suara asli Anda.</p>
        </div>
      </div>
    </section>
  );
};

export default WritingAssistant;
