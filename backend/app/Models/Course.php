<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Course extends Model
{
    use HasFactory;

    protected $fillable = [
    'user_id',
    'driver_profile_id',
    'start_latitude',
    'start_longitude',
    'end_latitude',
    'end_longitude',
    'prix',      // <-- ici (pas price)
    'statut',    // <-- ici (pas status)
    'start_time',
    'end_time',
];


    // Relation vers l'utilisateur client
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    // Relation vers le profil du chauffeur
    public function driverProfile()
    {
        return $this->belongsTo(DriverProfile::class);
    }

    // Relation vers les évaluations
    public function evaluations()
    {
        return $this->hasMany(Evaluation::class);
    }

    public function positions()
{
    return $this->hasMany(Position::class);
}

public function notifications()
{
    return $this->hasMany(Notification::class);
}


}
