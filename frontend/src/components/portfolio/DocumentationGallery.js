import React, { useCallback, useEffect, useRef, useState } from 'react';
import Gallery from '../ui/gallery';
import './DocumentationGallery.css';

const API = process.env.REACT_APP_BACKEND_URL || 'http://localhost:8001';
const SAMPLE_SIZE = 12;
const ROTATE_MS = 18000;

const resolveUrl = (source) => {
  const value = String(source || '').trim();
  if (!value) return '';
  if (value.startsWith('data:') || value.startsWith('blob:')) return value;
  if (value.startsWith('//')) return `https:${value}`;
  if (/^https?:\/\//i.test(value)) return value;
  return `${API}${value.startsWith('/') ? '' : '/'}${value}`;
};

const pickRandom = (pool, count) => {
  const copy = pool.slice();
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy.slice(0, Math.min(count, copy.length));
};

const DocumentationGallery = () => {
  const [pool, setPool] = useState([]);
  const [sample, setSample] = useState([]);
  const [status, setStatus] = useState('loading');
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.15 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let active = true;

    fetch(`${API}/api/portfolio/content?kind=documentation&published_only=true`)
      .then((response) => {
        if (!response.ok) throw new Error('Gagal memuat dokumentasi');
        return response.json();
      })
      .then((items) => {
        if (!active) return;
        const list = Array.isArray(items) ? items : [];
        const photos = list
          .flatMap((item) => (Array.isArray(item.images) ? item.images : []))
          .map(resolveUrl)
          .filter(Boolean);

        if (!photos.length) {
          setStatus('empty');
          return;
        }

        setPool(photos);
        setSample(pickRandom(photos, SAMPLE_SIZE));
        setStatus('ready');
      })
      .catch(() => {
        if (active) setStatus('error');
      });

    return () => {
      active = false;
    };
  }, []);

  const shuffle = useCallback(() => {
    setSample((current) => {
      if (pool.length < 2) return current;
      let next = pickRandom(pool, SAMPLE_SIZE);
      if (next[0] === current[0]) next = pickRandom(pool, SAMPLE_SIZE);
      return next;
    });
  }, [pool]);

  useEffect(() => {
    if (status !== 'ready' || pool.length < 2) return undefined;

    const timer = window.setInterval(() => {
      if (document.hidden) return;
      shuffle();
    }, ROTATE_MS);

    return () => window.clearInterval(timer);
  }, [status, pool, shuffle]);

  return (
    <section
      ref={sectionRef}
      id="dokumentasi"
      className={`dg-section ${isVisible ? 'visible' : ''}`}
    >
      <div className="dg-container">
        <div className="dg-header">
          <span className="section-badge">Galeri dokumentasi</span>
          <h2 className="dg-title">Cuplikan dokumentasi</h2>
          <p className="dg-description">
            {status === 'ready'
              ? `${sample.length} dari ${pool.length} foto dokumentasi, dipilih acak dan berganti otomatis.`
              : 'Sebagian kecil dokumentasi yang sudah diunggah.'}
          </p>
        </div>

        <div className="dg-stage">
          {status === 'ready' && sample.length > 0 && (
            <Gallery images={sample} speed={0.16} />
          )}
          {status === 'loading' && (
            <div className="dg-skeleton" aria-hidden="true" />
          )}
          {status === 'empty' && (
            <p className="dg-empty">
              Belum ada dokumentasi yang dipublikasikan.
            </p>
          )}
          {status === 'error' && (
            <p className="dg-empty">Galeri belum dapat dimuat saat ini.</p>
          )}
        </div>

        {status === 'ready' && pool.length > 0 && (
          <div className="dg-toolbar">
            <span className="dg-count">
              {sample.length} / {pool.length} foto
            </span>
            <button type="button" className="dg-shuffle" onClick={shuffle}>
              Acak ulang
            </button>
          </div>
        )}
      </div>
    </section>
  );
};

export default DocumentationGallery;