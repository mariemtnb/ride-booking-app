<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::create('vehicules', function (Blueprint $table) {
            $table->id();
            $table->foreignId('driver_profile_id')->constrained()->onDelete('cascade');
            $table->string('marque');
            $table->string('modele');
            $table->integer('annee');
            $table->string('couleur');
            $table->string('numero_plaque')->unique();
            $table->string('numero_assurance');
            $table->date('date_expiration_assurance');
            $table->string('statut')->default('ACTIF');
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('vehicules');
    }
};
