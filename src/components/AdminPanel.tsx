import React, { useState, useEffect } from 'react';
import {
  X,
  Lock,
  LogOut,
  FolderPlus,
  Edit2,
  Trash2,
  Upload,
  Save,
  CheckCircle2,
  AlertCircle,
  Film,
  Camera,
  Layers,
  Settings as SettingsIcon,
  MessageSquare,
  Key,
  RotateCcw,
  Star,
  ExternalLink,
  ChevronUp,
  ChevronDown,
  Info,
  Users,
  Image,
  Loader2,
} from 'lucide-react';
import { SiteData, Project, ServiceItem, SiteSettings, ContactInquiry } from '../types';
import {
  adminLogin,
  adminLogout,
  fetchAdminData,
  updateAdminSettings,
  updateAdminService,
  saveAdminProject,
  deleteAdminProject,
  updateInquiryStatus,
  deleteAdminInquiry,
  uploadFile,
  resetDemoData,
  changeAdminPassword,
  reorderAdminProjects,
  fetchStorageStatus,
  StorageStatus,
} from '../lib/api';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
  onDataUpdated: () => void;
  isLoggedIn: boolean;
  setIsLoggedIn: (status: boolean) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({
  isOpen,
  onClose,
  onDataUpdated,
  isLoggedIn,
  setIsLoggedIn,
}) => {
  // Login state
  const [username, setUsername] = useState('Marevas.mkt');
  const [password, setPassword] = useState('');
  const [loginError, setLoginError] = useState<string | null>(null);
  const [loginLoading, setLoginLoading] = useState(false);

  // Admin Data state
  const [data, setData] = useState<SiteData | null>(null);
  const [activeTab, setActiveTab] = useState<'proyectos' | 'logotipo' | 'servicios' | 'textos' | 'contacto' | 'leads' | 'seguridad'>('proyectos');
  const [feedbackMsg, setFeedbackMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Project Editor state
  const [editingProject, setEditingProject] = useState<Partial<Project> | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<{
    target: string;
    percent: number;
    loaded: number;
    total: number;
    filename: string;
    stage?: 'uploading' | 'processing' | 'completed';
    statusMessage?: string;
  } | null>(null);

  // Password state
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // In-UI Confirmation state (replaces window.confirm for 100% iframe/sandbox compatibility)
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [inquiryToDelete, setInquiryToDelete] = useState<string | null>(null);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isSavingProject, setIsSavingProject] = useState(false);
  const [storageStatus, setStorageStatus] = useState<StorageStatus | null>(null);

  // Load admin data when logged in and open
  useEffect(() => {
    if (isOpen && isLoggedIn) {
      loadData();
    }
  }, [isOpen, isLoggedIn]);

  const loadData = async () => {
    try {
      const siteData = await fetchAdminData();
      setData(siteData);
      fetchStorageStatus().then(setStorageStatus).catch(() => {});
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('sesión')) {
        setIsLoggedIn(false);
      } else {
        showFeedback('error', err.message);
      }
    }
  };

  const showFeedback = (type: 'success' | 'error', text: string) => {
    setFeedbackMsg({ type, text });
    setTimeout(() => {
      setFeedbackMsg(null);
    }, 4000);
  };

  // Auth actions
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError(null);
    setLoginLoading(true);
    try {
      await adminLogin({ username, password });
      setIsLoggedIn(true);
      await loadData();
    } catch (err: any) {
      setLoginError(err.message || 'Error de autenticación');
    } finally {
      setLoginLoading(false);
    }
  };

  const handleLogout = async () => {
    await adminLogout();
    setIsLoggedIn(false);
    setData(null);
  };

  // File Upload Helper (supports videos up to 500MB and photos from device)
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    target: string
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const MAX_FILE_SIZE = 500 * 1024 * 1024; // 500 MB
    if (file.size > MAX_FILE_SIZE) {
      const currentMB = (file.size / (1024 * 1024)).toFixed(1);
      showFeedback(
        'error',
        `El archivo seleccionado supera el tamaño máximo permitido por el servidor (500 MB). Tamaño actual: ${currentMB} MB. Por favor, comprime el vídeo o utiliza un enlace externo.`
      );
      if (e.target) e.target.value = '';
      return;
    }

    setIsUploading(true);
    setUploadProgress({
      target,
      percent: 0,
      loaded: 0,
      total: file.size,
      filename: file.name,
      stage: 'uploading',
      statusMessage: 'Iniciando subida...',
    });

    try {
      const res = await uploadFile(file, (p) => {
        setUploadProgress({
          target,
          percent: p.percent,
          loaded: p.loaded,
          total: p.total,
          filename: file.name,
          stage: p.stage,
          statusMessage: p.statusMessage,
        });
      });

      if (target === 'projectMedia' && editingProject) {
        const isVid = res.type === 'video';
        const updatedProject: Partial<Project> = {
          ...editingProject,
          mediaUrl: res.fileUrl,
          type: res.type,
          thumbnailUrl: isVid
            ? (editingProject.thumbnailUrl || res.thumbnailUrl || '')
            : (editingProject.thumbnailUrl || res.fileUrl),
        };
        setEditingProject(updatedProject);
        showFeedback(
          'success',
          `Archivo "${file.name}" subido y listo. Haz clic en «Guardar Proyecto» para confirmar y aplicar los cambios.`
        );
      } else if (target === 'projectThumbnail' && editingProject) {
        const updatedProject: Partial<Project> = {
          ...editingProject,
          thumbnailUrl: res.fileUrl,
        };
        setEditingProject(updatedProject);
        showFeedback('success', `Fotografía de portada "${file.name}" cargada. Haz clic en «Guardar Proyecto» para guardarla.`);
      } else if (target === 'heroVideo' && data) {
        setData({
          ...data,
          settings: {
            ...data.settings,
            heroVideoUrl: res.fileUrl,
          },
        });
      } else if (target === 'logo' && data) {
        setData({
          ...data,
          settings: {
            ...data.settings,
            logoUrl: res.fileUrl,
          },
        });
      } else if (target.startsWith('service_') && data) {
        const serviceId = target
          .replace('service_video_', '')
          .replace('service_photo_', '')
          .replace('service_', '');
        const isVid = target.startsWith('service_video_') || res.type === 'video';
        const updatedServices = data.services.map((s) =>
          s.id === serviceId
            ? {
                ...s,
                mediaUrl: res.fileUrl,
                mediaType: (isVid ? 'video' : 'image') as 'video' | 'image',
              }
            : s
        );
        setData({ ...data, services: updatedServices });

        // Auto-save service to server so upload is immediately persistent
        const targetService = updatedServices.find((s) => s.id === serviceId);
        if (targetService) {
          try {
            await updateAdminService(targetService);
            onDataUpdated();
          } catch (saveErr) {
            console.warn('Auto-save error for service:', saveErr);
          }
        }
      }

      showFeedback('success', `Archivo "${file.name}" transferido y optimizado correctamente.`);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('sesión')) {
        setIsLoggedIn(false);
      }
      showFeedback('error', err.message || 'Error al subir el archivo');
    } finally {
      setIsUploading(false);
      setUploadProgress(null);
      if (e.target) {
        e.target.value = '';
      }
    }
  };

  // Project CRUD
  const handleSaveProject = async () => {
    if (!editingProject) return;

    if (isUploading) {
      showFeedback('error', 'Por favor, espera a que termine la subida del archivo multimedia antes de guardar.');
      return;
    }

    if (isSavingProject) {
      return;
    }

    if (!editingProject.title || !editingProject.title.trim()) {
      showFeedback('error', 'Por favor, introduce el título del proyecto.');
      return;
    }
    if (!editingProject.mediaUrl || !editingProject.mediaUrl.trim()) {
      showFeedback('error', 'Por favor, sube un archivo o introduce la URL del vídeo o fotografía antes de guardar.');
      return;
    }

    setIsSavingProject(true);
    try {
      const projectToSave: Partial<Project> = {
        ...editingProject,
        title: editingProject.title.trim(),
        brandName: (editingProject.brandName || 'Bethânia Pratas').trim(),
        category: editingProject.category || 'reels',
        categoryLabel: editingProject.categoryLabel || 'Reels & Vídeos Verticales',
        type: editingProject.type || 'video',
        aspectRatio: editingProject.aspectRatio || '9:16',
        orientation:
          editingProject.aspectRatio === '16:9'
            ? 'landscape'
            : editingProject.aspectRatio === '1:1'
            ? 'square'
            : 'vertical',
        mediaUrl: editingProject.mediaUrl.trim(),
        thumbnailUrl: (editingProject.thumbnailUrl || (editingProject.type === 'video' ? '' : editingProject.mediaUrl)).trim(),
        description: (editingProject.description || '').trim(),
        clientSector: (editingProject.clientSector || 'Marca / Negocio').trim(),
      };

      const saved = await saveAdminProject(projectToSave);
      await loadData();
      onDataUpdated();
      setEditingProject(null);
      showFeedback('success', `¡Proyecto "${saved.title || projectToSave.title}" guardado permanentemente en el portafolio!`);
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('sesión')) {
        setIsLoggedIn(false);
      }
      showFeedback('error', err.message || 'Error al guardar el proyecto.');
    } finally {
      setIsSavingProject(false);
    }
  };

  const handleDeleteProject = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteAdminProject(id);
      if (data?.projects) {
        setData({
          ...data,
          projects: data.projects.filter((p) => p.id !== id),
        });
      }
      if (editingProject?.id === id) {
        setEditingProject(null);
      }
      setProjectToDelete(null);
      await loadData();
      onDataUpdated();
      showFeedback('success', 'Proyecto eliminado definitivamente del portafolio.');
    } catch (err: any) {
      if (err.message && err.message.toLowerCase().includes('sesión')) {
        setIsLoggedIn(false);
      }
      showFeedback('error', err.message || 'Error al eliminar el proyecto.');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleMoveProject = (index: number, direction: 'up' | 'down') => {
    if (!data?.projects) return;
    const newProjects = [...data.projects];
    const targetIdx = direction === 'up' ? index - 1 : index + 1;
    if (targetIdx < 0 || targetIdx >= newProjects.length) return;

    const temp = newProjects[index];
    newProjects[index] = newProjects[targetIdx];
    newProjects[targetIdx] = temp;

    // Save reorder
    const orderedIds = newProjects.map((p) => p.id);
    reorderAdminProjects(orderedIds)
      .then((updatedProjects) => {
        setData({ ...data, projects: updatedProjects });
        onDataUpdated();
      })
      .catch((err) => showFeedback('error', err.message || 'Error al reordenar proyectos'));
  };

  // Settings Save
  const handleSaveSettings = async () => {
    if (!data?.settings) return;
    try {
      await updateAdminSettings(data.settings);
      onDataUpdated();
      showFeedback('success', 'Configuración guardada correctamente.');
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Service Save
  const handleSaveService = async (service: ServiceItem) => {
    try {
      await updateAdminService(service);
      onDataUpdated();
      showFeedback('success', `Servicio "${service.title}" actualizado.`);
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Inquiry actions
  const handleUpdateInquiryStatus = async (id: string, status: ContactInquiry['status']) => {
    try {
      await updateInquiryStatus(id, status);
      await loadData();
      showFeedback('success', 'Estado de la solicitud actualizado.');
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  const handleDeleteInquiry = async (id: string) => {
    setIsDeleting(true);
    try {
      await deleteAdminInquiry(id);
      if (data?.inquiries) {
        setData({
          ...data,
          inquiries: data.inquiries.filter((inq) => inq.id !== id),
        });
      }
      setInquiryToDelete(null);
      await loadData();
      showFeedback('success', 'Solicitud eliminada del registro.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al eliminar la solicitud.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Password Change
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      showFeedback('error', 'Las contraseñas no coinciden.');
      return;
    }
    try {
      await changeAdminPassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showFeedback('success', 'Contraseña de administrador actualizada con éxito.');
    } catch (err: any) {
      showFeedback('error', err.message);
    }
  };

  // Reset demo data
  const handleResetDemo = async () => {
    setIsDeleting(true);
    try {
      await resetDemoData();
      setShowResetConfirm(false);
      await loadData();
      onDataUpdated();
      showFeedback('success', 'Datos restablecidos a la plantilla inicial de Marevas MKT.');
    } catch (err: any) {
      showFeedback('error', err.message || 'Error al restablecer los datos.');
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-5xl bg-white rounded-2xl shadow-2xl flex flex-col max-h-[92vh] overflow-hidden border border-[#E5E7EB]">
        
        {/* Header */}
        <div className="px-6 py-4 bg-[#064E3B] text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#2F5E4E] rounded-lg">
              <Lock className="w-5 h-5 text-[#DCE5E0]" />
            </div>
            <div>
              <h2 className="font-display font-bold text-lg text-white">
                Panel de Gestión — Marevas MKT
              </h2>
              <p className="text-xs text-[#DCE5E0]">
                {isLoggedIn ? 'Administración de contenidos, proyectos y solicitudes' : 'Acceso seguro al panel de administración'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {isLoggedIn && (
              <button
                onClick={handleLogout}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
                title="Cerrar sesión"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Salir</span>
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg text-[#DCE5E0] hover:text-white hover:bg-[#2F5E4E] transition-colors cursor-pointer"
              aria-label="Cerrar panel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Global Feedback Banner */}
        {feedbackMsg && (
          <div
            className={`px-6 py-2.5 text-xs font-medium flex items-center gap-2 ${
              feedbackMsg.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border-b border-emerald-200'
                : 'bg-red-50 text-red-800 border-b border-red-200'
            }`}
          >
            {feedbackMsg.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            ) : (
              <AlertCircle className="w-4 h-4 text-red-600" />
            )}
            <span>{feedbackMsg.text}</span>
          </div>
        )}

        {/* Content Body */}
        {!isLoggedIn ? (
          /* LOGIN SCREEN */
          <div className="p-6 sm:p-10 max-w-md mx-auto w-full my-auto flex flex-col justify-center">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-2xl bg-[#064E3B] text-white flex items-center justify-center mx-auto mb-3 shadow-md">
                <Lock className="w-7 h-7 text-[#DCE5E0]" />
              </div>
              <h3 className="font-display font-bold text-2xl text-[#064E3B]">
                Acceso al Panel
              </h3>
              <p className="text-xs text-[#2F5E4E] mt-1">
                Gestión oficial de proyectos, fotografías y vídeos de Marevas MKT.
              </p>
            </div>

            {/* Google AI Studio environment notice */}
            <div className="mb-4 p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-[11px] text-emerald-900 flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <strong className="block text-emerald-950 font-semibold">Almacenamiento Local Activo</strong>
                <span>En este entorno de desarrollo (Google AI Studio), los vídeos y fotos se guardan directamente en el servidor sin requerir Vercel Blob.</span>
              </div>
            </div>

            {loginError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-xs mb-4 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{loginError}</span>
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                  Usuario
                </label>
                <input
                  type="text"
                  required
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Marevas.mkt o admin"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#064E3B] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                  Contraseña
                </label>
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Introduce tu contraseña"
                  className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-sm text-[#064E3B] focus:border-[#064E3B] focus:ring-1 focus:ring-[#064E3B] focus:outline-none"
                />
              </div>

              {/* Quick credential selection pills */}
              <div className="pt-1 flex flex-wrap items-center gap-2">
                <span className="text-[11px] text-[#2F5E4E] font-medium">Accesos rápidos:</span>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('Marevas.mkt');
                    setPassword('JeSa@1313');
                  }}
                  className="text-[10px] px-2 py-1 rounded bg-[#DCE5E0]/70 hover:bg-[#064E3B] hover:text-white text-[#064E3B] font-semibold transition-colors cursor-pointer"
                >
                  Cuenta Marevas.mkt
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setUsername('admin');
                    setPassword('marevas2026!');
                  }}
                  className="text-[10px] px-2 py-1 rounded bg-[#DCE5E0]/70 hover:bg-[#064E3B] hover:text-white text-[#064E3B] font-semibold transition-colors cursor-pointer"
                >
                  Cuenta admin
                </button>
              </div>

              <button
                type="submit"
                disabled={loginLoading}
                className="w-full py-3 px-4 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-sm font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 mt-2"
              >
                {loginLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    <Key className="w-4 h-4" />
                    <span>Iniciar sesión</span>
                  </>
                )}
              </button>
            </form>
          </div>
        ) : (
          /* AUTHENTICATED DASHBOARD */
          <div className="flex flex-col md:flex-row grow overflow-hidden">
            
            {/* Sidebar Tabs Navigation */}
            <div className="w-full md:w-56 bg-[#DCE5E0]/30 border-r border-[#E5E7EB] p-3 shrink-0 flex md:flex-col gap-1 overflow-x-auto md:overflow-visible">
              <button
                onClick={() => {
                  setActiveTab('proyectos');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'proyectos'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <FolderPlus className="w-4 h-4" />
                <span>Portafolio (Vídeos y Fotos)</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('logotipo');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'logotipo'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <Image className="w-4 h-4" />
                <span>Logotipo e Identidad</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('servicios');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'servicios'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <Layers className="w-4 h-4" />
                <span>Servicios</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('textos');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'textos'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <Edit2 className="w-4 h-4" />
                <span>Textos & Portada</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('contacto');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'contacto'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <SettingsIcon className="w-4 h-4" />
                <span>WhatsApp & Canales</span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('leads');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'leads'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="flex items-center gap-1.5">
                  <span>Solicitudes</span>
                  {data?.inquiries && data.inquiries.filter((i) => i.status === 'nuevo').length > 0 && (
                    <span className="bg-emerald-600 text-white text-[10px] px-1.5 py-0.2 rounded-full font-bold">
                      {data.inquiries.filter((i) => i.status === 'nuevo').length}
                    </span>
                  )}
                </span>
              </button>

              <button
                onClick={() => {
                  setActiveTab('seguridad');
                  setEditingProject(null);
                }}
                className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-all text-left shrink-0 cursor-pointer ${
                  activeTab === 'seguridad'
                    ? 'bg-[#064E3B] text-white shadow-xs'
                    : 'text-[#2F5E4E] hover:bg-white/80'
                }`}
              >
                <Key className="w-4 h-4" />
                <span>Seguridad & Datos</span>
              </button>
            </div>

            {/* Tab Content Area */}
            <div className="grow p-6 overflow-y-auto">
              
              {/* TAB 1: PORTFOLIO & REELS */}
              {activeTab === 'proyectos' && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#064E3B]">
                        Gestión de Proyectos y Reels
                      </h3>
                      <p className="text-xs text-[#2F5E4E]">
                        Añade, edita, sube vídeos/fotos y define qué proyectos aparecen destacados.
                      </p>
                    </div>

                    {!editingProject && (
                      <button
                        onClick={() =>
                          setEditingProject({
                            title: '',
                            category: 'reels',
                            categoryLabel: 'Reels & Vídeos Verticales',
                            type: 'video',
                            mediaUrl: '',
                            thumbnailUrl: '',
                            description: '',
                            clientSector: 'Negocio / Marca',
                            featured: false,
                            orientation: 'vertical',
                            aspectRatio: '9:16',
                            isSample: false,
                            date: '2026',
                          })
                        }
                        className="px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-1.5 shadow-xs cursor-pointer"
                      >
                        <FolderPlus className="w-4 h-4" />
                        <span>Añadir Nuevo Proyecto</span>
                      </button>
                    )}
                  </div>

                  {/* PROJECT FORM MODAL / INLINE EDITOR */}
                  {editingProject ? (
                    <div className="bg-[#DCE5E0]/30 rounded-xl p-5 border border-[#E5E7EB] mb-6">
                      <div className="flex items-center justify-between mb-4 pb-2 border-b border-[#E5E7EB]">
                        <h4 className="font-display font-bold text-sm text-[#064E3B]">
                          {editingProject.id ? 'Editar Proyecto' : 'Crear Nuevo Proyecto'}
                        </h4>
                        <button
                          onClick={() => setEditingProject(null)}
                          className="text-xs text-[#2F5E4E] hover:text-[#064E3B]"
                        >
                          Cancelar
                        </button>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                          <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                            Título del proyecto *
                          </label>
                          <input
                            type="text"
                            value={editingProject.title || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, title: e.target.value })}
                            placeholder="Ej. Bottero: Campaña Colección Cuero"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                            Marca / Cliente oficial *
                          </label>
                          <input
                            type="text"
                            value={editingProject.brandName || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, brandName: e.target.value })}
                            placeholder="Ej. Bethânia Pratas / Bottero / Ultraforma"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none mb-1.5"
                          />
                          <div className="flex flex-wrap gap-1.5">
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  brandName: 'Bethânia Pratas',
                                  clientSector: 'Joyería en Plata 925',
                                })
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-[#DCE5E0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-colors"
                            >
                              Bethânia Pratas (Joyería)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  brandName: 'Bottero',
                                  clientSector: 'Calzado & Moda',
                                })
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-[#DCE5E0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-colors"
                            >
                              Bottero (Calzado)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  brandName: 'Ultraforma',
                                  clientSector: 'Clínica de Estética',
                                })
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-[#DCE5E0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-colors"
                            >
                              Ultraforma (Estética)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  brandName: 'Móvil Europa',
                                  clientSector: 'Tecnología & Móviles',
                                })
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-[#DCE5E0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-colors"
                            >
                              Móvil Europa (Telefonía)
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                setEditingProject({
                                  ...editingProject,
                                  brandName: 'Aura Boutique',
                                  clientSector: 'Moda & Boutique',
                                })
                              }
                              className="text-[10px] px-2 py-0.5 rounded bg-[#DCE5E0] text-[#064E3B] hover:bg-[#064E3B] hover:text-white transition-colors"
                            >
                              Aura Boutique (Moda)
                            </button>
                          </div>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                            Sector del cliente / Especialidad
                          </label>
                          <input
                            type="text"
                            value={editingProject.clientSector || ''}
                            onChange={(e) => setEditingProject({ ...editingProject, clientSector: e.target.value })}
                            placeholder="Ej. Joyería en Plata 925 / Calzado & Moda / Clínica de Estética"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                            Categoría
                          </label>
                          <select
                            value={editingProject.category || 'reels'}
                            onChange={(e) => {
                              const cat = e.target.value as any;
                              const labels: Record<string, string> = {
                                reels: 'Reels & Vídeos Verticales',
                                fotografia: 'Fotografía de Producto',
                                espacios: 'Espacios & Negocios',
                                marcas: 'Clínicas & Marcas',
                                comparativa: 'Comparativa Visual',
                              };
                              setEditingProject({
                                ...editingProject,
                                category: cat,
                                categoryLabel: labels[cat] || cat,
                              });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                          >
                            <option value="reels">Reels & Vídeos Verticales</option>
                            <option value="fotografia">Fotografía Móvil de Producto</option>
                            <option value="espacios">Espacios & Establecimientos</option>
                            <option value="marcas">Clínicas & Marcas</option>
                            <option value="comparativa">Comparativa Visual</option>
                          </select>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                            Tipo de Medio & Formato
                          </label>
                          <div className="grid grid-cols-2 gap-2">
                            <select
                              value={editingProject.type || 'video'}
                              onChange={(e) => setEditingProject({ ...editingProject, type: e.target.value as any })}
                              className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                            >
                              <option value="video">Vídeo</option>
                              <option value="image">Fotografía</option>
                            </select>

                            <select
                              value={editingProject.aspectRatio || '9:16'}
                              onChange={(e) => setEditingProject({ ...editingProject, aspectRatio: e.target.value as any })}
                              className="px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                            >
                              <option value="9:16">Vertical (9:16)</option>
                              <option value="4:5">Vertical feed (4:5)</option>
                              <option value="16:9">Horizontal (16:9)</option>
                              <option value="1:1">Cuadrado (1:1)</option>
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* Media Upload & URL section */}
                      <div className="p-4 rounded-xl bg-white border border-[#E5E7EB] mb-4 space-y-4">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-3">
                          <div>
                            <label className="text-xs font-bold text-[#064E3B] block">
                              Archivo multimedia principal (Vídeo o Fotografía) *
                            </label>
                            <span className="text-[11px] text-[#2F5E4E]">
                              Puedes subir el archivo directamente desde tu equipo (hasta 500 MB) o indicar una URL externa.
                            </span>
                          </div>
                          
                          {/* File input */}
                          <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors shrink-0 ${
                            isUploading
                              ? 'bg-amber-100 text-amber-800 cursor-not-allowed'
                              : 'bg-[#064E3B] hover:bg-[#2F5E4E] text-white shadow-xs'
                          }`}>
                            <Upload className="w-3.5 h-3.5" />
                            <span>{isUploading && uploadProgress?.target === 'projectMedia' ? `Subiendo ${uploadProgress.percent}%...` : isUploading ? 'Subiendo...' : 'Subir desde ordenador'}</span>
                            <input
                              type="file"
                              accept="video/mp4,video/webm,video/quicktime,video/*,image/*"
                              disabled={isUploading}
                              className="hidden"
                              onChange={(e) => handleFileUpload(e, 'projectMedia')}
                            />
                          </label>
                        </div>

                        {/* Upload Progress Bar for large 500MB video/photo files */}
                        {isUploading && uploadProgress?.target === 'projectMedia' && (
                          <div className="p-3.5 rounded-xl bg-emerald-50/90 border border-emerald-200 space-y-2 animate-fadeIn">
                            <div className="flex items-center justify-between text-xs text-[#064E3B] font-medium">
                              <span className="flex items-center gap-1.5 truncate max-w-[320px]">
                                {uploadProgress.stage === 'processing' ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                                ) : (
                                  <Upload className="w-3.5 h-3.5 animate-bounce text-emerald-600 shrink-0" />
                                )}
                                <span>
                                  <strong>{uploadProgress.filename}</strong>: {uploadProgress.statusMessage || (uploadProgress.stage === 'processing' ? 'Optimizando vídeo para reproducción instantánea...' : 'Subiendo archivo...')}
                                </span>
                              </span>
                              <span className="font-bold text-emerald-700 font-mono text-sm">{uploadProgress.percent}%</span>
                            </div>
                            <div className="w-full bg-emerald-200/60 rounded-full h-2.5 overflow-hidden">
                              <div
                                className={`h-2.5 rounded-full transition-all duration-300 ease-out ${
                                  uploadProgress.stage === 'processing' ? 'bg-emerald-600 animate-pulse' : 'bg-[#064E3B]'
                                }`}
                                style={{ width: `${uploadProgress.percent}%` }}
                              />
                            </div>
                            <div className="flex items-center justify-between text-[11px] text-[#2F5E4E]">
                              <span>{(uploadProgress.loaded / (1024 * 1024)).toFixed(1)} MB de {(uploadProgress.total / (1024 * 1024)).toFixed(1)} MB</span>
                              <span className="font-semibold text-emerald-700">
                                {uploadProgress.stage === 'processing' ? 'Paso 2/2: Conversión H.264 + FastStart' : 'Paso 1/2: Subida al servidor (límite 500 MB)'}
                              </span>
                            </div>
                          </div>
                        )}

                        <div>
                          <label className="block text-[11px] font-semibold text-[#2F5E4E] mb-1">
                            URL directa del medio o ruta del archivo:
                          </label>
                          <input
                            type="text"
                            value={editingProject.mediaUrl || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              const isVid = /\.(mp4|webm|mov|m4v|mkv|avi|3gp)($|\?)/i.test(val) || val.includes('video');
                              setEditingProject({
                                ...editingProject,
                                mediaUrl: val,
                                type: isVid ? 'video' : (editingProject.type || 'video'),
                                thumbnailUrl: editingProject.thumbnailUrl || val,
                              });
                            }}
                            placeholder="https://... o /uploads/marevas-video.mp4"
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-xs text-[#064E3B] font-mono focus:border-[#064E3B] focus:bg-white focus:outline-none"
                          />
                        </div>

                        {/* Thumbnail / Poster for videos */}
                        {editingProject.type === 'video' && (
                          <div className="pt-3 border-t border-[#E5E7EB]">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                              <div>
                                <label className="text-xs font-semibold text-[#064E3B] block">
                                  Portada / Miniatura del vídeo
                                </label>
                                <span className="text-[11px] text-[#2F5E4E]">
                                  Sube una fotografía (JPG, PNG, WebP) directamente desde tu dispositivo o introduce una URL.
                                </span>
                              </div>
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCE5E0] hover:bg-[#2F5E4E] hover:text-white text-[#064E3B] text-xs font-semibold cursor-pointer transition-colors shrink-0">
                                <Camera className="w-3.5 h-3.5" />
                                <span>{isUploading && uploadProgress?.target === 'projectThumbnail' ? 'Subiendo...' : 'Subir fotografía desde dispositivo'}</span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/jpg"
                                  disabled={isUploading}
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, 'projectThumbnail')}
                                />
                              </label>
                            </div>

                            {/* Live preview before saving */}
                            {editingProject.thumbnailUrl && (
                              <div className="mb-2.5 p-2 rounded-lg bg-[#F9FAFB] border border-[#E5E7EB] flex items-center justify-between gap-3">
                                <div className="flex items-center gap-3">
                                  <img
                                    src={editingProject.thumbnailUrl}
                                    alt="Vista previa miniatura"
                                    className="w-14 h-14 rounded-md object-cover border border-[#E5E7EB] bg-black/10"
                                  />
                                  <div>
                                    <span className="text-xs font-semibold text-[#064E3B] block">Vista previa de la fotografía</span>
                                    <span className="text-[10px] text-[#2F5E4E] font-mono truncate max-w-[200px] block">
                                      {editingProject.thumbnailUrl}
                                    </span>
                                  </div>
                                </div>
                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] text-[#064E3B] hover:underline font-semibold cursor-pointer">
                                    <span>Sustituir</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/jpg"
                                      disabled={isUploading}
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(e, 'projectThumbnail')}
                                    />
                                  </label>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => setEditingProject({ ...editingProject, thumbnailUrl: '' })}
                                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>
                            )}

                            <input
                              type="text"
                              value={editingProject.thumbnailUrl || ''}
                              onChange={(e) => setEditingProject({ ...editingProject, thumbnailUrl: e.target.value })}
                              placeholder="URL o ruta de la miniatura previa (opcional)"
                              className="w-full px-3 py-1.5 rounded-lg border border-[#E5E7EB] bg-[#F9FAFB] text-[11px] text-[#064E3B] font-mono focus:border-[#064E3B] focus:bg-white focus:outline-none"
                            />
                          </div>
                        )}

                        {/* Live Media Player / Preview */}
                        {editingProject.mediaUrl && (
                          <div className="mt-3 p-3 rounded-lg bg-[#DCE5E0]/40 border border-[#DCE5E0] flex flex-col items-center">
                            <div className="w-full flex items-center justify-between mb-2">
                              <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-800">
                                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                <span>Vista previa en vivo del contenido cargado</span>
                              </div>
                              <span className="text-[10px] font-mono text-[#2F5E4E] bg-white px-2 py-0.5 rounded border border-[#E5E7EB]">
                                Formato: {editingProject.type === 'video' ? 'Vídeo' : 'Fotografía'} ({editingProject.aspectRatio || '9:16'})
                              </span>
                            </div>

                            <div className="max-h-64 w-full flex justify-center items-center overflow-hidden rounded-lg bg-black">
                              {editingProject.type === 'video' ? (
                                <video
                                  src={editingProject.mediaUrl}
                                  poster={editingProject.thumbnailUrl}
                                  controls
                                  playsInline
                                  className="max-h-60 max-w-full object-contain"
                                />
                              ) : (
                                <img
                                  src={editingProject.mediaUrl}
                                  alt="Vista previa"
                                  className="max-h-60 max-w-full object-contain"
                                />
                              )}
                            </div>

                            <div className="w-full pt-2 mt-2 border-t border-[#064E3B]/20 flex items-center justify-between text-xs">
                              <label className="text-[11px] font-semibold text-[#064E3B] hover:underline cursor-pointer flex items-center gap-1">
                                <Upload className="w-3 h-3" />
                                <span>Sustituir {editingProject.type === 'video' ? 'vídeo' : 'fotografía'} desde dispositivo</span>
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime,video/*,image/*"
                                  disabled={isUploading}
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, 'projectMedia')}
                                />
                              </label>
                              <button
                                type="button"
                                onClick={() => setEditingProject({ ...editingProject, mediaUrl: '' })}
                                className="text-[11px] font-semibold text-red-600 hover:underline cursor-pointer"
                              >
                                Eliminar {editingProject.type === 'video' ? 'vídeo' : 'fotografía'}
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Description */}
                      <div className="mb-4">
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Descripción del proyecto
                        </label>
                        <textarea
                          rows={3}
                          value={editingProject.description || ''}
                          onChange={(e) => setEditingProject({ ...editingProject, description: e.target.value })}
                          placeholder="Explica el enfoque creativo, el resultado o el tipo de negocio..."
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] bg-white text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      {/* Flags (Featured, isSample) */}
                      <div className="flex flex-wrap items-center gap-6 mb-5">
                        <label className="flex items-center gap-2 text-xs font-medium text-[#064E3B] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProject.featured)}
                            onChange={(e) => setEditingProject({ ...editingProject, featured: e.target.checked })}
                            className="rounded border-[#E5E7EB] text-[#064E3B] focus:ring-[#064E3B]"
                          />
                          <span>Marcar como proyecto destacado</span>
                        </label>

                        <label className="flex items-center gap-2 text-xs font-medium text-[#2F5E4E] cursor-pointer">
                          <input
                            type="checkbox"
                            checked={Boolean(editingProject.isSample)}
                            onChange={(e) => setEditingProject({ ...editingProject, isSample: e.target.checked })}
                            className="rounded border-[#E5E7EB] text-[#064E3B] focus:ring-[#064E3B]"
                          />
                          <span>Etiquetar como "Espacio de muestra"</span>
                        </label>
                      </div>

                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          disabled={isUploading || isSavingProject}
                          onClick={handleSaveProject}
                          className="px-5 py-2.5 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shadow-xs"
                        >
                          {isSavingProject ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Guardando proyecto...</span>
                            </>
                          ) : isUploading ? (
                            <>
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                              <span>Subiendo archivo ({uploadProgress?.percent || 0}%)...</span>
                            </>
                          ) : (
                            <>
                              <Save className="w-3.5 h-3.5" />
                              <span>Guardar Proyecto</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          disabled={isSavingProject}
                          onClick={() => setEditingProject(null)}
                          className="px-4 py-2 rounded-lg bg-white border border-[#E5E7EB] text-xs text-[#2F5E4E] hover:text-[#064E3B] disabled:opacity-50"
                        >
                          Cancelar
                        </button>
                        {editingProject.id && (
                          <button
                            type="button"
                            onClick={() => {
                              const proj = data?.projects.find((p) => p.id === editingProject.id) || (editingProject as Project);
                              setProjectToDelete(proj);
                            }}
                            className="ml-auto px-3.5 py-2 rounded-lg bg-red-50 hover:bg-red-600 hover:text-white text-xs font-semibold text-red-600 flex items-center gap-1.5 transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Eliminar este proyecto</span>
                          </button>
                        )}
                      </div>
                    </div>
                  ) : null}

                  {/* Projects List Table */}
                  <div className="space-y-3">
                    {data?.projects?.map((proj, idx) => (
                      <div
                        key={proj.id}
                        className="p-3.5 rounded-xl bg-white border border-[#E5E7EB] hover:border-[#2F5E4E] transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                      >
                        <div className="flex items-center gap-3">
                          {/* Mini Thumbnail */}
                          <div className="w-12 h-12 rounded-lg bg-black overflow-hidden shrink-0 relative">
                            {proj.type === 'video' ? (
                              <video src={proj.mediaUrl} className="w-full h-full object-cover" />
                            ) : (
                              <img src={proj.mediaUrl || proj.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                            )}
                            <div className="absolute bottom-0 right-0 p-0.5 bg-black/60 text-white text-[8px] font-mono">
                              {proj.aspectRatio}
                            </div>
                          </div>

                          <div>
                            <div className="flex items-center gap-2">
                              <h4 className="font-display font-bold text-sm text-[#064E3B]">
                                {proj.title}
                              </h4>
                              {proj.featured && (
                                <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                              )}
                              {proj.isSample && (
                                <span className="text-[10px] bg-[#DCE5E0] text-[#064E3B] px-1.5 py-0.2 rounded font-medium">
                                  Muestra
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#2F5E4E] flex items-center gap-2 mt-0.5">
                              <span>{proj.categoryLabel}</span>
                              <span aria-hidden="true">·</span>
                              <span>{proj.clientSector}</span>
                            </div>
                          </div>
                        </div>

                        {/* Reorder and Action Buttons */}
                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                          <button
                            onClick={() => handleMoveProject(idx, 'up')}
                            disabled={idx === 0}
                            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-[#064E3B] disabled:opacity-30 cursor-pointer"
                            title="Subir orden"
                          >
                            <ChevronUp className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleMoveProject(idx, 'down')}
                            disabled={idx === (data?.projects?.length || 0) - 1}
                            className="p-1.5 rounded bg-gray-100 hover:bg-gray-200 text-[#064E3B] disabled:opacity-30 cursor-pointer"
                            title="Bajar orden"
                          >
                            <ChevronDown className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setEditingProject(proj)}
                            className="p-1.5 rounded bg-[#DCE5E0]/60 hover:bg-[#064E3B] hover:text-white text-[#064E3B] transition-colors cursor-pointer"
                            title="Editar"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => setProjectToDelete(proj)}
                            className="p-1.5 rounded bg-red-50 hover:bg-red-600 hover:text-white text-red-600 transition-colors cursor-pointer"
                            title={`Eliminar ${proj.title}`}
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB: LOGOTIPO E IDENTIDAD */}
              {activeTab === 'logotipo' && data && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#064E3B]">
                        Logotipo Oficial e Identidad de Marca
                      </h3>
                      <p className="text-xs text-[#2F5E4E]">
                        Gestiona el archivo oficial del logotipo de Marevas MKT visible en la cabecera, pie de página y portada.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Logotipo</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-xl bg-white border border-[#E5E7EB] space-y-6 max-w-2xl">
                    <div>
                      <div className="text-xs font-semibold text-[#064E3B] mb-3">
                        Vista previa del logotipo activo:
                      </div>
                      <div className="p-6 rounded-2xl bg-white border-2 border-dashed border-[#2F5E4E]/30 flex items-center justify-center min-h-[160px] shadow-2xs">
                        <img
                          src={data.settings.logoUrl || '/logo-marevas.svg'}
                          alt="Marevas MKT Logo"
                          className="max-h-24 w-auto object-contain"
                        />
                      </div>
                    </div>

                    <div className="space-y-4 pt-2">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <label className="text-xs font-semibold text-[#064E3B]">
                          Subir nuevo archivo de logotipo (PNG, SVG, JPG)
                        </label>
                        <label className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-xs">
                          <Upload className="w-3.5 h-3.5" />
                          <span>{isUploading ? 'Subiendo...' : 'Subir desde mi ordenador'}</span>
                          <input
                            type="file"
                            accept="image/*,.svg"
                            disabled={isUploading}
                            className="hidden"
                            onChange={(e) => handleFileUpload(e, 'logo')}
                          />
                        </label>
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          O introduce la ruta / URL del archivo:
                        </label>
                        <input
                          type="text"
                          value={data.settings.logoUrl || '/logo-marevas.svg'}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, logoUrl: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] font-mono focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div className="pt-2 flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setData({
                              ...data,
                              settings: { ...data.settings, logoUrl: '/logo-marevas.svg' },
                            });
                            showFeedback('success', 'Restaurado logotipo vectorial oficial original');
                          }}
                          className="px-3 py-1.5 rounded-lg border border-[#2F5E4E]/30 text-xs text-[#064E3B] hover:bg-[#DCE5E0]/40 transition-colors"
                        >
                          Restablecer logotipo vectorial original
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: SERVICIOS */}
              {activeTab === 'servicios' && (
                <div>
                  <div className="mb-6">
                    <h3 className="font-display font-bold text-xl text-[#064E3B]">
                      Modificar Servicios Creativos
                    </h3>
                    <p className="text-xs text-[#2F5E4E]">
                      Edita los textos, detalles y el vídeo o imagen de muestra de cada bloque de servicio.
                    </p>
                  </div>

                  <div className="space-y-6">
                    {data?.services?.map((service) => (
                      <div
                        key={service.id}
                        className="p-5 rounded-xl bg-white border border-[#E5E7EB] space-y-4"
                      >
                        <div className="flex items-center justify-between">
                          <h4 className="font-display font-bold text-base text-[#064E3B]">
                            {service.title}
                          </h4>
                          <span className="text-xs font-mono text-[#2F5E4E]">{service.id}</span>
                        </div>

                        <div>
                          <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                            Descripción breve
                          </label>
                          <textarea
                            rows={2}
                            value={service.shortDesc}
                            onChange={(e) => {
                              const updated = data.services.map((s) =>
                                s.id === service.id ? { ...s, shortDesc: e.target.value } : s
                              );
                              setData({ ...data, services: updated });
                            }}
                            className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                          />
                        </div>

                        <div className="pt-3 border-t border-[#E5E7EB] space-y-3">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                            <div>
                              <label className="text-xs font-semibold text-[#064E3B] block">
                                Vídeo o fotografía de muestra del servicio
                              </label>
                              <span className="text-[11px] text-[#2F5E4E]">
                                Puedes seleccionar vídeos (hasta 500 MB) o fotos directamente desde tu equipo.
                              </span>
                            </div>

                            <div className="flex flex-wrap items-center gap-2">
                              {/* Video Upload Button */}
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#064E3B] hover:bg-[#2F5E4E] text-white text-xs font-semibold cursor-pointer transition-colors shrink-0 shadow-2xs">
                                <Film className="w-3.5 h-3.5" />
                                <span>
                                  {isUploading && uploadProgress?.target === `service_video_${service.id}`
                                    ? `Subiendo ${uploadProgress.percent}%...`
                                    : 'Subir vídeo (hasta 500 MB)'}
                                </span>
                                <input
                                  type="file"
                                  accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.mov,.webm"
                                  disabled={isUploading}
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, `service_video_${service.id}`)}
                                />
                              </label>

                              {/* Photo Upload Button */}
                              <label className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#DCE5E0] hover:bg-[#2F5E4E] hover:text-white text-[#064E3B] text-xs font-semibold cursor-pointer transition-colors shrink-0">
                                <Camera className="w-3.5 h-3.5" />
                                <span>
                                  {isUploading && uploadProgress?.target === `service_photo_${service.id}`
                                    ? 'Subiendo...'
                                    : 'Subir foto'}
                                </span>
                                <input
                                  type="file"
                                  accept="image/jpeg,image/png,image/webp,image/jpg"
                                  disabled={isUploading}
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(e, `service_photo_${service.id}`)}
                                />
                              </label>
                            </div>
                          </div>

                          {/* Upload Progress Bar for Service */}
                          {isUploading &&
                            (uploadProgress?.target === `service_video_${service.id}` ||
                              uploadProgress?.target === `service_photo_${service.id}`) && (
                              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 space-y-1.5">
                                <div className="flex items-center justify-between text-xs text-[#064E3B]">
                                  <span className="truncate max-w-[280px] font-medium flex items-center gap-1.5">
                                    {uploadProgress.stage === 'processing' ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600 shrink-0" />
                                    ) : (
                                      <Upload className="w-3.5 h-3.5 animate-bounce text-emerald-600 shrink-0" />
                                    )}
                                    <span>
                                      <strong>{uploadProgress.filename}</strong>: {uploadProgress.statusMessage || (uploadProgress.stage === 'processing' ? 'Optimizando formato...' : 'Subiendo...')}
                                    </span>
                                  </span>
                                  <span className="font-bold text-emerald-800 font-mono">
                                    {uploadProgress.percent}%
                                  </span>
                                </div>
                                <div className="w-full bg-emerald-200/70 rounded-full h-2 overflow-hidden">
                                  <div
                                    className={`h-2 rounded-full transition-all duration-300 ${
                                      uploadProgress.stage === 'processing' ? 'bg-emerald-600 animate-pulse' : 'bg-[#064E3B]'
                                    }`}
                                    style={{ width: `${uploadProgress.percent}%` }}
                                  />
                                </div>
                                <div className="flex justify-between text-[10px] text-[#2F5E4E]">
                                  <span>
                                    {(uploadProgress.loaded / (1024 * 1024)).toFixed(1)} MB de{' '}
                                    {(uploadProgress.total / (1024 * 1024)).toFixed(1)} MB
                                  </span>
                                  <span className="font-semibold text-emerald-700">
                                    {uploadProgress.stage === 'processing' ? 'Optimizando para web' : 'Subida directa (hasta 500 MB)'}
                                  </span>
                                </div>
                              </div>
                            )}

                          {/* Live preview before saving */}
                          {service.mediaUrl && (
                            <div className="p-3 rounded-xl bg-[#F9FAFB] border border-[#E5E7EB] space-y-2.5">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-1.5 text-xs font-semibold text-[#064E3B]">
                                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>Vista previa del archivo cargado</span>
                                </div>

                                <div className="flex items-center gap-2">
                                  <label className="text-[11px] text-[#064E3B] hover:underline font-semibold cursor-pointer">
                                    <span>Sustituir vídeo</span>
                                    <input
                                      type="file"
                                      accept="video/mp4,video/webm,video/quicktime,video/*,.mp4,.mov,.webm"
                                      disabled={isUploading}
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(e, `service_video_${service.id}`)}
                                    />
                                  </label>
                                  <span className="text-gray-300">|</span>
                                  <label className="text-[11px] text-[#064E3B] hover:underline font-semibold cursor-pointer">
                                    <span>Sustituir foto</span>
                                    <input
                                      type="file"
                                      accept="image/jpeg,image/png,image/webp,image/jpg"
                                      disabled={isUploading}
                                      className="hidden"
                                      onChange={(e) => handleFileUpload(e, `service_photo_${service.id}`)}
                                    />
                                  </label>
                                  <span className="text-gray-300">|</span>
                                  <button
                                    type="button"
                                    onClick={() => {
                                      const updated = data.services.map((s) =>
                                        s.id === service.id ? { ...s, mediaUrl: '' } : s
                                      );
                                      setData({ ...data, services: updated });
                                    }}
                                    className="text-[11px] text-red-600 hover:underline font-semibold cursor-pointer"
                                  >
                                    Eliminar
                                  </button>
                                </div>
                              </div>

                              <div className="flex justify-center items-center bg-black/5 rounded-lg p-2 overflow-hidden max-h-56">
                                {service.mediaType === 'video' ||
                                /\.(mp4|webm|mov|m4v)($|\?)/i.test(service.mediaUrl) ? (
                                  <video
                                    src={service.mediaUrl}
                                    controls
                                    playsInline
                                    className="max-h-52 w-auto rounded-lg bg-black"
                                  />
                                ) : (
                                  <img
                                    src={service.mediaUrl}
                                    alt={service.title}
                                    className="max-h-48 w-auto rounded-lg object-contain"
                                  />
                                )}
                              </div>

                              <div className="flex items-center justify-between text-[11px] text-[#2F5E4E]">
                                <span className="font-mono truncate max-w-[280px]">
                                  {service.mediaUrl}
                                </span>
                                <span className="px-2 py-0.5 rounded bg-white border border-[#E5E7EB] font-medium">
                                  {service.mediaType === 'video' ? 'Vídeo' : 'Fotografía'}
                                </span>
                              </div>
                            </div>
                          )}

                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 pt-1">
                            <div className="sm:col-span-2">
                              <label className="block text-[11px] font-semibold text-[#2F5E4E] mb-1">
                                Ruta / URL del archivo:
                              </label>
                              <input
                                type="text"
                                value={service.mediaUrl || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  const isVid = /\.(mp4|webm|mov|m4v)($|\?)/i.test(val);
                                  const updated = data.services.map((s) =>
                                    s.id === service.id
                                      ? {
                                          ...s,
                                          mediaUrl: val,
                                          mediaType: isVid ? 'video' : s.mediaType,
                                        }
                                      : s
                                  );
                                  setData({ ...data, services: updated });
                                }}
                                placeholder="URL externa o ruta /uploads/..."
                                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] font-mono focus:border-[#064E3B] focus:outline-none"
                              />
                            </div>

                            <div>
                              <label className="block text-[11px] font-semibold text-[#2F5E4E] mb-1">
                                Tipo de formato:
                              </label>
                              <select
                                value={service.mediaType || 'image'}
                                onChange={(e) => {
                                  const val = e.target.value as 'video' | 'image';
                                  const updated = data.services.map((s) =>
                                    s.id === service.id ? { ...s, mediaType: val } : s
                                  );
                                  setData({ ...data, services: updated });
                                }}
                                className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                              >
                                <option value="video">Vídeo (Reel / Muestra)</option>
                                <option value="image">Fotografía / Imagen</option>
                              </select>
                            </div>
                          </div>
                        </div>

                        <div className="pt-2 flex justify-end">
                          <button
                            onClick={() => handleSaveService(service)}
                            className="px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
                          >
                            <Save className="w-3.5 h-3.5" />
                            <span>Guardar este servicio</span>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: TEXTOS & PORTADA */}
              {activeTab === 'textos' && data && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#064E3B]">
                        Textos de Portada & «Sobre Marevas»
                      </h3>
                      <p className="text-xs text-[#2F5E4E]">
                        Ajusta los titulares principales y la presentación de la agencia.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar todos los textos</span>
                    </button>
                  </div>

                  <div className="space-y-6">
                    {/* Hero Section Texts */}
                    <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] space-y-4">
                      <h4 className="font-display font-bold text-sm text-[#064E3B] pb-2 border-b border-[#E5E7EB]">
                        Portada / Cabecera
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Titular Principal
                        </label>
                        <input
                          type="text"
                          value={data.settings.tagline}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, tagline: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] font-semibold focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Texto Secundario de Presentación
                        </label>
                        <textarea
                          rows={3}
                          value={data.settings.heroSubtext}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, heroSubtext: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>
                    </div>

                    {/* Sobre Marevas Texts */}
                    <div className="p-5 rounded-xl bg-white border border-[#E5E7EB] space-y-4">
                      <h4 className="font-display font-bold text-sm text-[#064E3B] pb-2 border-b border-[#E5E7EB]">
                        Sección «Sobre Marevas»
                      </h4>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Título
                        </label>
                        <input
                          type="text"
                          value={data.settings.aboutTitle}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, aboutTitle: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] font-semibold focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Párrafo 1
                        </label>
                        <textarea
                          rows={2}
                          value={data.settings.aboutText1}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, aboutText1: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Párrafo 2
                        </label>
                        <textarea
                          rows={2}
                          value={data.settings.aboutText2}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, aboutText2: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Párrafo 3
                        </label>
                        <textarea
                          rows={2}
                          value={data.settings.aboutText3}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, aboutText3: e.target.value },
                            })
                          }
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 4: CONTACTO & REDES */}
              {activeTab === 'contacto' && data && (
                <div>
                  <div className="flex items-center justify-between mb-6">
                    <div>
                      <h3 className="font-display font-bold text-xl text-[#064E3B]">
                        Canales de Contacto & Redes
                      </h3>
                      <p className="text-xs text-[#2F5E4E]">
                        Configura el número de WhatsApp, mensaje predeterminado e Instagram oficial de Marevas MKT.
                      </p>
                    </div>

                    <button
                      onClick={handleSaveSettings}
                      className="px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Guardar Canales</span>
                    </button>
                  </div>

                  <div className="p-6 rounded-xl bg-white border border-[#E5E7EB] space-y-5">
                    <div>
                      <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                        Teléfono WhatsApp (formato internacional con prefijo, ej. +34600112233)
                      </label>
                      <input
                        type="text"
                        value={data.settings.whatsappNumber}
                        onChange={(e) =>
                          setData({
                            ...data,
                            settings: { ...data.settings, whatsappNumber: e.target.value },
                          })
                        }
                        placeholder="+34600000000"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] font-mono focus:border-[#064E3B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                        Mensaje automático al abrir WhatsApp
                      </label>
                      <input
                        type="text"
                        value={data.settings.whatsappDefaultMessage}
                        onChange={(e) =>
                          setData({
                            ...data,
                            settings: { ...data.settings, whatsappDefaultMessage: e.target.value },
                          })
                        }
                        placeholder="¡Hola Marevas MKT! Quiero información para mi marca..."
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                      />
                    </div>

                    <div>
                      <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                        Enlace a Instagram
                      </label>
                      <input
                        type="text"
                        value={data.settings.instagramUrl}
                        onChange={(e) =>
                          setData({
                            ...data,
                            settings: { ...data.settings, instagramUrl: e.target.value },
                          })
                        }
                        placeholder="https://instagram.com/marevasmkt"
                        className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] font-mono focus:border-[#064E3B] focus:outline-none"
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Email de contacto visible
                        </label>
                        <input
                          type="email"
                          value={data.settings.email}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, email: e.target.value },
                            })
                          }
                          placeholder="contacto@marevasmkt.es"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Ubicación
                        </label>
                        <input
                          type="text"
                          value={data.settings.location}
                          onChange={(e) =>
                            setData({
                              ...data,
                              settings: { ...data.settings, location: e.target.value },
                            })
                          }
                          placeholder="Madrid, España"
                          className="w-full px-3.5 py-2.5 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 5: LEADS & SOLICITUDES */}
              {activeTab === 'leads' && (
                <div>
                  <div className="mb-6">
                    <h3 className="font-display font-bold text-xl text-[#064E3B]">
                      Solicitudes de Contacto Recibidas
                    </h3>
                    <p className="text-xs text-[#2F5E4E]">
                      Propuestas y mensajes enviados por posibles clientes desde el formulario web.
                    </p>
                  </div>

                  {!data?.inquiries || data.inquiries.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-[#E5E7EB] text-[#2F5E4E] text-xs">
                      No hay solicitudes registradas todavía. Las peticiones enviadas por los clientes aparecerán aquí automáticamente.
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {data.inquiries.map((inq) => (
                        <div
                          key={inq.id}
                          className="p-4 rounded-xl bg-white border border-[#E5E7EB] flex flex-col justify-between gap-3 shadow-2xs"
                        >
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#E5E7EB] pb-2.5">
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-display font-bold text-sm text-[#064E3B]">
                                  {inq.name}
                                </span>
                                {inq.businessName && (
                                  <span className="text-xs font-medium text-[#2F5E4E]">
                                    ({inq.businessName})
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-[#2F5E4E]">
                                <a href={`mailto:${inq.email}`} className="underline hover:text-[#064E3B]">
                                  {inq.email}
                                </a>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              <span
                                className={`text-[10px] font-semibold uppercase px-2 py-0.5 rounded ${
                                  inq.status === 'nuevo'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : inq.status === 'contactado'
                                    ? 'bg-blue-100 text-blue-800'
                                    : 'bg-gray-100 text-gray-800'
                                }`}
                              >
                                {inq.status}
                              </span>
                              <span className="text-[11px] text-gray-400">
                                {new Date(inq.createdAt).toLocaleDateString('es-ES', {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                            </div>
                          </div>

                          <div className="text-xs text-[#064E3B] bg-[#DCE5E0]/20 p-3 rounded-lg">
                            <span className="font-semibold block mb-1 text-[#2F5E4E]">
                              Servicio solicitado: {inq.serviceType}
                            </span>
                            <p className="whitespace-pre-wrap">{inq.message}</p>
                          </div>

                          <div className="flex items-center justify-between pt-1">
                            <div className="flex items-center gap-2 text-xs">
                              <span className="text-[11px] text-[#2F5E4E]">Cambiar estado:</span>
                              <select
                                value={inq.status}
                                onChange={(e) =>
                                  handleUpdateInquiryStatus(inq.id, e.target.value as any)
                                }
                                className="px-2 py-1 rounded border border-[#E5E7EB] text-xs text-[#064E3B] bg-white"
                              >
                                <option value="nuevo">Nuevo</option>
                                <option value="contactado">Contactado</option>
                                <option value="archivado">Archivado</option>
                              </select>
                            </div>

                            <button
                              onClick={() => setInquiryToDelete(inq.id)}
                              className="text-xs text-red-600 hover:text-red-800 p-1 flex items-center gap-1 cursor-pointer"
                              title="Eliminar solicitud"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              <span>Eliminar</span>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 6: SEGURIDAD & DATOS */}
              {activeTab === 'seguridad' && (
                <div className="space-y-6">
                  <div>
                    <h3 className="font-display font-bold text-xl text-[#064E3B]">
                      Seguridad y Almacenamiento Persistente
                    </h3>
                    <p className="text-xs text-[#2F5E4E]">
                      Gestiona las credenciales de acceso y el estado de la base de datos local.
                    </p>
                  </div>

                  {/* Change Password Box */}
                  <div className="p-5 rounded-xl bg-white border border-[#E5E7EB]">
                    <h4 className="font-display font-bold text-sm text-[#064E3B] mb-3 flex items-center gap-2">
                      <Key className="w-4 h-4" />
                      <span>Cambiar contraseña de administrador</span>
                    </h4>

                    <form onSubmit={handleChangePassword} className="space-y-3 max-w-sm">
                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Nueva contraseña (mínimo 6 caracteres)
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-[#064E3B] mb-1">
                          Confirmar nueva contraseña
                        </label>
                        <input
                          type="password"
                          required
                          minLength={6}
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="w-full px-3 py-2 rounded-lg border border-[#E5E7EB] text-xs text-[#064E3B] focus:border-[#064E3B] focus:outline-none"
                        />
                      </div>

                      <button
                        type="submit"
                        className="px-4 py-2 rounded-lg bg-[#064E3B] text-white hover:bg-[#2F5E4E] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
                      >
                        <Save className="w-3.5 h-3.5" />
                        <span>Actualizar contraseña</span>
                      </button>
                    </form>
                  </div>

                  {/* System Architecture & Storage Diagnostic */}
                  <div className="p-5 rounded-xl bg-[#DCE5E0]/40 border border-[#DCE5E0] text-xs text-[#064E3B] space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="font-semibold flex items-center gap-1.5 text-sm">
                        <Info className="w-4 h-4 text-[#064E3B]" />
                        <span>Estado del Almacenamiento & Persistencia:</span>
                      </h4>
                      <span
                        className={`px-2.5 py-1 rounded-full text-[11px] font-bold ${
                          storageStatus?.isBlobConfigured
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                            : 'bg-amber-100 text-amber-800 border border-amber-300'
                        }`}
                      >
                        {storageStatus?.isBlobConfigured
                          ? '● Vercel Blob Activo (Nube)'
                          : '● Almacenamiento Local (Disco)'}
                      </span>
                    </div>

                    {storageStatus?.isBlobConfigured ? (
                      <div className="p-3 rounded-lg bg-emerald-50/80 border border-emerald-200 text-emerald-900 space-y-1">
                        <p className="font-semibold text-xs">
                          ✓ Almacenamiento persistente en la nube (Vercel Blob) conectado correctamente.
                        </p>
                        <p className="text-[11px] text-emerald-800">
                          Tus vídeos y fotos se suben directamente a la CDN global de Vercel y los datos de los proyectos se sincronizan de forma permanente. No se perderán tras nuevas publicaciones ni reinicios de servidor.
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 rounded-lg bg-amber-50/80 border border-amber-200 text-amber-900 space-y-2">
                        <p className="font-semibold text-xs">
                          Modo actual: Almacenamiento local en disco del servidor.
                        </p>
                        <p className="text-[11px] text-amber-800 leading-relaxed">
                          En este entorno de desarrollo o en servidores tradicionales con disco (Google Cloud Run / Railway / VPS), los archivos se guardan en <code>./data/site-data.json</code> y <code>./public/uploads/</code>.
                        </p>
                        <div className="p-2.5 rounded bg-white/80 border border-amber-200 text-[11px] text-[#064E3B] space-y-1">
                          <span className="font-bold block">Para habilitar persistencia permanente en Vercel:</span>
                          <ol className="list-decimal list-inside space-y-0.5 text-[#2F5E4E]">
                            <li>Abre tu proyecto en el panel de Vercel (<span className="font-mono text-[#064E3B]">vercel.com</span>).</li>
                            <li>Ve a la pestaña <strong>Storage</strong> y selecciona <strong>Blob</strong>.</li>
                            <li>Crea tu almacenamiento gratuito (1 GB gratis) y conéctalo al proyecto.</li>
                            <li>Vercel asignará la variable <code className="font-mono bg-amber-100 px-1 rounded">BLOB_READ_WRITE_TOKEN</code> automáticamente.</li>
                          </ol>
                        </div>
                      </div>
                    )}

                    <div className="pt-1 text-[11px] text-[#2F5E4E] border-t border-[#DCE5E0]/60 space-y-1">
                      <p>
                        <strong>Seguridad del sistema:</strong> Autenticación validada en el servidor mediante tokens firmados HMAC (SHA-256) sin exposición de contraseñas en el frontend.
                      </p>
                    </div>
                  </div>

                  {/* Reset to demo */}
                  <div className="p-5 rounded-xl bg-red-50/50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h4 className="font-display font-bold text-sm text-red-900">
                        Restablecer a datos de muestra iniciales
                      </h4>
                      <p className="text-xs text-red-700">
                        Vuelve a la configuración de demostración recomendada con los proyectos de muestra y los 5 servicios estructurados.
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowResetConfirm(true)}
                      className="px-4 py-2 rounded-lg bg-red-600 text-white hover:bg-red-700 text-xs font-semibold flex items-center gap-1.5 shrink-0 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Restablecer Demo</span>
                    </button>
                  </div>
                </div>
              )}

            </div>

          </div>
        )}

        {/* Modal: Confirm Project Deletion (In-UI Dialog, 100% reliable in iframes and all devices) */}
        {projectToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] text-[#064E3B]">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <Trash2 className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-[#064E3B] mb-2">
                ¿Eliminar este proyecto?
              </h3>
              <p className="text-xs text-[#2F5E4E] mb-3 leading-relaxed">
                ¿Seguro que deseas eliminar definitivamente el proyecto{' '}
                <span className="font-bold text-[#064E3B]">«{projectToDelete.title}»</span>?
              </p>
              <div className="p-3 rounded-lg bg-[#DCE5E0]/40 border border-[#DCE5E0] text-[11px] text-[#2F5E4E] mb-5">
                Esta acción retirará el vídeo/fotografía del portafolio en la web inmediatamente. Los cambios se guardan de forma permanente.
              </div>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setProjectToDelete(null)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#2F5E4E] hover:text-[#064E3B] hover:bg-gray-50 transition-colors cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteProject(projectToDelete.id)}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Eliminando...</span>
                    </>
                  ) : (
                    <>
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Sí, eliminar proyecto</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Inquiry Deletion */}
        {inquiryToDelete && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-[#E5E7EB] text-[#064E3B]">
              <div className="w-10 h-10 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-3">
                <Trash2 className="w-5 h-5" />
              </div>
              <h3 className="font-display font-bold text-base text-[#064E3B] mb-2">
                ¿Eliminar solicitud de contacto?
              </h3>
              <p className="text-xs text-[#2F5E4E] mb-5 leading-relaxed">
                Esta solicitud se eliminará del registro administrativo.
              </p>
              <div className="flex items-center justify-end gap-2.5">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setInquiryToDelete(null)}
                  className="px-3.5 py-1.5 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#2F5E4E] hover:text-[#064E3B] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => handleDeleteInquiry(inquiryToDelete)}
                  className="px-3.5 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                  <span>Eliminar</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal: Confirm Reset Demo */}
        {showResetConfirm && (
          <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150">
            <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#E5E7EB] text-[#064E3B]">
              <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center mb-4">
                <RotateCcw className="w-6 h-6" />
              </div>
              <h3 className="font-display font-bold text-lg text-red-950 mb-2">
                ¿Restablecer datos de muestra?
              </h3>
              <p className="text-xs text-red-800 mb-4 leading-relaxed">
                Se sobrescribirán las configuraciones actuales y se recargarán los proyectos de muestra predeterminados.
              </p>
              <div className="flex items-center justify-end gap-3">
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={() => setShowResetConfirm(false)}
                  className="px-4 py-2 rounded-lg border border-[#E5E7EB] text-xs font-semibold text-[#2F5E4E] hover:text-[#064E3B] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={isDeleting}
                  onClick={handleResetDemo}
                  className="px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Restableciendo...</span>
                    </>
                  ) : (
                    <>
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Sí, restablecer</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
