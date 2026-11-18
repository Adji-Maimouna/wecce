<?php

namespace App\Support;

use Carbon\Carbon;
use DateTimeInterface;

/**
 * Formatage des dates en français conforme à GUIDE-FRONT-BACK.md et clock.ts.
 */
final class WecceClock
{
    public const MONTHS = [
        1 => 'janvier', 2 => 'février', 3 => 'mars', 4 => 'avril',
        5 => 'mai', 6 => 'juin', 7 => 'juillet', 8 => 'août',
        9 => 'septembre', 10 => 'octobre', 11 => 'novembre', 12 => 'décembre',
    ];

    public const MONTHS_SHORT = [
        1 => 'janv.', 2 => 'févr.', 3 => 'mars', 4 => 'avr.',
        5 => 'mai', 6 => 'juin', 7 => 'juil.', 8 => 'août',
        9 => 'sept.', 10 => 'oct.', 11 => 'nov.', 12 => 'déc.',
    ];

    public const WEEKDAYS = [
        0 => 'dimanche', 1 => 'lundi', 2 => 'mardi', 3 => 'mercredi',
        4 => 'jeudi', 5 => 'vendredi', 6 => 'samedi',
    ];

    public static function today(): string
    {
        $ref = config('wecce.reference_date');

        return $ref ? (string) $ref : Carbon::now()->format('Y-m-d');
    }

    public static function now(): string
    {
        $real = Carbon::now();
        if (config('wecce.reference_date')) {
            $minutes = max($real->hour * 60 + $real->minute, 11 * 60);
            $hh = str_pad((string) intdiv($minutes, 60), 2, '0', STR_PAD_LEFT);
            $mm = str_pad((string) ($minutes % 60), 2, '0', STR_PAD_LEFT);

            return self::today() . "T{$hh}:{$mm}";
        }

        return $real->format('Y-m-d\TH:i');
    }

    /**
     * @return array{y:int, m:int, d:int, hh:int, mm:int}
     */
    public static function parts(string|DateTimeInterface|null $iso): array
    {
        if ($iso instanceof DateTimeInterface) {
            $iso = $iso->format('Y-m-d\TH:i');
        }
        $str = trim((string) ($iso ?: self::now()));
        $str = str_replace(' ', 'T', $str);
        $segments = explode('T', $str);
        $datePart = $segments[0] ?? '2026-11-07';
        $timePart = $segments[1] ?? '00:00';

        $dParts = explode('-', substr($datePart, 0, 10));
        $tParts = explode(':', substr($timePart, 0, 5));

        return [
            'y' => (int) ($dParts[0] ?? 2026),
            'm' => max(1, min(12, (int) ($dParts[1] ?? 11))),
            'd' => max(1, min(31, (int) ($dParts[2] ?? 7))),
            'hh' => (int) ($tParts[0] ?? 0),
            'mm' => (int) ($tParts[1] ?? 0),
        ];
    }

    public static function toIso(string|DateTimeInterface|null $val): string
    {
        $p = self::parts($val);
        return sprintf('%04d-%02d-%02dT%02d:%02d', $p['y'], $p['m'], $p['d'], $p['hh'], $p['mm']);
    }

    public static function dateOf(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return sprintf('%04d-%02d-%02d', $p['y'], $p['m'], $p['d']);
    }

    public static function monthKey(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return sprintf('%04d-%02d', $p['y'], $p['m']);
    }

    public static function dayNumber(int $d): string
    {
        return $d === 1 ? '1er' : (string) $d;
    }

    public static function weekday(string|DateTimeInterface|null $iso): int
    {
        $p = self::parts($iso);
        return (int) Carbon::createSafe($p['y'], $p['m'], $p['d'], 12, 0, 0)->dayOfWeek;
    }

    public static function addDays(string $date, int $days): string
    {
        $p = self::parts($date);
        return Carbon::createSafe($p['y'], $p['m'], $p['d'], 12, 0, 0)->addDays($days)->format('Y-m-d');
    }

    public static function minutesOf(string|DateTimeInterface|null $iso): int
    {
        $p = self::parts($iso);
        return $p['hh'] * 60 + $p['mm'];
    }

    public static function time(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return sprintf('%d h %02d', $p['hh'], $p['mm']);
    }

    public static function parseTime(string $label): string
    {
        $parts = explode(' h ', $label);
        $h = (int) trim($parts[0] ?? '0');
        $m = (int) trim($parts[1] ?? '0');
        return sprintf('%02d:%02d', $h, $m);
    }

    public static function dayMonth(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return self::dayNumber($p['d']) . ' ' . self::MONTHS[$p['m']];
    }

    public static function dayMonthShort(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return self::dayNumber($p['d']) . ' ' . self::MONTHS_SHORT[$p['m']];
    }

    public static function dayMonthYearShort(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return self::dayMonthShort($iso) . ' ' . $p['y'];
    }

    public static function dayMonthYear(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return self::dayMonth($iso) . ' ' . $p['y'];
    }

    public static function weekdayDayMonth(string|DateTimeInterface|null $iso): string
    {
        return self::WEEKDAYS[self::weekday($iso)] . ' ' . self::dayMonth($iso);
    }

    public static function longDate(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return self::capitalize(self::weekdayDayMonth($iso) . ' ' . $p['y']);
    }

    public static function stamp(string|DateTimeInterface|null $iso): string
    {
        return self::dayMonthShort($iso) . ', ' . self::time($iso);
    }

    public static function stampYear(string|DateTimeInterface|null $iso): string
    {
        return self::dayMonthYearShort($iso) . ', ' . self::time($iso);
    }

    public static function stampAt(string|DateTimeInterface|null $iso): string
    {
        return self::dayMonthShort($iso) . ' à ' . self::time($iso);
    }

    public static function fullStamp(string|DateTimeInterface|null $iso): string
    {
        $p = self::parts($iso);
        return self::weekdayDayMonth($iso) . ' ' . $p['y'] . ', ' . self::time($iso);
    }

    public static function monthName(string|DateTimeInterface|null $iso, int $offset = 0): string
    {
        $p = self::parts($iso);
        $idx = (($p['m'] - 1 + $offset) % 12 + 12) % 12 + 1;
        return self::MONTHS[$idx];
    }

    public static function monthTitle(string|DateTimeInterface|null $iso): string
    {
        return self::capitalize(self::monthName($iso));
    }

    /**
     * @return array{label:string, month:string}
     */
    public static function pickerDay(string $date): array
    {
        $p = self::parts($date);
        return [
            'label' => self::capitalize(self::WEEKDAYS[self::weekday($date)] . ' ' . $p['d']),
            'month' => self::MONTHS[$p['m']],
        ];
    }

    public static function daysBetween(string|DateTimeInterface $from, string|DateTimeInterface $to): int
    {
        $a = self::parts($from);
        $b = self::parts($to);
        $utcA = gmmktime(0, 0, 0, $a['m'], $a['d'], $a['y']);
        $utcB = gmmktime(0, 0, 0, $b['m'], $b['d'], $b['y']);
        return (int) round(($utcB - $utcA) / 86400);
    }

    public static function capitalize(string $s): string
    {
        if ($s === '') {
            return '';
        }
        return mb_strtoupper(mb_substr($s, 0, 1, 'UTF-8'), 'UTF-8') . mb_substr($s, 1, null, 'UTF-8');
    }
}
