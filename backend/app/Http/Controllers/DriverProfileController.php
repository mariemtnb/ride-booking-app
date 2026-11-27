<?php

namespace App\Http\Controllers;

use App\Models\DriverProfile;
use Illuminate\Http\Request;

class DriverProfileController extends Controller
{
    // Afficher tous les profils de chauffeurs
    public function index()
    {
        $drivers = DriverProfile::with('user')->get();
        return response()->json($drivers);
    }

    // Afficher un chauffeur par ID
    public function show($id)
    {
        $driver = DriverProfile::with('user')->find($id);

        if (!$driver) {
            return response()->json(['message' => 'Chauffeur non trouvé'], 404);
        }

        return response()->json($driver);
    }

    // Créer un nouveau profil chauffeur
    public function store(Request $request)
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'license_number' => 'required|string|unique:driver_profiles,license_number',
            'phone_number' => 'nullable|string',
            'car_model' => 'nullable|string',
            'car_plate' => 'nullable|string',
            'status' => 'in:EN_LIGNE,HORS_LIGNE,EN_COURSE,INACTIF',
        ]);

        $driver = DriverProfile::create($validated);

        return response()->json($driver, 201);
    }

    // Mettre à jour un profil
    public function update(Request $request, $id)
    {
        $driver = DriverProfile::find($id);

        if (!$driver) {
            return response()->json(['message' => 'Chauffeur non trouvé'], 404);
        }

        $validated = $request->validate([
            'license_number' => 'sometimes|string|unique:driver_profiles,license_number,' . $id,
            'phone_number' => 'nullable|string',
            'car_model' => 'nullable|string',
            'car_plate' => 'nullable|string',
            'status' => 'in:EN_LIGNE,HORS_LIGNE,EN_COURSE,INACTIF',
        ]);

        $driver->update($validated);

        return response()->json($driver);
    }

    // Supprimer un chauffeur
    public function destroy($id)
    {
        $driver = DriverProfile::find($id);

        if (!$driver) {
            return response()->json(['message' => 'Chauffeur non trouvé'], 404);
        }

        $driver->delete();

        return response()->json(['message' => 'Chauffeur supprimé']);
    }
}
