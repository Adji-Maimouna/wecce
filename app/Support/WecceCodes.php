<?php

namespace App\Support;

/**
 * Conversion bidirectionnelle des codes énumérés entre le front (camel/kebab minuscules)
 * et la base PostgreSQL (MAJUSCULES), conformément à GUIDE-FRONT-BACK.md section 3.
 */
final class WecceCodes
{
    public const CONDITION_TO_SQL = [
        'comme-neuf' => 'COMME_NEUF',
        'bon' => 'BON',
        'use' => 'USE',
        'fonctionnel' => 'FONCTIONNEL',
        'defectueux' => 'DEFECTUEUX',
    ];

    public const CONDITION_FROM_SQL = [
        'COMME_NEUF' => 'comme-neuf',
        'BON' => 'bon',
        'USE' => 'use',
        'FONCTIONNEL' => 'fonctionnel',
        'DEFECTUEUX' => 'defectueux',
    ];

    public const AGE_TO_SQL = [
        'moins-1' => 'MOINS_1AN',
        '1-2' => '1_2ANS',
        '2-3' => '2_3ANS',
        'plus-4' => 'PLUS_4ANS',
        'inconnu' => 'INCONNU',
    ];

    public const AGE_FROM_SQL = [
        'MOINS_1AN' => 'moins-1',
        '1_2ANS' => '1-2',
        '2_3ANS' => '2-3',
        'PLUS_4ANS' => 'plus-4',
        'INCONNU' => 'inconnu',
    ];

    public const DEPOSIT_STATUS_TO_SQL = [
        'brouillon' => 'BROUILLON',
        'demande-rdv' => 'RDV_DEMANDE',
        'rendez-vous' => 'RDV_PRIS',
        'a-signer' => 'EXPERTISE',
        'repris' => 'VALIDE',
        'refuse' => 'REFUSE',
        'annule' => 'ANNULE',
    ];

    public const DEPOSIT_STATUS_FROM_SQL = [
        'BROUILLON' => 'brouillon',
        'RDV_DEMANDE' => 'demande-rdv',
        'RDV_PRIS' => 'rendez-vous',
        'EXPERTISE' => 'a-signer',
        'VALIDE' => 'repris',
        'REFUSE' => 'refuse',
        'ANNULE' => 'annule',
    ];

    public const MOVEMENT_TO_SQL = [
        'reprise' => 'CREDIT_DEPOT',
        'bonus' => 'BONUS',
        'fonte' => 'FONTE',
        'acquisition' => 'DEBIT_RETRAIT',
        'ajustement' => 'AJUSTEMENT',
    ];

    public const MOVEMENT_FROM_SQL = [
        'CREDIT_DEPOT' => 'reprise',
        'BONUS' => 'bonus',
        'FONTE' => 'fonte',
        'DEBIT_RETRAIT' => 'acquisition',
        'AJUSTEMENT' => 'ajustement',
    ];

    public const PAYMENT_METHOD_TO_SQL = [
        'wave' => 'WAVE',
        'om' => 'ORANGE_MONEY',
        'especes' => 'ESPECES',
    ];

    public const PAYMENT_METHOD_FROM_SQL = [
        'WAVE' => 'wave',
        'ORANGE_MONEY' => 'om',
        'ESPECES' => 'especes',
    ];

    public const ORIGIN_TO_SQL = [
        'depot' => 'DEPOT_ETUDIANT',
        'boutique' => 'STOCK_PARTENAIRE',
    ];

    public const ORIGIN_FROM_SQL = [
        'DEPOT_ETUDIANT' => 'depot',
        'STOCK_PARTENAIRE' => 'boutique',
    ];

    public const STOCK_STATUS_TO_SQL = [
        'a-photographier' => 'A_PHOTOGRAPHIER',
        'en-ligne' => 'EN_LIGNE',
        'reserve' => 'RESERVEE',
        'remis' => 'VENDUE',
        'retire' => 'RETIREE',
    ];

    public const STOCK_STATUS_FROM_SQL = [
        'A_PHOTOGRAPHIER' => 'a-photographier',
        'EN_LIGNE' => 'en-ligne',
        'RESERVEE' => 'reserve',
        'VENDUE' => 'remis',
        'RETIREE' => 'retire',
    ];

    public const ADMIN_ACTION_TO_SQL = [
        'ajustement' => 'AJUSTEMENT_POINTS',
        'suspension' => 'SUSPENSION',
        'reprise' => 'REPRISE',
        'retrait' => 'RETRAIT_ANNONCE',
        'configuration' => 'CONFIGURATION',
    ];

    public const ADMIN_ACTION_FROM_SQL = [
        'AJUSTEMENT_POINTS' => 'ajustement',
        'SUSPENSION' => 'suspension',
        'REPRISE' => 'reprise',
        'RETRAIT_ANNONCE' => 'retrait',
        'CONFIGURATION' => 'configuration',
        'CATEGORIE' => 'configuration',
        'COMPTE' => 'configuration',
    ];

    public const CATEGORY_NAME = [
        'tel' => 'Téléphone',
        'ordi' => 'Ordinateur',
        'tab' => 'Tablette',
        'audio' => 'Audio',
        'piece' => 'Pièce',
    ];

    public const AGE_NAME = [
        'moins-1' => "moins d'un an",
        '1-2' => '1 à 2 ans',
        '2-3' => '2 à 3 ans',
        'plus-4' => 'plus de 4 ans',
        'inconnu' => 'âge inconnu',
    ];

    public const CONDITION_NAME = [
        'comme-neuf' => 'comme neuf',
        'bon' => 'bon état',
        'use' => 'usé',
        'fonctionnel' => 'fonctionnel',
        'defectueux' => 'défectueux',
    ];

    public const REFUSAL_SHORT = [
        'ecran' => 'écran',
        'compte' => 'compte lié',
        'batterie' => 'batterie',
        'modele' => 'modèle',
    ];

    public static function num(int|float $n): string
    {
        return number_format((int) round($n), 0, ',', "\u{202F}");
    }
}
