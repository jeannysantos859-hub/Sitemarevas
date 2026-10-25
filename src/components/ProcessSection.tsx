import React from 'react';
import { Search, Compass, Video, TrendingUp, CheckCircle2 } from 'lucide-react';

export const ProcessSection: React.FC = () => {
  const steps = [
    {
      step: '01',
      title: 'Descubrimiento',
      subtitle: 'Conocemos la marca y sus objetivos',
      description:
        'Analizamos tu identidad visual actual, el perfil de cliente al que te diriges, qué competidores destacan y qué tipo de mensaje deseas proyectar.',
      icon: Search,
      deliverable: 'Auditoría inicial y briefing de enfoque',
    },
    {
      step: '02',
      title: 'Estrategia',
      subtitle: 'Organizamos las ideas y definimos la dirección creativa',
      description:
        'Diseñamos el plan de contenidos mensual, los ganchos de los primeros 3 segundos de los Reels, los guiones visuales y la paleta de estilo.',
      icon: Compass,
      deliverable: 'Calendario editorial y guiones de rodaje',
    },
    {
      step: '03',
      title: 'Producción',
      subtitle: 'Grabamos, fotografiamos y editamos el contenido',
      description:
        'Sesión de grabación y fotografía in situ con móvil de alta gama, iluminación adecuada y edición rítmica optimizada para el formato vertical.',
      icon: Video,
      deliverable: 'Piezas terminadas en 4K y 9:16 listas para publicar',
    },
    {
      step: '04',
      title: 'Evolución',
      subtitle: 'Revisamos el contenido y proponemos nuevas oportunidades',
      description:
        'Medimos la retención, el alcance de los Reels y la interacción de la comunidad para ajustar las siguientes producciones y mantener la tendencia ascendente.',
      icon: TrendingUp,
      deliverable: 'Informe de rendimiento y siguientes pasos',
    },
  ];

  return (
    <section id="proceso" className="py-20 md:py-32 bg-[#FFFFFF] relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="max-w-3xl mb-16">
          <div className="text-xs font-semibold uppercase tracking-widest text-[#2F5E4E] mb-3">
            Metodología de Trabajo
          </div>
          <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#064E3B] tracking-tight mb-4">
            Un proceso claro, ágil y sin complicaciones
          </h2>
          <p className="text-base sm:text-lg text-[#2F5E4E] leading-relaxed">
            Eliminamos la incertidumbre en la creación de contenido con cuatro etapas diseñadas para que solo te preocupes de atender a tus clientes.
          </p>
        </div>

        {/* 4 Steps Timeline Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8 relative">
          
          {steps.map((item, idx) => {
            const Icon = item.icon;
            return (
              <div
                key={item.step}
                className="group p-6 sm:p-7 rounded-2xl bg-white border border-[#E5E7EB] hover:border-[#064E3B] transition-all duration-300 shadow-xs hover:shadow-lg flex flex-col justify-between relative"
              >
                <div>
                  {/* Step header */}
                  <div className="flex items-center justify-between mb-5">
                    <span className="font-mono text-2xl font-bold text-[#064E3B] opacity-90 group-hover:text-[#2F5E4E] transition-colors">
                      {item.step}
                    </span>
                    <div className="p-2.5 rounded-xl bg-[#DCE5E0]/70 text-[#064E3B] group-hover:bg-[#064E3B] group-hover:text-white transition-colors">
                      <Icon className="w-5 h-5" />
                    </div>
                  </div>

                  <h3 className="font-display font-bold text-xl text-[#064E3B] mb-1">
                    {item.title}
                  </h3>

                  <div className="text-xs font-semibold text-[#2F5E4E] mb-3 leading-snug">
                    {item.subtitle}
                  </div>

                  <p className="text-xs text-[#2F5E4E] leading-relaxed mb-6">
                    {item.description}
                  </p>
                </div>

                {/* Step Deliverable */}
                <div className="pt-4 border-t border-[#E5E7EB] flex items-start gap-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-[#064E3B] shrink-0 mt-0.5" />
                  <span className="text-[11px] font-medium text-[#064E3B] leading-tight">
                    {item.deliverable}
                  </span>
                </div>
              </div>
            );
          })}

        </div>

      </div>
    </section>
  );
};
