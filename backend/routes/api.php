<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;

// Contrôleurs métiers
use App\Http\Controllers\CourseController;
use App\Http\Controllers\DriverProfileController;
use App\Http\Controllers\EvaluationController;
use App\Http\Controllers\NotificationController;
use App\Http\Controllers\PositionController;
use App\Http\Controllers\VehiculeController;


use App\Http\Controllers\UserController;

// Contrôleurs d’authentification
use App\Http\Controllers\Auth\AuthenticatedSessionController;
use App\Http\Controllers\Auth\RegisteredUserController;
use App\Http\Controllers\Auth\PasswordResetLinkController;
use App\Http\Controllers\Auth\NewPasswordController;
use App\Http\Controllers\Auth\EmailVerificationNotificationController;
use App\Http\Controllers\Auth\VerifyEmailController;

// 🔓 Routes PUBLIQUES (auth)
Route::post('/register', [RegisteredUserController::class, 'store']);
Route::post('/login', [AuthenticatedSessionController::class, 'store']);
Route::post('/forgot-password', [PasswordResetLinkController::class, 'store']);
Route::post('/reset-password', [NewPasswordController::class, 'store']);

// 🔒 Route test utilisateur authentifié
Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return $request->user();
});

// 🔒 Routes PROTÉGÉES (auth:sanctum)
Route::middleware(['auth:sanctum'])->group(function () {

    // 🔐 Auth avancée
    Route::post('/logout', [AuthenticatedSessionController::class, 'destroy']);
    Route::post('/email/verification-notification', [EmailVerificationNotificationController::class, 'store']);
    Route::get('/verify-email/{id}/{hash}', VerifyEmailController::class)->name('verification.verify');


    Route::middleware('auth:sanctum')->get('/users', [UserController::class, 'index']);

    Route::middleware('auth:sanctum')->get('/user', function (Request $request) {
    return response()->json($request->user());
    });

    Route::middleware('auth:sanctum')->put('/user', [UserController::class, 'update']);
    Route::middleware('auth:sanctum')->get('/my-courses', [CourseController::class, 'myCourses']);



    // 📦 Courses
    Route::get('/courses', [CourseController::class, 'index']);
    Route::post('/courses', [CourseController::class, 'store']);
    Route::get('/courses/{id}', [CourseController::class, 'show']);
    Route::put('/courses/{id}', [CourseController::class, 'update']);
    Route::delete('/courses/{id}', [CourseController::class, 'destroy']);

    // 👨‍✈️ Driver Profiles
    Route::get('/drivers', [DriverProfileController::class, 'index']);
    Route::post('/drivers', [DriverProfileController::class, 'store']);
    Route::get('/drivers/{id}', [DriverProfileController::class, 'show']);
    Route::put('/drivers/{id}', [DriverProfileController::class, 'update']);
    Route::delete('/drivers/{id}', [DriverProfileController::class, 'destroy']);

    // ⭐ Evaluations
    Route::get('/evaluations', [EvaluationController::class, 'index']);
    Route::post('/evaluations', [EvaluationController::class, 'store']);
    Route::get('/evaluations/{id}', [EvaluationController::class, 'show']);
    Route::delete('/evaluations/{id}', [EvaluationController::class, 'destroy']);

    // 🔔 Notifications
    Route::get('/notifications', [NotificationController::class, 'index']);
    Route::get('/notifications/unread-count', [NotificationController::class, 'getUnreadCount']);
    Route::get('/notifications/stats', [NotificationController::class, 'getStats']);
    Route::post('/notifications', [NotificationController::class, 'store']);
    Route::put('/notifications/{id}/read', [NotificationController::class, 'markAsRead']);
    Route::put('/notifications/mark-all-read', [NotificationController::class, 'markAllAsRead']);
    Route::delete('/notifications/{id}', [NotificationController::class, 'destroy']);
    Route::delete('/notifications/delete-read', [NotificationController::class, 'deleteRead']);

    // 📍 Positions
    Route::get('/positions', [PositionController::class, 'index']); // ?driver_profile_id=1
    Route::post('/positions', [PositionController::class, 'store']);
    Route::delete('/positions/{id}', [PositionController::class, 'destroy']);

    // 🚗 Véhicules
    Route::get('/vehicules', [VehiculeController::class, 'index']);
    Route::post('/vehicules', [VehiculeController::class, 'store']);
    Route::get('/vehicules/{id}', [VehiculeController::class, 'show']);
    Route::put('/vehicules/{id}', [VehiculeController::class, 'update']);
    Route::delete('/vehicules/{id}', [VehiculeController::class, 'destroy']);
});
