'use client';

import { useState, useCallback } from 'react';
import freighterApi from '@stellar/freighter-api';

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

  const connect = useCallback(async () => {
    setWallet((prev) => ({ ...prev, connecting: true }));
    try {
      // Check if Freighter is connected
      const { isConnected: connected } = await freighterApi.isConnected();
      if (!connected) {
        // Request access
        const { error: accessError } = await freighterApi.requestAccess();
        if (accessError) {
          alert(
            'Freighter wallet not detected.\n\n' +
            'Make sure:\n' +
            '1. Freighter extension is installed\n' +
            '2. Open Freighter, create or import a wallet\n' +
            '3. Set network to Testnet\n' +
            '4. Refresh this page\n\n' +
            'Get it at: https://freighter.app',
          );
          setWallet((prev) => ({ ...prev, connecting: false }));
          return;
        }
      }

      const { address, error } = await freighterApi.getAddress();
      if (error || !address) {
        alert('Could not get public key from Freighter. Is your wallet set up?');
        setWallet((prev) => ({ ...prev, connecting: false }));
        return;
      }

      setWallet({ publicKey: address, connected: true, connecting: false });
      await fetchBalance(address);
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
      if (!wallet.publicKey) {
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

      const { signedTxXdr, error: signError } = await freighterApi.signTransaction(
        transaction.toXDR(),
        { networkPassphrase: StellarSdk.Networks.TESTNET, address: wallet.publicKey },
      );

      if (signError || !signedTxXdr) {
        throw new Error(signError?.message || 'Transaction signing failed');
      }

      const signedTransaction = StellarSdk.TransactionBuilder.fromXDR(
        signedTxXdr,
        StellarSdk.Networks.TESTNET,
      );

      const result = await server.submitTransaction(signedTransaction);

      const txResultData: TransactionResult = {
        hash: result.hash,
        success: result.successful,
        explorerUrl: `https://stellar.expert/explorer/testnet/tx/${result.hash}`,
      };

      setTxResult(txResultData);
      await fetchBalance(wallet.publicKey);

      return txResultData;
    } catch (err: any) {
      const errorMsg = err?.response?.data?.extras?.result_codes?.transaction ||
        err?.response?.data?.extras?.result_codes?.operations?.join(', ') ||
        err?.message || 'Transaction failed';

      const txResultData: TransactionResult = {
        hash: err?.response?.data?.hash || '',
        success: false,
        error: errorMsg,
        explorerUrl: err?.response?.data?.hash
          ? `https://stellar.expert/explorer/testnet/tx/${err.response.data.hash}`
          : undefined,
      };

      setTxResult(txResultData);
      return txResultData;
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
  };
}
