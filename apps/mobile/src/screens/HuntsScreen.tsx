import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export function HuntsScreen() {
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>My Hunts</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.empty}>Your active hunts will appear here</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  empty: { color: '#94A3B8', fontSize: 16 },
});
