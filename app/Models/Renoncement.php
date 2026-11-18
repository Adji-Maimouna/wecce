<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Renoncement extends Model
{
    use HasUuids;

    protected $table = 'renoncement';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'expertise_id',
        'agent_id',
        'signe_le',
        'lieu',
        'numero_serie_constate',
        'valeur_cedee',
        'prix_affichage',
        'bonus_accorde',
        'bonus_taux',
        'solde_avant',
        'signature_image',
        'empreinte',
    ];

    protected function casts(): array
    {
        return [
            'valeur_cedee' => 'integer',
            'prix_affichage' => 'integer',
            'bonus_accorde' => 'integer',
            'bonus_taux' => 'float',
            'solde_avant' => 'integer',
        ];
    }

    public function expertise(): BelongsTo
    {
        return $this->belongsTo(Expertise::class, 'expertise_id', 'id');
    }

    public function agent(): BelongsTo
    {
        return $this->belongsTo(Agent::class, 'agent_id', 'id');
    }
}
