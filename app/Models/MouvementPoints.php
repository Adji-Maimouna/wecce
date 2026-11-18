<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MouvementPoints extends Model
{
    use HasUuids;

    protected $table = 'mouvement_points';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'compte_id',
        'type',
        'montant',
        'taux_applique',
        'periode_fonte',
        'solde_apres',
        'libelle',
        'effectue_le',
        'effectue_par',
        'renoncement_id',
        'acquisition_id',
    ];

    protected function casts(): array
    {
        return [
            'montant' => 'integer',
            'taux_applique' => 'float',
            'solde_apres' => 'integer',
        ];
    }

    public function compte(): BelongsTo
    {
        return $this->belongsTo(ComptePoints::class, 'compte_id', 'id');
    }
}
