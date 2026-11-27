<?php

namespace App\Http\Controllers;

use App\Models\Course;
use Illuminate\Http\Request;
use App\Models\DriverProfile;
use App\Models\Notification;

class CourseController extends Controller
{
    public function index()
    {
        $courses = Course::all();
        return response()->json($courses);
    }

    public function show($id)
    {
        $course = Course::find($id);
        if (!$course) {
            return response()->json(['message' => 'Course non trouvée'], 404);
        }
        return response()->json($course);
    }

    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'start_latitude' => 'required|numeric',
            'start_longitude' => 'required|numeric',
            'end_latitude' => 'required|numeric',
            'end_longitude' => 'required|numeric',
            'statut' => 'nullable|string',
        ]);

        $distance = $this->calculateDistance(
            $validated['start_latitude'],
            $validated['start_longitude'],
            $validated['end_latitude'],
            $validated['end_longitude']
        );
        $prix = round($distance * 1.5, 2);

        $chauffeurDisponible = DriverProfile::where('status', 'EN_LIGNE')->first();

        if (!$chauffeurDisponible) {
            return response()->json(['message' => 'Aucun chauffeur disponible pour le moment.'], 409);
        }

        $course = Course::create([
            'user_id' => $validated['user_id'],
            'driver_profile_id' => $chauffeurDisponible->id,
            'start_latitude' => $validated['start_latitude'],
            'start_longitude' => $validated['start_longitude'],
            'end_latitude' => $validated['end_latitude'],
            'end_longitude' => $validated['end_longitude'],
            'distance_km' => $distance,
            'prix' => $prix,
            'statut' => $validated['statut'] ?? 'EN_ATTENTE',
        ]);

        $chauffeurDisponible->update(['status' => 'EN_COURSE']);

        // 🔔 Notification de création
        Notification::create([
            'user_id' => $validated['user_id'],
            'course_id' => $course->id,
            'type' => 'nouvelle_course',
            'titre' => 'Course créée avec succès',
            'message' => 'Votre course a été enregistrée avec un chauffeur assigné.',
            'date_envoi' => now(),
        ]);

        return response()->json([
            'message' => 'Course créée et chauffeur assigné avec succès',
            'course' => $course,
            'chauffeur' => $chauffeurDisponible->load('user')
        ], 201);
    }

    public function calculateDistance($lat1, $lon1, $lat2, $lon2)
    {
        $earthRadius = 6371;
        $dLat = deg2rad($lat2 - $lat1);
        $dLon = deg2rad($lon2 - $lon1);
        $a = sin($dLat / 2) * sin($dLat / 2) +
            cos(deg2rad($lat1)) * cos(deg2rad($lat2)) *
            sin($dLon / 2) * sin($dLon / 2);
        $c = 2 * atan2(sqrt($a), sqrt(1 - $a));
        return $earthRadius * $c;
    }

    public function myCourses(Request $request)
    {
        $user = $request->user();
        $courses = $user->courses()->with(['driverProfile.user'])->latest()->get();
        return response()->json($courses);
    }

  public function update(Request $request, $id)
{
    $course = Course::find($id);
    if (!$course) {
        return response()->json(['message' => 'Course non trouvée'], 404);
    }

    $validated = $request->validate([
        'start_latitude' => 'sometimes|numeric',
        'start_longitude' => 'sometimes|numeric',
        'end_latitude' => 'sometimes|numeric',
        'end_longitude' => 'sometimes|numeric',
        'statut' => 'sometimes|string',
    ]);

    $oldStatut = strtolower($course->statut);
    $newStatut = strtolower($validated['statut'] ?? $oldStatut); // on garde oldStatut si pas de nouveau

    // Mettre à jour la distance et le prix si coordonnées présentes
    if (isset($validated['start_latitude'], $validated['start_longitude'], $validated['end_latitude'], $validated['end_longitude'])) {
        $distance = $this->calculateDistance(
            $validated['start_latitude'],
            $validated['start_longitude'],
            $validated['end_latitude'],
            $validated['end_longitude']
        );
        $validated['distance_km'] = $distance;
        $validated['prix'] = round($distance * 1.5, 2);
    }

    $course->update($validated);
    $course->refresh();

    // 🔔 ANNULATION
    if ($oldStatut !== 'annulée' && $newStatut === 'annulée') {
        if ($course->driver_profile_id) {
            DriverProfile::where('id', $course->driver_profile_id)->update(['status' => 'EN_LIGNE']);
        }

        Notification::create([
            'user_id' => $course->user_id,
            'course_id' => $course->id,
            'type' => 'annulation',
            'titre' => 'Course annulée',
            'message' => 'Votre course a été annulée par le système.',
            'date_envoi' => now(),
        ]);
    }

    // 🔔 TERMINÉE
    if ($oldStatut !== 'terminée' && $newStatut === 'terminée') {
        Notification::create([
            'user_id' => $course->user_id,
            'course_id' => $course->id,
            'type' => 'terminee',
            'titre' => 'Course terminée',
            'message' => 'Merci d\'avoir utilisé notre service.',
            'date_envoi' => now(),
        ]);
    }

    return response()->json([
        'message' => 'Course mise à jour avec succès',
        'course' => $course
    ]);
}

}
