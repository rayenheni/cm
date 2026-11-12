import path from 'node:path';
import { mkdir, realpath, writeFile, readFile, lstat } from 'node:fs/promises';
import { randomBytes } from 'node:crypto';
import { imageSize } from 'image-size';

export class InvalidImage extends Error {}
const max = 2 * 1024 * 1024;
const namePattern = /^[a-f0-9]{32}\.(jpg|png|webp)$/;

async function directory(root: string, create: boolean): Promise<string | null> {
  if (create) await mkdir(root, { recursive: true, mode: 0o700 });
  let dir: string;
  try { dir = await realpath(root); } catch (e) { if (!create && (e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
  for (const publicRoot of ['public', 'dist']) {
    const exposed = path.resolve(publicRoot);
    if (dir === exposed || dir.startsWith(exposed + path.sep)) throw new Error('Media storage must be outside public and dist.');
  }
  return dir;
}

export function parseImage(input: unknown): { bytes: Buffer; ext: 'jpg' | 'png' | 'webp'; type: string } {
  if (typeof input !== 'string' || input.length > 2796204 || !/^[A-Za-z0-9+/]*={0,2}$/.test(input)) throw new InvalidImage('Image invalide ou trop volumineuse (2 Mo maximum).');
  const bytes = Buffer.from(input, 'base64');
  if (!bytes.length || bytes.length > max || bytes.toString('base64') !== input) throw new InvalidImage('Image invalide ou trop volumineuse (2 Mo maximum).');
  const jpeg = bytes.length >= 3 && bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const png = bytes.length >= 8 && bytes.subarray(0, 8).equals(Buffer.from([137,80,78,71,13,10,26,10]));
  const webp = bytes.length >= 12 && bytes.toString('ascii', 0, 4) === 'RIFF' && bytes.toString('ascii', 8, 12) === 'WEBP';
  if (!jpeg && !png && !webp) throw new InvalidImage('Utilisez une image JPEG, PNG ou WebP valide, de 2 Mo maximum.');
  let info: ReturnType<typeof imageSize>;
  try { info = imageSize(bytes); } catch { throw new InvalidImage('Image illisible.'); }
  const ext = jpeg ? 'jpg' : png ? 'png' : 'webp';
  if (info.type !== (jpeg ? 'jpg' : ext) || !info.width || !info.height || info.width > 10000 || info.height > 10000 || info.width * info.height > 40000000) throw new InvalidImage('Dimensions ou format de l’image invalide.');
  return { bytes, ext, type: { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[ext] };
}

export async function saveImage(root: string, input: unknown): Promise<string> {
  const { bytes, ext } = parseImage(input);
  const dir = await directory(root, true);
  const name = `${randomBytes(16).toString('hex')}.${ext}`;
  await writeFile(path.join(dir!, name), bytes, { flag: 'wx', mode: 0o600 });
  return `/media/${name}`;
}

export async function readImage(root: string, name: string): Promise<{ bytes: Buffer; type: string } | null> {
  const match = namePattern.exec(name); if (!match) return null;
  const dir = await directory(root, false); if (!dir) return null;
  const file = path.join(dir, name);
  try {
    const stat = await lstat(file);
    if (!stat.isFile() || stat.isSymbolicLink() || stat.size > max) return null;
    const bytes = await readFile(file);
    return { bytes, type: { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' }[match[1]]! };
  } catch (e) { if ((e as NodeJS.ErrnoException).code === 'ENOENT') return null; throw e; }
}
