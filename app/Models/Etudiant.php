<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Etudiant extends Model
{
    protected $table = 'etudiant';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'numero_carte',
        'niveau',
        'ufr',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }

    public function comptePoints(): HasOne
    {
        return $this->hasOne(ComptePoints::class, 'etudiant_id', 'id');
    }

    public function depots(): HasMany
    {
        return $this->hasMany(Depot::class, 'etudiant_id', 'id');
    }

    public function acquisitions(): HasMany
    {
        return $this->hasMany(Acquisition::class, 'etudiant_id', 'id');
    }

    public function studyLabel(): string
    {
        $parts = array_filter([$this->niveau, $this->ufr]);
        return count($parts) ? implode(' · ', $parts) : "Étudiant de l'UGB";
    }
}
