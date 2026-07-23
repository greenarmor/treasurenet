'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<any[]>([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/leaderboard`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => res.json())
      .then((data) => setLeaderboard(data.data || []))
      .catch(console.error);
  }, []);

  return (
    <div className="min-h-screen bg-treasure-bg p-6">
      <Link href="/" className="text-treasure-muted hover:text-treasure-text mb-6 block">
        ← Back
      </Link>

      <h1 className="text-2xl font-bold mb-6">Leaderboard</h1>

      <div className="card">
        <div className="space-y-2">
          {leaderboard.map((player, idx) => (
            <div
              key={idx}
              className="flex items-center gap-4 p-3 rounded-xl bg-treasure-bg"
            >
              <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-sm">
                {player.rank || idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{player.address?.slice(0, 12)}...</p>
                <p className="text-treasure-muted text-xs">
                  Level {player.level} • {player.winCount} wins
                </p>
              </div>
              <div className="text-right">
                <p className="font-bold text-gold-500">{player.score}</p>
                <p className="text-treasure-muted text-xs">score</p>
              </div>
            </div>
          ))}

          {leaderboard.length === 0 && (
            <p className="text-treasure-muted text-center py-8">No players yet. Be the first!</p>
          )}
        </div>
      </div>
    </div>
  );
}
