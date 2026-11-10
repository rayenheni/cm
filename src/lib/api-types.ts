export type Lang = 'fr' | 'ar';
export type ArticleStatus = 'draft' | 'published';
export interface ArticleTranslation {
  category: string;
  readTime: string;
  title: string;
  excerpt: string;
  imageAlt: string;
  intro: string;
  sections: { heading: string; paragraphs: string[] }[];
  keyPoints: string[];
}
export interface StoredArticle {
  id: string;
  expertiseId: string;
  image: string;
  status: ArticleStatus;
  createdAt: string;
  updatedAt: string;
  publishedAt: string | null;
  translations: { fr: ArticleTranslation; ar?: ArticleTranslation };
}
export type ArticleInput = Pick<StoredArticle, 'id' | 'expertiseId' | 'image' | 'status' | 'translations'>;
export type ReservationStatus = 'new' | 'contacted' | 'closed';
export type Urgency = 'normal' | '48h' | 'urgent';
export interface ReservationInput {
  name: string;
  email: string;
  phone: string;
  domain: string;
  urgency: Urgency;
  message: string;
  lang: Lang;
  consent: boolean;
  website: string;
}
export interface Reservation extends Omit<ReservationInput, 'website' | 'consent'> {
  id: string;
  createdAt: string;
  updatedAt: string;
  consentAt: string;
  status: ReservationStatus;
  notification: { status: 'disabled' | 'pending' | 'sending' | 'sent' | 'failed'; attempts: number };
}
export interface AdminUser { id: number; email: string }
export interface AuthState { authenticated: boolean; user: AdminUser | null; csrfToken: string | null; sessionToken?: string }
export interface ApiErrorBody { error: { code: string; message: string; fields?: Record<string, string> } }
