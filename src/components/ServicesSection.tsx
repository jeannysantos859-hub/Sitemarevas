import React, { useState } from 'react';
import { Film, Sparkles, Camera, Compass, Share2, ArrowRight, Play, X } from 'lucide-react';
import { ServiceItem } from '../types';

interface ServicesSectionProps {
  services: ServiceItem[];
  onSelectServiceForContact: (serviceTitle: string) => void;
}

export const ServicesSection: React.FC<ServicesSectionProps> = ({
  services,
  onSelectServiceForContact,
}) => {
  const [activeVideoModal, setActiveVideoModal] = useState<{
    url: string;
    title: string;
  } | null>(null);

  // Discrete, elegant service icons
  const renderIcon = (name: string, className: string = 'w-4 h-4') => {
    switch (name) {
      case 'Film':
      case 'Video':
        return <Film className={className} />;
      case 'Sparkles':
      case 'Creativity':
        return <Sparkles className={className} />;
      case 'Camera':
        return <Camera className={className} />;
      case 'Compass':
      case 'Strategy':
        return <Compass className={className} />;
      case 'Share2':
        return <Share2 className={className} />;
      default:
        return <Sparkles className={className} />;
    }
  };

  return (
    <section id="servicios" className="py-16 md:py-24 bg-[#FFFFFF] relative border-b border-[#E5E7EB]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Header */}
        <div className="max-w-3xl mb-12">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#2F5E4E] mb-2.5">
            Servicios Creativos
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl text-[#064E3B] tracking-tight mb-3">
            Soluciones visuales pensadas para crecer
          </h2>
          <p className="text-sm sm:text-base text-[#2F5E4E] leading-relaxed">
            Desde la producción vertical de Reels de alto impacto hasta la fotografía móvil y la estrategia integral: comunicamos el valor de cada marca con una estética cuidada y profesional.
          </p>
        </div>

        {/* Compact, Balanced Service Cards Grid — Without oversized green blocks */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {services.map((service, index) => {
            const hasVideo =
              service.mediaUrl &&
              (service.mediaType === 'video' ||
                /\.(mp4|webm|mov|m4v)($|\?)/i.test(service.mediaUrl));

            return (
              <div
                key={service.id}
                className="group bg-white rounded-xl p-5 border border-[#E5E7EB] hover:border-[#2F5E4E]/40 hover:shadow-sm transition-all duration-200 flex flex-col justify-between"
              >
                <div>
                  {/* Top: Small discrete icon + Order */}
                  <div className="flex items-center justify-between mb-3.5">
                    <div className="w-9 h-9 rounded-lg bg-[#DCE5E0]/70 text-[#064E3B] flex items-center justify-center group-hover:bg-[#064E3B] group-hover:text-white transition-colors shrink-0">
                      {renderIcon(service.icon, 'w-4 h-4')}
                    </div>
                    <span className="text-[11px] font-mono text-[#2F5E4E]/60 font-medium">
                      0{index + 1}
                    </span>
                  </div>

                  {/* Title */}
                  <h3 className="font-display font-bold text-base text-[#064E3B] mb-2 group-hover:text-[#2F5E4E] transition-colors leading-snug">
                    {service.title}
                  </h3>

                  {/* Short description */}
                  <p className="text-xs text-[#2F5E4E] leading-relaxed mb-4">
                    {service.shortDesc}
                  </p>
                </div>

                {/* Bottom: Functional Links */}
                <div className="pt-3.5 border-t border-[#E5E7EB] flex flex-col gap-2">
                  {/* Optional discrete video sample button if video is configured */}
                  {hasVideo && (
                    <button
                      type="button"
                      onClick={() =>
                        setActiveVideoModal({
                          url: service.mediaUrl,
                          title: service.title,
                        })
                      }
                      className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#064E3B] hover:text-[#2F5E4E] transition-colors cursor-pointer text-left"
                    >
                      <span className="w-5 h-5 rounded-full bg-[#DCE5E0] flex items-center justify-center shrink-0">
                        <Play className="w-2.5 h-2.5 fill-current text-[#064E3B] ml-0.5" />
                      </span>
                      <span>Ver vídeo de muestra</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => onSelectServiceForContact(service.title)}
                    className="inline-flex items-center justify-between w-full pt-1 text-xs font-medium text-[#2F5E4E] hover:text-[#064E3B] transition-colors cursor-pointer"
                  >
                    <span>Solicitar propuesta</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

      </div>

      {/* Video Modal Player (Discreet, Clean, No empty boxes) */}
      {activeVideoModal && (
        <div
          className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xs flex items-center justify-center p-4 animate-fadeIn"
          onClick={() => setActiveVideoModal(null)}
        >
          <div
            className="relative bg-black rounded-2xl overflow-hidden max-w-sm w-full shadow-2xl border border-white/20"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-3 bg-black/60 text-white flex items-center justify-between border-b border-white/10">
              <span className="text-xs font-semibold truncate pr-2">
                {activeVideoModal.title}
              </span>
              <button
                onClick={() => setActiveVideoModal(null)}
                className="p-1 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors cursor-pointer"
                aria-label="Cerrar reproductor"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="aspect-[9/16] max-h-[75vh] w-full flex items-center justify-center bg-black">
              <video
                src={activeVideoModal.url}
                controls
                autoPlay
                playsInline
                className="w-full h-full object-contain"
              />
            </div>
          </div>
        </div>
      )}
    </section>
  );
};
