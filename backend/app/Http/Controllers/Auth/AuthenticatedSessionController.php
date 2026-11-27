<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\LoginRequest;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthenticatedSessionController extends Controller
{
    /**
     * Handle an incoming authentication request.
     */
    public function store(LoginRequest $request): JsonResponse
    {
        // Valide les champs email et mot de passe via LoginRequest
        $request->authenticate();

        // Si l'authentification échoue (juste au cas où)
        if (!Auth::check()) {
            return response()->json([
                'message' => 'Email ou mot de passe incorrect.'
            ], 401);
        }

        // Utilisateur authentifié
        $user = $request->user();

        // Génère un token d'accès
        $token = $user->createToken('api-token')->plainTextToken;

        // Retourne le user et le token
        return response()->json([
            'user' => $user,
            'access_token' => $token,
            'token_type' => 'Bearer',
        ]);
    }

    /**
     * Destroy an authenticated session (logout).
     */
    public function destroy(Request $request): JsonResponse
    {
        // Supprime le token actuel (déconnexion)
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => 'Déconnexion réussie.',
        ]);
    }
}
