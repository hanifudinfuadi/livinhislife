import React, { useEffect, useRef, useState } from 'react';
import ImageCropper from './ImageCropper';
import { describeUploadError } from './uploadError';
import { CHUNK_SIZE, uploadImageInParts } from './chunkUpload';
import './ArticlesManager.css';

const API_URL = (typeof window !== 'undefined' ? window.location.origin : '');
const emptyArticle = { title: '', excerpt: '', body: '', category: 'Journal', image_url: '', intro_video: '', music_url: '', music_title: '', font: '', published: false };
// Same ids as the portfolio typography system so CSS classes can be shared.
const FONT_OPTIONS = [
  { value: '', label: 'Bawaan (Georgia)', hint: 'Tenang dan klasik, cocok untuk hampir semua tulisan.' },
  { value: 'lora', label: 'Lora', hint: 'Serif hangat dan mudah dibaca untuk esai panjang.' },
  { value: 'plus-jakarta', label: 'Plus Jakarta Sans', hint: 'Sans modern dan bersih untuk journal singkat.' },
  { value: 'merriweather', label: 'Merriweather', hint: 'Serif jurnalistik, tegas dan nyaman untuk cerita.' },
];
const LIMITS = {
  video: { bytes: 100 * 1024 * 1024, label: 'video' },
  audio: { bytes: 30 * 1024 * 1024, label: 'audio' },
};

const ArticlesManager = () => {
  const [articles, setArticles] = useState([]);
  const [article, setArticle] = useState(emptyArticle);
  const [editingId, setEditingId] = useState(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');
  const [cropper, setCropper] = useState(null);
  const fileInput = useRef(null);
  const audioInput = useRef(null);
  const videoInput = useRef(null);
  const [audioBusy, setAudioBusy] = useState(false);
  const [videoBusy, setVideoBusy] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(null);

  const resolveUrl = (url) => (!url ? '' : url.startsWith('http') ? url : `${API_URL}${url}`);

  const loadArticles = async () => {
    const response = await fetch(`${API_URL}/api/articles?published_only=false`, { credentials: 'include' });
    if (!response.ok) throw new Error('Gagal memuat artikel. Silakan masuk ulang.');
    setArticles(await response.json());
  };

  useEffect(() => { loadArticles().catch((error) => setMessage(error.message)); }, []);

  const setField = (event) => {
    const { name, value, checked, type } = event.target;
    setArticle((current) => ({ ...current, [name]: type === 'checkbox' ? checked : value }));
  };

  const uploadBlob = async (file) => {
    // Bertahap: Vercel menolak body request di atas 4.5 MB.
    const uploaded = await uploadImageInParts(API_URL, file);
    return uploaded?.url || '';
  };

  const uploadInParts = async (file, kind, onProgress) => {
    const uploadId = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const total = Math.max(1, Math.ceil(file.size / CHUNK_SIZE));
    for (let index = 0; index < total; index += 1) {
      const chunk = file.slice(index * CHUNK_SIZE, Math.min(file.size, (index + 1) * CHUNK_SIZE));
      const data = new FormData();
      data.append('upload_id', uploadId);
      data.append('index', String(index));
      data.append('file', chunk, `part-${index}.bin`);
      const response = await fetch(`${API_URL}/api/portfolio/upload-part`, { method: 'POST', body: data, credentials: 'include' });
      if (!response.ok) throw new Error(await describeUploadError(response));
      if (onProgress) onProgress(Math.round(((index + 1) / total) * 95));
    }
    const response = await fetch(`${API_URL}/api/portfolio/upload-finish`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ upload_id: uploadId, kind, filename: file.name, content_type: file.type }),
    });
    if (!response.ok) throw new Error(await describeUploadError(response));
    const uploaded = await response.json();
    if (onProgress) onProgress(100);
    return uploaded;
  };

  const uploadVideo = async (event) => {
    const file = (event.target.files || [])[0];
    event.target.value = '';
    if (!file) return;
    const limit = LIMITS.video;
    if (file.size > limit.bytes) {
      setMessage(`Video lebih dari ${Math.round(limit.bytes / 1048576)} MB. Gunakan URL video (YouTube/Vimeo) atau kecilkan resolusinya.`);
      return;
    }
    setVideoBusy(true);
    setUploadProgress(0);
    setMessage('');
    try {
      const uploaded = await uploadInParts(file, 'video', setUploadProgress);
      setArticle((current) => ({ ...current, intro_video: uploaded.url || '' }));
      setMessage('Video cuplikan siap. Klik "Simpan artikel" agar tersimpan.');
    } catch (error) { setMessage(error.message); }
    finally { setVideoBusy(false); setUploadProgress(null); }
  };

  const uploadAudio = async (event) => {
    const file = (event.target.files || [])[0];
    event.target.value = '';
    if (!file) return;
    const limit = LIMITS.audio;
    if (file.size > limit.bytes) {
      setMessage(`Lagu lebih dari ${Math.round(limit.bytes / 1048576)} MB. Kecilkan bitrate MP3-nya (mis. 128 kbps).`);
      return;
    }
    setAudioBusy(true);
    setUploadProgress(0);
    setMessage('');
    try {
      const uploaded = await uploadInParts(file, 'audio', setUploadProgress);
      setArticle((current) => ({
        ...current,
        music_url: uploaded.url || '',
        music_title: current.music_title || String(uploaded.name || '').replace(/\.[^.]+$/, '') || '',
      }));
      setMessage('Lagu pengiring siap. Klik "Simpan artikel" agar tersimpan.');
    } catch (error) { setMessage(error.message); }
    finally { setAudioBusy(false); setUploadProgress(null); }
  };

  const removeVideo = () => {
    setArticle((current) => ({ ...current, intro_video: '' }));
    setMessage('Video cuplikan dilepas.');
  };

  const removeAudio = () => {
    setArticle((current) => ({ ...current, music_url: '', music_title: '' }));
    setMessage('Lagu pengiring dilepas.');
  };

  const handleFilesChosen = (event) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;
    setCropper({ src: URL.createObjectURL(file), fileName: file.name, index: null, file });
  };

  const handleCropConfirm = async (croppedFile) => {
    const imageUrl = await uploadBlob(croppedFile);
    if (!imageUrl) throw new Error('Gambar gagal diunggah.');
    setArticle((current) => ({ ...current, image_url: imageUrl }));
    setMessage(
      cropper?.index === null || cropper?.index === undefined
        ? 'Gambar sampul siap. Klik "Simpan artikel" agar tersimpan.'
        : 'Gambar sampul diganti. Klik "Simpan perubahan" agar tersimpan.'
    );
    setCropper(null);
  };

  const handleCropSkip = async () => {
    const target = cropper;
    if (!target) return;
    if (!target.file) {
      setCropper(null);
      return;
    }
    const imageUrl = await uploadBlob(target.file);
    if (!imageUrl) throw new Error('Gambar gagal diunggah.');
    setArticle((current) => ({ ...current, image_url: imageUrl }));
    setMessage('Gambar diunggah tanpa perubahan.');
    setCropper(null);
  };

  const recropExisting = async () => {
    const url = resolveUrl(article.image_url);
    if (!url) return;
    try {
      const response = await fetch(url);
      if (!response.ok) throw new Error('Gambar gagal dimuat.');
      const objectUrl = URL.createObjectURL(await response.blob());
      setCropper({ src: objectUrl, fileName: 'sampul-artikel', index: 0 });
    } catch (error) {
      setMessage(error.message);
    }
  };

  const removeImage = () => {
    setArticle((current) => ({ ...current, image_url: '' }));
    setMessage('Gambar dilepas dari artikel. Klik "Simpan perubahan" agar tersimpan.');
  };

  const saveArticle = async (event) => {
    event.preventDefault();
    setBusy(true);
    setMessage('');
    try {
      const endpoint = editingId ? `${API_URL}/api/articles/${editingId}` : `${API_URL}/api/articles`;
      const response = await fetch(endpoint, {
        method: editingId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(article),
      });
      if (!response.ok) throw new Error('Artikel gagal disimpan. Periksa koneksi lalu coba lagi.');
      setArticle(emptyArticle);
      setEditingId(null);
      setMessage('Artikel berhasil disimpan.');
      await loadArticles();
    } catch (error) { setMessage(error.message); }
    finally { setBusy(false); }
  };

  const editArticle = (item) => {
    setEditingId(item.article_id);
    setArticle({ title: item.title, excerpt: item.excerpt || '', body: item.body || '', category: item.category || 'Journal', image_url: item.image_url || '', intro_video: item.intro_video || '', music_url: item.music_url || '', music_title: item.music_title || '', font: item.font || '', published: item.published });
    setMessage(`Sedang menyunting “${item.title}”.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const cancelEdit = () => {
    setArticle(emptyArticle);
    setEditingId(null);
    setMessage('');
  };

  const deleteArticle = async (item) => {
    if (!window.confirm(`Hapus artikel “${item.title}”?`)) return;
    const response = await fetch(`${API_URL}/api/articles/${item.article_id}`, { method: 'DELETE', credentials: 'include' });
    if (response.ok) { setMessage('Artikel dihapus.'); await loadArticles(); }
    else setMessage('Artikel gagal dihapus.');
  };

  return (
    <section className="articles-manager">
      <h2>Kelola artikel</h2>
      <p>Tulis dokumentasi dan cerita, atur gambar sampul, simpan sebagai draf, lalu publikasikan saat siap.</p>

      {editingId && (
        <div className="article-editing-banner" role="status">
          <span>Sedang menyunting artikel. Perubahan akan menimpa konten yang sudah tayang.</span>
          <button type="button" className="article-cancel-btn" onClick={cancelEdit}>Batal edit</button>
        </div>
      )}

      <form className="article-editor" onSubmit={saveArticle}>
        <label>Judul<input name="title" value={article.title} onChange={setField} required /></label>
        <label>Kategori<input name="category" value={article.category} onChange={setField} /></label>
        <label>Jenis font tulisan
          <select name="font" value={article.font || ''} onChange={setField}>
            {FONT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
          <span className="article-field-hint">{(FONT_OPTIONS.find((option) => option.value === (article.font || '')) || FONT_OPTIONS[0]).hint} Hanya memengaruhi tampilan tulisan di portfolio.</span>
        </label>
        <label>Ringkasan<textarea name="excerpt" value={article.excerpt} onChange={setField} rows="2" /></label>
        <label>Isi artikel<textarea name="body" value={article.body} onChange={setField} rows="9" /></label>

        <div className="article-cover-block">
          <span className="article-cover-label">Gambar sampul</span>
          <input ref={fileInput} type="file" accept="image/*" onChange={handleFilesChosen} hidden />
          <div className="article-cover-actions">
            <button type="button" className="admin-card-btn" onClick={() => fileInput.current?.click()}>
              {article.image_url ? 'Ganti gambar' : 'Pilih gambar'}
            </button>
            {article.image_url && (
              <>
                <button type="button" className="admin-card-btn" onClick={recropExisting}>Atur ulang posisi</button>
                <button type="button" className="article-cancel-btn" onClick={removeImage}>Hapus gambar</button>
              </>
            )}
          </div>
          {article.image_url && (
            <img
              className="article-editor-preview"
              src={resolveUrl(article.image_url)}
              alt="Pratinjau sampul"
            />
          )}
        </div>

        <div className="article-media-block">
          <div className="article-media-row">
            <span className="article-cover-label">Video cuplikan (opsional)</span>
            <input ref={videoInput} type="file" accept="video/mp4,video/webm,video/ogg" onChange={uploadVideo} hidden />
            <div className="article-media-actions">
              <button type="button" className="admin-card-btn" disabled={videoBusy} onClick={() => videoInput.current?.click()}>
                {videoBusy ? `Mengunggah… ${uploadProgress ?? 0}%` : article.intro_video ? 'Ganti video' : 'Unggah video'}
              </button>
              {article.intro_video && <button type="button" className="article-cancel-btn" onClick={removeVideo}>Hapus video</button>}
            </div>
          </div>
          {article.intro_video && (
            <video
              className="article-editor-preview video"
              src={resolveUrl(article.intro_video)}
              muted
              playsInline
              controls
            />
          )}
          <span className="article-upload-note">MP4/WebM, maksimal 100 MB — diunggah bertahap agar lolos batas server.</span>
        </div>

        <div className="article-media-block">
          <div className="article-media-row">
            <span className="article-cover-label">Lagu pengiring (opsional)</span>
            <input ref={audioInput} type="file" accept="audio/mpeg,audio/mp3,audio/ogg,audio/wav,audio/mp4" onChange={uploadAudio} hidden />
            <div className="article-media-actions">
              <button type="button" className="admin-card-btn" disabled={audioBusy} onClick={() => audioInput.current?.click()}>
                {audioBusy ? `Mengunggah… ${uploadProgress ?? 0}%` : article.music_url ? 'Ganti lagu' : 'Unggah lagu'}
              </button>
              {article.music_url && <button type="button" className="article-cancel-btn" onClick={removeAudio}>Hapus lagu</button>}
            </div>
          </div>
          {article.music_url && (
            <div className="article-music-preview">
              <span>🎵 {article.music_title || 'Lagu pengiring'}</span>
              <audio src={resolveUrl(article.music_url)} controls preload="none" crossOrigin="anonymous" />
            </div>
          )}
          <span className="article-upload-note">MP3/OGG/WAV, maksimal 30 MB — diunggah bertahap agar lolos batas server.</span>
        </div>

        <label className="article-publish-toggle"><input type="checkbox" name="published" checked={article.published} onChange={setField} /> Terbitkan di portfolio</label>
        <div className="article-editor-actions">
          <button className="admin-card-btn admin-card-btn-active" disabled={busy}>{busy ? 'Menyimpan…' : editingId ? 'Simpan perubahan' : 'Simpan artikel'}</button>
          {editingId && <button type="button" className="article-cancel-btn" onClick={cancelEdit}>Batal edit</button>}
        </div>
        {message && <p className="article-manager-message" role="status">{message}</p>}
      </form>

      <h3>Artikel tersimpan ({articles.length})</h3>
      <div className="managed-articles">
        {articles.map((item) => <article className="managed-article" key={item.article_id}>
          <div><strong>{item.title}</strong><span>{item.published ? 'Terbit' : 'Draf'} · {item.category} · {FONT_OPTIONS.find((option) => option.value === (item.font || ''))?.label || FONT_OPTIONS[0].label}</span></div>
          <div className="managed-article-actions"><button onClick={() => editArticle(item)}>Edit</button><button onClick={() => deleteArticle(item)}>Hapus</button></div>
        </article>)}
        {!articles.length && <p>Belum ada artikel. Mulai dengan menulis dokumentasi pertama.</p>}
      </div>

      {cropper && (
        <ImageCropper
          src={cropper.src}
          fileName={cropper.fileName}
          title={cropper.index === null || cropper.index === undefined ? 'Atur gambar sampul' : 'Atur ulang gambar sampul'}
          onCancel={() => setCropper(null)}
          onConfirm={handleCropConfirm}
          onSkip={handleCropSkip}
        />
      )}
    </section>
  );
};

export default ArticlesManager;