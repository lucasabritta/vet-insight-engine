export type UploadResponse = { id: string; filename: string };
export type ExtractResponse = {
  id: string;
  raw_text: string;
  extraction_meta: Record<string, unknown>;
  record: Record<string, unknown>;
};

export type VeterinaryRecord = Record<string, unknown>;

export type UpdateDocumentResponse = {
  id: string;
  record: VeterinaryRecord;
};

export const getApiBaseUrl = (): string =>
  import.meta.env.VITE_API_URL || 'http://localhost:8000';

export async function apiClient<T = unknown>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const baseUrl = getApiBaseUrl();
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

  return response.json() as Promise<T>;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/documents/upload`;
  const form = new FormData();
  form.append('file', file, file.name);

  const resp = await fetch(url, {
    method: 'POST',
    body: form,
  });
  if (!resp.ok) throw new Error(`Upload failed: ${resp.statusText}`);
  return resp.json();
}

export async function extractDocument(docId: string): Promise<ExtractResponse> {
  return apiClient<ExtractResponse>(`/documents/${docId}/extract`, {
    method: 'POST',
  });
}

export async function updateDocument(docId: string, record: VeterinaryRecord): Promise<UpdateDocumentResponse> {
  return apiClient<UpdateDocumentResponse>(`/documents/${docId}`, {
    method: 'PUT',
    body: JSON.stringify({ record }),
  });
}

export const getDocumentFileUrl = (docId: string): string =>
  `${getApiBaseUrl()}/documents/${docId}/file`;
