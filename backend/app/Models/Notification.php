<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Builder;
use Carbon\Carbon;

class Notification extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',          // Peut être l'utilisateur ou le conducteur (lié à user)
        'course_id',        // Facultatif, notification liée à une course
        'type',             // TypeNotification (enum ou string)
        'titre',
        'message',
        'lu',
        'date_envoi',
        'date_lecture',     // Quand la notification a été lue
        'priority',         // Priorité: low, medium, high, urgent
        'expires_at',       // Date d'expiration de la notification
        'action_url',       // URL d'action pour la notification
        'metadata',         // Données supplémentaires en JSON
    ];

    protected $casts = [
        'lu' => 'boolean',
        'date_envoi' => 'datetime',
        'date_lecture' => 'datetime',
        'expires_at' => 'datetime',
        'metadata' => 'array',
    ];

    // Types de notifications disponibles
    public const TYPES = [
        'nouvelle_course' => 'Nouvelle course',
        'course_acceptee' => 'Course acceptée',
        'course_en_cours' => 'Course en cours',
        'course_terminee' => 'Course terminée',
        'course_annulee' => 'Course annulée',
        'paiement' => 'Paiement',
        'evaluation' => 'Évaluation',
        'promotion' => 'Promotion',
        'maintenance' => 'Maintenance',
        'urgence' => 'Urgence'
    ];

    // Niveaux de priorité
    public const PRIORITIES = [
        'low' => 'Faible',
        'medium' => 'Moyenne',
        'high' => 'Élevée',
        'urgent' => 'Urgente'
    ];

    // Relation avec l'utilisateur (ou conducteur via user_id)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation avec une course (facultatif)
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    // Scopes pour filtrer les notifications
    public function scopeUnread(Builder $query): Builder
    {
        return $query->where('lu', false);
    }

    public function scopeRead(Builder $query): Builder
    {
        return $query->where('lu', true);
    }

    public function scopeByPriority(Builder $query, string $priority): Builder
    {
        return $query->where('priority', $priority);
    }

    public function scopeUrgent(Builder $query): Builder
    {
        return $query->where('priority', 'urgent');
    }

    public function scopeNotExpired(Builder $query): Builder
    {
        return $query->where(function ($q) {
            $q->whereNull('expires_at')
              ->orWhere('expires_at', '>', now());
        });
    }

    public function scopeExpired(Builder $query): Builder
    {
        return $query->whereNotNull('expires_at')
                    ->where('expires_at', '<=', now());
    }

    public function scopeByType(Builder $query, string $type): Builder
    {
        return $query->where('type', $type);
    }

    public function scopeToday(Builder $query): Builder
    {
        return $query->whereDate('created_at', today());
    }

    public function scopeThisWeek(Builder $query): Builder
    {
        return $query->whereBetween('created_at', [
            now()->startOfWeek(),
            now()->endOfWeek()
        ]);
    }

    // Accesseurs et mutateurs
    public function getIsExpiredAttribute(): bool
    {
        return $this->expires_at && $this->expires_at->isPast();
    }

    public function getIsUrgentAttribute(): bool
    {
        return $this->priority === 'urgent';
    }

    public function getTypeDisplayAttribute(): string
    {
        return self::TYPES[$this->type] ?? $this->type;
    }

    public function getPriorityDisplayAttribute(): string
    {
        return self::PRIORITIES[$this->priority] ?? $this->priority;
    }

    public function getPriorityColorAttribute(): string
    {
        $colors = [
            'low' => 'text-gray-500',
            'medium' => 'text-blue-500',
            'high' => 'text-orange-500',
            'urgent' => 'text-red-500'
        ];

        return $colors[$this->priority] ?? 'text-gray-500';
    }

    public function getPriorityBadgeAttribute(): string
    {
        $badges = [
            'low' => 'bg-gray-100 text-gray-800',
            'medium' => 'bg-blue-100 text-blue-800',
            'high' => 'bg-orange-100 text-orange-800',
            'urgent' => 'bg-red-100 text-red-800'
        ];

        return $badges[$this->priority] ?? 'bg-gray-100 text-gray-800';
    }

    // Méthodes utilitaires
    public function markAsRead(): bool
    {
        return $this->update([
            'lu' => true,
            'date_lecture' => now()
        ]);
    }

    public function isReadBy(User $user): bool
    {
        return $this->user_id === $user->id && $this->lu;
    }

    public function canBeDeletedBy(User $user): bool
    {
        return $this->user_id === $user->id;
    }

    // Boot method pour définir des valeurs par défaut
    protected static function boot()
    {
        parent::boot();

        static::creating(function ($notification) {
            if (!$notification->priority) {
                $notification->priority = 'medium';
            }
            if (!$notification->date_envoi) {
                $notification->date_envoi = now();
            }
        });
    }
}
