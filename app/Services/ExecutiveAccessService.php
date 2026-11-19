<?php

namespace App\Services;

use Carbon\Carbon;

class ExecutiveAccessService
{
    /**
     * Generate a cryptographic daily token for the Executive Board.
     * Bound to the Asia/Jakarta date and Laravel APP_KEY.
     */
    public static function generateDailyToken(?Carbon $date = null): string
    {
        $targetDate = $date ?? Carbon::today('Asia/Jakarta');
        $dateString = $targetDate->format('Ymd');
        $signature = substr(hash_hmac('sha256', "executive-board-{$dateString}", config('app.key')), 0, 16);

        return "{$dateString}-{$signature}";
    }

    /**
     * Validate a given daily token.
     *
     * @return array{
     *     status: 'valid'|'expired'|'invalid'|'missing',
     *     is_authenticated: bool,
     *     daily_token: string|null,
     *     date_formatted: string|null,
     *     expired_date: string|null,
     *     message: string
     * }
     */
    public static function validateToken(?string $token, bool $isAuthenticated = false): array
    {
        $today = Carbon::today('Asia/Jakarta');
        $todayString = $today->format('Ymd');

        // Authenticated DevOps / Admin users always have access
        if ($isAuthenticated) {
            $dailyToken = self::generateDailyToken($today);
            return [
                'status' => 'valid',
                'is_authenticated' => true,
                'daily_token' => $dailyToken,
                'date_formatted' => $today->locale('id')->isoFormat('dddd, D MMMM Y'),
                'expired_date' => null,
                'message' => 'Akses terverifikasi melalui sesi login DevOps.',
            ];
        }

        // Guest with no token
        if (empty($token)) {
            return [
                'status' => 'missing',
                'is_authenticated' => false,
                'daily_token' => null,
                'date_formatted' => null,
                'expired_date' => null,
                'message' => 'Link akses harian diperlukan untuk membuka Executive Board. Silahkan hubungi Tim DevOps untuk meminta link hari ini.',
            ];
        }

        // Validate format: YYYYMMDD-{16-char hex}
        if (!preg_match('/^(\d{8})-([a-f0-9]{16})$/', $token, $matches)) {
            return [
                'status' => 'invalid',
                'is_authenticated' => false,
                'daily_token' => null,
                'date_formatted' => null,
                'expired_date' => null,
                'message' => 'Format link akses tidak valid atau tautan rusak.',
            ];
        }

        $datePart = $matches[1];
        $hashPart = $matches[2];

        try {
            $tokenDate = Carbon::createFromFormat('Ymd', $datePart, 'Asia/Jakarta')->startOfDay();
        } catch (\Throwable $e) {
            return [
                'status' => 'invalid',
                'is_authenticated' => false,
                'daily_token' => null,
                'date_formatted' => null,
                'expired_date' => null,
                'message' => 'Tanggal pada link akses tidak valid.',
            ];
        }

        // Verify cryptographic signature
        $expectedHash = substr(hash_hmac('sha256', "executive-board-{$datePart}", config('app.key')), 0, 16);
        if (!hash_equals($expectedHash, $hashPart)) {
            return [
                'status' => 'invalid',
                'is_authenticated' => false,
                'daily_token' => null,
                'date_formatted' => null,
                'expired_date' => null,
                'message' => 'Token keamanan tidak cocok atau link telah dimodifikasi.',
            ];
        }

        $formattedTokenDate = $tokenDate->locale('id')->isoFormat('dddd, D MMMM Y');

        // Check if token date matches today in Asia/Jakarta
        if ($datePart === $todayString) {
            return [
                'status' => 'valid',
                'is_authenticated' => false,
                'daily_token' => $token,
                'date_formatted' => $formattedTokenDate,
                'expired_date' => null,
                'message' => 'Link akses harian aktif untuk hari ini.',
            ];
        }

        // Valid signature, but date is expired
        return [
            'status' => 'expired',
            'is_authenticated' => false,
            'daily_token' => $token,
            'date_formatted' => $formattedTokenDate,
            'expired_date' => $formattedTokenDate,
            'message' => 'Link sudah kadaluarsa. Silahkan Hubungi Tim DevOps untuk meminta link yang baru.',
        ];
    }
}
