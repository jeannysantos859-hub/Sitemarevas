import React from 'react';
import {
  ArrowDown,
  Film,
  Camera,
  Compass,
  ArrowUpRight,
  Sparkles,
  CheckCircle2,
} from 'lucide-react';
import { WaveGraphic } from './WaveGraphic';
import { SiteSettings } from '../types';

interface HeroProps {
  settings: SiteSettings;
  onExploreProjects: () => void;
  onContactClick: () => void;
}

export const Hero: React.FC<HeroProps> = ({ settings, onExploreProjects, onContactClick }) => {
  return (
    <section id="inicio" className="relative pt-28 pb-16 md:pt-36 md:pb-24 overflow-hidden bg-gradient-to-b from-white via-[#FFFFFF] to-[#DCE5E0]/20">
      {/* Background ambient wave curves */}
      <div className="absolute inset-0 pointer-events-none -z-10">
        <WaveGraphic variant="glow" className="absolute top-10 right-0 w-[800px] opacity-40" />
        <div className="absolute top-24 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-[#DCE5E0]/40 rounded-full blur-3xl -z-10" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          
          {/* Left Column: Headline & Editorial Presentation */}
          <div className="lg:col-span-7 flex flex-col items-start">
            
            {/* Metadata kicker */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#DCE5E0]/60 border border-[#2F5E4E]/20 text-xs font-semibold uppercase tracking-wider text-[#064E3B] mb-5">
              <Sparkles className="w-3.5 h-3.5 text-[#2F5E4E]" />
              <span>Agencia Creativa Audiovisual</span>
              <span aria-hidden="true" className="text-[#2F5E4E]/40">·</span>
              <span>Madrid</span>
            </div>

            {/* Main Headline */}
            <h1 className="font-display font-extrabold text-3xl sm:text-5xl lg:text-6xl text-[#064E3B] tracking-tight leading-[1.1] mb-6">
              Ideas que se convierten en contenido.{' '}
              <span className="text-[#2F5E4E] font-medium block mt-2 sm:mt-1">
                Contenido que impulsa marcas.
              </span>
            </h1>

            {/* Secondary Copy */}
            <p className="text-base sm:text-lg text-[#2F5E4E] font-normal leading-relaxed max-w-2xl mb-8">
              {settings.heroSubtext ||
                'Creamos vídeos, fotografías y estrategias de contenido para ayudar a las marcas a comunicar mejor, destacar en redes sociales y conectar con su público.'}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-wrap items-center gap-4 w-full sm:w-auto">
              <button
                onClick={onExploreProjects}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg text-sm sm:text-base font-semibold bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-all duration-200 shadow-sm hover:shadow-md flex items-center justify-center gap-2 group cursor-pointer focus-visible:outline-2 focus-visible:outline-[#064E3B]"
              >
                <span>Descubrir nuestros proyectos</span>
                <ArrowDown className="w-4 h-4 group-hover:translate-y-0.5 transition-transform" />
              </button>

              <button
                onClick={onContactClick}
                className="w-full sm:w-auto px-6 py-3.5 rounded-lg text-sm sm:text-base font-semibold bg-white text-[#064E3B] border border-[#2F5E4E]/30 hover:bg-[#DCE5E0]/40 hover:border-[#064E3B] transition-all duration-200 shadow-2xs flex items-center justify-center gap-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-[#064E3B]"
              >
                <span>Hablemos de tu marca</span>
                <ArrowUpRight className="w-4 h-4 text-[#2F5E4E]" />
              </button>
            </div>

            {/* Editorial highlights bar */}
            <div className="mt-12 pt-8 border-t border-[#E5E7EB] grid grid-cols-3 gap-4 sm:gap-8 w-full max-w-xl">
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[#064E3B]">9:16</div>
                <div className="text-xs text-[#2F5E4E] mt-0.5">Formato vertical Reels nativo</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[#064E3B]">4K</div>
                <div className="text-xs text-[#2F5E4E] mt-0.5">Fotografía & vídeo móvil</div>
              </div>
              <div>
                <div className="text-2xl sm:text-3xl font-display font-bold text-[#064E3B]">100%</div>
                <div className="text-xs text-[#2F5E4E] mt-0.5">Estrategia con propósito</div>
              </div>
            </div>

          </div>

          {/* Right Column: Branded Editorial Pillars (Clean, elegant, no phone frame) */}
          <div className="lg:col-span-5 flex flex-col gap-4">
            
            {/* Card 1: Reels */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#2F5E4E]/50 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Film className="w-5 h-5 text-[#DCE5E0]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-base text-[#064E3B]">
                      Producción de Reels
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#DCE5E0]/70 text-[#064E3B]">
                      Vertical 9:16
                    </span>
                  </div>
                  <p className="text-xs text-[#2F5E4E] leading-relaxed">
                    Grabación in situ y edición dinámica pensada para captar la atención en los primeros 3 segundos y comunicar el valor de tu negocio.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 2: Mobile Photo */}
            <div className="p-5 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#2F5E4E]/50 shadow-sm hover:shadow-md transition-all duration-200">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-[#2F5E4E] text-white flex items-center justify-center shrink-0 shadow-xs">
                  <Camera className="w-5 h-5 text-[#DCE5E0]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-base text-[#064E3B]">
                      Fotografía Mobile
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-[#DCE5E0]/70 text-[#064E3B]">
                      Detalle & Marca
                    </span>
                  </div>
                  <p className="text-xs text-[#2F5E4E] leading-relaxed">
                    Captura y edición de fotografías con móvil, con atención a la composición, la luz y el color para destacar la identidad de cada marca.
                  </p>
                </div>
              </div>
            </div>

            {/* Card 3: Strategy */}
            <div className="p-5 rounded-2xl bg-gradient-to-br from-[#064E3B] to-[#2F5E4E] text-white shadow-md">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-xl bg-white/15 text-white flex items-center justify-center shrink-0 backdrop-blur-xs">
                  <Compass className="w-5 h-5 text-[#DCE5E0]" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <h3 className="font-display font-bold text-base text-white">
                      Estrategia de Contenido
                    </h3>
                    <span className="text-[10px] font-mono font-medium px-2 py-0.5 rounded bg-white/20 text-[#DCE5E0]">
                      Planificación
                    </span>
                  </div>
                  <p className="text-xs text-[#DCE5E0] leading-relaxed">
                    Organización de ideas, calendario de publicaciones y desarrollo de una presencia digital coherente y orientada a objetivos.
                  </p>
                </div>
              </div>
            </div>

            {/* Micro reassurance badge */}
            <div className="flex items-center justify-center gap-2 text-xs text-[#2F5E4E] font-medium pt-1">
              <CheckCircle2 className="w-4 h-4 text-[#064E3B]" />
              <span>Contenido visual personalizado para cada negocio · Madrid</span>
            </div>

          </div>

        </div>
      </div>

      {/* Decorative Wave Divider */}
      <WaveGraphic variant="subtle" className="mt-12 -mb-2" />
    </section>
  );
};
