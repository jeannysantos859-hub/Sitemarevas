export type ProjectCategory = 
  | 'todos'
  | 'reels'
  | 'fotografia'
  | 'estrategia'
  | 'espacios'
  | 'marcas';

export type BrandFilter = 'todos' | 'Bethânia Pratas' | 'Bottero' | 'Ultraforma' | 'Móvil Europa' | 'Aura Boutique' | string;
export type FormatFilter = 'todos' | 'reels' | 'fotografia' | 'estrategia';

export interface Project {
  id: string;
  title: string;
  category: 'reels' | 'fotografia' | 'estrategia' | 'espacios' | 'marcas';
  categoryLabel: string;
  type: 'video' | 'image';
  mediaUrl: string;
  thumbnailUrl: string;
  description: string;
  clientSector: string;
  brandName: 'Bethânia Pratas' | 'Bottero' | 'Ultraforma' | 'Móvil Europa' | string;
  featured: boolean;
  orientation: 'vertical' | 'landscape' | 'square';
  aspectRatio: '9:16' | '4:5' | '16:9' | '1:1';
  order: number;
  isSample: boolean;
  date?: string;
}

export interface ServiceItem {
  id: string;
  title: string;
  shortDesc: string;
  details: string[];
  mediaUrl: string;
  mediaType: 'image' | 'video';
  icon: string;
  solution?: string;
  whatWePhotograph?: string[];
  delivery?: string;
}

export interface SiteSettings {
  agencyName: string;
  tagline: string;
  heroSubtext: string;
  heroVideoUrl: string;
  logoUrl: string;
  aboutTitle: string;
  aboutText1: string;
  aboutText2: string;
  aboutText3: string;
  contactTitle: string;
  contactSubtext: string;
  instagramUrl: string;
  whatsappNumber: string;
  whatsappDefaultMessage: string;
  email: string;
  location: string;
}

export interface ContactInquiry {
  id: string;
  name: string;
  businessName: string;
  email: string;
  serviceType: string;
  message: string;
  createdAt: string;
  status: 'nuevo' | 'contactado' | 'archivado';
}

export interface SiteData {
  settings: SiteSettings;
  services: ServiceItem[];
  projects: Project[];
  inquiries: ContactInquiry[];
}
