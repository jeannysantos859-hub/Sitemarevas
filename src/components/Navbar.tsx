import React, { useState, useEffect } from 'react';
import { Menu, X, Lock, ArrowUpRight } from 'lucide-react';

interface NavbarProps {
  onOpenAdmin: () => void;
  isAdminLoggedIn: boolean;
  logoUrl?: string;
}

export const Navbar: React.FC<NavbarProps> = ({ onOpenAdmin, isAdminLoggedIn, logoUrl = '/logo-marevas.svg' }) => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Inicio', href: '#inicio' },
    { label: 'Servicios', href: '#servicios' },
    { label: 'Proyectos', href: '#portfolio' },
    { label: 'Planes y precios', href: '#planes' },
    { label: 'Sobre nosotras', href: '#sobre-nosotros' },
    { label: 'Contacto', href: '#contacto' },
  ];

  const handleLinkClick = (href: string) => {
    setMobileMenuOpen(false);
    const element = document.querySelector(href);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-40 transition-all duration-300 ${
        isScrolled
          ? 'bg-white/95 backdrop-blur-md shadow-xs py-3 border-b border-[#E5E7EB]'
          : 'bg-white/85 backdrop-blur-xs py-4.5'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between">
          
          {/* Official Brand Logo */}
          <a
            href="#inicio"
            onClick={(e) => {
              e.preventDefault();
              handleLinkClick('#inicio');
            }}
            className="flex items-center gap-3 group focus-visible:outline-2 focus-visible:outline-[#064E3B]"
          >
            <img
              src={logoUrl || '/logo-marevas.svg'}
              alt="Marevas MKT — Videos · Estrategias · Contenidos · Resultados"
              className="h-10 sm:h-12 w-auto max-w-[170px] sm:max-w-[210px] object-contain group-hover:opacity-90 transition-opacity"
            />
          </a>

          {/* Desktop Nav Links */}
          <nav className="hidden md:flex items-center gap-7" aria-label="Navegación principal">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
                className="text-sm font-medium text-[#2F5E4E] hover:text-[#064E3B] transition-colors relative py-1 after:absolute after:bottom-0 after:left-0 after:w-0 after:h-0.5 after:bg-[#064E3B] hover:after:w-full after:transition-all focus-visible:outline-2 focus-visible:outline-[#064E3B]"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action CTAs & Admin access */}
          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={onOpenAdmin}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all focus-visible:outline-2 focus-visible:outline-[#064E3B] cursor-pointer ${
                isAdminLoggedIn
                  ? 'bg-[#064E3B] text-white hover:bg-[#2F5E4E] shadow-xs'
                  : 'border border-[#064E3B]/25 bg-[#DCE5E0]/40 text-[#064E3B] hover:bg-[#064E3B] hover:text-white'
              }`}
              title={isAdminLoggedIn ? 'Panel de Gestión (Conectado)' : 'Abrir Panel de Administración (Subir vídeos/fotos)'}
            >
              <Lock className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Admin Conectado' : 'Panel Admin'}</span>
            </button>

            <a
              href="#contacto"
              onClick={(e) => {
                e.preventDefault();
                handleLinkClick('#contacto');
              }}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-all duration-200 shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#064E3B]"
            >
              <span>Hablemos de tu marca</span>
              <ArrowUpRight className="w-4 h-4" />
            </a>
          </div>

          {/* Mobile hamburger button & quick admin */}
          <div className="flex md:hidden items-center gap-2">
            <button
              onClick={onOpenAdmin}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1 ${
                isAdminLoggedIn
                  ? 'bg-[#064E3B] text-white'
                  : 'text-[#064E3B] bg-[#DCE5E0]/80 hover:bg-[#DCE5E0] border border-[#064E3B]/20'
              }`}
              aria-label="Panel de Administración"
              title="Abrir Panel Admin"
            >
              <Lock className="w-3.5 h-3.5" />
              <span className="text-[11px] font-bold">Admin</span>
            </button>
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="p-2 rounded-lg text-[#064E3B] hover:bg-[#DCE5E0]/50 focus-visible:outline-2 focus-visible:outline-[#064E3B]"
              aria-label={mobileMenuOpen ? 'Cerrar menú' : 'Abrir menú'}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white/98 backdrop-blur-lg border-b border-[#E5E7EB] px-4 pt-3 pb-6 animate-in slide-in-from-top duration-200">
          <div className="flex flex-col space-y-3">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(link.href);
                }}
                className="text-base font-medium text-[#064E3B] py-2 px-3 rounded-md hover:bg-[#DCE5E0]/40 transition-colors"
              >
                {link.label}
              </a>
            ))}
            <div className="pt-2 border-t border-[#E5E7EB] flex flex-col gap-2">
              <a
                href="#contacto"
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick('#contacto');
                }}
                className="w-full text-center py-2.5 px-4 rounded-lg text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-colors"
              >
                Hablemos de tu marca
              </a>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  onOpenAdmin();
                }}
                className={`w-full text-center py-2.5 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                  isAdminLoggedIn
                    ? 'text-white bg-[#064E3B] hover:bg-[#2F5E4E]'
                    : 'text-[#064E3B] bg-[#DCE5E0]/70 hover:bg-[#DCE5E0] border border-[#064E3B]/20'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                <span>{isAdminLoggedIn ? 'Panel de Administración (Conectado)' : 'Acceso Panel de Administración'}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </header>
  );
};
