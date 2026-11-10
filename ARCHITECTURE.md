# Architecture du site CMCB

Ce document décrit l’architecture actuelle du site web du cabinet CMCB : organisation du code, pages, API, base de données, sécurité, flux métier et déploiement.

## 1. Vue d’ensemble

Le site est une application web monolithique modulaire, servie par un seul processus Node.js.

```text
Navigateur visiteur / administrateur
        │
        │ HTTPS
        ▼
Reverse proxy / plateforme de preview
        │
        ▼
Serveur Node.js — Express 5
        │
        ├── /api/*            API JSON sécurisée
        │       │
        │       ├── Zod validation
        │       ├── Auth / sessions / CSRF
        │       ├── Rate limiting
        │       └── Accès données
        │               │
        │               ▼
        │        SQLite — node:sqlite
        │        data/cmcb.sqlite
        │
        ├── /                 Frontend React
        │       ├── développement : Vite middleware
        │       └── production : dist/index.html
        │
        └── Worker SMTP interne
                └── outbox notifications
```

### Principes structurants

- Une seule origine pour le frontend et l’API : pas de CORS permissif, pas d’URL API séparée côté navigateur.
- Frontend React 19 + TypeScript + Vite + Tailwind CSS 4.
- Backend Express 5 + TypeScript.
- Base persistante SQLite via `node:sqlite`, nécessitant Node.js 22.16 ou plus récent.
- Administration protégée côté serveur, pas seulement masquée côté client.
- Articles bilingues français / arabe stockés en base.
- Demandes de consultation persistées avant toute notification e-mail.
- Notifications SMTP asynchrones via une outbox durable.
- Déploiement prévu pour une instance unique avec disque persistant.

## 2. Stack technique

| Couche | Technologie | Rôle |
|---|---|---|
| Interface publique | React 19, TypeScript, Tailwind CSS 4 | Pages du cabinet, articles, FAQ, contact |
| Routage frontend | Routage par hash maison | URLs `/#/...`, compatible hébergement statique |
| Build frontend | Vite 7, `vite-plugin-singlefile` | Bundle HTML/JS/CSS optimisé |
| Serveur HTTP | Express 5 | Sert l’API et le frontend |
| Validation | Zod | Validation stricte des entrées API |
| Base de données | SQLite, `node:sqlite`, WAL | Persistance articles, demandes, sessions, outbox |
| Authentification | Scrypt, sessions serveur, cookies / preview bearer | Accès admin sécurisé |
| E-mail | Nodemailer | Notifications SMTP configurables |
| Sécurité HTTP | Helmet, CSP, Origin checks, rate limits | Durcissement HTTP et anti-abus |
| Tests | Node test runner, Supertest, Playwright | Backend, navigateur, login, preview |

## 3. Arborescence du projet

```text
cm/
├── src/                          Frontend React
│   ├── main.tsx                  Point d’entrée React
│   ├── App.tsx                   Shell public + routage vers les pages
│   ├── router.tsx                Routeur hash, titres, liens
│   ├── i18n.tsx                  Contexte de langue FR/AR et textes UI
│   ├── index.css                 Thème Tailwind, styles globaux
│   │
│   ├── pages/                    Pages publiques et admin
│   │   ├── HomePage.tsx
│   │   ├── CabinetPage.tsx
│   │   ├── ExpertisesPage.tsx
│   │   ├── ExpertiseDetailPage.tsx
│   │   ├── ArticlesPage.tsx
│   │   ├── ArticleDetailPage.tsx
│   │   ├── FaqPage.tsx
│   │   ├── ContactPage.tsx
│   │   ├── LegalPage.tsx
│   │   ├── NotFoundPage.tsx
│   │   └── AdminPage.tsx
│   │
│   ├── admin/                    Espace administrateur
│   │   ├── AdminAuth.tsx         Login, vérification session, logout
│   │   ├── AdminShell.tsx        Navigation admin sobre sans emojis
│   │   ├── ArticlesManager.tsx   CRUD articles FR/AR
│   │   ├── ReservationsManager.tsx Demandes de consultation
│   │   ├── SettingsManager.tsx   Sécurité, SMTP, sauvegardes
│   │   └── useAdminArticles.ts   Hook API articles admin
│   │
│   ├── components/               Composants réutilisables
│   │   ├── Navbar.tsx
│   │   ├── Footer.tsx
│   │   ├── Hero.tsx
│   │   ├── ContactForm.tsx
│   │   ├── Blocks.tsx
│   │   ├── Icons.tsx             Icônes SVG professionnelles
│   │   ├── Logo.tsx
│   │   ├── PracticeExplorer.tsx
│   │   └── ...
│   │
│   ├── lib/                      Client API partagé
│   │   ├── api.ts                Fetch same-origin, CSRF, session, erreurs
│   │   ├── api-types.ts          Types partagés frontend/backend
│   │   └── useArticles.ts        Chargement des articles publics
│   │
│   ├── data/                     Contenus statiques FR/AR
│   │   ├── content.ts
│   │   └── content.ar.ts
│   │
│   ├── utils/                    Helpers frontend
│   └── assets/                   Images locales
│
├── server/                       Backend Node/Express
│   ├── index.ts                  Démarrage HTTP, Vite ou static, shutdown
│   ├── app.ts                    Application Express, middlewares, routes API
│   ├── config.ts                 Lecture et validation des variables d’environnement
│   ├── db.ts                     SQLite, schéma, seed, requêtes métier
│   ├── validation.ts             Schémas Zod
│   ├── password.ts               Hachage et vérification scrypt
│   ├── mail.ts                   Transport SMTP + worker outbox
│   ├── seed.ts                   Articles initiaux bilingues
│   ├── types.ts                  Types backend
│   ├── admin-cli.ts              Création / réinitialisation admin
│   └── backup-cli.ts             Sauvegarde SQLite cohérente
│
├── scripts/
│   └── export-seed.ts            Export des articles initiaux
│
├── tests/
│   ├── backend.test.ts           Tests API / sécurité / persistance
│   └── browser/
│       ├── smoke.mjs             Parcours navigateur complet
│       ├── login.mjs             Régression login admin
│       └── preview-login.mjs     Login en iframe preview sans cookies tiers
│
├── data/                         Runtime privé, ignoré par Git
│   └── cmcb.sqlite
│
├── backups/                      Sauvegardes privées, ignorées par Git
├── dist/                         Build frontend généré
├── build/                        Build serveur généré
│
├── .env                          Secrets locaux, ignoré par Git
├── .env.example                  Modèle de configuration
├── package.json                  Scripts npm
├── vite.config.ts                Config Vite / proxy / sécurité dev
├── tsconfig.json                 TypeScript frontend
├── tsconfig.server.json          TypeScript serveur
├── README.md                     Installation, exploitation, limites
└── ARCHITECTURE.md               Ce document
```

## 4. Architecture frontend

### 4.1 Shell public

Le frontend public est rendu par `src/App.tsx`.

```text
App
├── Navbar
├── main
│   └── Page selon la route hash
├── Footer
├── FloatingActions
└── MobileContactBar
```

L’admin est rendu hors du shell public :

```text
/#/admin
└── AdminPage
    └── AdminAuth
        ├── formulaire de connexion si non authentifié
        └── AdminShell si authentifié
            ├── ArticlesManager
            ├── ReservationsManager
            └── SettingsManager
```

### 4.2 Routes publiques

Le routage utilise le hash de l’URL, par exemple `https://domaine/#/articles`.

| Route | Page | Rôle |
|---|---|---|
| `/#/` | Accueil | Présentation, expertises, articles récents, CTA |
| `/#/cabinet` | Cabinet | Présentation du cabinet, valeurs, méthode |
| `/#/expertises` | Expertises | Liste des domaines |
| `/#/expertises/:id` | Détail expertise | Services, situations, documents, FAQ liée |
| `/#/articles` | Articles | Liste, recherche, catégories |
| `/#/articles/:id` | Article | Contenu bilingue publié |
| `/#/faq` | FAQ | Questions fréquentes filtrables |
| `/#/contact` | Contact | Formulaire de demande de consultation |
| `/#/mentions-legales` | Mentions légales | Informations légales |
| `/#/confidentialite` | Confidentialité | Traitement des données |
| `/#/admin` | Administration | Gestion articles, demandes, sécurité |
| autre | 404 | Page introuvable |

### 4.3 Internationalisation

- Les textes d’interface et contenus statiques sont dans `src/i18n.tsx`, `src/data/content.ts` et `src/data/content.ar.ts`.
- La langue choisie est conservée côté navigateur, principalement pour le confort visiteur.
- Les articles publiés sont stockés en base avec deux traductions possibles : `fr` et `ar`.
- Un article ne peut être publié que si les traductions nécessaires sont complètes.

### 4.4 Client API

`src/lib/api.ts` centralise les appels vers `/api`.

Responsabilités :

- appels same-origin ;
- sérialisation JSON ;
- ajout du token CSRF pour les écritures authentifiées ;
- gestion du token de session preview en mémoire si activé ;
- transformation des erreurs API en `ApiError` ;
- événement global `cmcb-session-expired` lorsque une session authentifiée devient invalide ;
- messages d’erreur utilisateur en français.

## 5. Architecture backend

### 5.1 Point d’entrée serveur

`server/index.ts` :

1. charge `.env` ;
2. lit la configuration ;
3. ouvre SQLite ;
4. crée le transport SMTP si configuré ;
5. démarre le worker de notifications ;
6. crée l’application Express ;
7. sert Vite en développement ou `dist/` en production ;
8. écoute sur `0.0.0.0` ;
9. gère l’arrêt propre : worker, Vite, HTTP, base.

### 5.2 Middlewares Express

Ordre général dans `server/app.ts` :

```text
Requête /api/*
├── Helmet / en-têtes sécurité
├── Cache-Control: no-store
├── contrôle Origin pour les écritures
├── contrôle Content-Type JSON
├── parsing JSON limité
├── rate limit global
├── route spécifique
│   ├── rate limit login ou contact si concerné
│   ├── validation Zod
│   ├── authentification si admin
│   ├── CSRF si écriture admin
│   └── logique métier / SQLite
└── gestionnaire d’erreurs JSON
```

### 5.3 Routes API

Toutes les routes sont préfixées par `/api`.

#### Santé et articles publics

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/health` | non | Vérifie que le serveur et SQLite répondent |
| GET | `/api/articles?lang=fr\|ar` | non | Liste les articles publiés dans la langue demandée |
| GET | `/api/articles/:id?lang=fr\|ar` | non | Détail d’un article publié |

#### Authentification

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/auth/session` | session ou non | État de session et token CSRF |
| POST | `/api/auth/login` | non | Connexion admin |
| POST | `/api/auth/logout` | session | Révocation de la session courante |
| POST | `/api/auth/password` | session + CSRF | Changement de mot de passe, révoque les sessions |

#### Demandes de consultation

| Méthode | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/reservations` | non | Crée une demande persistante avec clé d’idempotence |

#### Administration articles

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/articles` | session | Liste tous les articles, y compris brouillons |
| POST | `/api/admin/articles` | session + CSRF | Crée un article |
| PUT | `/api/admin/articles/:id` | session + CSRF | Modifie un article, slug immutable |
| DELETE | `/api/admin/articles/:id` | session + CSRF | Supprime un article |

#### Administration demandes

| Méthode | Route | Auth | Description |
|---|---|---|---|
| GET | `/api/admin/reservations` | session | Recherche, filtre, pagination |
| PATCH | `/api/admin/reservations/:id` | session + CSRF | Change le statut |
| DELETE | `/api/admin/reservations/:id` | session + CSRF | Supprime une demande |
| POST | `/api/admin/reservations/:id/retry` | session + CSRF | Relance une notification échouée |
| GET | `/api/admin/system` | session | État SMTP / stockage / durée de session |

## 6. Modèle de données

Base SQLite : `data/cmcb.sqlite`.

```text
admins
├── id
├── email UNIQUE
├── password_hash
└── created_at

sessions
├── token_hash PRIMARY KEY
├── admin_id → admins.id
├── csrf_token
└── expires_at

articles
├── id / slug PRIMARY KEY
├── expertise_id
├── image
├── status: draft | published
├── created_at
├── updated_at
└── published_at

article_translations
├── article_id → articles.id
├── lang: fr | ar
├── body JSON
└── PRIMARY KEY(article_id, lang)

reservations
├── id UUID PRIMARY KEY
├── idempotency_key UNIQUE
├── payload_hash
├── created_at
├── updated_at
├── consent_at
├── status: new | contacted | closed
├── name
├── email
├── phone
├── domain
├── urgency: normal | 48h | urgent
├── message
└── lang: fr | ar

outbox
├── reservation_id → reservations.id
├── status: disabled | pending | sending | sent | failed
├── attempts
├── next_attempt_at
├── last_error
└── sent_at

meta
├── key PRIMARY KEY
└── value
```

### Relations principales

```text
admins 1 ─── n sessions

articles 1 ─── n article_translations

reservations 1 ─── 1 outbox
```

### Choix de persistance

- SQLite en mode WAL pour de meilleures lectures/écritures concurrentes locales.
- Les traductions d’articles sont stockées en JSON par langue.
- Les demandes sont enregistrées avant l’envoi e-mail.
- L’outbox découple la persistence métier de la livraison SMTP.
- Les sessions sont stockées côté serveur sous forme de hash du token, jamais en clair.

## 7. Flux métier principaux

### 7.1 Consultation d’un article public

```text
Visiteur
└── ouvre /#/articles/:id
    └── React appelle GET /api/articles/:id?lang=fr
        └── Express filtre status=published
            └── SQLite retourne article + traduction
                └── React affiche la page
```

Les brouillons ne sont jamais exposés par les endpoints publics.

### 7.2 Demande de consultation

```text
Visiteur soumet le formulaire
└── POST /api/reservations
    ├── Origin + JSON + rate limit
    ├── validation Zod
    ├── clé Idempotency-Key
    ├── transaction SQLite
    │   ├── INSERT reservations
    │   └── INSERT outbox
    └── réponse 201 après commit

Worker SMTP
└── lit outbox pending
    ├── marque sending
    ├── envoie via Nodemailer
    ├── marque sent si accepté
    └── sinon retry / failed
```

Le visiteur voit une confirmation seulement après persistence serveur. Une demande n’est pas un rendez-vous confirmé : le cabinet doit recontacter la personne.

### 7.3 Connexion administrateur

```text
Admin soumet email + mot de passe
└── POST /api/auth/login
    ├── validation
    ├── vérification scrypt
    ├── création session serveur
    ├── token stocké hashé en base
    └── cookie HttpOnly ou token preview en mémoire

Puis GET /api/auth/session
└── vérifie que le transport fonctionne
    └── monte AdminShell seulement si authentifié
```

En production normale, la session utilise un cookie sécurisé. Dans certaines previews intégrées, un mode développement optionnel utilise un token en mémoire envoyé par en-tête, sans localStorage/sessionStorage.

### 7.4 Publication d’un article

```text
Admin
└── POST /api/admin/articles
    ├── session + CSRF + Origin
    ├── validation Zod
    ├── slug unique
    ├── traductions FR/AR
    └── transaction SQLite

Site public
└── prochain chargement /api/articles
    └── voit le nouvel article publié
```

## 8. Sécurité

### Authentification et sessions

- Pas d’inscription publique.
- Compte admin créé via CLI : `npm run admin:create`.
- Mots de passe hachés avec scrypt.
- Tokens de session aléatoires, stockés hashés en base.
- Expiration de session : 8 heures.
- Logout révoque la session courante.
- Changement de mot de passe révoque les sessions de l’administrateur.

### Cookies et preview

- Cookie de session `HttpOnly`.
- `SameSite=Strict` par défaut.
- `Secure` en production.
- Mode preview intégré optionnel : `SameSite=None; Secure; Partitioned`.
- Mode preview bearer développement uniquement, désactivé en production.
- Aucun token admin persisté dans localStorage ou sessionStorage.

### Protections API

- Écritures JSON uniquement.
- Contrôle strict de l’origine.
- CSRF token pour les écritures admin.
- Rate limits :
  - global API ;
  - login ;
  - formulaire de contact.
- Validation Zod stricte.
- Limite de taille des corps JSON.
- Pas de CORS permissif.
- Erreurs JSON cohérentes.
- Helmet et CSP en production.
- CSP production avec hashes des scripts inline générés par le build single-file.

### Données sensibles

- `.env`, `data/`, `backups/` ignorés par Git.
- Permissions restrictives sur le dossier et le fichier SQLite.
- Sauvegardes via commande dédiée.
- Les secrets SMTP ne sont jamais saisis dans le navigateur.

## 9. Notifications e-mail

Le système utilise une outbox durable.

```text
reservations
    │
    └── outbox
        ├── disabled
        ├── pending
        ├── sending
        ├── sent
        └── failed
```

Comportement :

- Si SMTP n’est pas configuré, les demandes sont conservées et visibles dans l’admin.
- Si SMTP est configuré, le worker tente l’envoi.
- Les échecs sont réessayés avec backoff exponentiel.
- Après plusieurs échecs, l’état devient `failed`.
- L’admin peut relancer manuellement une notification.
- La livraison est au moins une fois : un crash entre acceptation SMTP et enregistrement du succès peut produire un doublon.

## 10. Build et déploiement

### Développement

```sh
npm ci
cp .env.example .env
npm run admin:create
npm run dev
```

En développement :

```text
Express
├── /api/*
└── Vite middleware
    └── React + HMR
```

### Production

```sh
npm ci
npm run admin:create
npm run build
npm start
```

En production :

```text
Express
├── /api/*
└── dist/index.html + assets statiques
```

Le serveur compilé se trouve dans `build/server/`.

### Configuration requise en production

- `APP_ORIGIN` en HTTPS.
- `DATABASE_PATH` sur disque persistant.
- `TRUST_PROXY` configuré selon le proxy réel.
- `SESSION_COOKIE_SAMESITE=strict` en usage normal.
- SMTP optionnel mais recommandé pour les notifications.
- Superviseur de processus : systemd, PM2, container orchestrator, etc.
- Reverse proxy HTTPS : Nginx, Caddy, Apache, ou plateforme équivalente.

### Limite d’échelle

L’architecture actuelle est prévue pour une instance unique :

- SQLite local ;
- rate limits en mémoire processus ;
- worker SMTP dans le même processus.

Pour plusieurs instances, il faudrait migrer vers :

- PostgreSQL ou MySQL ;
- store de sessions partagé ;
- rate limiting distribué ;
- file de jobs externe ;
- stockage objet pour images si nécessaire.

## 11. Tests

| Commande | Couverture |
|---|---|
| `npm run typecheck` | Types frontend et backend |
| `npm test` | API, auth, CSRF, articles, demandes, outbox, persistance |
| `npm run test:login` | Régression login admin navigateur |
| `npm run test:preview-login` | Login en iframe preview avec cookies/en-têtes filtrés |
| `npm run test:browser` | Parcours complet public + admin |
| `npm run build` | Build production frontend + serveur |

## 12. Résumé architectural

```text
Frontend React bilingual FR/AR
        │
        │ same-origin JSON
        ▼
API Express sécurisée
        │
        ├── Auth admin
        ├── Articles publics / admin
        ├── Demandes de consultation
        └── Outbox SMTP
        │
        ▼
SQLite persistant
```

Le site est donc structuré comme un monolithe applicatif moderne : simple à déployer, sécurisé côté serveur, persistant, bilingue, et administrable sans modifier le code.
