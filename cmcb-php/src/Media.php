<?php
declare(strict_types=1);
namespace CMCB;

/** Public article images stored outside the web root and served by the application. */
final class Media
{
    private const MAX_BYTES = 2097152;
    public function __construct(private readonly Config $config) {}

    private function directory(bool $create): ?string
    {
        $path = $this->config->mediaPath;
        if ($create && !is_dir($path) && !@mkdir($path, 0700, true) && !is_dir($path)) throw new \RuntimeException('Impossible de créer le dossier des images.');
        if (!is_dir($path)) return null;
        $dir = realpath($path); $public = realpath($this->config->root . '/public');
        if ($dir === false || ($public !== false && ($dir === $public || str_starts_with($dir, $public . DIRECTORY_SEPARATOR)))) throw new \RuntimeException('Les images doivent être conservées hors du dossier public.');
        return $dir;
    }

    public function save(array $input): string
    {
        Validation::keys($input, ['data']);
        $data = $input['data'] ?? null;
        if (!is_string($data) || strlen($data) > 2796204 || !preg_match('/^[A-Za-z0-9+\/]*={0,2}$/D', $data)) throw new HttpError(400, 'INVALID_IMAGE', 'Image invalide ou trop volumineuse (2 Mo maximum).');
        $bytes = base64_decode($data, true);
        if ($bytes === false || strlen($bytes) === 0 || strlen($bytes) > self::MAX_BYTES || base64_encode($bytes) !== $data) throw new HttpError(400, 'INVALID_IMAGE', 'Image invalide ou trop volumineuse (2 Mo maximum).');
        $info = @getimagesizefromstring($bytes);
        $types = [IMAGETYPE_JPEG => 'jpg', IMAGETYPE_PNG => 'png', IMAGETYPE_WEBP => 'webp'];
        $ext = $types[$info[2] ?? 0] ?? null;
        if (!$ext || $info[0] < 1 || $info[1] < 1 || $info[0] > 10000 || $info[1] > 10000 || $info[0] * $info[1] > 40000000) throw new HttpError(400, 'INVALID_IMAGE', 'Utilisez une image JPEG, PNG ou WebP valide, de 2 Mo maximum.');
        $dir = $this->directory(true);
        $name = bin2hex(random_bytes(16)) . '.' . $ext;
        $file = @fopen($dir . DIRECTORY_SEPARATOR . $name, 'xb');
        if (!$file) throw new \RuntimeException('Impossible de conserver l’image.');
        try {
            @chmod($dir . DIRECTORY_SEPARATOR . $name, 0600);
            if (fwrite($file, $bytes) !== strlen($bytes) || !fflush($file)) throw new \RuntimeException('Écriture de l’image impossible.');
        } catch (\Throwable $e) {
            fclose($file); @unlink($dir . DIRECTORY_SEPARATOR . $name); throw $e;
        }
        fclose($file);
        return '/media/' . $name;
    }

    public function read(string $name): Response
    {
        if (!preg_match('/^[a-f0-9]{32}\.(jpg|png|webp)$/D', $name, $m)) throw new HttpError(404, 'NOT_FOUND', 'Image introuvable.');
        $dir = $this->directory(false);
        $file = $dir === null ? '' : $dir . DIRECTORY_SEPARATOR . $name;
        if ($file === '' || !is_file($file) || is_link($file) || filesize($file) > self::MAX_BYTES) throw new HttpError(404, 'NOT_FOUND', 'Image introuvable.');
        $bytes = @file_get_contents($file);
        if ($bytes === false) throw new HttpError(404, 'NOT_FOUND', 'Image introuvable.');
        $type = ['jpg' => 'image/jpeg', 'png' => 'image/png', 'webp' => 'image/webp'][$m[1]];
        return new Response(200, $bytes, ['Content-Type' => $type, 'Cache-Control' => 'public, max-age=31536000, immutable', 'Content-Security-Policy' => "default-src 'none'; sandbox", 'X-Content-Type-Options' => 'nosniff']);
    }
}
