'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useStellarWallet } from '@/hooks/useStellarWallet';

export default function WalletPage(): React.JSX.Element {
  const {
    publicKey,
    connected,
    connecting,
    balance,
    loadingBalance,
    txResult,
    sending,
    connect,
    disconnect,
    sendTestTransaction,
  } = useStellarWallet();

  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    if (!destination || !amount) return;
    await sendTestTransaction(destination, amount);
  };

  return (
    <div className="min-h-screen bg-treasure-bg p-6">
      <Link href="/" className="text-treasure-muted hover:text-treasure-text mb-6 block">
        ← Back to map
      </Link>

      <h1 className="text-2xl font-bold mb-2">Game Master Wallet</h1>
      <p className="text-treasure-muted text-sm mb-6">
        Connect your Freighter wallet to create hunts and fund escrow rewards.
        Players must use the mobile app to participate.
      </p>

      {/* ─── Wallet Connection ────────────────────────── */}
      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-1">Game Master Wallet</h2>
        <p className="text-treasure-muted text-xs mb-3">Freighter - Stellar Testnet</p>

        {!connected ? (
          <div>
            <p className="text-treasure-muted text-sm mb-4">
              Connect your Freighter wallet to interact with the Stellar testnet.
            </p>
            <button
              className="btn-primary w-full"
              onClick={connect}
              disabled={connecting}
            >
              {connecting ? 'Connecting...' : 'Connect Freighter Wallet'}
            </button>
            <p className="text-treasure-muted text-xs mt-3 text-center">
              Don&apos;t have Freighter?{' '}
              <a
                href="https://freighter.app"
                target="_blank"
                className="text-gold-500 underline"
              >
                Install it here
              </a>
            </p>
          </div>
        ) : (
          <div>
            {/* Connected State */}
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                <span className="text-green-400 font-medium">Connected</span>
                <span className="text-xs bg-gold-500/20 text-gold-500 px-2 py-0.5 rounded-full">
                  Game Master
                </span>
              </div>
              <button className="btn-secondary text-sm py-1 px-3" onClick={disconnect}>
                Disconnect
              </button>
            </div>

            {/* Wallet Address */}
            <div className="bg-treasure-bg rounded-xl p-4 mb-4">
              <p className="text-treasure-muted text-xs mb-1">Wallet Address</p>
              <p className="font-mono text-sm break-all text-treasure-text">{publicKey}</p>
            </div>

            {/* Balance */}
            <div className="bg-treasure-bg rounded-xl p-4 mb-4">
              <p className="text-treasure-muted text-xs mb-1">Balance (Testnet)</p>
              {loadingBalance ? (
                <p className="text-treasure-muted text-sm">Loading...</p>
              ) : (
                <p className="text-2xl font-bold text-gold-500">
                  {balance} <span className="text-sm text-treasure-muted">XLM</span>
                </p>
              )}
              <button
                className="text-xs text-gold-500 underline mt-2"
                onClick={() => connect()}
                disabled={connecting}
              >
                Refresh balance
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ─── Fund Escrow / Send Testnet XLM ──────────── */}
      {connected && (
        <div className="card mb-6">
          <h2 className="text-lg font-semibold mb-1">Fund Escrow</h2>
          <p className="text-treasure-muted text-xs mb-3">
            Send XLM to fund a hunt escrow or test your Game Master wallet.
          </p>

          <div className="space-y-3 mb-4">
            <div>
              <label className="block text-sm text-treasure-muted mb-1">
                Destination Address
              </label>
              <input
                className="input"
                placeholder="G..."
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
              />
            </div>
            <div>
              <label className="block text-sm text-treasure-muted mb-1">
                Amount (XLM)
              </label>
              <input
                className="input"
                type="number"
                step="0.0000001"
                placeholder="0.1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
              />
            </div>
          </div>

          <button
            className="btn-primary w-full"
            onClick={handleSend}
            disabled={sending || !destination || !amount}
          >
            {sending ? 'Sending...' : `Send ${amount || '0'} XLM`}
          </button>
        </div>
      )}

      {/* ─── Transaction Result ───────────────────────── */}
      {txResult && (
        <div
          className={`card border-2 ${
            txResult.success
              ? 'border-green-500/50'
              : 'border-red-500/50'
          }`}
        >
          <h2 className="text-lg font-semibold mb-3">
            Transaction {txResult.success ? 'Successful ✅' : 'Failed ❌'}
          </h2>

          {txResult.hash && (
            <div className="bg-treasure-bg rounded-xl p-3 mb-3">
              <p className="text-treasure-muted text-xs mb-1">Transaction Hash</p>
              <p className="font-mono text-xs break-all text-treasure-text">
                {txResult.hash}
              </p>
            </div>
          )}

          {txResult.success ? (
            <p className="text-green-400 text-sm mb-3">
              Transaction submitted successfully on Stellar Testnet.
            </p>
          ) : (
            <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 mb-3">
              <p className="text-red-400 text-sm">{txResult.error}</p>
            </div>
          )}

          {txResult.explorerUrl && (
            <a
              href={txResult.explorerUrl}
              target="_blank"
              className="text-gold-500 underline text-sm"
            >
              View on Stellar Expert Explorer →
            </a>
          )}
        </div>
      )}
    </div>
  );
}
