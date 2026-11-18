<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class ComptePoints extends Model
{
    use HasUuids;

    protected $table = 'compte_points';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'etudiant_id',
        'solde',
        'statut',
        'derniere_fonte_le',
        'dernier_mouvement_le',
    ];

    protected function casts(): array
    {
        return [
            'solde' => 'integer',
        ];
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id', 'id');
    }

    public function mouvements(): HasMany
    {
        return $this->hasMany(MouvementPoints::class, 'compte_id', 'id');
    }
}
