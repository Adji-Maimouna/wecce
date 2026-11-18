<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Campus extends Model
{
    use HasUuids;

    protected $table = 'campus';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'code',
        'nom',
        'partenaire_nom',
        'partenaire_lieu',
        'actif',
        'cree_le',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }
}
