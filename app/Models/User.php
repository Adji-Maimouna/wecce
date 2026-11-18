<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Concerns\HasUuids;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;

class User extends Authenticatable
{
    use HasUuids, Notifiable;

    protected $table = 'utilisateur';
    public $timestamps = false;

    protected $fillable = [
        'id',
        'campus_id',
        'nom',
        'prenom',
        'email',
        'telephone',
        'mot_de_passe_hash',
        'remember_token',
        'role',
        'actif',
        'cree_le',
    ];

    protected $hidden = [
        'mot_de_passe_hash',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'actif' => 'boolean',
        ];
    }

    public function getAuthPasswordName(): string
    {
        return 'mot_de_passe_hash';
    }

    public function etudiant(): HasOne
    {
        return $this->hasOne(Etudiant::class, 'id', 'id');
    }

    public function agent(): HasOne
    {
        return $this->hasOne(Agent::class, 'id', 'id');
    }

    public function administrateur(): HasOne
    {
        return $this->hasOne(Administrateur::class, 'id', 'id');
    }

    public function shortName(): string
    {
        return $this->prenom . ' ' . mb_substr($this->nom, 0, 1, 'UTF-8') . '.';
    }

    public function initials(): string
    {
        return mb_strtoupper(
            mb_substr($this->prenom, 0, 1, 'UTF-8') . mb_substr($this->nom, 0, 1, 'UTF-8'),
            'UTF-8'
        );
    }

    public function auditSignature(?string $ip = null): string
    {
        $masked = '41.82.••.••';
        if ($ip && filter_var($ip, FILTER_VALIDATE_IP, FILTER_FLAG_IPV4)) {
            $parts = explode('.', $ip);
            if ($parts[0] !== '127') {
                $masked = "{$parts[0]}.{$parts[1]}.••.••";
            }
        }

        return mb_substr($this->prenom, 0, 1, 'UTF-8') . ". {$this->nom} · {$masked}";
    }
}
