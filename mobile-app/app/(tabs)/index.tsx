'use client';
import { useEffect, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, RefreshControl, ScrollView, Switch,
} from 'react-native';
import { useFocusEffect } from 'expo-router';
import { api, DEVICE_ID } from '../../lib/api';
import { Device, ResponseAction } from '../../types';
import { Colors } from '../../constants/Colors';

const AUTO_RESPOND_OPTIONS: { value: ResponseAction; label: string; emoji: string }[] = [
  { value: 'hawk',       label: 'Hawk',        emoji: '🦅' },
  { value: 'eagle',      label: 'Eagle',       emoji: '🦅' },
  { value: 'polar_bear', label: 'Polar Bear',  emoji: '🐻‍❄️' },
  { value: 'banshee',    label: 'Banshee',     emoji: '👻' },
];

const DEFAULT_AUTO_ACTION: ResponseAction = 'eagle';

export default function StatusScreen() {
  const [device, setDevice]   = useState<Device | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);
  const [toggling, setToggling] = useState(false);
  const [autoRespond, setAutoRespond]     = useState(false);
  const [autoAction, setAutoAction]       = useState<ResponseAction>(DEFAULT_AUTO_ACTION);
  const [savingAuto, setSavingAuto]       = useState(false);

  const load = useCallback(async () => {
    try {
      setError(null);
      const d = await api.getDevice();
      setDevice(d);
      setAutoRespond(d.auto_respond ?? false);
      setAutoAction(d.auto_respond_action ?? DEFAULT_AUTO_ACTION);
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

  const updateAutoRespond = async (enabled: boolean, action: ResponseAction) => {
    setSavingAuto(true);
    try {
      await api.setAutoRespond(enabled, action);
      setAutoRespond(enabled);
      setAutoAction(action);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setSavingAuto(false);
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

      {/* Auto-respond */}
      {connected && (
        <View style={styles.card}>
          <View style={styles.row}>
            <Text style={styles.statusLabel}>Auto-respond</Text>
            <Switch
              value={autoRespond}
              onValueChange={(v) => updateAutoRespond(v, autoAction)}
              trackColor={{ true: Colors.forest }}
              thumbColor={Colors.text}
              disabled={savingAuto}
              style={{ marginLeft: 'auto' }}
            />
          </View>
          <Text style={styles.autoDesc}>
            Automatically play a deterrent when a woodpecker is detected. You'll still be notified.
          </Text>

          {autoRespond && (
            <View style={styles.optionGrid}>
              {AUTO_RESPOND_OPTIONS.map((o) => (
                <TouchableOpacity
                  key={o.value}
                  style={[styles.optionBtn, autoAction === o.value && styles.optionBtnActive]}
                  onPress={() => updateAutoRespond(true, o.value)}
                  disabled={savingAuto}
                >
                  <Text style={styles.optionEmoji}>{o.emoji}</Text>
                  <Text style={[styles.optionLabel, autoAction === o.value && styles.optionLabelActive]}>
                    {o.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
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
  root:            { flex: 1, backgroundColor: Colors.bg },
  content:         { padding: 20, gap: 16 },
  center:          { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.bg },
  deviceId:        { color: Colors.textDim, fontSize: 12, fontFamily: 'monospace', marginBottom: 4 },
  card:            { backgroundColor: Colors.surface, borderRadius: 12, padding: 16, gap: 12 },
  row:             { flexDirection: 'row', alignItems: 'center', gap: 10 },
  dot:             { width: 10, height: 10, borderRadius: 5 },
  statusLabel:     { color: Colors.text, fontSize: 16, fontWeight: '600' },
  errorText:       { color: Colors.danger, fontSize: 13 },
  button:          { borderRadius: 8, paddingVertical: 12, alignItems: 'center' },
  buttonStop:      { backgroundColor: Colors.danger },
  buttonStart:     { backgroundColor: Colors.forest },
  buttonText:      { color: Colors.text, fontWeight: '700', fontSize: 15 },
  meta:            { color: Colors.textDim, fontSize: 12, textAlign: 'center' },
  autoDesc:        { color: Colors.textDim, fontSize: 13, lineHeight: 18 },
  optionGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  optionBtn:       { flex: 1, minWidth: 70, borderRadius: 8, padding: 10, alignItems: 'center',
                     backgroundColor: Colors.bg, borderWidth: 1, borderColor: Colors.surface, gap: 4 },
  optionBtnActive: { borderColor: Colors.forest, backgroundColor: Colors.surface },
  optionEmoji:     { fontSize: 22 },
  optionLabel:     { color: Colors.textDim, fontSize: 12, fontWeight: '600' },
  optionLabelActive: { color: Colors.forest },
});
