'use client';

import { useState } from 'react';
import Link from 'next/link';

export default function CreateHuntPage() {
  const [form, setForm] = useState({
    title: '',
    description: '',
    reward: '',
    rewardToken: 'XLM',
    difficulty: 'MEDIUM',
    visibility: 'PUBLIC',
    treasureLat: '',
    treasureLng: '',
    treasureRadius: '20',
    expirationHours: '72',
    tags: '',
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const body = {
        ...form,
        reward: form.reward,
        treasureLocation: {
          latitude: parseFloat(form.treasureLat),
          longitude: parseFloat(form.treasureLng),
        },
        treasureRadius: parseInt(form.treasureRadius),
        expirationHours: parseInt(form.expirationHours),
        tags: form.tags.split(',').map((t) => t.trim()).filter(Boolean),
        clues: [
          {
            sequence: 1,
            location: { latitude: parseFloat(form.treasureLat) + 0.001, longitude: parseFloat(form.treasureLng) + 0.001 },
            unlockRadius: 30,
            hintText: 'First clue hint',
            clueType: 'TEXT',
            unlockType: 'GEO_FENCE',
            isFinal: false,
          },
          {
            sequence: 2,
            location: { latitude: parseFloat(form.treasureLat), longitude: parseFloat(form.treasureLng) },
            unlockRadius: parseInt(form.treasureRadius),
            hintText: 'Final clue - find the treasure!',
            clueType: 'TEXT',
            unlockType: 'GEO_FENCE',
            isFinal: true,
          },
        ],
      };

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/v1/hunt`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (res.ok) {
        window.location.href = '/';
      }
    } catch (err) {
      console.error('Failed to create hunt:', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-treasure-bg p-6">
      <Link href="/" className="text-treasure-muted hover:text-treasure-text mb-6 block">
        ← Back
      </Link>

      <h1 className="text-2xl font-bold mb-6">Create Treasure Hunt</h1>

      <form onSubmit={handleSubmit} className="card space-y-4">
        <div>
          <label className="block text-sm text-treasure-muted mb-1">Title</label>
          <input className="input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
        </div>

        <div>
          <label className="block text-sm text-treasure-muted mb-1">Description</label>
          <textarea className="input" rows={3} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Reward (XLM)</label>
            <input className="input" type="number" value={form.reward} onChange={(e) => setForm({ ...form, reward: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Difficulty</label>
            <select className="input" value={form.difficulty} onChange={(e) => setForm({ ...form, difficulty: e.target.value })}>
              <option value="EASY">Easy</option>
              <option value="MEDIUM">Medium</option>
              <option value="HARD">Hard</option>
              <option value="EXPERT">Expert</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Treasure Latitude</label>
            <input className="input" type="number" step="any" value={form.treasureLat} onChange={(e) => setForm({ ...form, treasureLat: e.target.value })} required />
          </div>
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Treasure Longitude</label>
            <input className="input" type="number" step="any" value={form.treasureLng} onChange={(e) => setForm({ ...form, treasureLng: e.target.value })} required />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Radius (m)</label>
            <input className="input" type="number" value={form.treasureRadius} onChange={(e) => setForm({ ...form, treasureRadius: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Expiration (h)</label>
            <input className="input" type="number" value={form.expirationHours} onChange={(e) => setForm({ ...form, expirationHours: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-treasure-muted mb-1">Visibility</label>
            <select className="input" value={form.visibility} onChange={(e) => setForm({ ...form, visibility: e.target.value })}>
              <option value="PUBLIC">Public</option>
              <option value="UNLISTED">Unlisted</option>
              <option value="INVITE_ONLY">Invite Only</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm text-treasure-muted mb-1">Tags (comma-separated)</label>
          <input className="input" value={form.tags} onChange={(e) => setForm({ ...form, tags: e.target.value })} placeholder="park, urban, easy" />
        </div>

        <button type="submit" className="btn-primary w-full" disabled={submitting}>
          {submitting ? 'Creating...' : 'Create Treasure Hunt'}
        </button>
      </form>
    </div>
  );
}
