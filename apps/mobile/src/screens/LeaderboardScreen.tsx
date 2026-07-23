import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';

export function LeaderboardScreen() {
  const [players, setPlayers] = useState<any[]>([]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Leaderboard</Text>
      </View>
      {players.length === 0 ? (
        <View style={styles.content}>
          <Text style={styles.empty}>No players yet. Be the first!</Text>
        </View>
      ) : (
        <FlatList
          data={players}
          keyExtractor={(_, i) => String(i)}
          contentContainerStyle={styles.list}
          renderItem={({ item, index }) => (
            <View style={styles.row}>
              <Text style={styles.rank}>#{index + 1}</Text>
              <View style={styles.playerInfo}>
                <Text style={styles.address}>{item.address?.slice(0, 12)}...</Text>
                <Text style={styles.stats}>Level {item.level} • {item.winCount} wins</Text>
              </View>
              <Text style={styles.score}>{item.score}</Text>
            </View>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  empty: { color: '#94A3B8', fontSize: 16 },
  list: { padding: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E293B',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#334155',
  },
  rank: { color: '#F59E0B', fontWeight: 'bold', fontSize: 16, width: 36 },
  playerInfo: { flex: 1 },
  address: { color: '#F8FAFC', fontWeight: '600' },
  stats: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  score: { color: '#F59E0B', fontWeight: 'bold', fontSize: 16 },
});
