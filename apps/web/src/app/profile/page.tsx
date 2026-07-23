'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ProfilePage(): React.JSX.Element {
  const [profile, setProfile] = useState<any>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    setIsConnected(true);
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/profile`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then(setProfile)
      .catch(console.error);
  }, []);

  const connectWallet = async () => {
    alert('Connect your Stellar wallet (Freighter, Albedo, or xBull) to authenticate.');
  };

  if (!isConnected || !profile) {
    return (
      <div className="min-h-screen bg-treasure-bg flex items-center justify-center p-6">
        <div className="card text-center max-w-sm w-full">
          <h1 className="text-2xl font-bold mb-4">TreasureNet</h1>
          <p className="text-treasure-muted mb-6">Connect your Stellar wallet to start hunting</p>
          <button className="btn-primary w-full" onClick={connectWallet}>
            Connect Wallet
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-treasure-bg p-6">
      <Link href="/" className="text-treasure-muted hover:text-treasure-text mb-6 block">
        ← Back
      </Link>

      <div className="card mb-6">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-16 h-16 rounded-full bg-gold-500/20 flex items-center justify-center text-2xl">
            🏴‍☠️
          </div>
          <div>
            <h1 className="text-xl font-bold">{profile.user?.username}</h1>
            <p className="text-treasure-muted text-sm font-mono">
              {profile.address?.slice(0, 8)}...{profile.address?.slice(-4)}
            </p>
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <StatBox label="Level" value={profile.progress?.level} />
          <StatBox label="XP" value={profile.progress?.xp} />
          <StatBox label="Wins" value={profile.stats?.wonHunts} />
        </div>
      </div>

      <div className="card mb-6">
        <h2 className="text-lg font-semibold mb-3">Badges</h2>
        {profile.progress?.badges?.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {profile.progress.badges.map((b: any) => (
              <span key={b.id} className="bg-gold-500/20 text-gold-500 text-xs px-3 py-1 rounded-full">
                {b.badge}
              </span>
            ))}
          </div>
        ) : (
          <p className="text-treasure-muted text-sm">No badges yet. Complete a hunt!</p>
        )}
      </div>

      <div className="card">
        <h2 className="text-lg font-semibold mb-3">Stats</h2>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-treasure-muted">Completed Hunts</p>
            <p className="font-bold">{profile.stats?.completedHunts}</p>
          </div>
          <div>
            <p className="text-treasure-muted">Distance Walked</p>
            <p className="font-bold">{(profile.progress?.distanceWalked || 0).toFixed(1)} km</p>
          </div>
          <div>
            <p className="text-treasure-muted">Total Earned</p>
            <p className="font-bold text-gold-500">{profile.progress?.totalRewardsEarned} XLM</p>
          </div>
          <div>
            <p className="text-treasure-muted">Roles</p>
            <p className="font-bold">{profile.roles?.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

function StatBox({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="bg-treasure-bg rounded-xl p-3 text-center">
      <p className="text-2xl font-bold text-gold-500">{value || 0}</p>
      <p className="text-xs text-treasure-muted">{label}</p>
    </div>
  );
}
