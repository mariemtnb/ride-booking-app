<?php

namespace App\Http\Controllers;

use App\Models\Evaluation;
use Illuminate\Http\Request;

class EvaluationController extends Controller
{
    // Afficher toutes les évaluations
    public function index()
    {
        $evaluations = Evaluation::with(['course', 'driverProfile'])->get();
        return response()->json($evaluations);
    }

    // Afficher une évaluation par ID
    public function show($id)
    {
        $evaluation = Evaluation::with(['course', 'driverProfile'])->find($id);

        if (!$evaluation) {
            return response()->json(['message' => 'Évaluation non trouvée'], 404);
        }

        return response()->json($evaluation);
    }

    // Créer une nouvelle évaluation
    public function store(Request $request)
    {
        $validated = $request->validate([
            'course_id' => 'required|exists:courses,id',
            'driver_profile_id' => 'nullable|exists:driver_profiles,id',
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'nullable|string',
            'date_evaluation' => 'nullable|date',
            'type_evaluateur' => 'required|in:UTILISATEUR,CONDUCTEUR',
        ]);

        $evaluation = Evaluation::create($validated);

        return response()->json($evaluation, 201);
    }

    // Supprimer une évaluation
    public function destroy($id)
    {
        $evaluation = Evaluation::find($id);

        if (!$evaluation) {
            return response()->json(['message' => 'Évaluation non trouvée'], 404);
        }

        $evaluation->delete();

        return response()->json(['message' => 'Évaluation supprimée']);
    }
}
