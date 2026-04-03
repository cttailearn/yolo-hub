/**
 * API 客户端
 */
import { config } from '@/lib/config';

class APIError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
    this.name = 'APIError';
  }
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new APIError(
      error.detail?.message || error.detail || '请求失败',
      response.status,
      error.code
    );
  }
  return response.json();
}

export const api = {
  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${config.api.baseUrl}${path}`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return handleResponse<T>(response);
  },

  async post<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${config.api.baseUrl}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async put<T>(path: string, data?: unknown): Promise<T> {
    const response = await fetch(`${config.api.baseUrl}${path}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: data ? JSON.stringify(data) : undefined,
    });
    return handleResponse<T>(response);
  },

  async delete(path: string): Promise<void> {
    const response = await fetch(`${config.api.baseUrl}${path}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new APIError(
        error.detail?.message || error.detail || '删除失败',
        response.status
      );
    }
  },

  async upload(
    path: string,
    files: File[],
    data?: Record<string, string>
  ): Promise<any> {
    const formData = new FormData();
    files.forEach((file) => formData.append('files', file));
    if (data) {
      Object.entries(data).forEach(([key, value]) => formData.append(key, value));
    }

    const response = await fetch(`${config.api.baseUrl}${path}`, {
      method: 'POST',
      body: formData,
    });
    return handleResponse(response);
  },
};

export { APIError };
