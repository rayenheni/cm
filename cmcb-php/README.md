# CMCB — version PHP

Site FR/AR en PHP 8.2+, avec administration, articles bilingues, demandes de consultation et **MySQL en production**. Cette version est indépendante du serveur et de la base de la version React/Node du dépôt parent. Aucun Composer, Node ni build n'est nécessaire pour exécuter la version PHP native.

## Installation

Suivez [INSTALLATION.md](INSTALLATION.md) : préparez une base MySQL vide, activez l'installateur depuis la CLI et ouvrez `public/install.php` en HTTPS pour configurer la connexion et créer le premier compte administrateur. L'installateur est protégé par une clé à usage unique, refuse d'écraser `.env` et se ferme après succès. Il ne migre pas les données d'une ancienne base SQLite : sauvegardez-les et prévoyez une migration séparée si nécessaire.

Prérequis : PHP 8.2+, `pdo_mysql`, `mbstring`, `openssl`, MySQL 8 / MariaDB récent, PHP-FPM et HTTPS. Seul le dossier `public/` doit être exposé sur le web. `deploy/apache.conf`, `deploy/nginx.conf` et `deploy/php-fpm-pool.conf` sont des exemples à adapter. L'accès Nginx à `install.php` est temporaire : retirez-le après installation.

La production refuse le driver SQLite. L'ancien adaptateur PHP-WASM et SQLite restent disponibles uniquement pour l'aperçu de développement historique et les tests existants ; ils ne vérifient pas MySQL et leurs données ne sont pas importées automatiquement. Le mot de passe de l'aperçu local n'est pas un mot de passe de production.

## Fonctionnalités et sécurité

- Pages publiques FR/AR, domaines d'expertise, bandeau animé, articles, FAQ, contact et mentions légales.
- Administration `/admin` : connexion, articles brouillon/publié, demandes, recherche et changement de mot de passe.
- Demandes persistantes avec consentement, validation serveur, clé d'idempotence et formulaire sans JavaScript.
- Sessions hachées, expiration et révocation, hachage Argon2id si disponible ou bcrypt, CSRF, contrôle d'origine et limites de débit.
- Notifications SMTP avec file d'attente et réessais. Sans SMTP, les demandes restent visibles dans l'administration.

La configuration `.env` est privée et hors de `public/`. L'installateur enregistre les identifiants MySQL encodés en base64, **pas chiffrés** : protégez ce fichier (mode `600`, lisible uniquement par le compte PHP-FPM) et utilisez un gestionnaire de secrets adapté à votre hébergement. Les variables d'environnement du serveur priment sur `.env`. En production, l'origine doit être HTTPS ; configurez précisément les proxys de confiance.

## SMTP

Pour activer les notifications, renseignez dans `.env` `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_FROM`, `NOTIFICATION_EMAIL`, et si nécessaire `SMTP_USER` et `SMTP_PASS`. Le port 587 utilise généralement STARTTLS (`SMTP_SECURE=false`) et le port 465 TLS implicite (`SMTP_SECURE=true`). Après modification, redémarrez les services concernés.

Le worker `bin/outbox-worker.php` utilise un fichier de verrouillage dans `data/`, qui doit exister et être accessible en écriture uniquement au compte de service. Un exemple systemd figure dans `deploy/cmcb-outbox.service`. La livraison est au moins une fois ; testez le fournisseur SMTP réel et surveillez les erreurs avant le lancement.

## Sauvegardes MySQL

Utilisez les outils de votre hébergeur ou un dump transactionnel `mysqldump --single-transaction` sur une base InnoDB. Protégez les identifiants, chiffrez les sauvegardes et testez régulièrement une restauration isolée. Les fichiers contiennent des données personnelles et des empreintes de mots de passe. Sauvegardez aussi les images téléversées dans `data/media/` (ou `MEDIA_PATH`) et testez leur restauration avec la base. `bin/backup.php` et les anciens services `cmcb-backup.*` ne sauvegardent que l'aperçu SQLite historique, pas les images, et **ne doivent pas être utilisés pour MySQL**.

## Tests et limites

Les tests PHP historiques s'exécutent avec SQLite en développement et permettent de vérifier les fonctionnalités communes. Ils ne remplacent pas une validation MySQL. Les essais effectués dans cette sandbox ont utilisé PHP-WASM ; ni l'installation MySQL de bout en bout, ni PHP-FPM, ni l'envoi SMTP réel n'ont été validés ici. **Ne considérez pas la mise en production comme validée** avant des essais sur un serveur MySQL/MariaDB réel et l'hébergement cible.

Le design et les ressources PHP correspondent à la référence React ; le CSS est déjà compilé dans `public/assets/theme.css`. La régénération optionnelle du thème utilise `cmcb-php/tools` et le projet parent. Le monogramme est extrait du logo fourni (`../src/assets/cmcb-logo-source.jpg`) et utilisé dans le site, l'administration et le favicon ; sa version adaptée est partagée par les deux applications.
