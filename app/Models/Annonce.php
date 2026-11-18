<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Annonce extends Model
{
    use HasUuids;

    protected $table = 'annonce';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'slug',
        'appareil_id',
        'origine',
        'depot_origine_id',
        'titre',
        'sous_titre',
        'mots_cles',
        'info',
        'controles',
        'examine_le',
        'prix_initial',
        'prix_courant',
        'derniere_fonte_le',
        'cree_le',
        'mise_en_ligne_le',
        'statut',
        'note_statut',
    ];

    protected function casts(): array
    {
        return [
            'prix_initial' => 'integer',
            'prix_courant' => 'integer',
            'controles' => 'array',
        ];
    }

    public function appareil(): BelongsTo
    {
        return $this->belongsTo(Appareil::class, 'appareil_id', 'id');
    }

    public function depotOrigine(): BelongsTo
    {
        return $this->belongsTo(Depot::class, 'depot_origine_id', 'id');
    }

    public function acquisitions(): HasMany
    {
        return $this->hasMany(Acquisition::class, 'annonce_id', 'id');
    }
}
