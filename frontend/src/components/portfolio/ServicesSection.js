import React, { useEffect, useRef, useState } from 'react';
import './ServicesSection.css';

const ServicesSection = () => {
  const [isVisible, setIsVisible] = useState(false);
  const sectionRef = useRef(null);

  const services = [
    {
      title: 'Fotografi',
      description: 'Penceritaan visual melalui fotografi dokumentasi, potret, acara, editorial, dan produk — menangkap momen, karakter, serta sudut pandang dalam setiap fragments.',
      tags: ['Dokumentasi', 'Potret', 'Acara', 'Editorial', 'Produk']
    },
    {
      title: 'Penulisan Konten',
      description: 'Penulisan kreatif dan strategis untuk brand, artikel, copywriting, serta storytelling digital dengan narasi yang menarik dan karakter yang khas.',
      tags: ['Copywriting', 'Artikel', 'Cerita Brand', 'Konten Kreatif']
    },
    {
      title: 'Fragments Tulis',
      description: 'Fragments literasi personal yang mengeksplorasi cerita, emosi, dan perspektif melalui novel, cerita pendek, esai, fiksi, serta tulisan reflektif.',
      tags: ['Novel', 'Cerita Pendek', 'Esai', 'Fiksi']
    }
  ];

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

  return (
    <section 
      ref={sectionRef} 
      className={`services-section ${isVisible ? 'visible' : ''}`}
    >
      <div className="services-container">
        <div className="services-header">
          <span className="section-badge">Layanan</span>
          <h2 className="services-title">Cerita visual dan tertulis untuk Anda.</h2>
          <a href="#contact" className="services-cta">Mari berkolaborasi →</a>
        </div>

        <div className="services-grid">
          {services.map((service, index) => (
            <div 
              key={index} 
              className="service-card"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <h3 className="service-title">{service.title}</h3>
              <p className="service-description">{service.description}</p>
              <div className="service-tags">
                {service.tags.map((tag, i) => (
                  <span key={i} className="service-tag">{tag}</span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ServicesSection;