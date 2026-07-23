import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useAuth } from '../hooks/useAuth';
import { api } from '../lib/api';

interface ProfileData {
  id: string;
  address: string;
  roles: string[];
  progress?: {
    xp: number;
    level: number;
    completedHunts: number;
    winCount: number;
    distanceWalked: number;
    totalRewardsEarned: string;
  };
  stats?: {
    completedHunts: number;
    wonHunts: number;
  };
}

export function ProfileScreen() {
  const {
    wallet,
    publicKey,
    balance,
    loading,
    isLoggedIn,
    authLoading,
    roles,
    createWallet,
    authenticate,
    refreshBalance,
  } = useAuth();
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isLoggedIn) {
      fetchProfile();
    }
  }, [isLoggedIn]);

  const fetchProfile = async () => {
    try {
      const data = await api.get<ProfileData>('/profile');
      setProfile(data);
    } catch (err) {
      console.error('Failed to fetch profile:', err);
    }
  };

  const handleCreateWallet = async () => {
    setCreating(true);
    await createWallet();
    await refreshBalance();
    // Auto-authenticate after wallet creation
    setTimeout(async () => {
      await authenticate();
      setCreating(false);
    }, 500);
  };

  if (loading || creating || authLoading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Profile</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>
            {creating ? 'Creating wallet & authenticating...' : 'Loading...'}
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        {wallet ? (
          <>
            {/* Role Badge */}
            {isLoggedIn && (
              <View style={styles.roleCard}>
                <View style={styles.roleDot} />
                <Text style={styles.roleText}>
                  {roles.includes('GAME_MASTER')
                    ? 'Game Master'
                    : roles.includes('PLAYER')
                    ? 'Player'
                    : 'Connected'}
                </Text>
              </View>
            )}

            {/* Wallet Address */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Wallet Address</Text>
              <Text style={styles.address} selectable>
                {publicKey}
              </Text>
              <View style={styles.balanceRow}>
                <Text style={styles.balanceLabel}>Balance</Text>
                <Text style={styles.balance}>
                  {balance} <Text style={styles.xlm}>XLM</Text>
                </Text>
              </View>
            </View>

            {/* SBT Status */}
            <View style={styles.card}>
              <Text style={styles.cardLabel}>Soulbound Token</Text>
              {isLoggedIn ? (
                <View style={styles.sbtBadge}>
                  <View style={styles.sbtDot} />
                  <Text style={styles.sbtText}>Issued - Player Verified</Text>
                </View>
              ) : (
                <TouchableOpacity style={styles.authButton} onPress={authenticate}>
                  <Text style={styles.authButtonText}>Authenticate to Verify SBT</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile?.stats?.completedHunts ?? 0}</Text>
                <Text style={styles.statLabel}>Hunts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile?.stats?.wonHunts ?? 0}</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>{profile?.progress?.level ?? 1}</Text>
                <Text style={styles.statLabel}>Level</Text>
              </View>
            </View>

            {/* XP Bar */}
            {profile?.progress && (
              <View style={styles.card}>
                <Text style={styles.cardLabel}>XP: {profile.progress.xp}</Text>
                <View style={styles.xpBar}>
                  <View
                    style={[
                      styles.xpFill,
                      { width: `${Math.min((profile.progress.xp % 1000) / 10, 100)}%` },
                    ]}
                  />
                </View>
                <Text style={styles.xpText}>
                  {profile.progress.distanceWalked.toFixed(1)} km traveled
                </Text>
              </View>
            )}
          </>
        ) : (
          <View style={styles.emptyState}>
            <View style={styles.avatar}>
              <Text style={styles.avatarEmoji}>🏴‍☠️</Text>
            </View>
            <Text style={styles.connectText}>Create your wallet</Text>
            <Text style={styles.connectSubtext}>
              Generate a Stellar wallet on your device to start hunting for treasure.
            </Text>
            <TouchableOpacity style={styles.createButton} onPress={handleCreateWallet}>
              <Text style={styles.createButtonText}>Create Wallet & Login</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  content: { flex: 1, padding: 20 },
  loadingText: { color: '#94A3B8', marginTop: 12, fontSize: 14 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center', alignItems: 'center', marginBottom: 16,
  },
  avatarEmoji: { fontSize: 40 },
  connectText: { color: '#F8FAFC', fontSize: 18, fontWeight: '600' },
  connectSubtext: {
    color: '#94A3B8', fontSize: 14, marginTop: 4, marginBottom: 24,
    textAlign: 'center', paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: '#F59E0B', paddingHorizontal: 32, paddingVertical: 14, borderRadius: 12,
  },
  createButtonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  roleCard: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
    padding: 12, borderRadius: 12, marginBottom: 12,
  },
  roleDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#F59E0B', marginRight: 8 },
  roleText: { color: '#F59E0B', fontWeight: '600', fontSize: 14 },
  card: {
    backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    marginBottom: 12, borderWidth: 1, borderColor: '#334155',
  },
  cardLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  address: { color: '#F8FAFC', fontFamily: 'monospace', fontSize: 13 },
  balanceRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#334155',
  },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balance: { color: '#F59E0B', fontWeight: 'bold', fontSize: 22 },
  xlm: { color: '#94A3B8', fontSize: 14 },
  sbtBadge: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 8, paddingHorizontal: 12, borderRadius: 8,
  },
  sbtDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E', marginRight: 8 },
  sbtText: { color: '#22C55E', fontWeight: '600', fontSize: 14 },
  authButton: {
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    padding: 12, borderRadius: 8, alignItems: 'center',
  },
  authButtonText: { color: '#F59E0B', fontWeight: '600' },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statCard: {
    flex: 1, backgroundColor: '#1E293B', borderRadius: 16, padding: 16,
    alignItems: 'center', borderWidth: 1, borderColor: '#334155',
  },
  statValue: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
  xpBar: {
    height: 6, backgroundColor: '#334155', borderRadius: 3, marginTop: 8, overflow: 'hidden',
  },
  xpFill: { height: 6, backgroundColor: '#F59E0B', borderRadius: 3 },
  xpText: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
});
