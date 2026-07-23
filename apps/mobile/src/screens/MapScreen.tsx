import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, ActivityIndicator } from 'react-native';
import * as Location from 'expo-location';
import { api } from '../lib/api';

interface Hunt {
  id: string;
  title: string;
  description?: string;
  difficulty: string;
  clueCount: number;
  reward: string;
  status: string;
  distance?: number;
}

export function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hunts, setHunts] = useState<Hunt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setError('Location permission required to find nearby hunts');
        setLoading(false);
        return;
      }

      try {
        const loc = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setLocation(loc);
      } catch {
        setError('Failed to get location. Please enable GPS.');
      }
    })();
  }, []);

  useEffect(() => {
    if (!location) return;
    fetchNearbyHunts();
  }, [location]);

  const fetchNearbyHunts = async () => {
    if (!location) return;
    setLoading(true);
    try {
      const data = await api.get<Hunt[]>('/hunts');
      setHunts(data || []);
      setError(null);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch hunts');
    } finally {
      setLoading(false);
    }
  };

  const formatDistance = (meters?: number) => {
    if (meters === undefined) return '---';
    if (meters < 1000) return `${Math.round(meters)}m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TreasureNet</Text>
        <Text style={styles.subtitle}>
          {location ? 'GPS Active - Nearby Hunts' : 'Acquiring GPS...'}
        </Text>
      </View>

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F59E0B" />
          <Text style={styles.loadingText}>Scanning for nearby treasures...</Text>
        </View>
      ) : error ? (
        <View style={styles.centered}>
          <Text style={styles.errorText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchNearbyHunts}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={hunts}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.list}
          ListEmptyComponent={
            <Text style={styles.empty}>No hunts nearby. Check back soon!</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity style={styles.huntCard}>
              <View style={styles.huntInfo}>
                <Text style={styles.huntTitle}>{item.title}</Text>
                <Text style={styles.huntMeta}>
                  {item.difficulty} - {item.clueCount} clues
                  {item.description ? `\n${item.description}` : ''}
                </Text>
              </View>
              <View style={styles.huntReward}>
                <Text style={styles.rewardText}>{item.reward} XLM</Text>
                <Text style={styles.distanceText}>{formatDistance(item.distance)}</Text>
              </View>
            </TouchableOpacity>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  subtitle: { color: '#94A3B8', marginTop: 4, fontSize: 14 },
  loadingText: { color: '#94A3B8', marginTop: 12 },
  errorText: { color: '#EF4444', fontSize: 14, textAlign: 'center', marginBottom: 12 },
  retryButton: {
    backgroundColor: '#F59E0B',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: { color: '#0F172A', fontWeight: '600' },
  list: { padding: 16 },
  empty: { color: '#94A3B8', textAlign: 'center', marginTop: 40, fontSize: 16 },
  huntCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#334155',
  },
  huntInfo: { flex: 1 },
  huntTitle: { color: '#F8FAFC', fontWeight: '600', fontSize: 16 },
  huntMeta: { color: '#94A3B8', marginTop: 4, fontSize: 13 },
  huntReward: { alignItems: 'flex-end' },
  rewardText: { color: '#F59E0B', fontWeight: 'bold', fontSize: 18 },
  distanceText: { color: '#94A3B8', fontSize: 12, marginTop: 2 },
});
