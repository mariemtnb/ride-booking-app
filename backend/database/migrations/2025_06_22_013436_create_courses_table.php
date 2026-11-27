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
       Schema::create('courses', function (Blueprint $table) {
            $table->id();
            $table->foreignId('user_id')->constrained()->onDelete('cascade'); // client
            $table->foreignId('driver_profile_id')->nullable()->constrained()->onDelete('set null'); // chauffeur
            $table->string('lieu_depart')->nullable();
            $table->double('start_latitude');
            $table->double('start_longitude');
            $table->string('lieu_arrivee')->nullable();
            $table->double('end_latitude');
            $table->double('end_longitude');
            $table->double('distance_km')->nullable();
            $table->double('prix')->default(0);
            $table->string('statut')->default('EN_ATTENTE'); // CourseStatus
            $table->timestamp('heure_demande')->nullable();
            $table->timestamp('heure_acceptation')->nullable();
            $table->timestamp('heure_debut')->nullable();
            $table->timestamp('heure_fin')->nullable();
            $table->string('mode_paiement')->default('ESPECES'); // ModePaiement
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('courses');
    }
};
