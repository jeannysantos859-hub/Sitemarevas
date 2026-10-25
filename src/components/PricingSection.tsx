import React, { useState } from 'react';
import { Check, Info, ChevronDown, ChevronUp, MessageCircle, Mail, Instagram, Sparkles, ArrowRight } from 'lucide-react';

interface Plan {
  id: string;
  name: string;
  price: string;
  period?: string;
  tag?: string;
  popular?: boolean;
  description: string;
  features: string[];
  notIncluded?: string;
}

const PLANS: Plan[] = [
  {
    id: 'plan-esencial',
    name: 'PLAN ESENCIAL',
    price: '249 €',
    period: '/mes',
    description: 'Para negocios que necesitan mantener una presencia activa y organizada en redes sociales.',
    features: [
      '8 publicaciones mensuales.',
      'Planificación del contenido.',
      'Diseño de publicaciones.',
      'Redacción de textos y selección de hashtags.',
      'Organización de un calendario de contenidos.',
    ],
    notIncluded: 'No incluye grabación presencial ni publicación diaria de Stories.',
  },
  {
    id: 'plan-presencial',
    name: 'PLAN PRESENCIAL',
    price: '349 €',
    period: '',
    tag: 'Audiovisual en Madrid',
    description: 'Para negocios que necesitan vídeos profesionales grabados en sus propias instalaciones.',
    features: [
      '1 sesión presencial de grabación de hasta 90 minutos.',
      '4 Reels grabados y editados.',
      'Planificación de ideas para los vídeos.',
      'Edición y adaptación de los vídeos a redes sociales.',
    ],
    notIncluded: 'Este plan está orientado a la creación de contenido audiovisual. No incluye la gestión de redes sociales ni la publicación del contenido.',
  },
  {
    id: 'plan-content',
    name: 'PLAN CONTENT',
    price: '449 €',
    period: '/mes',
    tag: 'El más solicitado',
    popular: true,
    description: 'Para negocios que quieren combinar contenido audiovisual y gestión de Instagram.',
    features: [
      '1 sesión presencial de grabación.',
      '4 Reels editados.',
      '4 publicaciones gráficas.',
      'Hasta 4 secuencias de Stories.',
      'Planificación de contenidos.',
      'Redacción de textos y hashtags.',
      'Gestión y publicación del contenido en Instagram.',
    ],
  },
  {
    id: 'plan-premium',
    name: 'PLAN PREMIUM',
    price: '749 €',
    period: '/mes',
    tag: 'Doble Red Social',
    description: 'Para negocios que necesitan una producción de contenido más amplia y presencia en dos redes sociales.',
    features: [
      '2 sesiones presenciales de grabación de hasta 90 minutos cada una.',
      '8 Reels editados.',
      '8 publicaciones gráficas.',
      'Hasta 8 secuencias de Stories.',
      'Planificación estratégica de contenidos.',
      'Redacción de textos y hashtags.',
      'Gestión y publicación en Instagram y una segunda red social acordada.',
      'Organización del calendario de contenidos.',
    ],
  },
  {
    id: 'plan-360',
    name: 'PLAN 360°',
    price: '990 €',
    period: '/mes',
    tag: 'Gestión Completa',
    description: 'Para negocios que buscan una gestión de contenido más completa y una presencia digital constante.',
    features: [
      '2 sesiones presenciales de grabación.',
      '8 Reels editados.',
      '8 publicaciones gráficas.',
      'Stories hasta 5 días por semana.',
      'Planificación estratégica de contenidos.',
      'Redacción de textos y hashtags.',
      'Gestión y publicación en Instagram y una segunda red social acordada.',
      'Monitorización de la actividad de las cuentas.',
      'Reunión de seguimiento para revisar el contenido y planificar los siguientes pasos.',
    ],
  },
];

const GENERAL_CONDITIONS = [
  'Los planes mensuales se abonan por adelantado.',
  'Las sesiones presenciales se realizan en Madrid y deben concertarse previamente. Los desplazamientos adicionales pueden tener un coste extra.',
  'El cliente debe facilitar la información, los materiales y las aprobaciones necesarios para desarrollar el contenido.',
  'Cada pieza de contenido incluye una ronda de ajustes.',
  'Los servicios adicionales que no estén incluidos en el plan contratado se presupuestarán por separado.',
  'Los archivos originales, brutos y editables no están incluidos, salvo acuerdo previo.',
  'La gestión de mensajes privados y WhatsApp, los anuncios de pago, las grabaciones adicionales, los eventos, los modelos, los influencers, el desarrollo web y otros servicios no especificados en el plan quedan excluidos.',
  'Marevas MKT no garantiza un número concreto de seguidores, visualizaciones, clientes o ventas, ya que los resultados dependen de diversos factores.',
];

export const PricingSection: React.FC = () => {
  const [conditionsOpen, setConditionsOpen] = useState(false);

  const getWhatsAppLink = (planName: string, price: string, period?: string) => {
    const message = `¡Hola Marevas MKT! Me gustaría solicitar información sobre el ${planName} (${price}${period || ''}).`;
    return `https://wa.me/34653745138?text=${encodeURIComponent(message)}`;
  };

  const generalWhatsAppLink = `https://wa.me/34653745138?text=${encodeURIComponent('¡Hola Marevas MKT! Quisiera consultar sobre vuestros planes y servicios para mi negocio.')}`;

  return (
    <section id="planes" className="py-20 md:py-28 bg-[#F4F6F5]/50 border-t border-[#E5E7EB] relative scroll-mt-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Introduction */}
        <div className="max-w-3xl mx-auto text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#DCE5E0]/60 border border-[#2F5E4E]/20 text-[#064E3B] text-xs font-semibold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-[#064E3B]" />
            <span>Planes y precios</span>
          </div>
          
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold text-[#064E3B] tracking-tight leading-tight mb-5">
            Encuentra el plan ideal para tu negocio
          </h2>
          
          <p className="text-base sm:text-lg text-[#2F5E4E] leading-relaxed">
            En Marevas MKT creamos contenido estratégico para ayudar a las marcas a comunicar mejor, reforzar su presencia digital y conectar con su público.
          </p>
          <p className="text-sm sm:text-base text-[#2F5E4E]/80 mt-2 font-medium">
            Descubre nuestros planes y elige el que mejor se adapte a las necesidades de tu negocio.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 items-stretch mb-14">
          {PLANS.map((plan) => {
            const isPopular = plan.popular;

            return (
              <div
                key={plan.id}
                className={`relative rounded-2xl flex flex-col justify-between transition-all duration-300 hover:shadow-xl ${
                  isPopular
                    ? 'bg-[#064E3B] text-white shadow-lg shadow-[#064E3B]/10 border-2 border-[#064E3B] ring-4 ring-[#064E3B]/10 md:scale-[1.02]'
                    : 'bg-white text-[#064E3B] border border-[#E5E7EB] shadow-xs'
                }`}
              >
                {/* Popular or Category Tag */}
                {plan.tag && (
                  <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold tracking-wide shadow-xs uppercase ${
                        isPopular
                          ? 'bg-[#DCE5E0] text-[#064E3B]'
                          : 'bg-[#064E3B] text-white'
                      }`}
                    >
                      {plan.tag}
                    </span>
                  </div>
                )}

                {/* Card Header & Content */}
                <div className="p-6 sm:p-7 flex-1 flex flex-col">
                  {/* Plan Name */}
                  <h3
                    className={`font-display font-bold text-lg sm:text-xl tracking-tight mb-2 ${
                      isPopular ? 'text-white' : 'text-[#064E3B]'
                    }`}
                  >
                    {plan.name}
                  </h3>

                  {/* Plan Description */}
                  <p
                    className={`text-xs sm:text-sm min-h-[40px] mb-5 ${
                      isPopular ? 'text-white/85' : 'text-[#2F5E4E]'
                    }`}
                  >
                    {plan.description}
                  </p>

                  {/* Price Block */}
                  <div className="mb-6 pb-6 border-b border-current/15">
                    <div className="flex items-baseline gap-1">
                      <span className="font-display font-extrabold text-3xl sm:text-4xl tracking-tight">
                        {plan.price}
                      </span>
                      {plan.period && (
                        <span
                          className={`text-sm font-medium ${
                            isPopular ? 'text-white/80' : 'text-[#2F5E4E]'
                          }`}
                        >
                          {plan.period}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Features List */}
                  <div className="flex-1">
                    <p
                      className={`text-xs font-bold uppercase tracking-wider mb-3.5 ${
                        isPopular ? 'text-white/90' : 'text-[#064E3B]'
                      }`}
                    >
                      Servicios incluidos:
                    </p>
                    <ul className="space-y-2.5 mb-5">
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm leading-snug">
                          <Check
                            className={`w-4 h-4 shrink-0 mt-0.5 ${
                              isPopular ? 'text-[#DCE5E0]' : 'text-[#064E3B]'
                            }`}
                          />
                          <span className={isPopular ? 'text-white/90' : 'text-[#2F5E4E]'}>
                            {feature}
                          </span>
                        </li>
                      ))}
                    </ul>

                    {/* Exclusions or Specific Focus Note */}
                    {plan.notIncluded && (
                      <div
                        className={`p-3 rounded-lg text-xs leading-relaxed mb-4 flex items-start gap-2 ${
                          isPopular
                            ? 'bg-white/10 text-white/80 border border-white/10'
                            : 'bg-[#F4F6F5] text-[#2F5E4E]/90 border border-[#E5E7EB]'
                        }`}
                      >
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 opacity-80" />
                        <span>{plan.notIncluded}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Card CTA Button */}
                <div className="p-6 sm:p-7 pt-0">
                  <a
                    href={getWhatsAppLink(plan.name, plan.price, plan.period)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`w-full py-3 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all duration-200 cursor-pointer shadow-xs focus-visible:outline-2 focus-visible:outline-offset-2 ${
                      isPopular
                        ? 'bg-white text-[#064E3B] hover:bg-[#DCE5E0] focus-visible:outline-white'
                        : 'bg-[#064E3B] text-white hover:bg-[#2F5E4E] focus-visible:outline-[#064E3B]'
                    }`}
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Solicitar información</span>
                  </a>
                </div>
              </div>
            );
          })}
        </div>

        {/* General Contact Callout & Channels */}
        <div className="bg-white rounded-2xl border border-[#E5E7EB] p-6 sm:p-8 mb-12 shadow-xs">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="text-center md:text-left">
              <h3 className="font-display font-bold text-xl sm:text-2xl text-[#064E3B] mb-2">
                ¿Tienes dudas sobre qué plan se adapta a tu marca?
              </h3>
              <p className="text-sm text-[#2F5E4E]">
                Escríbenos directamente o concierta una llamada para analizar las necesidades de tu negocio.
              </p>
              
              {/* Contact Channels */}
              <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 sm:gap-6 mt-4 text-xs font-medium text-[#2F5E4E]">
                <a
                  href="https://wa.me/34653745138"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#064E3B] transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-[#064E3B]" />
                  <span>WhatsApp: +34 653 745 138</span>
                </a>
                <a
                  href="https://instagram.com/marevasmkt.madrid"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 hover:text-[#064E3B] transition-colors"
                >
                  <Instagram className="w-4 h-4 text-[#064E3B]" />
                  <span>Instagram: @marevasmkt.madrid</span>
                </a>
                <a
                  href="mailto:marevasmarketing@gmail.com"
                  className="flex items-center gap-1.5 hover:text-[#064E3B] transition-colors"
                >
                  <Mail className="w-4 h-4 text-[#064E3B]" />
                  <span>marevasmarketing@gmail.com</span>
                </a>
              </div>
            </div>

            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <a
                href={generalWhatsAppLink}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-all duration-200 shadow-xs cursor-pointer text-center"
              >
                <MessageCircle className="w-4 h-4" />
                <span>Contactar con Marevas</span>
              </a>
              <a
                href="#contacto"
                className="inline-flex items-center justify-center gap-2 px-5 py-3.5 rounded-xl text-sm font-semibold bg-[#DCE5E0]/60 text-[#064E3B] hover:bg-[#DCE5E0] transition-all duration-200 cursor-pointer text-center"
              >
                <span>Formulario web</span>
                <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        </div>

        {/* Collapsible General Conditions */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl border border-[#E5E7EB] overflow-hidden shadow-xs">
          <button
            onClick={() => setConditionsOpen(!conditionsOpen)}
            className="w-full p-5 sm:p-6 flex items-center justify-between text-left hover:bg-[#F4F6F5]/50 transition-colors focus-visible:outline-2 focus-visible:outline-[#064E3B] cursor-pointer"
            aria-expanded={conditionsOpen}
          >
            <div className="flex items-center gap-3">
              <Info className="w-5 h-5 text-[#064E3B] shrink-0" />
              <div>
                <h4 className="font-display font-bold text-base sm:text-lg text-[#064E3B]">
                  Condiciones generales
                </h4>
                <p className="text-xs text-[#2F5E4E] mt-0.5">
                  Información importante sobre la contratación, grabaciones presenciales y plazos de entrega.
                </p>
              </div>
            </div>
            <div className="p-1 rounded-full bg-[#DCE5E0]/60 text-[#064E3B]">
              {conditionsOpen ? (
                <ChevronUp className="w-5 h-5" />
              ) : (
                <ChevronDown className="w-5 h-5" />
              )}
            </div>
          </button>

          {conditionsOpen && (
            <div className="p-5 sm:p-6 pt-0 border-t border-[#E5E7EB] space-y-6 text-xs sm:text-sm text-[#2F5E4E] leading-relaxed animate-in fade-in duration-200">
              <ul className="space-y-3 pt-4">
                {GENERAL_CONDITIONS.map((cond, index) => (
                  <li key={index} className="flex items-start gap-2.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#064E3B] mt-2 shrink-0" />
                    <span>{cond}</span>
                  </li>
                ))}
              </ul>

              <div className="p-4 rounded-xl bg-[#DCE5E0]/30 border border-[#DCE5E0] mt-4">
                <h5 className="font-display font-bold text-xs sm:text-sm text-[#064E3B] mb-1.5">
                  Entrega y conservación de archivos:
                </h5>
                <p className="text-xs sm:text-sm text-[#2F5E4E] leading-relaxed">
                  El contenido final se entregará mediante una carpeta de Google Drive. El cliente será responsable de descargar y guardar todos los archivos dentro de los 30 días naturales siguientes a su entrega. Transcurrido ese plazo, Marevas MKT podrá eliminar los archivos de su Drive y no garantiza su disponibilidad ni recuperación posterior.
                </p>
              </div>
            </div>
          )}
        </div>

      </div>
    </section>
  );
};
