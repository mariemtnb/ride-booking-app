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
         Schema::create('evaluations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('course_id')->constrained()->onDelete('cascade');
            $table->foreignId('driver_profile_id')->nullable()->constrained()->onDelete('set null');
            $table->integer('rating');
            $table->text('comment')->nullable();
            $table->timestamp('date_evaluation')->nullable();
            $table->string('type_evaluateur')->default('UTILISATEUR'); // TypeEvaluateur
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('evaluations');
    }
};
