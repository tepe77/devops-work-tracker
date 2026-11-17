<?php

namespace App\Services;

use Illuminate\Http\UploadedFile;
use Illuminate\Validation\ValidationException;

class ImageOptimizationService
{
    /**
     * Maximum width or height constraint in pixels.
     */
    protected int $maxDimension = 1920;

    /**
     * Quality parameter for WebP encoding (0-100).
     */
    protected int $webpQuality = 82;

    /**
     * Target extensions recognized as optimizable images.
     */
    protected array $imageExtensions = ['png', 'jpg', 'jpeg', 'webp', 'gif'];

    /**
     * Determine if the uploaded file is an image eligible for optimization.
     */
    public function isImage(UploadedFile $file): bool
    {
        $extension = strtolower($file->getClientOriginalExtension());
        $mime = strtolower($file->getMimeType() ?? '');

        return in_array($extension, $this->imageExtensions) || str_starts_with($mime, 'image/');
    }

    /**
     * Optimize an image:
     * - Auto-downscales if larger than 1920px (preserving aspect ratio)
     * - Corrects camera EXIF orientation for JPEG
     * - Preserves alpha transparency for PNG & WebP
     * - Preserves animated GIFs to keep animation frames intact
     * - Converts static images (PNG, JPG, static GIF, WebP) to compressed WebP format
     *
     * @return array{
     *     is_converted: bool,
     *     temp_path: string|null,
     *     extension: string,
     *     mime_type: string,
     *     file_size: int,
     *     original_name: string
     * }
     */
    public function optimize(UploadedFile $file): array
    {
        $originalName = $file->getClientOriginalName();
        $extension = strtolower($file->getClientOriginalExtension());
        $realPath = $file->getRealPath();

        // If not an image, return uncompressed passthrough information
        if (!$this->isImage($file)) {
            return [
                'is_converted' => false,
                'temp_path' => null,
                'extension' => $extension,
                'mime_type' => $file->getMimeType() ?? 'application/octet-stream',
                'file_size' => $file->getSize(),
                'original_name' => $originalName,
            ];
        }

        // If animated GIF, preserve original GIF to retain all animation frames
        if ($extension === 'gif' && $this->isAnimatedGif($realPath)) {
            return [
                'is_converted' => false,
                'temp_path' => null,
                'extension' => 'gif',
                'mime_type' => 'image/gif',
                'file_size' => $file->getSize(),
                'original_name' => $originalName,
            ];
        }

        // Load image into GD resource
        $content = @file_get_contents($realPath);
        if ($content === false) {
            throw ValidationException::withMessages([
                'file' => 'Tidak dapat membaca file gambar yang diunggah.',
            ]);
        }

        $sourceImage = @imagecreatefromstring($content);
        if ($sourceImage === false) {
            throw ValidationException::withMessages([
                'file' => 'Format file gambar rusak atau tidak didukung oleh pemroses server.',
            ]);
        }

        $canvas = null;

        try {
            // Correct EXIF orientation for JPEG (e.g. photos taken from smartphones)
            if (in_array($extension, ['jpg', 'jpeg'])) {
                $sourceImage = $this->correctOrientation($sourceImage, $realPath);
            }

            $origWidth = imagesx($sourceImage);
            $origHeight = imagesy($sourceImage);

            // Calculate resized dimensions if exceeding max dimension
            if ($origWidth > $this->maxDimension || $origHeight > $this->maxDimension) {
                $ratio = min($this->maxDimension / $origWidth, $this->maxDimension / $origHeight);
                $newWidth = (int) max(1, round($origWidth * $ratio));
                $newHeight = (int) max(1, round($origHeight * $ratio));
            } else {
                $newWidth = $origWidth;
                $newHeight = $origHeight;
            }

            // Create truecolor canvas with transparency support
            $canvas = imagecreatetruecolor($newWidth, $newHeight);
            imagealphablending($canvas, false);
            imagesavealpha($canvas, true);

            $transparent = imagecolorallocatealpha($canvas, 0, 0, 0, 127);
            imagefilledrectangle($canvas, 0, 0, $newWidth, $newHeight, $transparent);

            // High-quality resampling
            imagecopyresampled(
                $canvas,
                $sourceImage,
                0, 0, 0, 0,
                $newWidth,
                $newHeight,
                $origWidth,
                $origHeight
            );

            // Export to temporary WebP file
            $tempFile = tempnam(sys_get_temp_dir(), 'dwt_webp_') . '.webp';
            $success = @imagewebp($canvas, $tempFile, $this->webpQuality);

            if (!$success || !file_exists($tempFile)) {
                throw new \RuntimeException('Gagal melakukan kompresi gambar ke WebP.');
            }

            $baseName = pathinfo($originalName, PATHINFO_FILENAME);
            $newOriginalName = $baseName . '.webp';
            $fileSize = filesize($tempFile);

            return [
                'is_converted' => true,
                'temp_path' => $tempFile,
                'extension' => 'webp',
                'mime_type' => 'image/webp',
                'file_size' => $fileSize,
                'original_name' => $newOriginalName,
            ];
        } finally {
            if (is_resource($sourceImage) || (is_object($sourceImage) && $sourceImage instanceof \GdImage)) {
                imagedestroy($sourceImage);
            }
            if ($canvas && (is_resource($canvas) || (is_object($canvas) && $canvas instanceof \GdImage))) {
                imagedestroy($canvas);
            }
        }
    }

    /**
     * Check if a GIF file contains more than one frame (animated).
     */
    public function isAnimatedGif(string $filePath): bool
    {
        if (!($fh = @fopen($filePath, 'rb'))) {
            return false;
        }

        $count = 0;
        while (!feof($fh) && $count < 2) {
            $chunk = fread($fh, 1024 * 100);
            $count += preg_match_all('#\x00\x21\xF9\x04#s', $chunk);
        }
        fclose($fh);

        return $count > 1;
    }

    /**
     * Rotate GD image based on EXIF orientation tag.
     */
    protected function correctOrientation($image, string $filePath)
    {
        if (!function_exists('exif_read_data')) {
            return $image;
        }

        $exif = @exif_read_data($filePath);
        if (empty($exif['Orientation'])) {
            return $image;
        }

        switch ($exif['Orientation']) {
            case 3:
                $rotated = imagerotate($image, 180, 0);
                imagedestroy($image);
                return $rotated;
            case 6:
                $rotated = imagerotate($image, -90, 0);
                imagedestroy($image);
                return $rotated;
            case 8:
                $rotated = imagerotate($image, 90, 0);
                imagedestroy($image);
                return $rotated;
            default:
                return $image;
        }
    }
}
