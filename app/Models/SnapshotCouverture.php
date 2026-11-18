<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class SnapshotCouverture extends Model
{
    use HasUuids;

    protected $table = 'snapshot_couverture';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'arrete_le',
        'dette_en_points',
        'valeur_stock',
        'nb_objets_en_stock',
        'taux_couverture',
        'niveau',
        'evenement',
    ];

    protected function casts(): array
    {
        return [
            'dette_en_points' => 'integer',
            'valeur_stock' => 'integer',
            'nb_objets_en_stock' => 'integer',
            'taux_couverture' => 'float',
        ];
    }
}
