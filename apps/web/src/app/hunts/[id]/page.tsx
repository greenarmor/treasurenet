'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';

export default function HuntDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [hunt, setHunt] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHunt = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hunt/${id}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const data = await res.json();
        setHunt(data);
      } catch (err) {
        console.error('Failed to fetch hunt:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchHunt();
  }, [id]);

  if (loading) return <div className="p-8 text-center text-treasure-muted">Loading...</div>;
  if (!hunt) return <div className="p-8 text-center text-red-400">Hunt not found</div>;

  return (
    <div className="min-h-screen bg-treasure-bg p-6">
      <Link href="/" className="text-treasure-muted hover:text-treasure-text mb-6 block">
        ← Back to map
      </Link>

      <div className="card mb-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold">{hunt.title}</h1>
            <div className="flex gap-3 mt-2">
              <span className={`badge ${hunt.difficulty === 'EASY' ? 'bg-green-600' : hunt.difficulty === 'MEDIUM' ? 'bg-yellow-600' : 'bg-red-600'} text-white text-xs px-3 py-1 rounded-full`}>
                {hunt.difficulty}
              </span>
              <span className="bg-treasure-border text-treasure-text text-xs px-3 py-1 rounded-full">
                {hunt.clueCount} Clues
              </span>
              <span className="bg-gold-500/20 text-gold-500 text-xs px-3 py-1 rounded-full">
                {hunt.reward} {hunt.rewardToken || 'XLM'}
              </span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-2xl font-bold text-gold-500">{hunt.reward} XLM</p>
            <p className="text-treasure-muted text-sm">Reward</p>
          </div>
        </div>

        <p className="text-treasure-muted mb-6">{hunt.description}</p>

        <div className="grid grid-cols-2 gap-4 text-sm mb-6">
          <div>
            <p className="text-treasure-muted">Created by</p>
            <p className="font-mono text-xs">{hunt.owner?.address?.slice(0, 12)}...</p>
          </div>
          <div>
            <p className="text-treasure-muted">Status</p>
            <p className="text-green-400">{hunt.status}</p>
          </div>
          <div>
            <p className="text-treasure-muted">Treasure Radius</p>
            <p>{hunt.treasureRadius}m</p>
          </div>
          <div>
            <p className="text-treasure-muted">Expires in</p>
            <p>{hunt.expirationHours}h</p>
          </div>
        </div>

        <button className="btn-primary w-full" onClick={() => joinHunt(hunt.id)}>
          Join Hunt
        </button>
      </div>

      {/* Clues Section */}
      <div className="card">
        <h2 className="text-lg font-semibold mb-4">Clues ({hunt.clues?.length || 0})</h2>
        <div className="space-y-3">
          {hunt.clues?.map((clue: any, idx: number) => (
            <div key={clue.id} className="flex items-center gap-4 p-3 rounded-xl bg-treasure-bg">
              <div className="w-8 h-8 rounded-full bg-gold-500/20 flex items-center justify-center text-gold-500 font-bold text-sm">
                {idx + 1}
              </div>
              <div className="flex-1">
                <p className="font-medium text-sm">{clue.hintText}</p>
                <p className="text-treasure-muted text-xs">
                  {clue.clueType} • {clue.unlockRadius}m radius
                  {clue.isFinal && ' • 🏁 Final'}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

async function joinHunt(huntId: string) {
  const token = localStorage.getItem('token');
  await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hunt/${huntId}/join`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
  });
}
