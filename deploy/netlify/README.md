# Netlify + Supabase — prototype en cours de validation

**Ne pas utiliser pour des données réelles ou confidentielles.** Le code et les
tests locaux ne constituent pas une validation sur Netlify/Supabase. Un projet
Supabase jetable et des tests sur un déploiement réel sont nécessaires avant de
considérer cette adaptation prête. La version PHP/InfinityFree reste séparée.
Ne mélangez pas les deux installations et ne supprimez pas d'anciennes données.

## Architecture proposée

- `netlify/functions/api.ts` adapte les requêtes à Express ; le disque d'une
  fonction n'est jamais utilisé comme stockage persistant. `netlify.toml`
  configure le build, les redirections et des en-têtes de sécurité.
- `server.ts` fournit une API asynchrone PostgreSQL, avec validation des entrées,
  cookies HttpOnly/Secure, CSRF, vérification de l'origine et limites persistées.
  La connexion exige un certificat TLS de serveur vérifié. Le comportement des
  adresses IP et l'application des limites restent à vérifier sur Netlify réel.
- `001_initial_schema.sql` crée le schéma `cmcb_private` uniquement sur une
  base neuve. Il refuse de l'écraser s'il existe déjà. Les rôles navigateur
  n'ont pas accès au schéma ; RLS est activé sans politique publique. Le
  propriétaire PostgreSQL et les rôles BYPASSRLS peuvent contourner RLS : le
  serveur doit rester l'unique utilisateur de sa connexion privilégiée.
- Les images JPEG, PNG ou WebP validées (maximum 2 Mo) sont écrites dans un
  bucket Supabase public par la fonction ; leur URL est publique, y compris
  pour les brouillons. Ne jamais y téléverser des documents confidentiels.
- Les demandes sont enregistrées et visibles dans l'administration. **L'envoi
  d'e-mails est désactivé** dans cette adaptation : aucun worker SMTP n'est
  déployé. Il faudra une solution de notification distincte et testée.
- `preparer-cle.html` génère localement une clé unique et son SHA-256 ; seul le
  hash est configuré en variable Netlify. Le formulaire `/installation.html`
  crée une seule fois le premier administrateur et les articles de départ en une
  transaction. Retirer la variable de clé et redéployer après installation.

## Configuration serveur prévue

À saisir uniquement dans les variables sécurisées de Netlify, jamais dans le code,
le navigateur public, un ZIP ou la conversation :

- `APP_ORIGIN` : origine HTTPS exacte du site, sans chemin ni slash final.
- `SUPABASE_URL` : origine HTTPS du projet `<projet>.supabase.co`.
- `SUPABASE_DB_URL` : URL PostgreSQL du pooler de transaction Supabase, avec
  identifiants encodés si nécessaire, sans paramètres de requête. La connexion
  impose TLS vérifié et vérifie le nom du serveur ; vérifier la chaîne réelle.
- `SUPABASE_DB_CA_PEM` : facultatif. Si le certificat serveur exige une CA que
  Node ne connaît pas, téléchargez le certificat racine depuis **Supabase →
  Project Settings → Database → SSL Configuration → Download Certificate**.
  Copiez le contenu complet du fichier PEM, de `BEGIN CERTIFICATE` à `END
  CERTIFICATE`, dans cette variable Netlify (portée Functions / Production).
  Une fois définie, cette CA remplace les CA par défaut pour la connexion à la
  base ; la vérification du certificat et du nom d'hôte reste obligatoire.
  Seul un certificat CA provenant de Supabase doit être utilisé, jamais une clé
  privée. Les retours à la ligne présents, supprimés ou remplacés par des espaces
  sont acceptés, mais il faut copier exactement un certificat PEM complet. Une
  valeur invalide bloque le démarrage : `INVALID_DB_CA_FORMAT` indique un bloc
  incomplet ou illisible ; `INVALID_DB_CA_NOT_AUTHORITY` indique un certificat
  qui n'est pas une CA. Aucun contenu du certificat n'est écrit dans les logs.
  Si TLS échoue encore, vérifiez le nom du pooler et contactez Supabase ; ne
  désactivez jamais la vérification.
  https://supabase.com/docs/guides/platform/ssl-enforcement
- `SUPABASE_SECRET_KEY` : clé serveur `sb_secret_...` de Supabase pour Storage.
  Elle contourne RLS et doit rester secrète. Elle n'est jamais publiée dans le
  code front ; elle est transmise à Supabase via l'en-tête `apikey`.
- `SUPABASE_MEDIA_BUCKET` : facultatif, par défaut `cmcb-media` ; ce bucket doit
  être créé manuellement en mode public pour les images d'articles uniquement.
- `CMCB_BOOTSTRAP_KEY_HASH` : empreinte SHA-256 de la clé temporaire, obtenue
  dans `preparer-cle.html`. Supprimer après création de l'administrateur.

Toutes ces variables sont lues à l'exécution de la fonction, jamais par Vite.
L'utilisateur ne doit jamais transmettre ses secrets dans un message.

## Validation locale

- `npm test` exécute les tests du backend initial et les tests de l'adaptation
  sur PostgreSQL WASM et stockage simulé, sans connexion à Supabase.
- `npm run build:netlify` vérifie TypeScript et construit les assets statiques.
- Pour valider la mise en service, tester séparément sur Netlify et un Supabase
  jetable : connexion PostgreSQL TLS, règles RLS/grants, Storage et permissions,
  réécritures, limite IP (y compris en-têtes falsifiés), setup à usage unique,
  login et CSRF, création/édition/suppression, demandes concurrentes et
  idempotentes, images et persistance après redéploiement.
- Tester les sauvegardes chiffrées et la restauration de la base et du bucket ;
  l'offre gratuite Supabase peut mettre le projet en pause et ne fournit pas de
  sauvegardes automatiques. Ne pas utiliser de données réelles avant contrôle
  de sécurité et examen des obligations de confidentialité applicables.
- Aucune migration des données existantes n'est automatique.
