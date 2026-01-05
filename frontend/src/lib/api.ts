export async function apiClient(endpoint: string, options: RequestInit = {}) {
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8000';
  const url = `${baseUrl}${endpoint}`;

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
}
