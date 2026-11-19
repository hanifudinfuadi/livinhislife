import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import './JournalSection.css';

const BACKEND_URL = process.env.REACT_APP_BACKEND_URL || (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8001');


const FONT_CLASSES = {
  lora: 'article-font--lora',
  'plus-jakarta': 'article-font--plus-jakarta',
  merriweather: 'article-font--merriweather',
};
const fontClass = (article) => FONT_CLASSES[article?.font] || '';



const resolveUrl = (url) => {
  if (!url) return '';
  if (/^(https?:|blob:|data:)/i.test(url)) return url;
  return `${BACKEND_URL}${url.startsWith('/') ? url : `/${url}`}`;
};



// URL media langsung dipakai sebagai src agar bisa diganti lewat prop/state.
const mediaUrl = (url) => resolveUrl(url);

const splitParagraphs = (text) =>
  String(text || '')
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);

const JournalSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [articles, setArticles] = useState([]);
  const [selectedArticle, setSelectedArticle] = useState(null);
  const [failed, setFailed] = useState(false);
  const [loading, setLoading] = useState(true);
  const [musicMuted, setMusicMuted] = useState(false);
  const [videoMuted, setVideoMuted] = useState(true);
  const [audioBlocked, setAudioBlocked] = useState(false);

  const sectionRef = useRef(null);
  const audioRef = useRef(null);
  const videoRef = useRef(null);

  const closeArticle = useCallback(() => {
    setSelectedArticle(null);
    setVideoMuted(true);
  }, []);

  useEffect(() => {
    const controller = typeof AbortController === 'function' ? new AbortController() : null;
    setLoading(true);
    fetch(`${BACKEND_URL}/api/articles?published_only=true`, controller ? { signal: controller.signal } : undefined)
      .then((response) => {
        if (!response.ok) throw new Error('Failed to load');
        return response.json();
      })
      .then((items) => {
        setArticles(Array.isArray(items) ? items : []);
        setFailed(false);
      })
      .catch((error) => {
        if (error?.name !== 'AbortError') setFailed(true);
      })
      .finally(() => setLoading(false));
    return () => controller?.abort();
  }, []);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.2 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  // Lagu pengantar untuk catatan yang sedang dibuka (diunggah lewat menu admin).
  const musicTrack = mediaUrl(selectedArticle?.music_url);
  const musicTitle = selectedArticle?.music_title || 'Lagu pengantar';
  const videoTrack = mediaUrl(selectedArticle?.intro_video);

  // Coba bunyikan lagu (bersuara) saat catatan dibuka. Jika peramban menahan autoplay,
  // coba lagi pada gesture pertama pengunjung: klik, sentuh, gulir, atau ketuk tombol.
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !musicTrack) return undefined;

    audio.volume = 0.6;
    audio.muted = musicMuted;
    const play = () => {
      const attempt = audio.play();
      if (attempt && typeof attempt.then === 'function') {
        attempt.then(() => setAudioBlocked(false)).catch(() => setAudioBlocked(true));
      }
    };
    play();
    if (musicMuted) return undefined;

    window.addEventListener('pointerdown', play);
    window.addEventListener('keydown', play);
    window.addEventListener('touchstart', play, { passive: true });
    window.addEventListener('wheel', play, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', play);
      window.removeEventListener('keydown', play);
      window.removeEventListener('touchstart', play);
      window.removeEventListener('wheel', play);
    };
  }, [musicTrack, musicMuted]);


  // Cuplikan video otomatis diputar saat catatan dibuka.
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return undefined;
    video.muted = videoMuted;
    const attempt = video.play();
    if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    return () => {
      video.pause();
    };
  }, [videoTrack, videoMuted]);

  useEffect(() => {
    if (!selectedArticle) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') closeArticle();
    };
    window.addEventListener('keydown', onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = previous;
    };
  }, [selectedArticle, closeArticle]);

  const toggleVideoSound = () => {
    const video = videoRef.current;
    const next = !videoMuted;
    setVideoMuted(next);
    if (!video) return;
    video.muted = next;
    if (!next) {
      const attempt = video.play();
      if (attempt && typeof attempt.catch === 'function') attempt.catch(() => {});
    }
  };

  return (
    <section
      ref={sectionRef}
      id="journal"
      className={`journal-section ${isVisible ? 'visible' : ''}`}
    >
      <div className="journal-container">
        <div className="journal-header">
          <span className="section-badge">Catatan desain</span>
          <h2 className="journal-title">Ide &amp; perspektif</h2>
          <p className="journal-description">
            Hal-hal yang membentuk cara saya melihat dan merancang.
          </p>
        </div>

        {failed && <p className="journal-empty">Artikel belum dapat dimuat saat ini.</p>}
        {!failed && !loading && articles.length === 0 && (
          <p className="journal-empty">Dokumentasi dan cerita baru akan hadir di sini.</p>
        )}

        <div className="articles-grid">
          {articles.map((article, index) => {
            const hasBody = Boolean(String(article.body || '').trim());
            const active = hasBody || article.image_url;
            return (
              <article
                className={`article-card ${fontClass(article)}`}
                key={article.article_id || index}
                style={{ animationDelay: `${0.1 * index}s` }}
              >
                {article.image_url && (
                  <div className="article-image-wrapper">
                    <img
                      className="article-image"
                      src={mediaUrl(article.image_url)}
                      alt={article.title}
                    />
                  </div>
                )}
                <div className="article-content">
                  <span className="article-label">{article.category || 'Catatan'}</span>
                  <h3 className="article-title">{article.title}</h3>
                  {article.excerpt && <p className="article-description">{article.excerpt}</p>}
                  {active && (
                    <button
                      className="article-link"
                      onClick={() => setSelectedArticle(article)}
                    >
                      {hasBody ? 'Baca selengkapnya →' : 'Buka catatan →'}
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </div>
      </div>

      {selectedArticle && createPortal(
        <div
          className="article-modal-backdrop"
          role="presentation"
          onClick={closeArticle}
        >
          <article
            className={`article-modal ${fontClass(selectedArticle)}`}
            role="dialog"
            aria-modal="true"
            aria-labelledby="article-modal-title"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              className="article-modal-close"
              onClick={closeArticle}
              aria-label="Tutup artikel"
            >
              ×
            </button>
            <span className="article-label">{selectedArticle.category || 'Catatan'}</span>
            <h2 id="article-modal-title">{selectedArticle.title}</h2>
            {selectedArticle.excerpt && (
              <p className="article-modal-excerpt">{selectedArticle.excerpt}</p>
            )}
            {musicTrack && (
              <div className="article-modal-music">
                <button
                  type="button"
                  className="article-music-btn"
                  onClick={() => setMusicMuted((current) => !current)}
                  aria-label={musicMuted ? 'Nyalakan lagu pengantar' : 'Bisukan lagu pengantar'}
                >
                  {musicMuted ? '🔇' : '🔊'}
                </button>
                <div className="article-music-text">
                  <span className="article-music-label">Lagu pengantar</span>
                  <span className="article-music-title">{musicTitle}</span>
                </div>
                <audio
                  ref={audioRef}
                  className="article-music-audio"
                  loop
                  preload="auto"
                  controls
                  src={musicTrack}
                />
              </div>
            )}
            {audioBlocked && musicTrack && musicMuted && (
              <p className="article-modal-hint">
                Browser menahan pemutaran otomatis. Tekan tombol 🔊 atau sentuh halaman untuk memulai lagu.
              </p>
            )}

            {videoTrack && (
              <div className="article-modal-media">
                <div className="article-modal-media-head">
                  <span className="article-music-label">Cuplikan video</span>
                  <button
                    type="button"
                    className="article-sound-btn"
                    onClick={toggleVideoSound}
                  >
                    {videoMuted ? '🔇 Nyalakan suara' : '🔊 Bisukan'}
                  </button>
                </div>
                <video
                  ref={videoRef}
                  className="article-modal-video"
                  src={videoTrack}
                  controls
                  playsInline
                  loop
                  muted={videoMuted}
                  preload="metadata"
                >
                  Browser tidak mendukung pemutaran video.
                </video>
              </div>
            )}

            {splitParagraphs(selectedArticle.body).length > 0 && (
              <div className="article-modal-body">
                {splitParagraphs(selectedArticle.body).map((paragraph, index) => (
                  <p key={index}>{paragraph}</p>
                ))}
              </div>
            )}
          </article>
        </div>,
        document.body
      )}


    </section>
  );
};

export default JournalSection;
