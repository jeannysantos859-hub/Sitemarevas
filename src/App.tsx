import React, { useState, useEffect } from 'react';
import { Navbar } from './components/Navbar';
import { Hero } from './components/Hero';
import { ServicesSection } from './components/ServicesSection';
import { PortfolioSection } from './components/PortfolioSection';
import { PricingSection } from './components/PricingSection';
import { AboutSection } from './components/AboutSection';
import { ProcessSection } from './components/ProcessSection';
import { ContactSection } from './components/ContactSection';
import { Footer } from './components/Footer';
import { AdminPanel } from './components/AdminPanel';
import { SiteData } from './types';
import { fetchSiteData, getAdminToken, deleteAdminProject } from './lib/api';
import { FALLBACK_SITE_DATA } from './lib/defaultData';

export default function App() {
  const [data, setData] = useState<SiteData>(() => {
    try {
      const cached = localStorage.getItem('marevas_site_data_cache');
      if (cached) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed.settings && parsed.projects) {
          return parsed;
        }
      }
    } catch {}
    return FALLBACK_SITE_DATA;
  });

  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState(false);
  const [preFilledService, setPreFilledService] = useState<string | undefined>(undefined);

  const loadData = async (retryCount = 0) => {
    try {
      const result = await fetchSiteData();
      setData(result);
      try {
        localStorage.setItem('marevas_site_data_cache', JSON.stringify(result));
      } catch {}
    } catch (err: any) {
      console.warn('Conexión con servidor en segundo plano:', err.message);
      // Auto-retry in case of server cold-start
      if (retryCount < 3) {
        setTimeout(() => loadData(retryCount + 1), 2000 * (retryCount + 1));
      }
    }
  };

  useEffect(() => {
    loadData();
    setIsAdminLoggedIn(Boolean(getAdminToken()));

    // Check URL triggers: ?admin or #admin
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.has('admin') || window.location.hash === '#admin') {
      setIsAdminOpen(true);
    }

    // Keyboard shortcut: Ctrl+Shift+A or Cmd+Shift+A
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && (e.key === 'a' || e.key === 'A')) {
        e.preventDefault();
        setIsAdminOpen((prev) => !prev);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectServiceForContact = (serviceTitle: string) => {
    setPreFilledService(serviceTitle);
    const contactElem = document.getElementById('contacto');
    if (contactElem) {
      contactElem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleDeleteProjectFromSite = async (projectId: string) => {
    try {
      await deleteAdminProject(projectId);
      await loadData();
    } catch (err: any) {
      console.error('Error al eliminar proyecto:', err);
      // If unauthorized, open admin login
      if (err.message && err.message.toLowerCase().includes('sesión')) {
        setIsAdminLoggedIn(false);
        setIsAdminOpen(true);
      }
    }
  };

  return (
    <div className="min-h-screen bg-white text-[#064E3B] selection:bg-[#2F5E4E] selection:text-white">
      {/* Navbar: 1. Inicio, 2. Servicios, 3. Proyectos, 4. Planes y precios, 5. Sobre nosotras, 6. Contacto */}
      <Navbar
        onOpenAdmin={() => setIsAdminOpen(true)}
        isAdminLoggedIn={isAdminLoggedIn}
        logoUrl={data.settings.logoUrl}
      />

      <main id="main-content">
        {/* 1. Hero Section (Inicio) */}
        <Hero
          settings={data.settings}
          onExploreProjects={() => scrollToSection('portfolio')}
          onContactClick={() => scrollToSection('contacto')}
        />

        {/* 2. Services Section (Servicios) */}
        <ServicesSection
          services={data.services}
          onSelectServiceForContact={handleSelectServiceForContact}
        />

        {/* 3. Visual Portfolio & Projects (Proyectos) */}
        <PortfolioSection
          projects={data.projects}
          onOpenProjectContact={(projectTitle) =>
            handleSelectServiceForContact(`Consulta sobre proyecto: ${projectTitle}`)
          }
          onOpenAdmin={() => setIsAdminOpen(true)}
          isAdminLoggedIn={isAdminLoggedIn}
          onDeleteProject={handleDeleteProjectFromSite}
        />

        {/* 4. Planes y Precios (Planos e Preços) */}
        <PricingSection />

        {/* 5. Sobre Marevas (Sobre Nós) */}
        <AboutSection
          settings={data.settings}
          onContactClick={() => scrollToSection('contacto')}
        />

        {/* Proceso de Trabajo */}
        <ProcessSection />

        {/* 6. Contacto & Canales (Contato) */}
        <ContactSection
          settings={data.settings}
          selectedServicePreFill={preFilledService}
          onClearPreFill={() => setPreFilledService(undefined)}
        />
      </main>

      {/* Footer */}
      <Footer
        settings={data.settings}
        onOpenAdmin={() => setIsAdminOpen(true)}
      />

      {/* Floating Official WhatsApp Button */}
      <a
        href="https://wa.me/34653745138?text=%C2%A1Hola%20Marevas%20MKT!%20Me%20gustar%C3%ADa%20consultar%20una%20propuesta%20de%20contenido%20audiovisual."
        target="_blank"
        rel="noopener noreferrer"
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2.5 bg-[#25D366] hover:bg-[#20ba59] text-white px-4 py-3 rounded-full shadow-2xl hover:shadow-emerald-900/30 transition-all duration-300 hover:scale-105 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#25D366] border border-white/20"
        aria-label="Contactar por WhatsApp (+34 653 745 138)"
      >
        <svg className="w-5 h-5 fill-current" viewBox="0 0 24 24">
          <path d="M12.031 6.172c-3.181 0-5.767 2.586-5.768 5.766-.001 1.298.38 2.27 1.019 3.287l-.582 2.128 2.182-.573c.978.58 1.911.928 3.145.929 3.178 0 5.767-2.587 5.768-5.766.001-3.187-2.575-5.77-5.764-5.771zm3.392 8.244c-.144.405-.837.774-1.17.824-.312.045-.693.074-2.147-.532-1.859-.774-3.045-2.668-3.138-2.792-.092-.124-.757-.999-.757-1.91 0-.912.482-1.358.653-1.545.172-.187.375-.233.5-.233.125 0 .25.002.359.006.115.005.27-.043.422.325.158.381.54 1.32.587 1.415.047.094.078.204.015.328-.063.125-.094.204-.188.312-.094.11-.198.245-.282.329-.094.094-.192.196-.083.383.11.187.487.804 1.045 1.302.72.641 1.327.84 1.514.933.187.094.296.079.405-.047.11-.125.468-.545.593-.733.125-.187.25-.156.422-.093.172.062 1.092.515 1.28.608.187.094.312.141.359.219.046.078.046.452-.098.857zM12 2C6.477 2 2 6.477 2 12c0 1.891.524 3.662 1.434 5.176L2 22l4.957-1.399C8.423 21.493 10.153 22 12 22c5.523 0 10-4.477 10-10S17.523 2 12 2z"/>
        </svg>
        <span className="text-xs font-bold tracking-wide">
          WhatsApp
        </span>
      </a>

      {/* Admin Panel Modal / Dashboard */}
      <AdminPanel
        isOpen={isAdminOpen}
        onClose={() => setIsAdminOpen(false)}
        onDataUpdated={loadData}
        isLoggedIn={isAdminLoggedIn}
        setIsLoggedIn={setIsAdminLoggedIn}
      />
    </div>
  );
}
