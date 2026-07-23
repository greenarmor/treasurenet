import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { useMobileWallet } from '../hooks/useMobileWallet';

export function ProfileScreen() {
  const { wallet, publicKey, balance, loading, createWallet } = useMobileWallet();

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Profile</Text>
      </View>

      <View style={styles.content}>
        {loading ? (
          <ActivityIndicator size="large" color="#F59E0B" />
        ) : wallet ? (
          <>
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
              <View style={styles.sbtBadge}>
                <View style={styles.sbtDot} />
                <Text style={styles.sbtText}>Issued - Player Verified</Text>
              </View>
            </View>

            {/* Stats */}
            <View style={styles.statsRow}>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Hunts</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Wins</Text>
              </View>
              <View style={styles.statCard}>
                <Text style={styles.statValue}>0</Text>
                <Text style={styles.statLabel}>Badges</Text>
              </View>
            </View>
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
            <TouchableOpacity style={styles.createButton} onPress={createWallet}>
              <Text style={styles.createButtonText}>Create Wallet</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  content: { flex: 1, padding: 20 },
  emptyState: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: 'rgba(245, 158, 11, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarEmoji: { fontSize: 40 },
  connectText: { color: '#F8FAFC', fontSize: 18, fontWeight: '600' },
  connectSubtext: {
    color: '#94A3B8',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 24,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  createButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 12,
  },
  createButtonText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLabel: { color: '#94A3B8', fontSize: 12, marginBottom: 8, textTransform: 'uppercase' },
  address: { color: '#F8FAFC', fontFamily: 'monospace', fontSize: 13 },
  balanceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#334155',
  },
  balanceLabel: { color: '#94A3B8', fontSize: 14 },
  balance: { color: '#F59E0B', fontWeight: 'bold', fontSize: 22 },
  xlm: { color: '#94A3B8', fontSize: 14 },
  sbtBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(34, 197, 94, 0.15)',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
  },
  sbtDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#22C55E',
    marginRight: 8,
  },
  sbtText: { color: '#22C55E', fontWeight: '600', fontSize: 14 },
  statsRow: { flexDirection: 'row', gap: 8, marginTop: 4 },
  statCard: {
    flex: 1,
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  statValue: { color: '#F8FAFC', fontSize: 24, fontWeight: 'bold' },
  statLabel: { color: '#94A3B8', fontSize: 12, marginTop: 4 },
});
