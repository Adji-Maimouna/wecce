<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class Photo extends Model
{
    use HasUuids;

    protected $table = 'photo';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'appareil_id',
        'url',
        'alt',
        'largeur',
        'hauteur',
        'ordre',
    ];

    protected function casts(): array
    {
        return [
            'largeur' => 'integer',
            'hauteur' => 'integer',
            'ordre' => 'integer',
        ];
    }
}
