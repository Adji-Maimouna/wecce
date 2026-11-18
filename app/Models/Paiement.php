<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Paiement extends Model
{
    use HasUuids;

    protected $table = 'paiement';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'acquisition_id',
        'moyen',
        'montant_fcfa',
        'commission_fcfa',
        'reference',
        'telephone',
        'statut',
        'cree_le',
        'confirme_le',
    ];

    protected function casts(): array
    {
        return [
            'montant_fcfa' => 'integer',
            'commission_fcfa' => 'integer',
        ];
    }

    public function acquisition(): BelongsTo
    {
        return $this->belongsTo(Acquisition::class, 'acquisition_id', 'id');
    }
}
