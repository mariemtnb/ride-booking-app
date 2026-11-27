<?php

namespace App\Http\Controllers;

use App\Models\Notification;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class NotificationController extends Controller
{
    // Liste toutes les notifications d'un utilisateur avec pagination et filtres
    public function index(Request $request): JsonResponse
    {
        $user = $request->user();
        $query = Notification::where('user_id', $user->id);

        // Filtres optionnels
        if ($request->has('type')) {
            $query->where('type', $request->type);
        }

        if ($request->has('lu')) {
            $query->where('lu', $request->boolean('lu'));
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        // Tri par priorité puis par date
        $notifications = $query->orderByRaw('FIELD(priority, "urgent", "high", "medium", "low")')
                              ->orderBy('created_at', 'desc')
                              ->paginate($request->get('per_page', 15));

        return response()->json($notifications);
    }

    // Obtenir le nombre de notifications non lues
    public function getUnreadCount(Request $request): JsonResponse
    {
        $user = $request->user();
        $count = Notification::where('user_id', $user->id)
                           ->where('lu', false)
                           ->count();

        return response()->json(['unread_count' => $count]);
    }

    // Marquer une notification comme lue
    public function markAsRead($id): JsonResponse
    {
        $user = Auth::user();
        $notification = Notification::where('id', $id)
                                  ->where('user_id', $user->id)
                                  ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification introuvable'], 404);
        }

        $notification->update([
            'lu' => true,
            'date_lecture' => now()
        ]);

        return response()->json([
            'message' => 'Notification marquée comme lue',
            'notification' => $notification
        ]);
    }

    // Marquer toutes les notifications comme lues
    public function markAllAsRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $updated = Notification::where('user_id', $user->id)
                             ->where('lu', false)
                             ->update([
                                 'lu' => true,
                                 'date_lecture' => now()
                             ]);

        return response()->json([
            'message' => "$updated notifications marquées comme lues",
            'updated_count' => $updated
        ]);
    }

    // Supprimer une notification
    public function destroy($id): JsonResponse
    {
        $user = Auth::user();
        $notification = Notification::where('id', $id)
                                  ->where('user_id', $user->id)
                                  ->first();

        if (!$notification) {
            return response()->json(['message' => 'Notification introuvable'], 404);
        }

        $notification->delete();

        return response()->json(['message' => 'Notification supprimée avec succès']);
    }

    // Supprimer toutes les notifications lues
    public function deleteRead(Request $request): JsonResponse
    {
        $user = $request->user();
        $deleted = Notification::where('user_id', $user->id)
                             ->where('lu', true)
                             ->delete();

        return response()->json([
            'message' => "$deleted notifications supprimées",
            'deleted_count' => $deleted
        ]);
    }

    // Créer une notification avec validation améliorée
    public function store(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'user_id' => 'required|exists:users,id',
            'course_id' => 'nullable|exists:courses,id',
            'type' => 'required|in:nouvelle_course,course_acceptee,course_en_cours,course_terminee,course_annulee,paiement,evaluation,promotion,maintenance,urgence',
            'titre' => 'required|string|max:255',
            'message' => 'nullable|string|max:1000',
            'priority' => 'nullable|in:low,medium,high,urgent',
            'date_envoi' => 'nullable|date',
            'expires_at' => 'nullable|date|after:now',
            'action_url' => 'nullable|url',
            'metadata' => 'nullable|array'
        ]);

        // Définir la priorité par défaut selon le type
        if (!isset($validated['priority'])) {
            $validated['priority'] = $this->getDefaultPriority($validated['type']);
        }

        $notification = Notification::create($validated);

        // Envoyer notification en temps réel si nécessaire
        $this->sendRealTimeNotification($notification);

        return response()->json($notification, 201);
    }

    // Obtenir les statistiques des notifications
    public function getStats(Request $request): JsonResponse
    {
        $user = $request->user();
        $stats = [
            'total' => Notification::where('user_id', $user->id)->count(),
            'unread' => Notification::where('user_id', $user->id)->where('lu', false)->count(),
            'urgent' => Notification::where('user_id', $user->id)->where('priority', 'urgent')->where('lu', false)->count(),
            'today' => Notification::where('user_id', $user->id)->whereDate('created_at', today())->count(),
            'this_week' => Notification::where('user_id', $user->id)->whereBetween('created_at', [now()->startOfWeek(), now()->endOfWeek()])->count()
        ];

        return response()->json($stats);
    }

    // Méthode privée pour définir la priorité par défaut
    private function getDefaultPriority(string $type): string
    {
        $priorities = [
            'urgence' => 'urgent',
            'course_annulee' => 'high',
            'paiement' => 'high',
            'nouvelle_course' => 'medium',
            'course_acceptee' => 'medium',
            'course_en_cours' => 'medium',
            'course_terminee' => 'low',
            'evaluation' => 'low',
            'promotion' => 'low',
            'maintenance' => 'medium'
        ];

        return $priorities[$type] ?? 'medium';
    }

    // Méthode privée pour envoyer des notifications en temps réel
    private function sendRealTimeNotification(Notification $notification): void
    {
        // Ici on pourrait intégrer Pusher, WebSockets, ou Firebase
        // Pour l'instant, on log juste l'événement
        Log::info('Notification en temps réel envoyée', [
            'user_id' => $notification->user_id,
            'type' => $notification->type,
            'priority' => $notification->priority
        ]);
    }
}
