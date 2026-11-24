import React from 'react';
import ArticlesManager from './ArticlesManager';
import PortfolioManager from './PortfolioManager';
import WritingAssistant from './WritingAssistant';

/* Satu halaman per menu admin. Komponen manager yang sudah ada tetap
   dipakai apa adanya; file ini hanya memberi mereka route sendiri. */
const sections = {
  hero: () => <PortfolioManager channel="hero" />,
  story: () => <PortfolioManager channel="story" />,
  fragments: () => <PortfolioManager channel="fragments" />,
  journal: () => <ArticlesManager />,
  writing: () => <WritingAssistant />,
  media: () => <PortfolioManager channel="media" />,
  novel: () => <PortfolioManager channel="novel" />,
  messages: () => <PortfolioManager channel="contact" />,
};

const AdminSection = ({ section }) => {
  const render = sections[section];
  if (!render) return null;
  return <div className="admin-section">{render()}</div>;
};

export default AdminSection;
