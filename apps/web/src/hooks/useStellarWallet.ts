'use client';

import { useState, useCallback } from 'react';

interface WalletState {
  publicKey: string | null;
  connected: boolean;
  connecting: boolean;
}

interface TransactionResult {
  hash: string;
  success: boolean;
  error?: string;
  explorerUrl?: string;
}

export function useStellarWallet() {
  const [wallet, setWallet] = useState<WalletState>({
    publicKey: null,
    connected: false,
    connecting: false,
  });
  const [balance, setBalance] = useState<string | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);
  const [txResult, setTxResult] = useState<TransactionResult | null>(null);
  const [sending, setSending] = useState(false);

  const isFreighterAvailable = useCallback((): boolean => {
    return typeof window !== 'undefined' && !!(window as any).stellar?.isConnected;
  }, []);

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, connecting: true }));
    try {
      const provider = (window as any).stellar;
      if (!provider) {
        alert('Please install Freighter wallet extension: https://freighter.app');
        return;
      }

      const isConnected = await provider.isConnected();
      if (!isConnected) {
        await provider.requestAccess();
      }

      const publicKey = await provider.getPublicKey();
      setWallet({ publicKey, connected: true, connecting: false });

      await fetchBalance(publicKey);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setWallet({ publicKey: null, connected: false, connecting: false });
      alert(`Connection failed: ${err.message || 'Unknown error'}`);
    }
  }, []);

  const disconnect = useCallback(() => {
    setWallet({ publicKey: null, connected: false, connecting: false });
    setBalance(null);
    setTxResult(null);
  }, []);

  const fetchBalance = useCallback(async (publicKey?: string) => {
    const key = publicKey || wallet.publicKey;
    if (!key) return;
    setLoadingBalance(true);
    try {
      const horizonUrl = 'https://horizon-testnet.stellar.org';
      const res = await fetch(`${horizonUrl}/accounts/${key}`);
      if (!res.ok) {
        setBalance('0');
        return;
      }
      const data = await res.json();
      const xlmBalance = data.balances?.find((b: any) => b.asset_type === 'native');
      setBalance(xlmBalance?.balance || '0');
    } catch {
      setBalance('0');
    } finally {
      setLoadingBalance(false);
    }
  }, [wallet.publicKey]);

  const sendTestTransaction = useCallback(async (
    destination: string,
    amount: string,
  ): Promise<TransactionResult> => {
    setSending(true);
    setTxResult(null);

    try {
      const provider = (window as any).stellar;
      if (!provider || !wallet.publicKey) {
        throw new Error('Wallet not connected');
      }

      const StellarSdk = await import('@stellar/stellar-sdk');
      const server = new StellarSdk.Horizon.Server('https://horizon-testnet.stellar.org');
      const sourceAccount = await server.loadAccount(wallet.publicKey);

      const transaction = new StellarSdk.TransactionBuilder(sourceAccount, {
        fee: StellarSdk.BASE_FEE,
        networkPassphrase: StellarSdk.Networks.TESTNET,
      })
        .addOperation(
          StellarSdk.Operation.payment({
            destination,
            asset: StellarSdk.Asset.native(),
            amount,
          }),
        )
        .setTimeout(180)
        .build();

      const signedXdr = await provider.signTransaction(transaction.toXDR(), {
        network: 'TESTNET',
        publicKey: wallet.publicKey,
      });

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedXdr,
        StellarSdk.Networks.TESTNET,
      );

      const result = await server.submitTransaction(signedTransaction);

      const txResult: TransactionResult = {
        hash: result.hash,
        success: result.successful,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };

      setTxResult(txResult);
      await fetchBalance(wallet.publicKey);

      return txResult;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.extras?.result_codes?.transaction ||
        err?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
        err?.message || 'Transaction failed';

      const txResult: TransactionResult = {
        hash: err?.response?.data?.hash || '',
        success: false,
        error: errorMsg,
        explorerUrl: err?.response?.data?.hash
          ? `https://stellar.expert/explorer/testnet/tx/${err.response.data.hash}`
          : undefined,
      };

      setTxResult(txResult);
      return txResult;
    } finally {
      setSending(false);
    }
  }, [wallet.publicKey]);

  return {
    ...wallet,
    balance,
    loadingBalance,
    txResult,
    sending,
    connect,
    disconnect,
    fetchBalance,
    sendTestTransaction,
    isFreighterAvailable,
  };
}
