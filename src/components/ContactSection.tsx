import React, { useState, useEffect } from 'react';
import { Send, CheckCircle, MessageSquare, Instagram, Mail, MapPin, Sparkles, AlertCircle } from 'lucide-react';
import { SiteSettings } from '../types';
import { submitContactForm } from '../lib/api';

interface ContactSectionProps {
  settings: SiteSettings;
  selectedServicePreFill?: string;
  onClearPreFill?: () => void;
}

export const ContactSection: React.FC<ContactSectionProps> = ({
  settings,
  selectedServicePreFill,
  onClearPreFill,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    businessName: '',
    email: '',
    serviceType: 'Producción de Reels',
    message: '',
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [whatsAppRedirectUrl, setWhatsAppRedirectUrl] = useState<string>('');

  // Sync pre-fill
  useEffect(() => {
    if (selectedServicePreFill) {
      setFormData((prev) => ({
        ...prev,
        serviceType: selectedServicePreFill,
      }));
    }
  }, [selectedServicePreFill]);

  const serviceOptions = [
    'Producción de Reels',
    'Creación de contenido',
    'Fotografía móvil',
    'Estrategia de contenido',
    'Gestión de redes sociales',
    'Estrategia + Producción Completa',
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    const name = formData.name.trim();
    const email = formData.email.trim();
    const message = formData.message.trim();
    const business = formData.businessName.trim();
    const service = formData.serviceType.trim();

    if (!name || !email || !message) {
      setErrorMessage('Por favor, completa los campos obligatorios (Nombre, Email y Mensaje).');
      return;
    }

    const cleanPhone = (settings.whatsappNumber || '+34 653 745 138').replace(/[^\d]/g, '');

    const lines = [
      '¡Hola Marevas MKT! Quiero solicitar una propuesta de contenido:',
      '',
      `👤 *Nombre:* ${name}`,
      business ? `🏢 *Negocio / Marca:* ${business}` : null,
      `✉️ *Correo Electrónico:* ${email}`,
      `🎯 *Servicio de interés:* ${service}`,
      '',
      `📝 *Detalles de lo que necesito:*`,
      message,
    ].filter(Boolean) as string[];

    const formattedMessage = lines.join('\n');
    const waLink = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(formattedMessage)}`;
    setWhatsAppRedirectUrl(waLink);

    setIsSubmitting(true);
    try {
      // 1. Guardar copia en el panel de administración
      await submitContactForm({
        name,
        businessName: business,
        email,
        serviceType: service,
        message,
      });

      // 2. Notificar éxito en la interfaz
      setSubmitSuccess(true);

      // 3. Abrir automáticamente WhatsApp con la respuesta estructurada
      const isMobile =
        typeof navigator !== 'undefined' &&
        /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
      if (isMobile) {
        window.location.href = waLink;
      } else {
        window.open(waLink, '_blank', 'noopener,noreferrer');
      }

      setFormData({
        name: '',
        businessName: '',
        email: '',
        serviceType: 'Producción de Reels',
        message: '',
      });
      if (onClearPreFill) onClearPreFill();
    } catch (err: any) {
      setErrorMessage(err.message || 'Hubo un error al procesar tu solicitud. Inténtalo de nuevo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp link preparation
  const cleanPhone = (settings.whatsappNumber || '').replace(/[^\d+]/g, '');
  const waUrl = cleanPhone
    ? `https://wa.me/${cleanPhone}?text=${encodeURIComponent(
        settings.whatsappDefaultMessage || '¡Hola Marevas MKT! Me gustaría consultar una propuesta para mi marca.'
      )}`
    : '#';

  return (
    <section id="contacto" className="py-20 md:py-32 bg-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          
          {/* Left Column: Context, Pitch & Direct Channels */}
          <div className="lg:col-span-5 flex flex-col justify-between">
            <div>
              <div className="text-xs font-semibold uppercase tracking-widest text-[#2F5E4E] mb-3">
                Contacto Directo
              </div>

              <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#064E3B] tracking-tight mb-4">
                {settings.contactTitle || '¿Damos movimiento a tu marca?'}
              </h2>

              <p className="text-base sm:text-lg text-[#2F5E4E] leading-relaxed mb-8">
                {settings.contactSubtext ||
                  'Cuéntanos qué necesitas y diseñaremos una propuesta adaptada a tu negocio.'}
              </p>

              {/* Direct channels cards - Official Marevas MKT Channels */}
              <div className="space-y-3.5 mb-10">
                
                {/* WhatsApp Direct Access */}
                <a
                  href="https://wa.me/34653745138?text=%C2%A1Hola%20Marevas%20MKT!%20Me%20gustar%C3%ADa%20consultar%20una%20propuesta%20de%20contenido%20audiovisual."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#064E3B] bg-white hover:bg-[#DCE5E0]/30 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <MessageSquare className="w-6 h-6 text-[#DCE5E0]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#2F5E4E]">
                      WhatsApp Oficial
                    </div>
                    <div className="text-sm font-bold text-[#064E3B] group-hover:underline">
                      +34 653 745 138
                    </div>
                    <div className="text-[11px] text-[#2F5E4E] truncate">
                      Conversación directa por WhatsApp
                    </div>
                  </div>
                </a>

                {/* Instagram Direct Access */}
                <a
                  href="https://www.instagram.com/marevasmkt.madrid/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#064E3B] bg-white hover:bg-[#DCE5E0]/30 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#2F5E4E] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Instagram className="w-6 h-6 text-[#DCE5E0]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#2F5E4E]">
                      Instagram Oficial
                    </div>
                    <div className="text-sm font-bold text-[#064E3B] group-hover:underline">
                      @marevasmkt.madrid
                    </div>
                    <div className="text-[11px] text-[#2F5E4E] truncate">
                      Reels, portfolios y publicaciones diarias
                    </div>
                  </div>
                </a>

                {/* Email Direct Access */}
                <a
                  href="mailto:marevasmarketing@gmail.com"
                  className="flex items-center gap-4 p-4 rounded-xl border border-[#E5E7EB] hover:border-[#064E3B] bg-white hover:bg-[#DCE5E0]/30 transition-all group shadow-2xs cursor-pointer"
                >
                  <div className="w-12 h-12 rounded-xl bg-[#064E3B] text-white flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform">
                    <Mail className="w-6 h-6 text-[#DCE5E0]" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#2F5E4E]">
                      Correo Electrónico
                    </div>
                    <div className="text-sm font-bold text-[#064E3B] group-hover:underline break-all">
                      marevasmarketing@gmail.com
                    </div>
                    <div className="text-[11px] text-[#2F5E4E] truncate">
                      Haz clic para abrir tu aplicación de correo
                    </div>
                  </div>
                </a>

              </div>

              {/* Agency Location metadata */}
              <div className="pt-6 border-t border-[#E5E7EB] space-y-2 text-xs text-[#2F5E4E]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 text-[#064E3B]" />
                  <span>Madrid, España</span>
                </div>
                <div className="flex items-center gap-2">
                  <Mail className="w-3.5 h-3.5 text-[#064E3B]" />
                  <a href="mailto:marevasmarketing@gmail.com" className="hover:underline text-[#064E3B] font-medium">
                    marevasmarketing@gmail.com
                  </a>
                </div>
              </div>
            </div>

            <div className="mt-8 p-3 rounded-lg bg-[#DCE5E0]/40 text-[11px] text-[#064E3B] border border-[#DCE5E0]">
              <strong>Datos configurables:</strong> El número de WhatsApp, email e Instagram pueden modificarse en tiempo real desde el Panel de Administración.
            </div>

          </div>

          {/* Right Column: Contact Request Form */}
          <div className="lg:col-span-7 bg-[#DCE5E0]/20 rounded-2xl p-6 sm:p-10 border border-[#E5E7EB] shadow-xs">
            
            <h3 className="font-display font-bold text-xl sm:text-2xl text-[#064E3B] mb-2">
              Solicitar propuesta personalizada
            </h3>
            <p className="text-xs sm:text-sm text-[#2F5E4E] mb-6">
              Rellena los datos de tu marca y te responderemos en un plazo máximo de 24 horas laborables.
            </p>

            {submitSuccess ? (
              <div className="p-6 sm:p-8 rounded-xl bg-[#064E3B] text-white flex flex-col items-center text-center animate-in zoom-in-95 duration-200">
                <div className="w-12 h-12 rounded-full bg-[#2F5E4E] flex items-center justify-center mb-3">
                  <CheckCircle className="w-7 h-7 text-[#DCE5E0]" />
                </div>
                <h4 className="font-display font-bold text-xl sm:text-2xl text-white mb-2">
                  ¡Solicitud preparada para WhatsApp!
                </h4>
                <p className="text-sm text-[#DCE5E0] max-w-md mb-5 leading-relaxed">
                  Tus respuestas se han organizado en un mensaje completo para enviarlo directamente al WhatsApp oficial de Marevas MKT (<strong className="text-white">{settings.whatsappNumber || '+34 653 745 138'}</strong>).
                </p>

                {whatsAppRedirectUrl && (
                  <a
                    href={whatsAppRedirectUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:w-auto px-6 py-3.5 mb-3 rounded-xl bg-[#25D366] hover:bg-[#20ba59] text-white text-sm font-bold flex items-center justify-center gap-2.5 shadow-md hover:scale-[1.02] transition-all cursor-pointer"
                  >
                    <MessageSquare className="w-5 h-5 fill-current" />
                    <span>Continuar y enviar en WhatsApp ({settings.whatsappNumber || '+34 653 745 138'})</span>
                  </a>
                )}

                <p className="text-[11px] text-[#DCE5E0]/80 max-w-sm mb-5">
                  Si tu aplicación de WhatsApp no se abrió automáticamente, pulsa el botón verde de arriba. Recuerda pulsar enviar en WhatsApp para completar la entrega.
                </p>

                <button
                  type="button"
                  onClick={() => setSubmitSuccess(false)}
                  className="px-4 py-2 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition-colors cursor-pointer border border-white/20"
                >
                  Enviar otra consulta
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-4">
                
                {errorMessage && (
                  <div className="p-3.5 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                    <span>{errorMessage}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Name */}
                  <div>
                    <label htmlFor="contact-name" className="block text-xs font-semibold text-[#064E3B] mb-1.5">
                      Nombre completo *
                    </label>
                    <input
                      id="contact-name"
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Ej. Carmen Rodríguez"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#064E3B] focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition-colors"
                    />
                  </div>

                  {/* Business Name */}
                  <div>
                    <label htmlFor="contact-business" className="block text-xs font-semibold text-[#064E3B] mb-1.5">
                      Nombre del negocio o marca
                    </label>
                    <input
                      id="contact-business"
                      type="text"
                      value={formData.businessName}
                      onChange={(e) => setFormData({ ...formData, businessName: e.target.value })}
                      placeholder="Ej. Clínica Dental Sol / Café de Autor"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#064E3B] focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition-colors"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Email */}
                  <div>
                    <label htmlFor="contact-email" className="block text-xs font-semibold text-[#064E3B] mb-1.5">
                      Correo electrónico *
                    </label>
                    <input
                      id="contact-email"
                      type="email"
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="contacto@tuempresa.es"
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#064E3B] focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition-colors"
                    />
                  </div>

                  {/* Service Type Selection */}
                  <div>
                    <label htmlFor="contact-service" className="block text-xs font-semibold text-[#064E3B] mb-1.5">
                      Tipo de servicio *
                    </label>
                    <select
                      id="contact-service"
                      value={formData.serviceType}
                      onChange={(e) => setFormData({ ...formData, serviceType: e.target.value })}
                      className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#064E3B] focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition-colors"
                    >
                      {serviceOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label htmlFor="contact-message" className="block text-xs font-semibold text-[#064E3B] mb-1.5">
                    ¿Qué necesitas para tu marca? *
                  </label>
                  <textarea
                    id="contact-message"
                    required
                    rows={4}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Cuéntanos sobre tu negocio, tus objetivos en redes sociales, qué tipo de vídeos o fotografías necesitas y cuándo te gustaría empezar..."
                    className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] bg-white text-sm text-[#064E3B] focus:border-[#064E3B] focus:outline-none focus:ring-1 focus:ring-[#064E3B] transition-colors"
                  />
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full py-3.5 px-6 rounded-lg text-sm font-semibold bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-all flex items-center justify-center gap-2 shadow-xs cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-2 focus-visible:outline-[#064E3B]"
                >
                  {isSubmitting ? (
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  ) : (
                    <>
                      <span>Enviar solicitud de propuesta</span>
                      <Send className="w-4 h-4" />
                    </>
                  )}
                </button>

                <p className="text-[11px] text-[#2F5E4E] text-center pt-1">
                  Sin compromiso. Tratamos tu información con estricta confidencialidad.
                </p>

              </form>
            )}

          </div>

        </div>

      </div>
    </section>
  );
};
