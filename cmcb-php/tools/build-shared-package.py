#!/usr/bin/env python3
"""Build a clean shared-hosting archive locally. No secrets or live data are read."""
from __future__ import annotations

import argparse
import hashlib
from pathlib import Path
import zipfile

ROOT = Path(__file__).resolve().parent.parent
SHARED = ROOT / 'deploy' / 'shared-hosting'


def files_under(folder: Path):
    for item in sorted(folder.rglob('*')):
        if item.is_symlink():
            raise RuntimeError(f'Symlink not allowed in package: {item}')
        if item.is_file():
            yield item



def replace_once(source: str, old: str, new: str, label: str) -> str:
    if source.count(old) != 1:
        raise RuntimeError(f'Unexpected {label}; review before packaging')
    return source.replace(old, new, 1)


def shared_config(source: str) -> str:
    # This exception is confined to the shared-hosting package. The normal
    # application keeps its mandatory TLS policy for remote MySQL.
    source = replace_once(source,
        "&& $ca === '') throw new \\RuntimeException('MySQL distant exige DB_SSL_CA et une connexion TLS vérifiée.');",
        "&& $ca === '' && ($env['DB_ALLOW_INSECURE_REMOTE'] ?? '') !== 'true') throw new \\RuntimeException('MySQL distant exige DB_SSL_CA ou une acceptation explicite du risque.');",
        'remote MySQL TLS policy')
    return replace_once(source, "'DB_SSL_CA', 'TRUST_PROXY'", "'DB_SSL_CA', 'DB_ALLOW_INSECURE_REMOTE', 'TRUST_PROXY'", 'environment allowlist')


def shared_installer(source: str) -> str:
    source = replace_once(source, "        $config = new CMCB\\Config($root, $env);",
        "        if ($value('allow_insecure') === 'yes') {\n            if ($dbCa !== '') throw new RuntimeException('Choisissez TLS avec CA ou acceptez le risque sans CA, pas les deux.');\n            $env['DB_ALLOW_INSECURE_REMOTE'] = 'true';\n        }\n        $config = new CMCB\\Config($root, $env);", 'installer config')
    return replace_once(source,
        '<p class="hint">Obligatoire pour un serveur MySQL distant en production. Le certificat doit être fourni par l’hébergeur et lisible par PHP-FPM.</p>',
        '<p class="hint">Pour une base distante, utilisez une CA fournie par l’hébergeur si disponible.</p><label style="display:flex;gap:.6rem;align-items:flex-start"><input style="width:auto;margin-top:.35rem" type="checkbox" name="allow_insecure" value="yes"> J’accepte une connexion MySQL distante potentiellement non chiffrée et non authentifiée. Les identifiants et données peuvent être interceptés ou modifiés. Ne pas utiliser pour des données confidentielles.</label><p class="hint">Ne cochez cette case que si TLS vérifié est indisponible. HTTPS protège le navigateur, pas la connexion MySQL.</p>',
        'installer security notice')

def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--output', required=True, type=Path, help='Path to new ZIP; existing files are never overwritten')
    args = parser.parse_args()
    output = args.output.resolve()
    output.parent.mkdir(parents=True, exist_ok=True)
    root_guard = (SHARED / 'htdocs.htaccess').read_bytes()
    private_guard = (SHARED / 'private.htaccess').read_bytes()
    root_hash = hashlib.sha256(root_guard).hexdigest()
    private_hash = hashlib.sha256(private_guard).hexdigest()
    # Presence and integrity checks are defense in depth; they do NOT prove
    # Apache actually enforces .htaccess. The operator must test HTTP 403.
    checks = f'''\n// Shared hosting: reject missing or modified protection files.\nforeach ([__DIR__ . '/.htaccess' => '{root_hash}', $root . '/.htaccess' => '{private_hash}'] as $guard => $expected) {{\n    $actual = is_file($guard) ? @hash_file('sha256', $guard) : false;\n    if (!is_string($actual) || !hash_equals($expected, $actual)) {{\n        http_response_code(503); header('Content-Type: text/plain; charset=utf-8');\n        exit('Protection du dossier privé manquante ou modifiée. Consultez le guide avant installation.');\n    }}\n}}\n'''
    with zipfile.ZipFile(output, 'x', compression=zipfile.ZIP_DEFLATED, compresslevel=9) as archive:
        archive.writestr('LISEZ-MOI.txt', (SHARED / 'LISEZ-MOI.txt').read_bytes())
        archive.writestr('outils-local/preparer-cle.html', (SHARED / 'preparer-cle.html').read_bytes())
        archive.writestr('site/.htaccess', root_guard)
        archive.writestr('site/_cmcb/.htaccess', private_guard)
        archive.writestr('site/_cmcb/PROTECTION_TEST.txt', 'Ce fichier de test ne doit jamais être accessible par HTTP.\n')
        for folder in ('src', 'templates', 'resources'):
            for item in files_under(ROOT / folder):
                target = 'site/_cmcb/' + item.relative_to(ROOT).as_posix()
                if item == ROOT / 'src' / 'Config.php':
                    archive.writestr(target, shared_config(item.read_text(encoding='utf-8')))
                else:
                    archive.write(item, target)
        for item in files_under(ROOT / 'public' / 'assets'):
            archive.write(item, 'site/' + item.relative_to(ROOT / 'public').as_posix())
        for name in ('index.php', 'install.php'):
            source = (ROOT / 'public' / name).read_text(encoding='utf-8')
            original = '$root = dirname(__DIR__);'
            if source.count(original) != 1:
                raise RuntimeError(f'Unexpected {name} layout; review before packaging')
            source = source.replace(original, "$root = __DIR__ . '/_cmcb';" + checks, 1)
            if name == 'install.php':
                source = shared_installer(source)
            archive.writestr('site/' + name, source)
    print(f'Created {output}')


if __name__ == '__main__':
    main()
