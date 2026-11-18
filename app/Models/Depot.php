<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Depot extends Model
{
    use HasUuids;

    protected $table = 'depot';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'reference',
        'etudiant_id',
        'appareil_id',
        'prix_souhaite',
        'nb_photos_declarees',
        'date_rendez_vous',
        'statut',
        'cree_le',
        'cloture_le',
        'disponibilites',
        'rdv_fixe_le',
        'rdv_fixe_par',
    ];

    protected function casts(): array
    {
        return [
            'prix_souhaite' => 'integer',
            'nb_photos_declarees' => 'integer',
            'disponibilites' => 'array',
        ];
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id', 'id');
    }

    public function appareil(): BelongsTo
    {
        return $this->belongsTo(Appareil::class, 'appareil_id', 'id');
    }

    public function expertise(): HasOne
    {
        return $this->hasOne(Expertise::class, 'depot_id', 'id');
    }

    public function annonce(): HasOne
    {
        return $this->hasOne(Annonce::class, 'depot_origine_id', 'id');
    }
}
