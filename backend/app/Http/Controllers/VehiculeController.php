<?php

namespace App\Http\Controllers;

use App\Models\Vehicule;
use Illuminate\Http\Request;

class VehiculeController extends Controller
{
    // Afficher tous les véhicules (optionnel - admin)
    public function index()
    {
        $vehicules = Vehicule::with('driverProfile')->get();
        return response()->json($vehicules);
    }

    // Afficher un véhicule par ID
    public function show($id)
    {
        $vehicule = Vehicule::with('driverProfile')->find($id);

        if (!$vehicule) {
            return response()->json(['message' => 'Véhicule introuvable'], 404);
        }

        return response()->json($vehicule);
    }

    // Créer un nouveau véhicule
    public function store(Request $request)
    {
        $validated = $request->validate([
            'driver_profile_id' => 'required|exists:driver_profiles,id',
            'marque' => 'required|string',
            'modele' => 'required|string',
            'annee' => 'required|integer',
            'couleur' => 'required|string',
            'numero_plaque' => 'required|string|unique:vehicules,numero_plaque',
            'numero_assurance' => 'required|string',
            'date_expiration_assurance' => 'required|date',
            'statut' => 'in:ACTIF,MAINTENANCE,INACTIF',
        ]);

        $vehicule = Vehicule::create($validated);

        return response()->json($vehicule, 201);
    }

    // Modifier un véhicule
    public function update(Request $request, $id)
    {
        $vehicule = Vehicule::find($id);

        if (!$vehicule) {
            return response()->json(['message' => 'Véhicule non trouvé'], 404);
        }

        $validated = $request->validate([
            'marque' => 'sometimes|string',
            'modele' => 'sometimes|string',
            'annee' => 'sometimes|integer',
            'couleur' => 'sometimes|string',
            'numero_plaque' => 'sometimes|string|unique:vehicules,numero_plaque,' . $id,
            'numero_assurance' => 'sometimes|string',
            'date_expiration_assurance' => 'sometimes|date',
            'statut' => 'in:ACTIF,MAINTENANCE,INACTIF',
        ]);

        $vehicule->update($validated);

        return response()->json($vehicule);
    }

    // Supprimer un véhicule (optionnel)
    public function destroy($id)
    {
        $vehicule = Vehicule::find($id);

        if (!$vehicule) {
            return response()->json(['message' => 'Véhicule non trouvé'], 404);
        }

        $vehicule->delete();

        return response()->json(['message' => 'Véhicule supprimé']);
    }
}
