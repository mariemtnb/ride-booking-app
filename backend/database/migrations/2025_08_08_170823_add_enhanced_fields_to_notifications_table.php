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
        Schema::table('notifications', function (Blueprint $table) {
            // Ajouter la colonne de priorité
            $table->enum('priority', ['low', 'medium', 'high', 'urgent'])->default('medium')->after('message');
            
            // Ajouter la date de lecture
            $table->timestamp('date_lecture')->nullable()->after('lu');
            
            // Ajouter la date d'expiration
            $table->timestamp('expires_at')->nullable()->after('date_lecture');
            
            // Ajouter l'URL d'action
            $table->string('action_url')->nullable()->after('expires_at');
            
            // Ajouter les métadonnées JSON
            $table->json('metadata')->nullable()->after('action_url');
            
            // Ajouter un index sur la priorité pour les requêtes rapides
            $table->index(['user_id', 'priority']);
            
            // Ajouter un index sur les notifications non lues
            $table->index(['user_id', 'lu']);
            
            // Ajouter un index sur le type
            $table->index(['user_id', 'type']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('notifications', function (Blueprint $table) {
            // Supprimer les index
            $table->dropIndex(['user_id', 'priority']);
            $table->dropIndex(['user_id', 'lu']);
            $table->dropIndex(['user_id', 'type']);
            
            // Supprimer les colonnes
            $table->dropColumn([
                'priority',
                'date_lecture',
                'expires_at',
                'action_url',
                'metadata'
            ]);
        });
    }
};
