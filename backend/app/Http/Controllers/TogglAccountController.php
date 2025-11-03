<?php

namespace App\Http\Controllers;

use App\Models\TogglAccount;
use App\Services\TogglService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TogglAccountController extends Controller
{
    private TogglService $togglService;

    public function __construct(TogglService $togglService)
    {
        $this->togglService = $togglService;
    }

    public function index(): JsonResponse
    {
        $accounts = TogglAccount::all();
        return response()->json($accounts);
    }

    public function store(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'api_token' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        // Validar el token haciendo una petición a Toggl
        try {
            $this->togglService->getMe($request->api_token);
        } catch (\Exception $e) {
            return response()->json(['error' => 'Token de API inválido'], 422);
        }

        $account = TogglAccount::create([
            'name' => $request->name,
            'api_token' => $request->api_token,
        ]);

        return response()->json($account, 201);
    }

    public function destroy(int $id): JsonResponse
    {
        $account = TogglAccount::findOrFail($id);
        $account->delete();

        return response()->json(['message' => 'Cuenta eliminada correctamente']);
    }
}
