<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Position extends Model
{
    use HasFactory;

    protected $fillable = [
        'driver_profile_id',
        'course_id',
        'latitude',
        'longitude',
        'vitesse',
        'timestamp',
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    // Relation avec le chauffeur
    public function driverProfile()
    {
        return $this->belongsTo(DriverProfile::class);
    }

    // Relation avec la course (optionnelle)
    public function course()
    {
        return $this->belongsTo(Course::class);
    }
}
