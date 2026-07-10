<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MinatBeli extends Model
{
    protected $fillable = [
        'koperasi_id', 'produk_id', 'nama_buyer', 'kontak_wa',
        'volume_diminati', 'status',
    ];

    public function koperasi(): BelongsTo
    {
        return $this->belongsTo(Koperasi::class);
    }

    public function produk(): BelongsTo
    {
        return $this->belongsTo(Produk::class);
    }
}
