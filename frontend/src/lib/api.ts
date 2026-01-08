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
  console.debug('api.request', { url, method: options.method || 'GET' });

  const response = await fetch(url, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  });

  if (!response.ok) {
    console.error('api.error', { url, status: response.status, statusText: response.statusText });
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }
  const data = (await response.json()) as T;
  console.debug('api.response', { url, ok: true });
  return data;
}

export async function uploadDocument(file: File): Promise<UploadResponse> {
  const baseUrl = getApiBaseUrl();
  const url = `${baseUrl}/documents/upload`;
  const form = new FormData();
  form.append('file', file, file.name);

  console.info('api.upload.start', { name: file.name, size: file.size, type: file.type });
  const resp = await fetch(url, {
    method: 'POST',
    body: form,
  });
  if (!resp.ok) {
    console.error('api.upload.error', { status: resp.status, statusText: resp.statusText });
    throw new Error(`Upload failed: ${resp.statusText}`);
  }
  const data = await resp.json();
  console.info('api.upload.success', { id: data.id, filename: data.filename });
  return data;
}

export async function extractDocument(docId: string): Promise<ExtractResponse> {
  console.info('api.extract.start', { id: docId });
  const data = await apiClient<ExtractResponse>(`/documents/${docId}/extract`, {
    method: 'POST',
  });
  console.info('api.extract.success', { id: docId, textLen: String(data.raw_text || '').length });
  return data;
}

export async function updateDocument(docId: string, record: VeterinaryRecord): Promise<UpdateDocumentResponse> {
  console.info('api.update.start', { id: docId });
  const data = await apiClient<UpdateDocumentResponse>(`/documents/${docId}`, {
    method: 'PUT',
    body: JSON.stringify({ record }),
  });
  console.info('api.update.success', { id: docId });
  return data;
}

export const getDocumentFileUrl = (docId: string): string =>
  `${getApiBaseUrl()}/documents/${docId}/file`;
