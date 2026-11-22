import React from 'react';
import './PortfolioFooter.css';

const INSTAGRAM_URL = 'https://www.instagram.com/hanifudinfuadii/';
const EMAIL = 'framedbyheart@outlook.com';
const WHATSAPP_NUMBER = '6285119723762';
const LINKEDIN_URL = 'https://www.linkedin.com/in/mohammad-hanifudin-fuadi-90265b176/';

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="2" width="20" height="20" rx="5" />
    <circle cx="12" cy="12" r="4" />
    <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
  </svg>
);

const MailIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    <rect x="2" y="4" width="20" height="16" rx="2" />
    <path d="m2 7 10 6 10-6" />
  </svg>
);

const WhatsappIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M17.47 14.38c-.3-.15-1.75-.86-2.02-.96-.27-.1-.47-.15-.67.15-.2.3-.77.96-.94 1.16-.17.2-.35.22-.64.07-.3-.15-1.25-.46-2.38-1.47-.88-.78-1.48-1.75-1.65-2.05-.17-.3-.02-.46.13-.6.13-.14.3-.35.44-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.6-.92-2.19-.24-.58-.49-.5-.67-.51l-.57-.01c-.2 0-.52.07-.79.37-.27.3-1.04 1.02-1.04 2.48s1.06 2.87 1.21 3.07c.15.2 2.1 3.2 5.08 4.49.71.31 1.27.49 1.7.63.72.23 1.37.2 1.89.12.58-.09 1.75-.71 2-1.4.25-.69.25-1.28.17-1.4-.07-.13-.27-.2-.57-.35zM12.05 21.5h-.01a9.5 9.5 0 0 1-4.83-1.32l-.35-.21-3.59.94.96-3.5-.23-.36A9.5 9.5 0 1 1 12.05 21.5zm0-20.5A11.4 11.4 0 0 0 .65 12.4c0 2.01.52 3.97 1.52 5.7L.5 24l6.05-1.58a11.4 11.4 0 0 0 5.5 1.4h.01A11.4 11.4 0 0 0 23.46 12.4 11.4 11.4 0 0 0 12.05 1z" />
  </svg>
);

const LinkedinIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor" aria-hidden="true">
    <path d="M20.45 20.45h-3.55v-5.57c0-1.33-.02-3.04-1.85-3.04-1.85 0-2.13 1.45-2.13 2.94v5.67H9.36V9h3.41v1.56h.05c.47-.9 1.63-1.85 3.36-1.85 3.6 0 4.27 2.37 4.27 5.46v6.28zM5.34 7.43a2.06 2.06 0 1 1 0-4.12 2.06 2.06 0 0 1 0 4.12zM7.12 20.45H3.56V9h3.56v11.45zM22.23 0H1.77C.79 0 0 .77 0 1.73v20.54C0 23.23.79 24 1.77 24h20.46c.98 0 1.77-.77 1.77-1.73V1.73C24 .77 23.21 0 22.23 0z" />
  </svg>
);

const PortfolioFooter = () => {
  const currentYear = new Date().getFullYear();

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  return (
    <footer className="portfolio-footer">
      <div className="footer-container">
        <div className="footer-content">
          <div className="footer-brand-section">
            <h3 className="footer-logo">hanif®</h3>
            <p className="footer-tagline">
              Creative thinking.
              <br />
              Thoughtful experiences.
            </p>
          </div>

          <div className="footer-socials">
            <span className="footer-socials-label">Mari terhubung</span>
            <div className="footer-social-links">
              <a
                className="footer-social-link"
                href={INSTAGRAM_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram @hanifudinfuadii"
              >
                <InstagramIcon />
                <span className="footer-social-text">@hanifudinfuadii</span>
              </a>
              <a
                className="footer-social-link"
                href={`mailto:${EMAIL}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={`Surel ${EMAIL}`}
              >
                <MailIcon />
                <span className="footer-social-text">{EMAIL}</span>
              </a>
              <a
                className="footer-social-link"
                href={`https://wa.me/${WHATSAPP_NUMBER}`}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="WhatsApp 0851 1972 3762"
              >
                <WhatsappIcon />
                <span className="footer-social-text">0851 1972 3762</span>
              </a>
              <a
                className="footer-social-link"
                href={LINKEDIN_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn Mohammad Hanifudin Fuadi"
              >
                <LinkedinIcon />
                <span className="footer-social-text">Mohammad Hanifudin Fuadi</span>
              </a>
            </div>
          </div>

          <div className="footer-actions">
            <button onClick={scrollToTop} className="back-to-top">
              Kembali ke atas ↑
            </button>
          </div>
        </div>

        <div className="footer-bottom">
          <p className="footer-copyright">© {currentYear} Mohammad Hanifudin Fuadi. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default PortfolioFooter;