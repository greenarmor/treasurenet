'use client';

import { useState, useCallback } from 'react';

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function useWebAuth() {
  const [token, setTokenState] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  });

  const setToken = useCallback((t: string | null) => {
    setTokenState(t);
    if (t) {
      localStorage.setItem('token', t);
    } else {
      localStorage.removeItem('token');
    }
  }, []);

  const getNonce = useCallback(async (address: string) => {
    const res = await fetch(`${API_URL}/auth/nonce`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address }),
    });
    return res.json() as Promise<{ nonce: string; message: string }>;
  }, []);

  const login = useCallback(async (address: string, signature: string, message: string) => {
    const res = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, signature, message, walletType: 'FREIGHTER' }),
    });
    if (!res.ok) throw new Error('Login failed');
    const data = await res.json();
    setToken(data.accessToken);
    return data;
  }, [setToken]);

  const promoteToGM = useCallback(async (address: string) => {
    const adminKey = prompt('Enter admin key to upgrade to Game Master:');
    if (!adminKey) return;
    const res = await fetch(`${API_URL}/profile/promote-gm`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, adminKey }),
    });
    if (!res.ok) throw new Error('Promotion failed');
    return res.json();
  }, []);

  return { token, setToken, getNonce, login, promoteToGM };
}
