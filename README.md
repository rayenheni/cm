# CMCB — site du cabinet et backend

React 19 + Vite + Tailwind frontend, with a same-origin Express 5 API and persistent SQLite database. Node **22.16 or newer** is required (`node:sqlite`). The application is designed for a single Node process on a persistent disk/volume.

Une **version PHP indépendante** est également disponible dans [`cmcb-php/`](cmcb-php/README.md). Elle conserve le même périmètre fonctionnel, avec ses propres templates, sa propre base SQLite et ses propres identifiants ; elle ne remplace pas le projet Node décrit ici.

## Run locally

```sh
npm ci
cp .env.example .env
# Edit .env: set ADMIN_EMAIL and a unique ADMIN_PASSWORD.
# APP_ORIGIN can be omitted for local development.
npm run admin:create
npm run dev
```

Open `http://localhost:5173`; admin is at `/#/admin`. Express serves both Vite and `/api` on the same port; no separate frontend server or browser localhost API URL is needed. The server binds to `0.0.0.0` for container previews. In development, writes must come from the requesting host's HTTP(S) origin. Vite's host allowlist is permissive for the Arena preview; do not expose the development server as a public production service.

The database is created automatically at `data/cmcb.sqlite`, including the four original bilingual articles. There is **no public registration/setup endpoint and no default password**. `admin:create` creates or resets the account identified by `ADMIN_EMAIL` and revokes existing sessions. Remove `ADMIN_PASSWORD` from `.env` after provisioning. Administrators can change their password in **Sécurité** in the admin UI.

## What is implemented

- Scrypt password hashing; random server-side sessions stored as SHA-256 token digests; HTTP-only, SameSite=Strict cookies by default, Secure in production; eight-hour expiry and logout/password-change revocation.
- CSRF tokens for authenticated writes; exact origin checks; JSON-only writes; login/contact/general rate limits; server-side Zod validation and size limits; no permissive CORS.
- Public article reads; authenticated create/edit/delete of **all** articles, including the original seeded content. French/Arabic translations, draft/published states, immutable slugs and images via HTTPS link or authenticated upload (JPEG/PNG/WebP, 2 MiB maximum). Publishing requires both translations. Draft article content is not exposed through public article endpoints. Uploaded images are public to anyone with their random URL immediately, including images for drafts or canceled edits; do not upload confidential material, and check image metadata.
- Persistent consultation requests with consent timestamp, language, normalized urgency, idempotency keys, honeypot and validation. Admin search, status filter, pagination, status updates and deletion. Success is shown only after the database commits.
- Durable SMTP notification outbox: retries with exponential backoff, eight attempts, visible failure state and manual retry. Requests remain saved when SMTP is unavailable. Notification delivery is to the cabinet; visitors are not automatically emailed.
- Consistent SQLite backup command, private runtime file permissions and ignored secrets/database/backup directories.
- Frontend loading/error/retry states; no client-side appointment or article persistence. Language preference remains the only public localStorage use.

**Appointment scope:** this is a consultation-request workflow, not a calendar/availability booking system. The cabinet must contact the client to confirm a time. No slot is represented as booked.

## Production deployment

Use a persistent Linux VM/container volume, an HTTPS reverse proxy and a process supervisor. Serverless/ephemeral filesystems and multi-instance autoscaling are not supported by this SQLite/local-rate-limit implementation.

```sh
npm ci
# Provision .env with APP_ORIGIN=https://your-real-domain, DATABASE_PATH,
# ADMIN_EMAIL, ADMIN_PASSWORD, and optional SMTP settings.
npm run admin:create
npm run build
npm start
```

`npm start` requires `NODE_ENV=production` (already set by the script) and an HTTPS `APP_ORIGIN`. It serves `dist/` and compiled `build/server/`. Keep the working directory at the repository root. Build uses the single-file frontend plugin; production CSP allows only hashes of its generated inline scripts. Configure the proxy to preserve Host and forward HTTPS protocol information. Set `TRUST_PROXY` to the exact trusted proxy hop count (often 1); never blindly trust arbitrary forwarded headers. Terminate TLS before the app. Production session cookies require HTTPS.

For an HTTPS embedded preview such as Arena, set `SESSION_COOKIE_SAMESITE=none` to try `Secure; SameSite=None; Partitioned` cookies. If the browser or proxy still blocks third-party cookies, set `PREVIEW_BEARER_AUTH=true` in the development preview environment. Embedded login requests a random Bearer session token in the JSON body as well as a header, so proxies that strip auth headers can still negotiate it, kept only in page memory and sent as `X-CMCB-Session` (plus `Authorization` when the proxy preserves it). It is still hashed server-side, expires after eight hours, requires CSRF for writes, and is revoked on logout. It is never written to localStorage/sessionStorage and the server refuses this transport in production. Reloading the preview asks for login again. Keep both settings off/strict for ordinary local development. Arena direct sandbox links may require a platform traffic token; use the authenticated Arena Preview panel rather than trying to bypass that protection.

The development server is not a production server. `npm run preview` runs the built production app and therefore needs production configuration. Restrict filesystem access to the service operator; application-layer authentication does not encrypt the SQLite file at rest. Use disk encryption and restricted backups for sensitive client information.

### SMTP

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE` (`true` for implicit TLS, usually port 465), `SMTP_FROM`, `NOTIFICATION_EMAIL`, and, if required, `SMTP_USER`/`SMTP_PASS`. Restart after changes. Port 587 typically uses STARTTLS (`SMTP_SECURE=false`). Use a provider-authorized sender. Without SMTP, the admin clearly shows notifications as disabled; requests are still saved.

The queue runs inside the single app process. A crash after SMTP acceptance but before recording success can cause a duplicate notification on restart (at-least-once delivery). SMTP credentials and real delivery must be tested with your provider before launch; no credentials are included in this repository.

## Backup and restore

```sh
npm run db:backup
```

This uses SQLite's online backup API, not an unsafe copy of a live WAL database. The command does **not** include uploaded images: separately back up `data/media/` or the configured `MEDIA_PATH` and test restoring it together with the database. Uploads canceled or replaced in the editor are not automatically deleted; monitor disk usage and verify references before any cleanup. Backups contain personal data and admin password hashes. Encrypt them, restrict access, store off-server, and define a retention schedule.

To restore: stop the app, preserve the old database directory, copy the chosen backup to the configured `DATABASE_PATH`, ensure no stale `-wal`/`-shm` files from the old database remain alongside it, set owner-only permissions, then start the app. Test restoration regularly. Deleting a request cascades to its outbox entry; it does not erase old backups or SMTP-provider copies.

## API

All paths are relative to `/api`. Browser requests use same-origin cookies, or the explicit development-only in-memory Bearer transport in embedded previews. Authenticated writes require `X-CSRF-Token` from login/session. All writes require JSON and a matching `Origin`.

| Method | Path | Access |
|---|---|---|
| GET | `/health` | Public |
| GET | `/articles?lang=fr` or `ar` | Published articles only |
| GET | `/articles/:slug?lang=fr` or `ar` | Published article |
| GET | `/auth/session` | Session state |
| POST | `/auth/login` | Email/password, rate limited |
| POST | `/auth/logout` | Revokes current session |
| POST | `/auth/password` | Authenticated; revokes all own sessions |
| POST | `/reservations` | Public, consent required, `Idempotency-Key` UUID |
| GET | `/admin/articles` | Admin |
| POST | `/admin/articles` | Admin |
| PUT/DELETE | `/admin/articles/:slug` | Admin |
| GET | `/admin/reservations?page=1&limit=25&status=new&q=...` | Admin |
| PATCH/DELETE | `/admin/reservations/:id` | Admin |
| POST | `/admin/reservations/:id/retry` | Admin, retry failed/pending notification |
| GET | `/admin/system` | Admin, non-secret configuration status |

Reservation body: `name`, `email`, optional `phone`, `domain`, `urgency` (`normal`, `48h`, `urgent`), `message` (15–5000 chars), `lang` (`fr`, `ar`), `consent: true`, `website: ""` (honeypot). Article contracts and validation are in `src/lib/api-types.ts` and `server/validation.ts`. Errors use `{ error: { code, message, fields? } }`.

## Checks

```sh
npm run typecheck
npm test
npm run build
npm audit
```

An optional real-browser smoke test is in `tests/browser/smoke.mjs`. With the development server running and a provisioned `.env`, run `node tests/browser/smoke.mjs`. It uses the bundled Chromium test dependency and creates uniquely named test records; remove those records afterward. On Debian hosts missing NSS libraries, install `libnss3` and `libnspr4`. The test does not disable browser origin enforcement.

Tests cover authentication, CSRF/origin protection, rate limiting, bilingual publishing, draft privacy, duplicate slugs, input validation, cross-visitor persistence, idempotency, search/filter/pagination, deletion, session expiry/revocation, password changes, disk restart persistence and SMTP retry behavior using a mock transport.

## Launch checklist / limitations

- Provide real SMTP credentials and verify delivery; implement a monitored alerting channel if mail failures need immediate attention.
- Verify the cabinet's contact details, legal content, retention periods, hosting privacy terms and applicable professional/data-protection obligations. The privacy text now describes server storage but is not legal certification.
- Configure HTTPS, trusted proxy hops, persistent storage, encrypted off-server backups and process monitoring.
- Rate limits are process-local and reset on restart. SQLite and this outbox require one app instance. For horizontal scaling, migrate to shared database/session/rate-limit stores and a distributed job queue.
- The site uses hash routes; article crawling/SEO and per-article social previews are limited. External images/fonts/map require third-party network access.
- Old browser-only articles/requests are not automatically uploaded: browser storage is not a shared source of truth. Export/obtain any valuable old records from the original browser and import them through an authenticated, validated migration before discarding that browser profile.
- No calendar availability, payment, client portal, file uploads, MFA, or automated data-retention scheduler is included.
