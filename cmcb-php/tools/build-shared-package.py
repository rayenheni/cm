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
                archive.write(item, 'site/_cmcb/' + item.relative_to(ROOT).as_posix())
        for item in files_under(ROOT / 'public' / 'assets'):
            archive.write(item, 'site/' + item.relative_to(ROOT / 'public').as_posix())
        for name in ('index.php', 'install.php'):
            source = (ROOT / 'public' / name).read_text(encoding='utf-8')
            original = '$root = dirname(__DIR__);'
            if source.count(original) != 1:
                raise RuntimeError(f'Unexpected {name} layout; review before packaging')
            source = source.replace(original, "$root = __DIR__ . '/_cmcb';" + checks, 1)
            archive.writestr('site/' + name, source)
    print(f'Created {output}')


if __name__ == '__main__':
    main()
