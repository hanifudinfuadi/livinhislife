import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import GlassFolder from "../ui/glass-folder-cards";

const BACKEND_URL = (typeof window !== 'undefined' ? window.location.origin : 'http://localhost:8000');

const ART_FOR_CATEGORY = {
  Fotografi: 'aurora',
  Novel: 'dusk',
  Esai: 'verdant',
};

const WorksGrid = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);
  const [activeFilter, setActiveFilter] = useState('Semua');
  const [managedProjects, setManagedProjects] = useState([]);
  const sectionRef = useRef(null);

  const projects = [
    {
      title: 'Urban Chronicles',
      category: 'Fotografi',
      description: 'Dokumentasi visual kehidupan perkotaan melalui lensa hitam-putih yang menangkap esensi keseharian.',
      image: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800&h=600&fit=crop']
    },
    {
      title: 'Jejak Nusantara',
      category: 'Fotografi',
      description: 'Perjalanan fotografi melintasi kepulauan, mengabadikan kekayaan budaya dan keindahan alam Indonesia.',
      image: 'https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1452587925148-ce544e77e70d?w=800&h=600&fit=crop']
    },
    {
      title: 'Bayangan Senja',
      category: 'Novel',
      description: 'Kisah in perspective pencarian jati diri di tengah hiruk pikuk modernitas, ditulis dengan prosa puitis.',
      image: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&h=600&fit=crop']
    },
    {
      title: 'Potret Sunyi',
      category: 'Fotografi',
      description: 'Studi komposisi minimal yang membangun narasi visual melalui keheningan dan ruang negatif.',
      image: 'https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1481277542470-605612bd2d61?w=800&h=600&fit=crop']
    },
    {
      title: 'Manuscript Langit',
      category: 'Esai',
      description: 'Kumpulan esai filosofis in perspective alam, waktu, dan keberadaan manusia dalam semesta.',
      image: 'https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1506880018603-83d5b814b5a6?w=800&h=600&fit=crop']
    },
    {
      title: 'Light & Shadow',
      category: 'Fotografi',
      description: 'Eksplorasi cahaya dan bayangan dalam fotografi arsitektur kontemporer.',
      image: 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=600&fit=crop',
      images: ['https://images.unsplash.com/photo-1511818966892-d7d671e672a2?w=800&h=600&fit=crop']
    }
  ];

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setIsVisible(true);
      },
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    let isMounted = true;

    fetch(`${BACKEND_URL}/api/portfolio/content?published_only=true`)
      .then(response => {
        if (response.ok) return response.json();
        console.warn('API not responding, showing fallback projects');
        return null;
      })
      .catch(error => {
        console.warn('Failed to fetch data from API', error);
        return null;
      })
      .then((items) => {
        if (isMounted && Array.isArray(items) && items.length) {
          setManagedProjects(items.map((item) => ({
            content_id: item.content_id,
            title: item.title,
            category: item.kind === 'documentation' || item.kind === 'media' ? 'Fotografi' : item.kind === 'novel' ? 'Novel' : item.category,
            description: item.description,
            image: item.images?.[0]
              ? (item.images[0].startsWith('http') ? item.images[0] : `${BACKEND_URL}${item.images[0]}`)
              : null,
            images: (item.images || []).map((image) => {
              if (image.startsWith('http')) return image;
              return `${BACKEND_URL}${image}`;
            }),
            body: item.body,
          })));
        }
      })
      .catch(() => {});
  }, []);

  const displayedProjects = managedProjects.length ? managedProjects : projects;

  const filters = ['Semua', 'Fotografi', 'Novel', 'Esai'];

  const filteredProjects = activeFilter === 'Semua'
    ? displayedProjects
    : displayedProjects.filter((project) => project.category === activeFilter);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => setIsVisible(entry.isIntersecting),
      { threshold: 0.1 }
    );

    if (sectionRef.current) observer.observe(sectionRef.current);
    return () => observer.disconnect();
  }, [activeFilter]);

  const artForCategory = (category) => ART_FOR_CATEGORY[category] || 'glacier';

  return (
    <section
      ref={sectionRef}
      id="works"
      className={`works-section ${isVisible ? 'visible' : ''} py-16 bg-white`}
    >
      <div className="works-container max-w-7xl mx-auto px-6">
        <div className="works-header mb-10">
          <span className="section-badge inline-block mb-3 px-3 py-1 rounded-full bg-gray-100 text-gray-700 text-xs font-medium uppercase tracking-wider">Selected works</span>
          <h2 className="works-title text-3xl md:text-4xl font-serif font-bold text-gray-900 mb-3">Fragments terbaru</h2>
          <p className="works-description text-gray-600 max-w-xl">
            Eksplorasi identitas visual dan pengalaman digital.
          </p>
        </div>

        <div className="filter-bar flex flex-wrap gap-3 mb-10">
          {filters.map(filter => (
            <button
              key={filter}
              className={`filter-btn px-5 py-2 rounded-full text-sm font-medium transition ${activeFilter === filter ? 'bg-gray-900 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              onClick={() => setActiveFilter(filter)}
            >
              {filter}
            </button>
          ))}
          <span className="ml-auto work-count text-gray-500 text-sm">{filteredProjects.length} fragments</span>
        </div>

        <div className="projects-grid grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6 max-w-7xl mx-auto px-6 justify-items-center">
          {filteredProjects.map((project, index) => {
            const art = artForCategory(project.category);
            const tone = index % 2 === 0 ? 'light' : 'dark';
            const files = (project.images || []).map((img, i) => ({
              name: `${project.title} ${i + 1}`,
              meta: 'Image',
              art,
              image: img,
              href: `/fragments/${project.content_id}`,
            }));
            return (
              <div
                key={project.content_id || index}
                className="project-card-wrapper"
                style={{ animationDelay: `${index * 0.12}s` }}
              >
                <GlassFolder
                  label={project.title}
                  meta={project.category}
                  tone={tone}
                  art={art}
                  seed={index + 3}
                  width={250}
                  image={project.image || undefined}
                  files={files}
                  action="more"
                  labelPlacement="bottom-left"
                  appearDelay={index * 120}
                  onFileSelect={(file) => {
                    if (file.href) navigate(file.href);
                  }}
                  menu={[
                    { label: "Lihat detail", onSelect: () => navigate(`/fragments/${project.content_id}`) },
                    { label: "Kategori: " + project.category },
                  ]}
                />
              </div>
            );
          })}
        </div>

        <div className="works-cta mt-12">
          <a href="#contact" className="cta-button inline-flex items-center px-6 py-3 bg-gray-900 text-white rounded-lg font-medium hover:bg-gray-800 transition">
            Diskusikan proyek Anda
            <span className="cta-arrow ml-2">→</span>
          </a>
        </div>

      </div>

    </section>
  );
};

export default WorksGrid;
