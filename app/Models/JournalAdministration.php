<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;

class JournalAdministration extends Model
{
    use HasUuids;

    protected $table = 'journal_administration';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'administrateur_id',
        'utilisateur_id',
        'auteur_libelle',
        'action',
        'cible_type',
        'cible_id',
        'cible_libelle',
        'changement',
        'avant',
        'apres',
        'motif',
        'effectue_le',
        'adresse_ip',
    ];

    protected function casts(): array
    {
        return [
            'avant' => 'array',
            'apres' => 'array',
        ];
    }
}
