'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, DEVICE_ID } from '../../lib/api';
import { Device } from '../../types';
import { Colors } from '../../constants/Colors';

export default function StatusScreen() {
  const [device, setDevice]   = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await api.getDevice();
      setDevice(d);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  const toggle = async () => {
    if (!device) return;
    setToggling(true);
    try {
      await api.controlDevice(device.is_monitoring ? 'stop' : 'start');
      await load();
    } catch (e: any) {
      setError(e.message);
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.forest} size="large" />
      </View>
    );
  }

  const connected = !!device && !error;
  const listening = connected && device.is_monitoring;

  return (
    <ScrollView
      style={styles.root}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.forest} />}
    >
      {/* Device ID */}
      <Text style={styles.deviceId}>{DEVICE_ID}</Text>

      {/* Connection status */}
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.dot, { backgroundColor: connected ? Colors.forest : Colors.danger }]} />
          <Text style={styles.statusLabel}>
            {connected ? 'Device connected' : 'Device not found'}
          </Text>
        </View>
        {error && <Text style={styles.errorText}>{error}</Text>}
      </View>

      {/* Listening status */}
      {connected && (
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.dot, { backgroundColor: listening ? Colors.amber : Colors.textDim }]} />
            <Text style={styles.statusLabel}>
              {listening ? 'Listening for woodpeckers' : 'Monitoring paused'}
            </Text>
          </View>

          <TouchableOpacity
            style={[styles.button, listening ? styles.buttonStop : styles.buttonStart]}
            onPress={toggle}
            disabled={toggling}
          >
            {toggling
              ? <ActivityIndicator color={Colors.text} size="small" />
              : <Text style={styles.buttonText}>
                  {listening ? 'Pause Monitoring' : 'Resume Monitoring'}
                </Text>
            }
          </TouchableOpacity>
        </View>
      )}

      {device && (
        <Text style={styles.meta}>
          Registered {new Date(device.registered_at).toLocaleDateString()}
        </Text>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root:        { flex: 1, backgroundColor: Colors.bg },
  content:     { padding: 20, gap: 16 },
  center:      { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  deviceId:    { color: Colors.textDim, fontSize: 12, fontFamily: 'monospace', marginBottom: 4 },
  card:        { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  row:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:         { width: 10, height: 10, borderRadius: 5 },
  statusLabel: { color: Colors.text, fontSize: 16, fontWeight: '600' },
  errorText:   { color: Colors.danger, fontSize: 13 },
  button:      { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonStop:  { backgroundColor: Colors.danger },
  buttonStart: { backgroundColor: Colors.forest },
  buttonText:  { color: Colors.text, fontWeight: '700', fontSize: 15 },
  meta:        { color: Colors.textDim, fontSize: 12, textAlign: 'center' },
});
