import { useState, useCallback } from 'react';
import { useMobileWallet } from './useMobileWallet';
import { getNonce, login, refreshAuth, setToken, getToken } from '../lib/api';

export function useAuth() {
  const wallet = useMobileWallet();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [roles, setRoles] = useState<string[]>([]);

  const authenticate = useCallback(async () => {
    if (!wallet.wallet) return false;

    setAuthLoading(true);
    try {
      const { message } = await getNonce(wallet.wallet.publicKey);
      const signature = await wallet.signAuthMessage(message);
      const result = await login(wallet.wallet.publicKey, signature, message, 'MOBILE');

      setToken(result.accessToken);
      setRoles(result.wallet.roles);
      setIsLoggedIn(true);
      return true;
    } catch (err) {
      console.error('Auth failed:', err);
      return false;
    } finally {
      setAuthLoading(false);
    }
  }, [wallet]);

  const refresh = useCallback(async () => {
    const token = getToken();
    if (!token) return false;

    try {
      // Try to use existing token; if it fails, user must re-authenticate
      setIsLoggedIn(true);
      return true;
    } catch {
      setIsLoggedIn(false);
      return false;
    }
  }, []);

  return {
    ...wallet,
    isLoggedIn,
    authLoading,
    roles,
    authenticate,
  };
}
