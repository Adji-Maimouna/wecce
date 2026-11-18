<?php

namespace App\Services\Points;

use App\Exceptions\RuleViolationException;
use App\Models\ComptePoints;
use App\Models\ConfigurationPlateforme;
use App\Models\MouvementPoints;

/**
 * Règle unique du bonus de lancement, partagée par le crédit, l'écran d'expertise et le renoncement.
 *
 * Limites demandées par LBC (novembre 2026) :
 * - taux plafonné (TAUX_MAX) et quota global plafonné (QUOTA_MAX) ;
 * - plafond en points par dépôt (configuration_plateforme.bonus_plafond_points) ;
 * - un seul bonus par étudiant (configuration_plateforme.bonus_un_par_etudiant).
 */
final class RegleBonus
{
    public const TAUX_MAX_POURCENT = 20;
    public const QUOTA_MAX = 500;
    public const PLAFOND_MAX = 20000;

    public static function campagneOuverte(ConfigurationPlateforme $config): bool
    {
        return $config->bonus_actif
            && $config->bonus_taux > 0
            && $config->bonus_consomme < $config->bonus_quota;
    }

    public static function dejaBonifie(?string $compteId): bool
    {
        if (!$compteId) {
            return false;
        }

        return MouvementPoints::query()
            ->where('compte_id', $compteId)
            ->where('type', 'BONUS')
            ->exists();
    }

    /** L'étudiant de ce compte peut-il encore recevoir un bonus ? */
    public static function eligible(ConfigurationPlateforme $config, ?ComptePoints $compte): bool
    {
        if (!self::campagneOuverte($config)) {
            return false;
        }

        return !($config->bonus_un_par_etudiant && self::dejaBonifie($compte?->id));
    }

    /**
     * @return array{bonus: int, ratePercent: int, rate: float, capped: bool}
     */
    public static function pour(ConfigurationPlateforme $config, ?ComptePoints $compte, int $valeurReprise): array
    {
        if ($valeurReprise <= 0 || !self::eligible($config, $compte)) {
            return ['bonus' => 0, 'ratePercent' => 0, 'rate' => 0.0, 'capped' => false];
        }

        $ratePercent = min(self::TAUX_MAX_POURCENT, (int) round($config->bonus_taux * 100));
        $brut = (int) round(($valeurReprise * $ratePercent) / 100);
        $plafond = (int) ($config->bonus_plafond_points ?? 0);
        $bonus = $plafond > 0 ? min($brut, $plafond) : $brut;

        return [
            'bonus' => $bonus,
            'ratePercent' => $bonus > 0 ? $ratePercent : 0,
            'rate' => $bonus > 0 ? $ratePercent / 100 : 0.0,
            'capped' => $bonus < $brut,
        ];
    }

    public static function valider(int $ratePercent, int $quota, int $plafond): void
    {
        if ($ratePercent < 0 || $ratePercent > self::TAUX_MAX_POURCENT) {
            throw new RuleViolationException('bonus-taux', 'Le taux du bonus doit rester entre 0 et ' . self::TAUX_MAX_POURCENT . ' %.');
        }
        if ($quota < 0 || $quota > self::QUOTA_MAX) {
            throw new RuleViolationException('bonus-quota', 'Le nombre de dépôts bonifiés est limité à ' . self::QUOTA_MAX . '.');
        }
        if ($plafond < 0 || $plafond > self::PLAFOND_MAX) {
            throw new RuleViolationException('bonus-plafond', 'Le plafond par dépôt doit rester entre 0 et ' . number_format(self::PLAFOND_MAX, 0, ',', ' ') . ' points.');
        }
    }
}
