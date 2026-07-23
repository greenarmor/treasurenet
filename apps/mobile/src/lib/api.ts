const API_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:4000';

let authToken: string | null = null;

export function setToken(token: string | null) {
  authToken = token;
}

export function getToken(): string | null {
  return authToken;
}

async function request<T>(
  method: string,
  path: string,
  body?: Record<string, unknown>,
): Promise<T> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (authToken) {
    headers['Authorization'] = `Bearer ${authToken}`;
  }

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const err = await res.json().catch(() => ({ message: res.statusText }));
    throw new Error(err.message || 'Request failed');
  }

  return res.json();
}

export const api = {
  get: <T>(path: string) => request<T>('GET', path),
  post: <T>(path: string, body?: Record<string, unknown>) => request<T>('POST', path, body),
};

interface NonceResponse {
  nonce: string;
  message: string;
}

interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  wallet: {
    id: string;
    address: string;
    roles: string[];
  };
}

export async function getNonce(address: string): Promise<NonceResponse> {
  return api.post<NonceResponse>('/auth/nonce', { address });
}

export async function login(
  address: string,
  signature: string,
  message: string,
  walletType: string = 'MOBILE',
): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/login', { address, signature, message, walletType });
}

export async function refreshAuth(refreshToken: string): Promise<AuthResponse> {
  return api.post<AuthResponse>('/auth/refresh', { refreshToken });
}
