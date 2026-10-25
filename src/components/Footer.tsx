import React from 'react';
import { ArrowUp, Instagram, MessageSquare, Mail, Lock, Heart } from 'lucide-react';
import { BrandMark } from './WaveGraphic';
import { SiteSettings } from '../types';

interface FooterProps {
  settings: SiteSettings;
  onOpenAdmin: () => void;
}

export const Footer: React.FC<FooterProps> = ({ settings, onOpenAdmin }) => {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#064E3B] text-white pt-16 pb-12 border-t border-[#2F5E4E] relative overflow-hidden">
      
      {/* Subtle background glow */}
      <div className="absolute top-0 right-0 w-80 h-80 bg-[#2F5E4E]/30 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-white/10">
          
          {/* Brand Presentation (2 cols) */}
          <div className="lg:col-span-2 flex flex-col items-start">
            <div className="mb-4">
              <div className="p-2.5 rounded-xl bg-white/95 inline-block shadow-sm">
                <img
                  src={settings.logoUrl || '/logo-marevas.svg'}
                  alt="Marevas MKT"
                  className="h-10 w-auto object-contain"
                />
              </div>
            </div>

            <p className="text-xs sm:text-sm text-[#DCE5E0] leading-relaxed max-w-sm mb-6">
              Ideas que se convierten en contenido. Contenido que impulsa marcas. Especialistas en producción vertical de Reels, fotografía móvil y estrategias de redes sociales en Madrid.
            </p>

            <div className="flex items-center gap-3">
              <a
                href="https://wa.me/34653745138"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#DCE5E0] hover:text-white flex items-center justify-center transition-colors"
                title="WhatsApp: +34 653 745 138"
                aria-label="WhatsApp de Marevas MKT"
              >
                <MessageSquare className="w-4 h-4" />
              </a>

              <a
                href="https://www.instagram.com/marevasmkt.madrid/"
                target="_blank"
                rel="noopener noreferrer"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#DCE5E0] hover:text-white flex items-center justify-center transition-colors"
                title="Instagram: @marevasmkt.madrid"
                aria-label="Instagram de Marevas MKT"
              >
                <Instagram className="w-4 h-4" />
              </a>

              <a
                href="mailto:marevasmarketing@gmail.com"
                className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 text-[#DCE5E0] hover:text-white flex items-center justify-center transition-colors"
                title="Correo: marevasmarketing@gmail.com"
                aria-label="Correo de Marevas MKT"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Nav Links Column */}
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white mb-4">
              Navegación
            </h4>
            <ul className="space-y-2.5 text-xs text-[#DCE5E0]">
              <li>
                <a href="#inicio" className="hover:text-white transition-colors">
                  Inicio
                </a>
              </li>
              <li>
                <a href="#servicios" className="hover:text-white transition-colors">
                  Servicios Creativos
                </a>
              </li>
              <li>
                <a href="#portfolio" className="hover:text-white transition-colors">
                  Portafolio de Proyectos
                </a>
              </li>
              <li>
                <a href="#sobre-nosotros" className="hover:text-white transition-colors">
                  Sobre nosotras
                </a>
              </li>
              <li>
                <a href="#proceso" className="hover:text-white transition-colors">
                  Metodología de Trabajo
                </a>
              </li>
              <li>
                <a href="#contacto" className="hover:text-white transition-colors">
                  Contacto
                </a>
              </li>
            </ul>
          </div>

          {/* Services Column */}
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white mb-4">
              Servicios
            </h4>
            <ul className="space-y-2.5 text-xs text-[#DCE5E0]">
              <li>Producción de Reels</li>
              <li>Creación de contenido</li>
              <li>Fotografía Mobile</li>
              <li>Estrategia de contenido</li>
              <li>Gestión de redes sociales</li>
            </ul>
          </div>

          {/* Location & Admin */}
          <div>
            <h4 className="font-display font-bold text-xs uppercase tracking-wider text-white mb-4">
              Ubicación & Gestión
            </h4>
            <p className="text-xs text-[#DCE5E0] leading-relaxed mb-4">
              {settings.location || 'Madrid, España'}
              <br />
              <a
                href="mailto:marevasmarketing@gmail.com"
                className="text-[#DCE5E0] hover:text-white hover:underline transition-colors block mt-1"
              >
                marevasmarketing@gmail.com
              </a>
            </p>
          </div>

        </div>

        {/* Bottom bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#DCE5E0]/70">
          <div className="flex items-center gap-4">
            <span>© {new Date().getFullYear()} MAREVAS MKT. Todos los derechos reservados.</span>
            <button
              onClick={onOpenAdmin}
              className="text-[11px] text-[#DCE5E0]/40 hover:text-white transition-colors cursor-pointer inline-flex items-center gap-1"
              title="Acceso privado para el equipo"
            >
              <Lock className="w-2.5 h-2.5" />
              <span>Acceso interno</span>
            </button>
          </div>

          <div className="flex items-center gap-6">
            <span className="text-[11px]">
              Especialistas en Reels & Contenido Móvil
            </span>
            <button
              onClick={scrollToTop}
              className="p-2 rounded-lg bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
              aria-label="Volver arriba"
            >
              <ArrowUp className="w-4 h-4" />
            </button>
          </div>
        </div>

      </div>
    </footer>
  );
};
