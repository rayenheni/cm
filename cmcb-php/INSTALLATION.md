# Installation PHP avec MySQL

Ce guide concerne la version `cmcb-php/`. L'installation crée les tables MySQL et le premier compte administrateur à l'aide de **`public/install.php`**. MySQL est obligatoire en production ; aucun Composer ou Node n'est nécessaire sur le serveur.

Pour un hébergement mutualisé sans SSH dont le dossier public est imposé, voir le guide expérimental [`deploy/shared-hosting/LISEZ-MOI.txt`](deploy/shared-hosting/LISEZ-MOI.txt) et l'archive produite par `python3 tools/build-shared-package.py --output /chemin/nouveau-paquet.zip`. Les règles Apache et le TLS MySQL doivent impérativement être vérifiés sur l'hébergeur cible avant utilisation ; cette adaptation n'a pas été validée sur InfinityFree.

> **Données existantes :** l'installateur exige une base MySQL vide et ne convertit ni ne supprime une ancienne base SQLite. Si le site contient déjà des articles ou demandes à conserver, sauvegardez-les et prévoyez une migration séparée avant de changer de base. Ne supprimez pas `.env` ou la base existante pour essayer l'installateur.

## 1. Prérequis

- PHP 8.2 ou supérieur avec `pdo_mysql`, `mbstring` et `openssl` en CLI **et** dans PHP-FPM. Argon2id est recommandé ; bcrypt est utilisé en repli.
- MySQL 8 / MariaDB récent avec une **base vide dédiée** en `utf8mb4`, et un utilisateur dédié avec mot de passe fort ayant les droits de création des tables, d'index et de clés étrangères, ainsi que SELECT, INSERT, UPDATE et DELETE sur cette base. L'installateur ne crée pas le serveur, la base ni l'utilisateur MySQL : créez-les dans l'interface de l'hébergeur ou demandez-les à l'administrateur du serveur. En production, MySQL distant exige TLS avec certificat serveur vérifié : fournissez le fichier CA de confiance de votre hébergeur, lisible par PHP-FPM et par le worker CLI. Le nom DNS saisi doit correspondre au certificat. Pour `localhost`, `127.0.0.1` ou `::1`, TLS reste facultatif.
- Un serveur Apache ou Nginx/PHP-FPM avec HTTPS. Seul `cmcb-php/public/` doit être accessible sur le web.
- Un accès SSH/CLI pour activer l'installation et régler les permissions.

Exemple Debian/Ubuntu (adaptez la version de PHP à votre serveur) :

```sh
sudo apt update
sudo apt install php-cli php-fpm php-mysql php-mbstring
php -v
php -m | grep -E '^(PDO|pdo_mysql|mbstring|openssl)$'
```

Vérifiez également les extensions dans le pool PHP-FPM ; la configuration CLI peut être différente.

## 2. Préparer une nouvelle installation

Déployez le contenu du dossier `cmcb-php/` sur le serveur. Faites pointer le domaine vers son sous-dossier `public/`, jamais vers le dossier parent. Configurez HTTPS et le routage vers `public/index.php` ; des exemples à adapter figurent dans `deploy/`.

**Ne copiez pas `.env.example` vers `.env` pour l'installation par formulaire** : l'installateur refuse tout `.env` existant pour ne jamais l'écraser. Il créera `.env` lui-même. Sur Nginx, autorisez temporairement l'exécution exacte de `public/install.php` (bloc prévu dans `deploy/nginx.conf`), puis retirez ce bloc après installation. Apache doit autoriser PHP-FPM pour ce fichier.

Le processus PHP-FPM doit temporairement pouvoir écrire dans le dossier `cmcb-php/` afin de créer `.env`, `.install-key` et `.install.lock`. Restreignez l'accès au dossier et ne donnez pas de permissions globales `777`. Créez également le dossier privé des verrous, par exemple `sudo mkdir -p data && sudo chown www-data:www-data data && sudo chmod 700 data` (adaptez l'utilisateur PHP-FPM). Après installation, retirez le droit d'écriture temporaire au dossier applicatif, tout en laissant PHP-FPM lire `.env` et écrire dans `data/` pour les verrous du worker SMTP. `.env` doit rester privé (mode `600`, propriétaire correspondant au processus PHP).

## 3. Activer l'installateur

Exécutez la commande **avec le même utilisateur système que PHP-FPM**, depuis `cmcb-php/`. Par exemple, si votre pool s'exécute sous `www-data` :

```sh
cd /chemin/vers/cmcb-php
sudo -u www-data php bin/install-enable.php
```

Adaptez l'utilisateur à votre hébergeur. La commande affiche une clé secrète à usage unique. Gardez-la privée. Elle crée `.install-key` hors du dossier web avec un hash de la clé et refuse de démarrer si `.env` existe déjà ou si une installation est déjà activée. Pour désactiver une installation non terminée, supprimez `.install-key` sur le serveur ; ne supprimez jamais `.env` sur un site existant.

## 4. Configurer MySQL et l'administrateur

Ouvrez **`https://votre-domaine.tn/install.php`** et remplissez :

1. la clé affichée à l'étape précédente ;
2. l'hôte, le port, le nom de la base vide, l'utilisateur et le mot de passe MySQL fournis par l'hébergeur ; pour un serveur distant, le chemin absolu du certificat CA MySQL fourni par l'hébergeur ;
3. l'e-mail de l'administrateur et un mot de passe unique de **12 à 128 octets**, à confirmer (maximum 72 octets si PHP utilise bcrypt plutôt qu'Argon2id) ;
4. l'origine HTTPS exacte du site, par exemple `https://votre-domaine.tn`, sans chemin ni slash final.

L'installateur vérifie que la base est vide, crée les tables InnoDB et quatre articles bilingues de départ, crée l'administrateur avec un mot de passe haché, puis enregistre la configuration MySQL dans `.env` (permissions `600`, hors `public/`). Il ne stocke pas le mot de passe administrateur en clair. Les identifiants MySQL encodés dans `.env` ne sont **pas chiffrés** : protégez le fichier et ne le partagez pas. L'installateur se désactive après succès ; supprimez ou bloquez aussi `public/install.php` sur le serveur.

Une connexion HTTPS directe est requise. Si HTTPS est terminé par un proxy de confiance, configurez correctement le serveur web/PHP-FPM pour indiquer à PHP que la requête est HTTPS ; l'installateur ne fait pas confiance à un simple en-tête `X-Forwarded-Proto` envoyé par le navigateur. L'HTTP n'est autorisé que pour les essais sur la boucle locale et uniquement si `CMCB_INSTALL_ALLOW_HTTP_LOCAL=true` est explicitement défini dans l'environnement du processus PHP de développement ; ne définissez jamais cette option en production.

## 5. Vérifications et sécurité après installation

- Retirez le droit d'écriture temporaire au dossier applicatif ; PHP-FPM doit pouvoir lire `.env` et écrire dans `data/` pour le worker et les images téléversées. Par défaut les images sont dans `data/media/`, hors de `public/` ; `MEDIA_PATH` permet de choisir un autre dossier persistant et privé, accessible en lecture/écriture à PHP-FPM. Vérifiez que `.env`, `.install-key` et les sauvegardes ne sont pas accessibles sur le web.
- L'administration accepte un lien HTTPS ou une image JPEG, PNG ou WebP de 2 Mo maximum. L'application sert les images par une URL publique aléatoire, y compris celles associées à un brouillon ou téléversées avant enregistrement : ne téléversez pas de documents confidentiels et vérifiez leurs métadonnées. Un téléversement annulé ou remplacé n'est pas automatiquement supprimé ; surveillez l'espace disque et ne supprimez un fichier qu'après avoir vérifié qu'aucun article ne le référence.
- Connectez-vous à `https://votre-domaine.tn/admin`. Vérifiez les articles, la création d'une demande de test, les deux langues et la connexion après déconnexion.
- Dans `.env`, `TRUST_PROXY=0` correspond à un accès direct. Si un proxy est utilisé, configurez le nombre **exact** de proxys de confiance et assurez-vous qu'ils écrasent les en-têtes transférés. Les variables d'environnement du serveur priment sur `.env` : vérifiez qu'elles ne contredisent pas la configuration.
- Pour une installation existante avec MySQL distant, renseignez `DB_SSL_CA=/chemin/absolu/ca.pem` dans `.env` **avant** le déploiement de cette version. Sans CA lisible, pilote supportant la vérification ou TLS effectivement négocié, le démarrage échoue volontairement. N'utilisez pas de CA non fiable et ne désactivez pas la vérification. Testez une connexion valide, une CA incorrecte et un serveur sans TLS sur l'hébergement cible ; cette vérification n'a pas été réalisée ici sur un vrai serveur MySQL.
- La connexion est limitée par adresse IP et par adresse de compte (10 tentatives par 15 minutes, y compris les connexions réussies). Un attaquant peut donc temporairement bloquer un compte connu : prévoir surveillance et protection réseau en amont. Les limites sont en base.
- Sans SMTP configuré, les demandes restent dans MySQL et sont visibles dans l'administration, mais aucun e-mail n'est envoyé. Configurez et testez un fournisseur réel si les notifications sont nécessaires ; voir [README.md](README.md).
- Sauvegardez régulièrement la base MySQL avec l'outil de l'hébergeur ou un dump transactionnel (`mysqldump --single-transaction` pour InnoDB), ainsi que le dossier d'images `data/media/` (ou `MEDIA_PATH`). Chiffrez les copies et testez leur restauration ensemble sur une installation isolée. N'inscrivez pas de mot de passe dans une commande ou son historique. `bin/backup.php` ne sauvegarde **ni MySQL ni les images**.
- Testez le site avec les versions et permissions réelles du serveur avant ouverture au public.

## Tester avec un vrai serveur MySQL

La suite `tests/run.php` accepte une base MySQL **vide et jetable** dont le nom commence par `cmcb_test_`. Elle crée des tables et des données de test, mais ne les supprime pas automatiquement. Ne l'exécutez jamais sur la base du site ; l'initialisation refuse toute base contenant déjà des tables. Depuis `cmcb-php/`, avec PHP natif et `pdo_mysql` :

```bash
export CMCB_TEST_MYSQL=1 CMCB_TEST_DB_HOST=127.0.0.1 CMCB_TEST_DB_PORT=3306
export CMCB_TEST_DB_NAME=cmcb_test_validation CMCB_TEST_DB_USER=utilisateur_de_test
read -r -s -p 'Mot de passe MySQL de test : ' CMCB_TEST_DB_PASSWORD; echo
export CMCB_TEST_DB_PASSWORD
php tests/run.php
unset CMCB_TEST_DB_PASSWORD
```

Le compte de test doit avoir les droits nécessaires sur cette base dédiée. Contrôlez les résultats et testez séparément le formulaire d'installation complet et la restauration MySQL sur le serveur cible.

## Réinitialiser le mot de passe administrateur

Si l'administrateur peut se connecter, utilisez le changement de mot de passe dans l'administration. Sinon, sauvegardez la base, renseignez temporairement `ADMIN_EMAIL` et `ADMIN_PASSWORD` dans `.env`, puis lancez `php bin/admin-create.php` avec l'utilisateur PHP-FPM. Si l'adresse existe, le mot de passe est remplacé et les sessions de ce compte sont révoquées ; une adresse différente crée un autre compte. Retirez `ADMIN_PASSWORD` de `.env` après succès.

## Dépannage

- **Installation fermée (404)** : l'installateur n'a pas été activé, `.env` existe déjà ou l'installation est terminée. Ne supprimez pas un `.env` existant.
- **Extensions manquantes** : activez `pdo_mysql`, `mbstring` et `openssl` dans le PHP utilisé par FPM et redémarrez le service.
- **Connexion ou initialisation MySQL impossible** : vérifiez hôte, port, nom, identifiants, droits et accès réseau. Utilisez une base vide et dédiée ; l'installateur refuse une base contenant déjà des tables.
- **Échec après création partielle des tables** : MySQL valide certaines opérations de schéma immédiatement. L'installation ne supprime jamais automatiquement les tables. Examinez les journaux privés et, uniquement sur une base de test dédiée dont vous n'avez pas besoin, recréez une base vide avant de réessayer. Ne supprimez pas de données existantes.
- **Impossible de créer `.env`** : vérifiez l'utilisateur PHP-FPM et les permissions temporaires du dossier applicatif. Ne rendez pas le projet accessible en écriture à tous.
- **HTTPS requis derrière un proxy** : configurez l'information HTTPS au niveau du serveur web/FPM et vérifiez la chaîne de confiance.

**Limite de validation :** l'installation MySQL doit être testée sur l'hébergement cible avec un vrai serveur MySQL/MariaDB, PHP-FPM et le fournisseur SMTP avant la mise en production. L'aperçu sandbox historique utilise encore SQLite en développement et ne migre aucune donnée automatiquement.
