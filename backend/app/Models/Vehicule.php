<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vehicule extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_profile_id',
        'marque',
        'modele',
        'annee',
        'couleur',
        'numero_plaque',
        'numero_assurance',
        'date_expiration_assurance',
        'statut',
    ];

    protected $casts = [
        'date_expiration_assurance' => 'date',
    ];

    // Relation avec le conducteur
    public function driverProfile()
    {
        return $this->belongsTo(DriverProfile::class);
    }

    // Méthode métier optionnelle
    public function isValide(): bool
    {
        return $this->date_expiration_assurance && $this->date_expiration_assurance->isFuture();
    }
}
