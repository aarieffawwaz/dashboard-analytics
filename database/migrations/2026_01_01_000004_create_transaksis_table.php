<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('transaksis', function (Blueprint $table) {
            $table->id();
            $table->foreignId('koperasi_id')->constrained()->cascadeOnDelete();
            $table->foreignId('produk_id')->constrained()->cascadeOnDelete();
            $table->enum('tipe', ['beli', 'jual']);
            $table->string('nama_pihak');
            $table->decimal('volume', 12, 2);
            $table->string('satuan');
            $table->decimal('harga_satuan', 14, 2);
            $table->decimal('total', 16, 2);
            $table->date('tanggal');
            $table->timestamps();

            $table->index(['koperasi_id', 'produk_id', 'tipe']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('transaksis');
    }
};
