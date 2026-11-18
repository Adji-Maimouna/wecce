<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Appareil extends Model
{
    use HasUuids;

    protected $table = 'appareil';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'categorie_code',
        'designation',
        'stockage',
        'precision',
        'numero_serie',
        'age_declare',
        'etat_declare',
        'etat_constate',
        'batterie_pourcent',
        'statut',
    ];

    protected function casts(): array
    {
        return [
            'batterie_pourcent' => 'integer',
        ];
    }

    public function photos(): HasMany
    {
        return $this->hasMany(Photo::class, 'appareil_id', 'id')->orderBy('ordre');
    }

    public function fullName(): string
    {
        $parts = array_filter([trim((string) $this->designation), trim((string) $this->stockage)]);
        return implode(' · ', $parts);
    }
}
