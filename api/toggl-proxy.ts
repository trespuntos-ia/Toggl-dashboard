import type { VercelRequest, VercelResponse } from '@vercel/node';

const API_BASE_URL = 'https://api.track.toggl.com/api/v9';

export default async function handler(
  request: VercelRequest,
  response: VercelResponse
) {
  // Habilitar CORS
  response.setHeader('Access-Control-Allow-Credentials', 'true');
  response.setHeader('Access-Control-Allow-Origin', '*');
  response.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  response.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );

  // Manejar preflight requests
  if (request.method === 'OPTIONS') {
    response.status(200).end();
    return;
  }

  // Obtener el token de la query o del body
  const apiToken = request.query.token || request.body?.token;
  
  if (!apiToken || typeof apiToken !== 'string') {
    response.status(400).json({ error: 'API token is required' });
    return;
  }

  // Obtener el endpoint de la query
  const endpoint = request.query.endpoint as string;
  
  if (!endpoint) {
    response.status(400).json({ error: 'Endpoint is required' });
    return;
  }

  try {
    // Crear headers de autenticación
    const auth = Buffer.from(`${apiToken}:api_token`).toString('base64');
    const headers: Record<string, string> = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
    };

    // Construir la URL
    const url = `${API_BASE_URL}${endpoint}`;
    
    // Añadir parámetros de query si existen
    const queryParams = new URLSearchParams();
    Object.keys(request.query).forEach(key => {
      if (key !== 'token' && key !== 'endpoint') {
        const value = request.query[key];
        if (value && typeof value === 'string') {
          queryParams.append(key, value);
        }
      }
    });
    
    const fullUrl = queryParams.toString() 
      ? `${url}?${queryParams.toString()}` 
      : url;

    // Hacer la petición a Toggl API
    const togglResponse = await fetch(fullUrl, {
      method: request.method || 'GET',
      headers,
      body: request.method === 'POST' ? JSON.stringify(request.body) : undefined,
    });

    const data = await togglResponse.json();

    if (!togglResponse.ok) {
      response.status(togglResponse.status).json(data);
      return;
    }

    response.status(200).json(data);
  } catch (error: any) {
    console.error('Error proxying request to Toggl:', error);
    response.status(500).json({ 
      error: 'Error proxying request to Toggl API',
      message: error.message 
    });
  }
}

