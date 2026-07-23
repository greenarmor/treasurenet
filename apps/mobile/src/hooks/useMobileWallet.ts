import { useState, useEffect, useCallback } from 'react';
import {
  getWallet,
  generateWallet,
  fetchBalance,
  sendPayment,
  signMessage,
  TxResult,
  MobileWallet,
} from '../lib/wallet';

export function useMobileWallet() {
  const [wallet, setWallet] = useState<MobileWallet | null>(null);
  const [balance, setBalance] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [txResult, setTxResult] = useState<TxResult | null>(null);

  useEffect(() => {
    loadWallet();
  }, []);

  const loadWallet = async () => {
    setLoading(true);
    const w = await getWallet();
    setWallet(w);
    if (w) {
      const bal = await fetchBalance(w.publicKey);
      setBalance(bal);
    }
    setLoading(false);
  };

  const createWallet = useCallback(async () => {
    setLoading(true);
    const w = await generateWallet();
    setWallet(w);
    const bal = await fetchBalance(w.publicKey);
    setBalance(bal);
    setLoading(false);
  }, []);

  const refreshBalance = useCallback(async () => {
    if (!wallet) return;
    const bal = await fetchBalance(wallet.publicKey);
    setBalance(bal);
  }, [wallet]);

  const sendTx = useCallback(async (destination: string, amount: string) => {
    if (!wallet) return null;
    setSending(true);
    setTxResult(null);
    const result = await sendPayment(wallet.secretKey, wallet.publicKey, destination, amount);
    setTxResult(result);
    if (result.success) {
      await refreshBalance();
    }
    setSending(false);
    return result;
  }, [wallet, refreshBalance]);

  const signAuthMessage = useCallback(async (message: string) => {
    if (!wallet) throw new Error('No wallet');
    return signMessage(wallet.secretKey, message);
  }, [wallet]);

  return {
    wallet,
    publicKey: wallet?.publicKey || null,
    balance,
    loading,
    txResult,
    sending,
    createWallet,
    refreshBalance,
    sendTx,
    signAuthMessage,
  };
}
