import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Play,
  Pause,
  Maximize,
  Maximize2,
  Minimize,
  X,
  Volume1,
  Volume2,
  VolumeX,
  Sparkles,
  Film,
  Camera,
  Layers,
  Store,
  Gem,
  Footprints,
  Activity,
  Smartphone,
  ArrowRight,
  Tag,
  CheckCircle2,
  SlidersHorizontal,
  Loader2,
  AlertCircle,
  ExternalLink,
  Trash2,
} from 'lucide-react';
import { Project, BrandFilter, FormatFilter } from '../types';

// Dedicated High-Performance Project Video Player with full controls, seek, duration, and Google Drive support
const ProjectVideoPlayer: React.FC<{
  project: Project;
  fallbackPoster: string;
  onClose?: () => void;
}> = ({ project, fallbackPoster, onClose }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [errorDetails, setErrorDetails] = useState('');
  const [currentSrc, setCurrentSrc] = useState(project.mediaUrl);
  const [retryCount, setRetryCount] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<any>(null);

  const isGoogleDrive = (project.mediaUrl || '').includes('drive.google.com');

  const getGoogleDriveEmbed = (url: string) => {
    const match = url.match(/\/file\/d\/([a-zA-Z0-9_-]+)/);
    if (match && match[1]) {
      return `https://drive.google.com/file/d/${match[1]}/preview`;
    }
    return url;
  };

  // Format seconds to mm:ss
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  // Reset state when project changes
  useEffect(() => {
    setCurrentSrc(project.mediaUrl);
    setRetryCount(0);
    setHasError(false);
    setErrorDetails('');
    setIsLoading(true);
    setCurrentTime(0);
    setIsPlaying(false);
  }, [project.mediaUrl]);

  // Safe video playback initialization with autoplay policy handling
  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    setHasError(false);
    setIsLoading(true);

    try {
      video.load();
    } catch {}

    // Attempt autoplay; if browser blocks unmuted audio, user clicks center play button
    const playPromise = video.play();
    if (playPromise !== undefined) {
      playPromise
        .then(() => {
          setIsPlaying(true);
          setIsLoading(false);
        })
        .catch(() => {
          // Autoplay blocked by browser policy; pause smoothly
          setIsPlaying(false);
          setIsLoading(false);
        });
    }

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if (e.key === 'm' || e.key === 'M') {
        toggleMute();
      } else if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
      } else if (e.key === 'Escape' && onClose) {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      video.pause();
    };
  }, [currentSrc]);

  const handleVideoError = (e: React.SyntheticEvent<HTMLVideoElement, Event>) => {
    if (!videoRef.current) return;
    const mediaErr = e.currentTarget.error;
    if (mediaErr && mediaErr.code === 1) return; // MEDIA_ERR_ABORTED

    console.warn('Error al reproducir vídeo:', currentSrc, mediaErr);

    // Automatic recovery 1: If currentSrc points to an unoptimized or alternate filename, try web-optimized version
    if (retryCount === 0 && currentSrc) {
      let candidate = '';
      if (currentSrc.toLowerCase().endsWith('.mov')) {
        candidate = currentSrc.replace(/\.mov$/i, '-web.mp4');
      } else if (currentSrc.toLowerCase().includes('-h264.mp4')) {
        candidate = currentSrc.replace(/-h264\.mp4$/i, '-web.mp4');
      } else if (currentSrc.endsWith('.mp4') && !currentSrc.includes('-web.mp4')) {
        candidate = currentSrc.replace(/\.mp4$/i, '-web.mp4');
      }

      if (candidate && candidate !== currentSrc) {
        console.log('[Player Recovery] Intentando versión web alternativa:', candidate);
        setRetryCount(1);
        setCurrentSrc(candidate);
        return;
      }
    }

    // Automatic recovery 2: append cache-busting timestamp
    if (retryCount === 1 && currentSrc) {
      const sep = currentSrc.includes('?') ? '&' : '?';
      setRetryCount(2);
      setCurrentSrc(`${currentSrc.split('?')[0]}${sep}t=${Date.now()}`);
      return;
    }

    let reason = 'El archivo no se encuentra disponible o el formato requiere una versión compatible.';
    if (mediaErr) {
      if (mediaErr.code === 2) reason = 'Error de red o conexión al descargar el fragmento de vídeo.';
      if (mediaErr.code === 3) reason = 'Error de descodificación: los códecs del archivo no son compatibles con este navegador.';
      if (mediaErr.code === 4) reason = 'El formato de vídeo o la dirección URL del archivo no es compatible o no se encuentra en el servidor.';
    }

    setErrorDetails(reason);
    setIsLoading(false);
    setHasError(true);
  };

  // Listen for fullscreen change
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const handlePlayPause = () => {
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play().then(() => setIsPlaying(true)).catch((err) => {
        console.warn('Bloqueo de reproducción automática:', err);
      });
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const targetTime = parseFloat(e.target.value);
    setCurrentTime(targetTime);
    if (videoRef.current) {
      videoRef.current.currentTime = targetTime;
    }
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    setVolume(val);
    setIsMuted(val === 0);
    if (videoRef.current) {
      videoRef.current.volume = val;
      videoRef.current.muted = val === 0;
    }
  };

  const toggleMute = () => {
    if (!videoRef.current) return;
    if (isMuted) {
      videoRef.current.muted = false;
      setIsMuted(false);
      if (volume === 0) {
        setVolume(0.8);
        videoRef.current.volume = 0.8;
      }
    } else {
      videoRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const toggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) clearTimeout(controlsTimeoutRef.current);
    controlsTimeoutRef.current = setTimeout(() => {
      if (isPlaying) setShowControls(false);
    }, 3000);
  };

  if (isGoogleDrive) {
    return (
      <div className="relative w-full h-full min-h-[350px] bg-black flex items-center justify-center">
        <iframe
          src={getGoogleDriveEmbed(project.mediaUrl)}
          className="w-full h-full min-h-[350px] border-0"
          allow="autoplay; fullscreen"
          title={project.title}
        />
      </div>
    );
  }

  const posterSrc = project.thumbnailUrl || fallbackPoster;

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative w-full h-full bg-black flex items-center justify-center select-none overflow-hidden group/player"
    >
      {/* Video Element */}
      <video
        ref={videoRef}
        src={currentSrc}
        poster={posterSrc}
        playsInline
        preload="auto"
        onLoadedMetadata={(e) => {
          const d = e.currentTarget.duration;
          if (!isNaN(d) && d > 0) setDuration(d);
          setIsLoading(false);
          setHasError(false);
        }}
        onCanPlay={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onLoadedData={() => {
          setIsLoading(false);
          setHasError(false);
        }}
        onTimeUpdate={(e) => {
          setCurrentTime(e.currentTarget.currentTime);
          const d = e.currentTarget.duration;
          if (!isNaN(d) && d > 0 && duration === 0) setDuration(d);
        }}
        onPlay={() => {
          setIsPlaying(true);
          setIsLoading(false);
          setHasError(false);
        }}
        onPause={() => setIsPlaying(false)}
        onWaiting={() => setIsLoading(true)}
        onPlaying={() => {
          setIsPlaying(true);
          setIsLoading(false);
          setHasError(false);
        }}
        onEnded={() => setIsPlaying(false)}
        onError={handleVideoError}
        onClick={handlePlayPause}
        className="max-h-[85vh] w-auto max-w-full object-contain mx-auto cursor-pointer"
      />

      {/* Loading Spinner */}
      {isLoading && !hasError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 pointer-events-none z-10">
          <div className="p-3 rounded-full bg-black/60 text-white backdrop-blur-xs flex items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-[#DCE5E0]" />
            <span className="text-xs text-[#DCE5E0]">Cargando vídeo...</span>
          </div>
        </div>
      )}

      {/* Center Play Button on paused */}
      {!isPlaying && !isLoading && !hasError && (
        <button
          onClick={handlePlayPause}
          className="absolute z-20 w-16 h-16 rounded-full bg-[#064E3B]/90 hover:bg-[#064E3B] text-white flex items-center justify-center shadow-2xl transition-transform hover:scale-110 cursor-pointer"
          aria-label="Reproducir vídeo"
        >
          <Play className="w-8 h-8 ml-1 fill-white" />
        </button>
      )}

      {/* Error state */}
      {hasError && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center p-6 bg-black/85 text-white text-center">
          <AlertCircle className="w-10 h-10 text-amber-400 mb-2" />
          <h4 className="font-bold text-sm text-white mb-1">No se pudo reproducir este vídeo</h4>
          <p className="text-xs text-[#DCE5E0] max-w-sm mb-4">
            {errorDetails || 'El archivo no se encuentra disponible o el formato requiere una versión compatible.'}
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <button
              onClick={() => {
                setHasError(false);
                setIsLoading(true);
                setRetryCount(0);
                setCurrentSrc(project.mediaUrl);
                if (videoRef.current) {
                  videoRef.current.load();
                  videoRef.current.play().catch(() => {});
                }
              }}
              className="px-3.5 py-1.5 text-xs rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] cursor-pointer"
            >
              Reintentar reproducción
            </button>
            <a
              href={currentSrc}
              target="_blank"
              rel="noreferrer"
              className="px-3.5 py-1.5 text-xs rounded-lg bg-white/20 text-white hover:bg-white/30 flex items-center gap-1"
            >
              <span>Abrir archivo directo</span>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}

      {/* Bottom Control Bar */}
      <div
        className={`absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/95 via-black/70 to-transparent p-3 pt-6 transition-opacity duration-300 ${
          showControls || !isPlaying ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      >
        {/* Progress scrub bar */}
        <div className="flex items-center gap-2 mb-2">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full h-1.5 bg-white/30 rounded-lg appearance-none cursor-pointer accent-[#10B981] hover:h-2 transition-all"
            aria-label="Barra de progreso de vídeo"
          />
        </div>

        {/* Controls Row */}
        <div className="flex items-center justify-between text-white text-xs">
          <div className="flex items-center gap-3">
            <button
              onClick={handlePlayPause}
              className="p-1.5 rounded-full hover:bg-white/20 transition-colors cursor-pointer"
              aria-label={isPlaying ? 'Pausar' : 'Reproducir'}
            >
              {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
            </button>

            {/* Time indicator */}
            <div className="font-mono text-[11px] text-[#DCE5E0]">
              <span>{formatTime(currentTime)}</span>
              <span className="mx-1 text-white/50">/</span>
              <span>{formatTime(duration)}</span>
            </div>

            {/* Volume control */}
            <div className="flex items-center gap-1.5 ml-2">
              <button
                onClick={toggleMute}
                className="p-1 rounded hover:bg-white/20 transition-colors cursor-pointer"
                aria-label={isMuted ? 'Activar sonido' : 'Silenciar'}
              >
                {isMuted || volume === 0 ? (
                  <VolumeX className="w-4 h-4 text-white" />
                ) : volume < 0.5 ? (
                  <Volume1 className="w-4 h-4 text-white" />
                ) : (
                  <Volume2 className="w-4 h-4 text-white" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={isMuted ? 0 : volume}
                onChange={handleVolumeChange}
                className="w-16 h-1 bg-white/30 rounded appearance-none cursor-pointer accent-white"
                aria-label="Control de volumen"
              />
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={toggleFullscreen}
              className="p-1.5 rounded hover:bg-white/20 transition-colors cursor-pointer"
              title={isFullscreen ? 'Salir de pantalla completa' : 'Pantalla completa'}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

interface PortfolioSectionProps {
  projects: Project[];
  onOpenProjectContact: (projectTitle: string) => void;
  onOpenAdmin: () => void;
  isAdminLoggedIn?: boolean;
  onDeleteProject?: (projectId: string) => void;
}

export const PortfolioSection: React.FC<PortfolioSectionProps> = ({
  projects,
  onOpenProjectContact,
  onOpenAdmin,
  isAdminLoggedIn = false,
  onDeleteProject,
}) => {
  const [selectedBrand, setSelectedBrand] = useState<BrandFilter>('todos');
  const [selectedFormat, setSelectedFormat] = useState<FormatFilter>('todos');
  const [activeProject, setActiveProject] = useState<Project | null>(null);

  // Brand navigation tabs
  const brandTabs: { key: BrandFilter; label: string; sector: string; icon: any }[] = [
    { key: 'todos', label: 'Todas las marcas', sector: 'Portafolio global', icon: Sparkles },
    { key: 'Aura Boutique', label: 'Aura Boutique', sector: 'Moda & Boutique', icon: Store },
    { key: 'Bethânia Pratas', label: 'Bethânia Pratas', sector: 'Joyería en Plata 925', icon: Gem },
    { key: 'Bottero', label: 'Bottero', sector: 'Calzado & Moda', icon: Footprints },
    { key: 'Ultraforma', label: 'Ultraforma', sector: 'Clínica de Estética', icon: Activity },
    { key: 'Móvil Europa', label: 'Móvil Europa', sector: 'Tecnología & Móviles', icon: Smartphone },
  ];

  // Format filter chips
  const formatChips: { key: FormatFilter; label: string; icon: any }[] = [
    { key: 'todos', label: 'Todos los formatos', icon: Layers },
    { key: 'reels', label: 'Reels / Vídeos', icon: Film },
    { key: 'fotografia', label: 'Fotografía de Producto', icon: Camera },
    { key: 'estrategia', label: 'Estrategia Visual', icon: Sparkles },
  ];

  // Filtered projects strictly maintaining brand separation
  const filteredProjects = useMemo(() => {
    return projects.filter((p) => {
      // Brand filter
      const matchesBrand =
        selectedBrand === 'todos' ||
        (p.brandName && p.brandName.toLowerCase().includes(selectedBrand.toLowerCase()));

      // Format filter
      const matchesFormat =
        selectedFormat === 'todos' ||
        (selectedFormat === 'reels' && (p.category === 'reels' || p.type === 'video')) ||
        (selectedFormat === 'fotografia' && (p.category === 'fotografia' || p.type === 'image')) ||
        (selectedFormat === 'estrategia' && (p.category === 'estrategia' || p.category === 'marcas'));

      return matchesBrand && matchesFormat;
    });
  }, [projects, selectedBrand, selectedFormat]);

  // Brand contextual summary meta
  const currentBrandInfo = useMemo(() => {
    if (selectedBrand === 'Aura Boutique') {
      return {
        title: 'Aura Boutique — Creación de Contenido Audiovisual & Moda',
        desc: 'Creación de contenido audiovisual para Aura Boutique: moda, detalles y esencia de marca. Producción vertical con estilismo, prendas en tendencia y ambientación cuidada para redes sociales.',
      };
    }
    if (selectedBrand === 'Bethânia Pratas') {
      return {
        title: 'Bethânia Pratas — Alta Joyería en Plata 925',
        desc: 'Fotografía de producto macro y Reels de temporada. Resaltamos el brillo, pureza y sofisticación de cada joya de plata 925 legítima para generar deseo y ventas.',
      };
    }
    if (selectedBrand === 'Bottero') {
      return {
        title: 'Bottero — Calzado de Cuero Legítimo & Moda',
        desc: 'Producción de Reels dinámicos en tienda oficial y sesiones de producto sobre podio. Transmitimos la nobleza del cuero, confort y tendencia de temporada.',
      };
    }
    if (selectedBrand === 'Ultraforma') {
      return {
        title: 'Ultraforma — Clínica de Medicina Estética & Salud',
        desc: 'Producción audiovisual y Reels experienciales en clínica. Comunicación médica cercana que transmite confianza, protocolos de vanguardia y bienestar.',
      };
    }
    if (selectedBrand === 'Móvil Europa') {
      return {
        title: 'Móvil Europa — Telefonía Móvil, Smartphones & Reparación',
        desc: 'Reels verticales dinámicos y presentación de smartphones de alta gama (Google Pixel, Samsung Galaxy). Mostramos garantías, precios y soporte técnico para dinamizar ventas en tienda física y redes.',
      };
    }
    return null;
  }, [selectedBrand]);

  // Guaranteed local fallback image resolver
  const getFallbackImage = (brandName?: string, category?: string) => {
    if (brandName?.toLowerCase().includes('aura')) {
      return '/uploads/aura-boutique-thumb.jpg';
    }
    if (brandName?.toLowerCase().includes('bethânia') || brandName?.toLowerCase().includes('bethania')) {
      return category === 'reels' ? '/images/bethania-reels.svg' : '/images/bethania-joyas.svg';
    }
    if (brandName?.toLowerCase().includes('bottero')) {
      return category === 'reels' ? '/images/bottero-reels.svg' : '/images/bottero-calzado.svg';
    }
    if (brandName?.toLowerCase().includes('ultraforma')) {
      return '/images/ultraforma-estetica.svg';
    }
    if (brandName?.toLowerCase().includes('móvil') || brandName?.toLowerCase().includes('movil')) {
      return '/uploads/marevas-up-1792577097780-zf8lp5j-thumb.jpg';
    }
    return '/images/reels-production.svg';
  };

  return (
    <section id="portfolio" className="py-20 md:py-32 bg-[#E5E7EB]/30 relative overflow-hidden scroll-mt-20">
      <div id="proyectos" className="-top-24 relative" />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div className="max-w-3xl">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-widest text-[#2F5E4E] mb-3">
              <span>Portafolio de Proyectos</span>
              <span aria-hidden="true" className="text-[#2F5E4E]/40">·</span>
              <span>Trabajos Reales</span>
            </div>
            <h2 className="font-display font-bold text-3xl sm:text-4xl lg:text-5xl text-[#064E3B] tracking-tight mb-4">
              Contenido vertical y visual con identidad propia
            </h2>
            <p className="text-base sm:text-lg text-[#2F5E4E] leading-relaxed">
              Cada marca tiene su voz y su estética. Explora nuestros proyectos organizados por cliente y formato: producción de Reels verticales, fotografía de producto y campañas visuales.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={onOpenAdmin}
              className={`text-xs font-semibold px-3.5 py-2.5 rounded-lg transition-colors shadow-2xs cursor-pointer flex items-center gap-2 ${
                isAdminLoggedIn
                  ? 'bg-[#064E3B] text-white hover:bg-[#2F5E4E]'
                  : 'bg-white border border-[#064E3B]/30 text-[#064E3B] hover:bg-[#064E3B] hover:text-white'
              }`}
              title="Abrir panel de administración para subir vídeos y fotos"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              <span>{isAdminLoggedIn ? 'Gestionar Portafolio' : 'Gestionar Portafolio (Subir Mídia)'}</span>
            </button>
          </div>
        </div>

        {/* 1. Brand Filter Tabs */}
        <div className="mb-6">
          <div className="text-xs font-bold uppercase tracking-wider text-[#064E3B] mb-3 flex items-center gap-2">
            <Store className="w-4 h-4 text-[#2F5E4E]" />
            <span>Filtrar por Marca & Sector</span>
          </div>

          <div className="flex flex-wrap items-center gap-2.5" role="tablist">
            {brandTabs.map((brand) => {
              const Icon = brand.icon;
              const isSelected = selectedBrand === brand.key;
              return (
                <button
                  key={brand.key}
                  role="tab"
                  aria-selected={isSelected}
                  onClick={() => setSelectedBrand(brand.key)}
                  className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all cursor-pointer focus-visible:outline-2 focus-visible:outline-[#064E3B] ${
                    isSelected
                      ? 'bg-[#064E3B] text-white shadow-md'
                      : 'bg-white text-[#2F5E4E] border border-[#E5E7EB] hover:bg-[#DCE5E0]/50 hover:text-[#064E3B]'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span>{brand.label}</span>
                  {brand.key !== 'todos' && (
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-md font-normal hidden sm:inline ${
                        isSelected ? 'bg-white/15 text-white' : 'bg-[#E5E7EB] text-[#2F5E4E]'
                      }`}
                    >
                      {brand.sector}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* 2. Format Sub-Filters */}
        <div className="mb-10 pb-6 border-b border-[#E5E7EB] flex flex-wrap items-center gap-2">
          <span className="text-xs font-semibold text-[#2F5E4E] mr-2 flex items-center gap-1.5">
            <Tag className="w-3.5 h-3.5" />
            <span>Formato:</span>
          </span>
          {formatChips.map((chip) => {
            const Icon = chip.icon;
            const isSelected = selectedFormat === chip.key;
            return (
              <button
                key={chip.key}
                onClick={() => setSelectedFormat(chip.key)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                  isSelected
                    ? 'bg-[#2F5E4E] text-white shadow-2xs'
                    : 'bg-white/80 text-[#2F5E4E] hover:bg-white border border-[#E5E7EB]'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{chip.label}</span>
              </button>
            );
          })}

          {(selectedBrand !== 'todos' || selectedFormat !== 'todos') && (
            <button
              onClick={() => {
                setSelectedBrand('todos');
                setSelectedFormat('todos');
              }}
              className="text-xs text-[#064E3B] hover:underline ml-auto font-medium cursor-pointer"
            >
              Restablecer filtros
            </button>
          )}
        </div>

        {/* Brand Focus Spotlight Banner (if a brand is actively selected) */}
        {currentBrandInfo && (
          <div className="mb-10 p-5 rounded-2xl bg-white border border-[#064E3B]/20 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 text-xs font-bold text-[#064E3B] uppercase tracking-wider mb-1">
                <CheckCircle2 className="w-4 h-4 text-[#064E3B]" />
                <span>Proyecto Destacado: {selectedBrand}</span>
              </div>
              <h3 className="font-display font-bold text-lg text-[#064E3B]">{currentBrandInfo.title}</h3>
              <p className="text-xs sm:text-sm text-[#2F5E4E] mt-1 max-w-3xl leading-relaxed">
                {currentBrandInfo.desc}
              </p>
            </div>
            <button
              onClick={() => onOpenProjectContact(selectedBrand)}
              className="shrink-0 px-4 py-2.5 rounded-lg text-xs font-semibold bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-colors flex items-center gap-1.5 cursor-pointer"
            >
              <span>Solicitar propuesta similar</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Dynamic Asymmetrical Portfolio Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8 items-start">
          {filteredProjects.map((project) => {
            const isVerticalReel = project.aspectRatio === '9:16' || project.orientation === 'vertical';

            return (
              <div
                key={project.id}
                onClick={() => setActiveProject(project)}
                className={`group cursor-pointer rounded-2xl overflow-hidden bg-white border border-[#E5E7EB] hover:border-[#064E3B] transition-all duration-300 shadow-xs hover:shadow-xl relative flex flex-col ${
                  isVerticalReel ? 'sm:row-span-2' : ''
                }`}
              >
                {/* Media Container */}
                <div
                  className={`relative w-full overflow-hidden bg-[#042F24] ${
                    isVerticalReel ? 'aspect-[9/16]' : project.aspectRatio === '16:9' ? 'aspect-video' : 'aspect-[4/5]'
                  }`}
                >
                  {project.type === 'video' ? (
                    <div className="relative w-full h-full">
                      {/* Real poster frame image always displayed underneath so card is never an empty box */}
                      <img
                        src={project.thumbnailUrl || getFallbackImage(project.brandName, project.category)}
                        alt={project.title}
                        loading="lazy"
                        onError={(e) => {
                          e.currentTarget.src = getFallbackImage(project.brandName, project.category);
                        }}
                        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <video
                        src={project.mediaUrl}
                        muted
                        loop
                        playsInline
                        preload="metadata"
                        poster={project.thumbnailUrl || getFallbackImage(project.brandName, project.category)}
                        onError={(e) => {
                          // Hide video element if it cannot decode or load, revealing the crisp poster underneath
                          e.currentTarget.style.display = 'none';
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.play().catch(() => {});
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.pause();
                        }}
                        className="relative z-1 w-full h-full object-cover transition-opacity duration-300 opacity-95 group-hover:opacity-100"
                      />
                    </div>
                  ) : (
                    <img
                      src={project.mediaUrl || project.thumbnailUrl || getFallbackImage(project.brandName, project.category)}
                      alt={project.title}
                      loading="lazy"
                      onError={(e) => {
                        e.currentTarget.src = getFallbackImage(project.brandName, project.category);
                      }}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}

                  {/* Gradient shade */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent opacity-85 group-hover:opacity-95 transition-opacity" />

                  {/* Top tags on media */}
                  <div className="absolute top-3.5 left-3.5 right-3.5 flex items-center justify-between text-white text-[11px] font-medium z-10">
                    <span className="bg-black/60 backdrop-blur-xs px-2.5 py-1 rounded text-white font-mono uppercase tracking-wider text-[10px]">
                      {project.aspectRatio || '9:16'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <span className="bg-[#064E3B]/90 backdrop-blur-xs text-[#DCE5E0] px-2.5 py-0.5 rounded text-[10px] font-semibold border border-white/20">
                        {project.brandName}
                      </span>
                      {isAdminLoggedIn && onDeleteProject && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            if (window.confirm(`¿Seguro que deseas eliminar definitivamente el proyecto «${project.title}»?`)) {
                              onDeleteProject(project.id);
                            }
                          }}
                          className="bg-red-600/90 hover:bg-red-600 text-white p-1 rounded transition-colors shadow-xs z-20 cursor-pointer"
                          title="Eliminar este proyecto (Administrador)"
                          aria-label={`Eliminar proyecto ${project.title}`}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Play Icon / Center Hover Badge */}
                  <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none">
                    <div className="w-12 h-12 rounded-full bg-[#064E3B]/90 text-white flex items-center justify-center backdrop-blur-xs shadow-lg transform group-hover:scale-110 transition-transform">
                      {project.type === 'video' ? (
                        <Play className="w-5 h-5 ml-0.5 fill-current" />
                      ) : (
                        <Maximize2 className="w-5 h-5" />
                      )}
                    </div>
                  </div>

                  {/* Bottom info on media */}
                  <div className="absolute bottom-3.5 left-3.5 right-3.5 text-white z-10">
                    <div className="text-[11px] text-[#DCE5E0] font-semibold uppercase tracking-wider mb-1 flex items-center gap-1.5">
                      <span className="text-white font-bold">{project.brandName}</span>
                      <span aria-hidden="true" className="text-white/60">·</span>
                      <span>{project.clientSector}</span>
                    </div>
                    <h3 className="font-display font-bold text-base sm:text-lg text-white leading-snug line-clamp-2">
                      {project.title}
                    </h3>
                  </div>
                </div>

                {/* Card Footer Detail */}
                <div className="p-4 bg-white flex flex-col justify-between grow">
                  <p className="text-xs text-[#2F5E4E] line-clamp-2 mb-3 leading-relaxed">
                    {project.description}
                  </p>
                  <div className="flex items-center justify-between pt-2 border-t border-[#E5E7EB] text-xs">
                    <span className="text-[#2F5E4E] font-medium">{project.categoryLabel}</span>
                    <span className="font-semibold text-[#064E3B] flex items-center gap-1 group-hover:translate-x-0.5 transition-transform">
                      <span>Ver proyecto</span>
                      <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Empty state if filter has no items */}
        {filteredProjects.length === 0 && (
          <div className="text-center py-16 bg-white rounded-2xl border border-[#E5E7EB] p-8 max-w-xl mx-auto">
            <Sparkles className="w-10 h-10 text-[#2F5E4E] mx-auto mb-3 opacity-60" />
            <h4 className="font-display font-bold text-lg text-[#064E3B] mb-1">
              No hay proyectos con los filtros actuales
            </h4>
            <p className="text-sm text-[#2F5E4E] mb-5">
              Prueba a seleccionar «Todas las marcas» o a subir nuevos contenidos para esta categoría desde el panel de gestión.
            </p>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => {
                  setSelectedBrand('todos');
                  setSelectedFormat('todos');
                }}
                className="px-4 py-2 text-xs font-semibold bg-[#064E3B] text-white rounded-lg hover:bg-[#2F5E4E] transition-colors"
              >
                Ver todos los proyectos
              </button>
            </div>
          </div>
        )}

        {/* Editorial Footnote */}
        <div className="mt-14 p-4 rounded-xl bg-white border border-[#E5E7EB] flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#2F5E4E]">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#064E3B]" />
            <span>
              <strong>Portafolio oficial Marevas MKT:</strong> Proyectos clasificados por marcas asociadas (Bethânia Pratas, Bottero, Ultraforma y Móvil Europa) con visor interactivo de alta calidad.
            </span>
          </div>
          <button
            onClick={onOpenAdmin}
            className="text-[#064E3B] font-semibold underline hover:text-[#2F5E4E] shrink-0 cursor-pointer"
          >
            Añadir o sustituir archivos
          </button>
        </div>

      </div>

      {/* High-End Project Modal / Lightbox */}
      {activeProject && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/85 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setActiveProject(null)}
        >
          <div
            className="relative w-full max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden flex flex-col lg:flex-row max-h-[92vh]"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={() => setActiveProject(null)}
              className="absolute top-4 right-4 z-30 p-2 rounded-full bg-black/60 text-white hover:bg-black transition-colors focus:outline-none"
              aria-label="Cerrar modal de proyecto"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Media Viewport (Vertical Video or Image) with custom interactive Player */}
            <div className="lg:w-7/12 bg-black flex items-center justify-center relative min-h-[340px] max-h-[65vh] lg:max-h-[85vh] overflow-hidden">
              {activeProject.type === 'video' ? (
                <ProjectVideoPlayer
                  key={activeProject.id}
                  project={activeProject}
                  fallbackPoster={getFallbackImage(activeProject.brandName, activeProject.category)}
                  onClose={() => setActiveProject(null)}
                />
              ) : (
                <img
                  src={activeProject.mediaUrl || activeProject.thumbnailUrl}
                  alt={activeProject.title}
                  onError={(e) => {
                    e.currentTarget.src = getFallbackImage(activeProject.brandName, activeProject.category);
                  }}
                  className="max-h-[85vh] w-auto max-w-full object-contain mx-auto"
                />
              )}
            </div>

            {/* Metadata & Description Column */}
            <div className="lg:w-5/12 p-6 sm:p-8 flex flex-col justify-between overflow-y-auto bg-white">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold text-[#2F5E4E] uppercase tracking-wider mb-2">
                  <span>{activeProject.categoryLabel}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeProject.aspectRatio}</span>
                </div>

                <h3 className="font-display font-bold text-xl sm:text-2xl text-[#064E3B] mb-3 leading-snug">
                  {activeProject.title}
                </h3>

                <div className="flex flex-wrap gap-2 mb-6">
                  {activeProject.brandName && (
                    <div className="flex items-center gap-1 text-xs font-bold text-white bg-[#064E3B] px-3 py-1 rounded-md">
                      <span>{activeProject.brandName}</span>
                    </div>
                  )}
                  <div className="flex items-center gap-1 text-xs text-[#064E3B] bg-[#DCE5E0] px-2.5 py-1 rounded-md font-medium">
                    <Tag className="w-3 h-3" />
                    <span>{activeProject.clientSector}</span>
                  </div>
                  {activeProject.date && (
                    <div className="text-xs text-[#2F5E4E] bg-[#E5E7EB] px-2.5 py-1 rounded-md">
                      {activeProject.date}
                    </div>
                  )}
                </div>

                <div className="text-sm text-[#2F5E4E] leading-relaxed mb-6 space-y-3">
                  <p>{activeProject.description}</p>
                </div>
              </div>

              {/* Action Buttons in Modal */}
              <div className="pt-6 border-t border-[#E5E7EB] flex flex-col gap-2.5">
                <button
                  onClick={() => {
                    setActiveProject(null);
                    onOpenProjectContact(activeProject.title);
                  }}
                  className="w-full py-3 px-4 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] transition-colors text-sm font-semibold flex items-center justify-center gap-2 shadow-xs cursor-pointer"
                >
                  <span>Solicitar contenido para mi marca</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setActiveProject(null)}
                  className="w-full py-2 px-3 text-xs text-[#2F5E4E] hover:text-[#064E3B] text-center"
                >
                  Volver al portfolio
                </button>
                {isAdminLoggedIn && onDeleteProject && (
                  <button
                    onClick={() => {
                      if (window.confirm(`¿Seguro que deseas eliminar definitivamente el proyecto «${activeProject.title}»?`)) {
                        onDeleteProject(activeProject.id);
                        setActiveProject(null);
                      }
                    }}
                    className="w-full py-2.5 px-3 text-xs text-red-600 hover:bg-red-50 hover:border-red-400 border border-red-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer mt-1 font-semibold"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar este proyecto (Modo Administrador)</span>
                  </button>
                )}
              </div>

            </div>

          </div>
        </div>
      )}

    </section>
  );
};
