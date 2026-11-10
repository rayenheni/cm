import { z } from 'zod';
export const expertiseIds = ['affaires', 'famille', 'travail', 'penal', 'mediation'] as const;
const text = (max: number) => z.string().trim().min(1).max(max);
const translation = z.strictObject({
  category: text(120), readTime: text(40), title: text(240), excerpt: text(1200),
  imageAlt: z.string().trim().max(300), intro: text(10000),
  sections: z.array(z.strictObject({ heading: text(240), paragraphs: z.array(text(10000)).min(1).max(40) })).min(1).max(30),
  keyPoints: z.array(text(1000)).max(20),
});
export const articleSchema = z.strictObject({
  id: z.string().trim().min(1).max(120).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Use lowercase letters, numbers and single hyphens.'),
  expertiseId: z.enum(expertiseIds),
  image: z.union([z.literal(''), z.string().regex(/^\/media\/[a-f0-9]{32}\.(?:jpg|png|webp)$/), z.url().max(2048).refine(v => new URL(v).protocol === 'https:', 'Images must use HTTPS.')]),
  status: z.enum(['draft', 'published']),
  translations: z.strictObject({ fr: translation, ar: translation.optional() }),
}).superRefine((value, ctx) => {
  if (value.status === 'published' && !value.translations.ar) ctx.addIssue({ code: 'custom', path: ['translations', 'ar'], message: 'Add the Arabic translation before publishing.' });
});
export const reservationSchema = z.strictObject({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().max(254).email().transform(v => v.toLowerCase()),
  phone: z.string().trim().max(40).refine(v => !v || /^[+\d][\d\s.\-()]{7,}$/.test(v)),
  domain: text(200), urgency: z.enum(['normal', '48h', 'urgent']),
  message: z.string().trim().min(15).max(5000), lang: z.enum(['fr', 'ar']),
  consent: z.literal(true), website: z.literal(''),
});
export const credentialsSchema = z.strictObject({ email: z.string().trim().toLowerCase().email().max(254), password: z.string().min(1).max(128), transport: z.enum(['cookie', 'bearer']).optional() });
export const reservationPatchSchema = z.strictObject({ status: z.enum(['new', 'contacted', 'closed']).optional() }).refine(v => v.status !== undefined);
export const listQuerySchema = z.strictObject({ page: z.coerce.number().int().min(1).default(1), limit: z.coerce.number().int().min(1).max(100).default(25), status: z.enum(['new', 'contacted', 'closed']).optional(), q: z.string().trim().max(200).optional() });
