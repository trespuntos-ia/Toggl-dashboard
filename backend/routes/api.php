<?php

use App\Http\Controllers\TogglAccountController;
use App\Http\Controllers\TogglDataController;
use Illuminate\Support\Facades\Route;

Route::prefix('toggl')->group(function () {
    // Rutas para gestionar cuentas
    Route::get('/accounts', [TogglAccountController::class, 'index']);
    Route::post('/accounts', [TogglAccountController::class, 'store']);
    Route::delete('/accounts/{id}', [TogglAccountController::class, 'destroy']);

    // Rutas para obtener datos de Toggl
    Route::get('/accounts/{accountId}/workspaces', [TogglDataController::class, 'getWorkspaces']);
    Route::get('/accounts/{accountId}/workspaces/{workspaceId}/clients', [TogglDataController::class, 'getClients']);
    Route::get('/accounts/{accountId}/workspaces/{workspaceId}/projects', [TogglDataController::class, 'getProjects']);
    Route::get('/accounts/{accountId}/workspaces/{workspaceId}/tags', [TogglDataController::class, 'getTags']);
    Route::post('/time-entries', [TogglDataController::class, 'getTimeEntries']);
});
