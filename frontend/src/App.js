import React, { useEffect } from "react";
import { motion } from "framer-motion";
import "./App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import PreLanding from "./components/PreLanding";
import PortfolioNav from "./components/portfolio/PortfolioNav";
import SideNav from "./components/portfolio/SideNav";
import PortfolioHero from "./components/portfolio/PortfolioHero";
import AboutSection from "./components/portfolio/AboutSection";
import WorksGrid from "./components/portfolio/WorksGrid";
import WorkDetail from "./components/portfolio/WorkDetail";
import Novel3DShowcase from "./components/portfolio/Novel3DShowcase";
import ServicesSection from "./components/portfolio/ServicesSection";
import DocumentationGallery from "./components/portfolio/DocumentationGallery";
import FAQSection from "./components/portfolio/FAQSection";
import JournalSection from "./components/portfolio/JournalSection";
import ContactSection from "./components/portfolio/ContactSection";
import PortfolioFooter from "./components/portfolio/PortfolioFooter";
import Login from "./components/Login";
import ResetPassword from "./components/ResetPassword";
import AdminDashboard from "./components/AdminDashboard";
import ProtectedRoute from "./components/ProtectedRoute";

/* Jangan pernah biarkan URL yang tidak dikenal merender halaman kosong —
   pengunjung (dan crawler) menganggap situs rusak. Arahkan ke beranda. */
function NotFoundRedirect() {
  useEffect(() => {
    window.location.replace("/");
  }, []);
  return null;
}

const sectionVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 120, damping: 18 } },
};

const ScrollSection = ({ children }) => (
  <motion.div
    variants={sectionVariants}
    initial="hidden"
    whileInView="visible"
    viewport={{ once: true, amount: 0.18 }}
  >
    {children}
  </motion.div>
);

/* Defined at module scope so the component identity (and therefore the
   whole page subtree) is not re-created on every App render. */
function PortfolioHome() {
  return (
    <>
      <ScrollSection><PortfolioNav /></ScrollSection>
      <ScrollSection><SideNav /></ScrollSection>
      <ScrollSection><PortfolioHero /></ScrollSection>
      <ScrollSection><AboutSection /></ScrollSection>
      <ScrollSection><WorksGrid /></ScrollSection>
      <ScrollSection><Novel3DShowcase /></ScrollSection>
      <ScrollSection><ServicesSection /></ScrollSection>
      <ScrollSection><DocumentationGallery /></ScrollSection>
      <ScrollSection><FAQSection /></ScrollSection>
      <ScrollSection><JournalSection /></ScrollSection>
      <ScrollSection><ContactSection /></ScrollSection>
      <ScrollSection><PortfolioFooter /></ScrollSection>
    </>
  );
}

function AppRouter() {
  return (
    <Routes>
      <Route path="/" element={<PreLanding />} />
      <Route path="/portfolio" element={<PortfolioHome />} />
      <Route path="/fragments/:contentId" element={<WorkDetail />} />
      <Route path="/login" element={<Login />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route
        path="/admin"
        element={
          <ProtectedRoute>
            <AdminDashboard />
          </ProtectedRoute>
        }
      />
      <Route path="*" element={<NotFoundRedirect />} />
    </Routes>
  );
}

function App() {
  return (
    <div className="App">
      <BrowserRouter>
        <AppRouter />
      </BrowserRouter>
    </div>
  );
}

export default App;
