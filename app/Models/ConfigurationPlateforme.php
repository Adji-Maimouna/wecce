<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ConfigurationPlateforme extends Model
{
    protected $table = 'configuration_plateforme';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'campus_id',
        'depots_ouverts',
        'suspension_manuelle',
        'motif_suspension',
        'suspendu_le',
        'bonus_actif',
        'bonus_taux',
        'bonus_quota',
        'bonus_consomme',
        'taux_fonte',
        'seuil_surveillance',
        'seuil_suspension',
        'seuil_reouverture',
        'delai_retrait_jours',
        'duree_garantie_jours',
        'taux_commission',
        'derniere_fonte_le',
        'derniere_fonte_comptes',
        'derniere_fonte_annonces',
        'mis_a_jour_le',
        'mis_a_jour_par',
        'bonus_plafond_points',
        'bonus_un_par_etudiant',
    ];

    protected function casts(): array
    {
        return [
            'depots_ouverts' => 'boolean',
            'suspension_manuelle' => 'boolean',
            'bonus_actif' => 'boolean',
            'bonus_taux' => 'float',
            'bonus_quota' => 'integer',
            'bonus_consomme' => 'integer',
            'bonus_plafond_points' => 'integer',
            'bonus_un_par_etudiant' => 'boolean',
            'taux_fonte' => 'float',
            'seuil_surveillance' => 'float',
            'seuil_suspension' => 'float',
            'seuil_reouverture' => 'float',
            'delai_retrait_jours' => 'integer',
            'duree_garantie_jours' => 'integer',
            'taux_commission' => 'float',
            'derniere_fonte_comptes' => 'integer',
            'derniere_fonte_annonces' => 'integer',
        ];
    }

    public static function current(): self
    {
        return static::query()->findOrFail(1);
    }
}
