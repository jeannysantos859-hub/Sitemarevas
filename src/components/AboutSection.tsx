import React from 'react';
import { Sparkles, Eye, Target, Zap, ArrowUpRight, Camera, Film, Compass } from 'lucide-react';
import { WaveGraphic } from './WaveGraphic';
import { SiteSettings } from '../types';

interface AboutSectionProps {
  settings: SiteSettings;
  onContactClick: () => void;
  onOpenAdmin?: () => void;
}

export const AboutSection: React.FC<AboutSectionProps> = ({ settings, onContactClick }) => {
  return (
    <section id="sobre-nosotros" className="py-20 md:py-32 bg-[#064E3B] text-white relative overflow-hidden">
      
      {/* Abstract wave lines in background */}
      <WaveGraphic variant="dark" className="absolute bottom-0 left-0 right-0 opacity-20 pointer-events-none" />
      <div className="absolute top-10 right-1/4 w-96 h-96 bg-[#2F5E4E]/40 rounded-full blur-3xl pointer-events-none -z-0" />
      <div className="absolute bottom-20 left-10 w-80 h-80 bg-[#DCE5E0]/10 rounded-full blur-3xl pointer-events-none -z-0" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        
        {/* Top Header: Sobre Marevas */}
        <div className="max-w-3xl mb-14">
          <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#DCE5E0] mb-3">
            <span>Sobre Marevas</span>
            <span aria-hidden="true" className="text-white/40">·</span>
            <span>Identidad & Propósito</span>
          </div>

          <h2 className="font-display font-extrabold text-3xl sm:text-4xl lg:text-5xl text-white tracking-tight leading-[1.15] mb-6">
            Creatividad con intención para marcas que evolucionan
          </h2>

          <p className="text-base sm:text-lg text-[#DCE5E0] leading-relaxed">
            Marevas MKT es una agencia creativa especializada en producción audiovisual, fotografía móvil y estrategia de contenido. Ayudamos a los negocios a comunicar mejor su valor, conectar con su público y construir una presencia digital coherente a través de contenido visual pensado para sus objetivos.
          </p>
        </div>

        {/* Philosophy Copy & Value Pillars */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start pt-8 border-t border-white/15">
          
          {/* Left Column: Core Agency Philosophy */}
          <div className="lg:col-span-7 flex flex-col items-start space-y-6">
            
            <h3 className="font-display font-bold text-2xl sm:text-3xl text-white tracking-tight">
              {settings.aboutTitle || 'Creatividad en movimiento. Marcas en evolución.'}
            </h3>

            <div className="space-y-4 text-sm sm:text-base text-[#DCE5E0] leading-relaxed">
              <p>
                {settings.aboutText1 ||
                  'Marevas MKT nace de la idea de que las marcas necesitan evolucionar, comunicar con intención y crear contenido que conecte con las personas.'}
              </p>
              <p>
                {settings.aboutText2 ||
                  'Combinamos creatividad, estrategia y producción audiovisual para desarrollar contenido adaptado a cada negocio y a sus objetivos.'}
              </p>
              <p className="text-white font-medium">
                {settings.aboutText3 ||
                  'Nuestra forma de trabajar une planificación, sensibilidad visual y atención a los detalles para construir una presencia digital más coherente y profesional.'}
              </p>
            </div>

            {/* Disciplines Highlights */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 w-full pt-4">
              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#2F5E4E] text-[#DCE5E0] shrink-0">
                  <Film className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Reels & Vídeo</div>
                  <div className="text-[11px] text-[#DCE5E0]">Formato 9:16 nativo</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#2F5E4E] text-[#DCE5E0] shrink-0">
                  <Camera className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Fotografía Mobile</div>
                  <div className="text-[11px] text-[#DCE5E0]">Detalle de producto</div>
                </div>
              </div>

              <div className="p-3.5 rounded-xl bg-white/10 backdrop-blur-xs border border-white/10 flex items-center gap-3">
                <div className="p-2 rounded-lg bg-[#2F5E4E] text-[#DCE5E0] shrink-0">
                  <Compass className="w-4 h-4" />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">Estrategia</div>
                  <div className="text-[11px] text-[#DCE5E0]">Objetivos y medición</div>
                </div>
              </div>
            </div>

            <div className="pt-2">
              <button
                onClick={onContactClick}
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-lg text-sm font-semibold bg-white text-[#064E3B] hover:bg-[#DCE5E0] transition-colors shadow-sm cursor-pointer focus-visible:outline-2 focus-visible:outline-white"
              >
                <span>Hablemos de impulsar tu marca</span>
                <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

          </div>

          {/* Right Column: Values Pillars */}
          <div className="lg:col-span-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            <div className="p-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#2F5E4E] flex items-center justify-center text-[#DCE5E0] mb-3">
                <Target className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-base text-white mb-1.5">
                Comunicación con Intención
              </h4>
              <p className="text-xs text-[#DCE5E0] leading-relaxed">
                Cada segundo del Reel o fotografía responde a un propósito claro de atracción y valor de marca.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#2F5E4E] flex items-center justify-center text-[#DCE5E0] mb-3">
                <Eye className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-base text-white mb-1.5">
                Sensibilidad Visual
              </h4>
              <p className="text-xs text-[#DCE5E0] leading-relaxed">
                Cuidado meticuloso del encuadre, la luz natural y el ritmo de edición en cada plano.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#2F5E4E] flex items-center justify-center text-[#DCE5E0] mb-3">
                <Zap className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-base text-white mb-1.5">
                Producción Móvil Ágil
              </h4>
              <p className="text-xs text-[#DCE5E0] leading-relaxed">
                Grabación in situ sin montajes invasivos que interrumpan la actividad comercial de tu negocio.
              </p>
            </div>

            <div className="p-5 rounded-xl bg-white/5 backdrop-blur-md border border-white/10 hover:border-white/25 transition-all">
              <div className="w-9 h-9 rounded-lg bg-[#2F5E4E] flex items-center justify-center text-[#DCE5E0] mb-3">
                <Sparkles className="w-4 h-4" />
              </div>
              <h4 className="font-display font-bold text-base text-white mb-1.5">
                Evolución Continua
              </h4>
              <p className="text-xs text-[#DCE5E0] leading-relaxed">
                Revisamos métricas reales para optimizar la cadencia y descubrir nuevas oportunidades de impacto.
              </p>
            </div>

          </div>

        </div>

      </div>
    </section>
  );
};
