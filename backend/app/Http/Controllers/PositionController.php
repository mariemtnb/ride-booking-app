<?php

namespace App\Http\Controllers;

use App\Models\Position;
use Illuminate\Http\Request;
use App\Models\Course;


class PositionController extends Controller
{
    // Récupérer les dernières positions d’un chauffeur
    public function index(Request $request)
    {
        $driverProfileId = $request->query('driver_profile_id');

        $positions = Position::where('driver_profile_id', $driverProfileId)
            ->latest('timestamp')
            ->limit(50)
            ->get();

        return response()->json($positions);
    }

    // Enregistrer une nouvelle position
    public function store(Request $request)
    {
        $validated = $request->validate([
            'driver_profile_id' => 'required|exists:driver_profiles,id',
            'course_id' => 'nullable|exists:courses,id',
            'latitude' => 'required|numeric',
            'longitude' => 'required|numeric',
            'vitesse' => 'nullable|numeric',
            'timestamp' => 'nullable|date',
        ]);

        $position = Position::create($validated);

        return response()->json($position, 201);
    }

    // Supprimer une position (optionnel)
    public function destroy($id)
    {
        $position = Position::find($id);

        if (!$position) {
            return response()->json(['message' => 'Position non trouvée'], 404);
        }

        $position->delete();

        return response()->json(['message' => 'Position supprimée']);
    }
}
