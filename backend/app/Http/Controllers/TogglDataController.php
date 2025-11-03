<?php

namespace App\Http\Controllers;

use App\Models\TogglAccount;
use App\Services\TogglService;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Validator;

class TogglDataController extends Controller
{
    private TogglService $togglService;

    public function __construct(TogglService $togglService)
    {
        $this->togglService = $togglService;
    }

    public function getWorkspaces(int $accountId): JsonResponse
    {
        $account = TogglAccount::findOrFail($accountId);
        
        try {
            $workspaces = $this->togglService->getWorkspaces($account->api_token);
            return response()->json($workspaces);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getClients(int $accountId, int $workspaceId): JsonResponse
    {
        $account = TogglAccount::findOrFail($accountId);
        
        try {
            $clients = $this->togglService->getClients($workspaceId, $account->api_token);
            return response()->json($clients);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getProjects(int $accountId, int $workspaceId, Request $request): JsonResponse
    {
        $account = TogglAccount::findOrFail($accountId);
        $clientId = $request->query('client_id');
        
        try {
            $projects = $this->togglService->getProjects(
                $workspaceId,
                $account->api_token,
                $clientId ? (int)$clientId : null
            );
            return response()->json($projects);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getTags(int $accountId, int $workspaceId): JsonResponse
    {
        $account = TogglAccount::findOrFail($accountId);
        
        try {
            $tags = $this->togglService->getTags($workspaceId, $account->api_token);
            return response()->json($tags);
        } catch (\Exception $e) {
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function getTimeEntries(Request $request): JsonResponse
    {
        $validator = Validator::make($request->all(), [
            'accounts' => 'required|array|min:1',
            'accounts.*.account_id' => 'required|integer|exists:toggl_accounts,id',
            'accounts.*.workspace_id' => 'required|integer',
            'start_date' => 'required|date',
            'end_date' => 'required|date',
        ]);

        if ($validator->fails()) {
            return response()->json(['errors' => $validator->errors()], 422);
        }

        $allEntries = [];

        foreach ($request->accounts as $accountConfig) {
            $account = TogglAccount::findOrFail($accountConfig['account_id']);
            
            try {
                $entries = $this->togglService->getTimeEntriesWithDetails(
                    $account,
                    $accountConfig['workspace_id'],
                    $request->start_date,
                    $request->end_date,
                    $accountConfig['client_id'] ?? null,
                    $accountConfig['project_id'] ?? null,
                    $accountConfig['tag_id'] ?? null
                );

                $allEntries = array_merge($allEntries, $entries);
            } catch (\Exception $e) {
                // Continuar con otras cuentas aunque una falle
                continue;
            }
        }

        return response()->json($allEntries);
    }
}
