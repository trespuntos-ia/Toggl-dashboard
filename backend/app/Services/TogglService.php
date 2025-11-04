<?php

namespace App\Services;

use App\Models\TogglAccount;
use GuzzleHttp\Client;
use GuzzleHttp\Exception\GuzzleException;
use Illuminate\Support\Facades\Log;

class TogglService
{
    private Client $client;
    private string $baseUrl = 'https://api.track.toggl.com/api/v9';

    public function __construct()
    {
        $this->client = new Client([
            'base_uri' => $this->baseUrl,
            'timeout' => 30,
        ]);
    }

    private function makeRequest(string $method, string $endpoint, string $apiToken, array $params = []): array
    {
        try {
            $options = [
                'auth' => [$apiToken, 'api_token'],
                'headers' => [
                    'Content-Type' => 'application/json',
                ],
            ];

            if ($method === 'GET' && !empty($params)) {
                $options['query'] = $params;
            } elseif (in_array($method, ['POST', 'PUT', 'PATCH'])) {
                $options['json'] = $params;
            }

            $response = $this->client->request($method, $endpoint, $options);
            return json_decode($response->getBody()->getContents(), true);
        } catch (GuzzleException $e) {
            Log::error('Toggl API Error: ' . $e->getMessage());
            throw new \Exception('Error al comunicarse con Toggl API: ' . $e->getMessage());
        }
    }

    public function getMe(string $apiToken): array
    {
        return $this->makeRequest('GET', '/me', $apiToken);
    }

    public function getWorkspaces(string $apiToken): array
    {
        return $this->makeRequest('GET', '/me/workspaces', $apiToken);
    }

    public function getClients(int $workspaceId, string $apiToken): array
    {
        return $this->makeRequest('GET', "/workspaces/{$workspaceId}/clients", $apiToken);
    }

    public function getProjects(int $workspaceId, string $apiToken, ?int $clientId = null): array
    {
        $endpoint = "/workspaces/{$workspaceId}/projects";
        $params = [];
        
        if ($clientId) {
            $params['client_ids'] = $clientId;
        }

        return $this->makeRequest('GET', $endpoint, $apiToken, $params);
    }

    public function getTags(int $workspaceId, string $apiToken): array
    {
        return $this->makeRequest('GET', "/workspaces/{$workspaceId}/tags", $apiToken);
    }

    public function getTimeEntries(
        int $workspaceId,
        string $apiToken,
        string $startDate,
        string $endDate,
        ?int $clientId = null,
        ?int $projectId = null,
        ?int $tagId = null
    ): array {
        $params = [
            'start_date' => $startDate,
            'end_date' => $endDate,
        ];

        if ($clientId) {
            $params['client_ids'] = $clientId;
        }

        if ($projectId) {
            $params['project_ids'] = $projectId;
        }

        if ($tagId) {
            $params['tag_ids'] = $tagId;
        }

        return $this->makeRequest('GET', "/workspaces/{$workspaceId}/time_entries", $apiToken, $params);
    }

    public function getTimeEntriesWithDetails(
        TogglAccount $account,
        int $workspaceId,
        string $startDate,
        string $endDate,
        ?int $clientId = null,
        ?int $projectId = null,
        ?int $tagId = null
    ): array {
        $timeEntries = $this->getTimeEntries(
            $workspaceId,
            $account->api_token,
            $startDate,
            $endDate,
            $clientId,
            $projectId,
            $tagId
        );

        // Obtener información del usuario
        $userInfo = $this->getMe($account->api_token);
        $userName = $userInfo['fullname'] ?? $userInfo['email'] ?? 'Usuario';

        // Obtener información adicional de proyectos y clientes
        $projects = $this->getProjects($workspaceId, $account->api_token, $clientId);
        $projectsMap = [];
        foreach ($projects as $project) {
            $projectsMap[$project['id']] = $project;
        }

        $clients = $this->getClients($workspaceId, $account->api_token);
        $clientsMap = [];
        foreach ($clients as $client) {
            $clientsMap[$client['id']] = $client;
        }

        // Enriquecer las entradas con información adicional
        $enrichedEntries = [];
        foreach ($timeEntries as $entry) {
            $entryProjectId = $entry['project_id'] ?? null;
            $project = $entryProjectId ? ($projectsMap[$entryProjectId] ?? null) : null;
            $entryClientId = $project ? ($project['client_id'] ?? null) : null;
            $client = $entryClientId ? ($clientsMap[$entryClientId] ?? null) : null;

            $enrichedEntries[] = [
                'id' => $entry['id'],
                'description' => $entry['description'] ?? '',
                'start' => $entry['start'],
                'stop' => $entry['stop'] ?? null,
                'duration' => $entry['duration'],
                'billable' => $entry['billable'] ?? false,
                'tags' => $entry['tags'] ?? [],
                'account_name' => $account->name,
                'workspace_id' => $workspaceId,
                'project_id' => $entryProjectId,
                'project_name' => $project ? ($project['name'] ?? null) : null,
                'client_id' => $entryClientId,
                'client_name' => $client ? ($client['name'] ?? null) : null,
                'user_id' => $entry['user_id'] ?? $userInfo['id'] ?? null,
                'user_name' => $entry['user_name'] ?? $userName,
            ];
        }

        return $enrichedEntries;
    }
}
