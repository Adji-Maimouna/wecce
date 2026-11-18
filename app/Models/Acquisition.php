<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Acquisition extends Model
{
    use HasUuids;

    protected $table = 'acquisition';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'reference',
        'annonce_id',
        'etudiant_id',
        'moyen_paiement',
        'prix_total',
        'points_debites',
        'complement_du',
        'statut',
        'cree_le',
        'confirme_le',
        'retire_le',
        'garantie_jusquau',
        'valide_le',
        'valide_par',
        'remis_par',
        'motif_refus',
    ];

    protected function casts(): array
    {
        return [
            'prix_total' => 'integer',
            'points_debites' => 'integer',
            'complement_du' => 'integer',
        ];
    }

    public function annonce(): BelongsTo
    {
        return $this->belongsTo(Annonce::class, 'annonce_id', 'id');
    }

    public function etudiant(): BelongsTo
    {
        return $this->belongsTo(Etudiant::class, 'etudiant_id', 'id');
    }

    public function paiements(): HasMany
    {
        return $this->hasMany(Paiement::class, 'acquisition_id', 'id');
    }
}
