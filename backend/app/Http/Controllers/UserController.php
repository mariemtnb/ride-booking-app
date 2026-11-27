<?php

namespace App\Http\Controllers;
use App\Models\User;
use Illuminate\Http\Request;

class UserController extends Controller

{
    
public function index()
    {
        $users = User::all(['id', 'name', 'email']); // sélectionne seulement id, name, email
        return response()->json($users);
    }

public function update(Request $request)
{
    $user = $request->user();

    $validated = $request->validate([
        'name' => 'required|string|max:255',
        'email' => 'required|email|max:255|unique:users,email,' . $user->id,
        'phone_number' => 'nullable|string|max:20',
    ]);

    $user->update($validated);

    return response()->json($user);
}





}
