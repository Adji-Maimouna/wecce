<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Expertise extends Model
{
    use HasUuids;

    protected $table = 'expertise';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'depot_id',
        'agent_id',
        'realisee_le',
        'etat_constate',
        'batterie_pourcent',
        'numero_serie_saisi',
        'valeur_reprise',
        'prix_affichage',
        'decision',
        'motif_refus',
        'commentaire',
        'controles',
        'mode_reprise',
        'contrepartie_libelle',
        'contrepartie_annonce_id',
    ];

    protected function casts(): array
    {
        return [
            'batterie_pourcent' => 'integer',
            'valeur_reprise' => 'integer',
            'prix_affichage' => 'integer',
            'controles' => 'array',
        ];
    }

    public function depot(): BelongsTo
    {
        return $this->belongsTo(Depot::class, 'depot_id', 'id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id', 'id');
    }

    public function renoncement(): HasOne
    {
        return $this->hasOne(Renoncement::class, 'expertise_id', 'id');
    }
}
