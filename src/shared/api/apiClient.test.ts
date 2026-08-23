import { describe, expect, it, vi } from 'vitest';
import { ApiClient } from './apiClient';

describe('ApiClient', () => {
  it('sends cookies and JSON headers to the configured API', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ ok: true }), { status: 200 }));
    const client = new ApiClient('https://api.example.test', fetchMock);
    await expect(client.request('/v1/me')).resolves.toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledWith('https://api.example.test/v1/me', expect.objectContaining({ credentials: 'include' }));
  });

  it('converts the public API error envelope into ApiError', async () => {
    const fetchMock = vi.fn<typeof fetch>().mockResolvedValue(new Response(JSON.stringify({ error: { code: 'invalid_credentials', message: 'Неверная почта или пароль.' } }), { status: 401 }));
    const client = new ApiClient('https://api.example.test', fetchMock);
    await expect(client.request('/v1/auth/login')).rejects.toMatchObject({ status: 401, code: 'invalid_credentials' });
  });
});
