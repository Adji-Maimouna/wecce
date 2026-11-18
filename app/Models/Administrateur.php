<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Administrateur extends Model
{
    protected $table = 'administrateur';
    protected $keyType = 'string';
    public $incrementing = false;
    public $timestamps = false;

    protected $fillable = [
        'id',
        'portee',
    ];

    public function utilisateur(): BelongsTo
    {
        return $this->belongsTo(User::class, 'id', 'id');
    }
}
