<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Koperasi extends Model
{
    protected $fillable = ['nama', 'wilayah', 'lat', 'lng', 'no_telp'];

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    public function transaksis(): HasMany
    {
        return $this->hasMany(Transaksi::class);
    }
}
