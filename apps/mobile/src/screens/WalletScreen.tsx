import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useMobileWallet } from '../hooks/useMobileWallet';

export function WalletScreen() {
  const { publicKey, balance, loading, sending, txResult, sendTx, refreshBalance } =
    useMobileWallet();
  const [destination, setDestination] = useState('');
  const [amount, setAmount] = useState('');

  const handleSend = async () => {
    if (!destination || !amount) return;
    await sendTx(destination, amount);
    setDestination('');
    setAmount('');
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Wallet</Text>
        </View>
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Wallet</Text>
      </View>

      <ScrollView style={styles.content}>
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceLabel}>Your Balance</Text>
          <Text style={styles.balanceValue}>{balance || '0'} XLM</Text>
          <Text style={styles.networkBadge}>Testnet</Text>
          <TouchableOpacity style={styles.refreshBtn} onPress={refreshBalance}>
            <Text style={styles.refreshText}>Refresh</Text>
          </TouchableOpacity>
        </View>

        {/* Address */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Your Address</Text>
          <Text style={styles.address} selectable>
            {publicKey}
          </Text>
        </View>

        {/* Send Payment */}
        <View style={styles.card}>
          <Text style={styles.cardLabel}>Send XLM</Text>

          <Text style={styles.inputLabel}>Destination Address</Text>
          <TextInput
            style={styles.input}
            placeholder="G..."
            placeholderTextColor="#64748B"
            value={destination}
            onChangeText={setDestination}
            autoCapitalize="none"
          />

          <Text style={styles.inputLabel}>Amount (XLM)</Text>
          <TextInput
            style={styles.input}
            placeholder="0.1"
            placeholderTextColor="#64748B"
            value={amount}
            onChangeText={setAmount}
            keyboardType="decimal-pad"
          />

          <TouchableOpacity
            style={[styles.sendButton, (!destination || !amount || sending) && styles.sendDisabled]}
            onPress={handleSend}
            disabled={!destination || !amount || sending}
          >
            {sending ? (
              <ActivityIndicator color="#0F172A" />
            ) : (
              <Text style={styles.sendText}>Send {amount || '0'} XLM</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Transaction Result */}
        {txResult && (
          <View
            style={[
              styles.card,
              {
                borderColor: txResult.success ? '#22C55E' : '#EF4444',
                borderWidth: 2,
              },
            ]}
          >
            <Text style={styles.cardLabel}>
              {txResult.success ? 'Transaction Sent' : 'Transaction Failed'}
            </Text>

            {txResult.hash ? (
              <View style={styles.txDetail}>
                <Text style={styles.txHash} selectable>
                  {txResult.hash}
                </Text>
              </View>
            ) : null}

            {txResult.error ? (
              <Text style={styles.errorText}>{txResult.error}</Text>
            ) : null}

            {txResult.explorerUrl ? (
              <Text style={styles.explorerLink}>View on Stellar Expert</Text>
            ) : null}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#0F172A' },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { padding: 20, paddingTop: 60 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#F59E0B' },
  content: { flex: 1, padding: 20 },
  balanceCard: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  balanceLabel: { color: '#94A3B8', fontSize: 14, marginBottom: 4 },
  balanceValue: { color: '#F59E0B', fontWeight: 'bold', fontSize: 36 },
  networkBadge: {
    color: '#64748B',
    fontSize: 11,
    backgroundColor: 'rgba(100, 116, 139, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 4,
    marginTop: 4,
  },
  refreshBtn: { marginTop: 12 },
  refreshText: { color: '#F59E0B', fontSize: 14 },
  card: {
    backgroundColor: '#1E293B',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  cardLabel: {
    color: '#94A3B8',
    fontSize: 12,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  address: { color: '#F8FAFC', fontFamily: 'monospace', fontSize: 12 },
  inputLabel: { color: '#94A3B8', fontSize: 13, marginBottom: 6 },
  input: {
    backgroundColor: '#0F172A',
    borderRadius: 12,
    padding: 14,
    color: '#F8FAFC',
    fontSize: 15,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#334155',
  },
  sendButton: {
    backgroundColor: '#F59E0B',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 4,
  },
  sendDisabled: { opacity: 0.5 },
  sendText: { color: '#0F172A', fontWeight: 'bold', fontSize: 16 },
  txDetail: {
    backgroundColor: '#0F172A',
    borderRadius: 8,
    padding: 10,
    marginBottom: 8,
  },
  txHash: { color: '#94A3B8', fontFamily: 'monospace', fontSize: 11 },
  errorText: { color: '#EF4444', fontSize: 13, marginTop: 4 },
  explorerLink: { color: '#F59E0B', fontSize: 13, marginTop: 8 },
});
