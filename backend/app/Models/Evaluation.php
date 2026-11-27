<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Evaluation extends Model
{
    use HasFactory;

    protected $fillable = [
        'course_id',            // la course évaluée
        'driver_profile_id',    // le chauffeur évalué
        'rating',               // note (par exemple entre 1 et 5)
        'comment',              // commentaire facultatif
    ];

    // Relation vers la course
    public function course()
    {
        return $this->belongsTo(Course::class);
    }

    // Relation vers le chauffeur évalué
    public function driverProfile()
    {
        return $this->belongsTo(DriverProfile::class);
    }
}
