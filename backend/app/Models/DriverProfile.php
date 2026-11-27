<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class DriverProfile extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',          // référence à l'utilisateur chauffeur
        'license_number',   // numéro de permis
        'phone_number',
        'car_model',
        'car_plate',
        'status',           // ex: 'disponible', 'occupé', 'indisponible'
        'rating',           // moyenne des évaluations
    ];

    // Relation vers l'utilisateur (chauffeur)
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation vers les courses assignées au chauffeur
    public function courses()
    {
        return $this->hasMany(Course::class);
    }

    // Relation vers les évaluations reçues
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function positions()
{
    return $this->hasMany(Position::class);
}

public function vehicule()
{
    return $this->hasOne(Vehicule::class);
}


}
