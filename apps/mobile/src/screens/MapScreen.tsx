import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import * as Location from 'expo-location';

export function MapScreen() {
  const [location, setLocation] = useState<Location.LocationObject | null>(null);
  const [hunts, setHunts] = useState<any[]>([]);

  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;

      const loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High });
      setLocation(loc);
    })();
  }, []);

  useEffect(() => {
    if (!location) return;
    const fetchNearby = async () => {
      try {
        const res = await fetch(
          `http://localhost:4000/api/v1/hunts?latitude=${location.coords.latitude}&longitude=${location.coords.longitude}&radiusKm=10`,
        );
        const data = await res.json();
        setHunts(Array.isArray(data) ? data : data.data || []);
      } catch {
        setHunts([]);
      }
    };
    fetchNearby();
    const interval = setInterval(fetchNearby, 30000);
    return () => clearInterval(interval);
  }, [location]);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>TreasureNet</Text>
        <Text style={styles.subtitle}>GPS Active • Nearby Hunts</Text>
      </View>

      <FlatList
        data={hunts}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <Text style={styles.empty}>No hunts nearby. Create one!</Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.huntCard}>
            <View style={styles.huntInfo}>
              <Text style={styles.huntTitle}>{item.title}</Text>
              <Text style={styles.huntMeta}>
                {item.difficulty} • {item.clueCount} clues
              </Text>
            </View>
            <View style={styles.huntReward}>
              <Text style={styles.rewardText}>{item.reward} XLM</Text>
              <Text style={styles.distanceText}>
                {item.distance
                  ? `${(item.distance / 1000).toFixed(1)} km`
                  : '---'}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  subtitle: { color: '#94A3B8', marginTop: 4, fontSize: 14 },
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
