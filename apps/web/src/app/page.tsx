'use client';

import { useEffect, useState } from 'react';
import dynamic from 'next/dynamic';
import Link from 'next/link';

const TreasureMap = dynamic(() => import('@/components/map/TreasureMap'), {
  ssr: false,
  loading: () => (
    <div className="w-full h-screen flex items-center justify-center bg-treasure-bg">
      <div className="text-gold-500 animate-pulse text-xl">Loading map...</div>
    </div>
  ),
});

export default function HomePage(): React.JSX.Element {
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
        () => setUserLocation({ lat: 40.7128, lng: -74.006 }),
        { enableHighAccuracy: true },
      );
    }
  }, []);

  return (
    <div className="relative w-full h-screen">
      <TreasureMap userLocation={userLocation} />

      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 z-10 p-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gold-500 drop-shadow-lg">TreasureNet</h1>
            <span className="text-xs text-treasure-muted">Game Master Console</span>
          </div>
          <div className="flex gap-2">
            <Link href="/wallet" className="btn-primary text-sm py-2 px-4">
              Wallet
            </Link>
            <Link href="/create" className="btn-secondary text-sm py-2 px-4">
              Create Hunt
            </Link>
            <Link href="/leaderboard" className="btn-secondary text-sm py-2 px-4">
              Leaderboard
            </Link>
          </div>
        </div>
      </div>

      {/* Bottom Sheet */}
      <div className="absolute bottom-0 left-0 right-0 z-10 p-4">
        <div className="card">
          <h2 className="text-lg font-semibold mb-1">Active Hunts</h2>
          <p className="text-treasure-muted text-xs mb-3">Monitor your hunts and player activity</p>
          <NearbyHuntsList userLocation={userLocation} />
        </div>
      </div>
    </div>
  );
}

function NearbyHuntsList({ userLocation }: { userLocation: { lat: number; lng: number } | null }) {
  const [hunts, setHunts] = useState<any[]>([]);

  useEffect(() => {
    if (!userLocation) return;

    const fetchHunts = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/hunts?latitude=${userLocation.lat}&longitude=${userLocation.lng}&radiusKm=10`,
          { headers: { Authorization: `Bearer ${token}` } },
        );
        const data = await res.json();
        setHunts(Array.isArray(data) ? data : data.data || []);
      } catch {
        setHunts([]);
      }
    };

    fetchHunts();
    const interval = setInterval(fetchHunts, 30000);
    return () => clearInterval(interval);
  }, [userLocation]);

  if (!userLocation) {
    return <p className="text-treasure-muted text-sm">Enable location to see nearby hunts</p>;
  }

  if (hunts.length === 0) {
    return <p className="text-treasure-muted text-sm">No active hunts yet. Create your first hunt!</p>;
  }

  return (
    <div className="space-y-3 max-h-48 overflow-y-auto">
      {hunts.slice(0, 5).map((hunt) => (
        <Link
          key={hunt.id}
          href={`/hunts/${hunt.id}`}
          className="flex items-center justify-between p-3 rounded-xl bg-treasure-bg hover:bg-treasure-border transition-colors"
        >
          <div>
            <p className="font-semibold text-sm">{hunt.title}</p>
            <p className="text-treasure-muted text-xs">
              {hunt.difficulty} • {hunt.clueCount} clues
            </p>
          </div>
          <div className="text-right">
            <p className="text-gold-500 font-bold">{hunt.reward} XLM</p>
            <p className="text-treasure-muted text-xs">
              {hunt.distance ? `${(hunt.distance / 1000).toFixed(1)}km` : '---'}
            </p>
          </div>
        </Link>
      ))}
    </div>
  );
}
