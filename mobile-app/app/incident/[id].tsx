import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Alert, ScrollView,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Audio } from 'expo-av';
import { api, streamUri } from '../../lib/api';
import { ResponseAction } from '../../types';
import { Colors } from '../../constants/Colors';

interface Option {
  action: ResponseAction;
  label: string;
  sub: string;
  color: string;
}

const OPTIONS: Option[] = [
  { action: 'hawk',       label: '🦅  Hawk',           sub: 'most recommended',        color: Colors.forest },
  { action: 'eagle',      label: '🦆  Eagle',          sub: 'recommended for variety', color: Colors.forestLight },
  { action: 'polar_bear', label: '🐻  Polar Bear',     sub: 'most unexpected',         color: Colors.amber },
  { action: 'stream',     label: '🎤  Speak directly', sub: 'not recommended',         color: '#6b4c9a' },
];

type Screen = 'options' | 'speak_warning' | 'streaming' | 'done';

export default function IncidentScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const incidentId = parseInt(id, 10);

  const [screen, setScreen]         = useState<Screen>('options');
  const [submitting, setSubmitting] = useState<ResponseAction | null>(null);
  const wsRef  = useRef<WebSocket | null>(null);
  const recRef = useRef<Audio.Recording | null>(null);

  useEffect(() => {
    return () => { stopStream(); };
  }, []);

  /* ------------------------------------------------------------------ */

  const respond = async (action: ResponseAction) => {
    if (submitting) return;

    if (action === 'stream') {
      setScreen('speak_warning');
      return;
    }

    setSubmitting(action);
    try {
      const res = await api.respondToIncident(incidentId, action);
      if (res.ok || res.status === 204) {
        setScreen('done');
        setTimeout(() => router.back(), 1200);
      } else if (res.status === 429) {
        Alert.alert(
          'Polar Bear limit reached',
          'Polar Bear may only be used once per day per device. Please choose another deterrent.'
        );
      } else {
        Alert.alert('Error', `Server returned ${res.status}`);
      }
    } catch (e: any) {
      Alert.alert('Error', e.message);
    } finally {
      setSubmitting(null);
    }
  };

  /* ------------------------------------------------------------------ */

  const startStream = async () => {
    setScreen('streaming');
    await api.respondToIncident(incidentId, 'stream').catch(() => {});

    const { granted } = await Audio.requestPermissionsAsync();
    if (!granted) {
      Alert.alert('Permission required', 'Microphone access is needed to speak directly.');
      setScreen('options');
      return;
    }

    await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
    const recording = new Audio.Recording();
    await recording.prepareToRecordAsync({
      android: {
        extension: '.pcm',
        outputFormat: Audio.AndroidOutputFormat.PCM_16BIT,
        audioEncoder: Audio.AndroidAudioEncoder.PCM_16BIT,
        sampleRate: 16000, numberOfChannels: 1, bitRate: 256000,
      },
      ios: {
        extension: '.pcm',
        audioQuality: Audio.IOSAudioQuality.HIGH,
        sampleRate: 16000, numberOfChannels: 1, bitRate: 256000,
        linearPCMBitDepth: 16, linearPCMIsBigEndian: false, linearPCMIsFloat: false,
      },
      web: {},
    });
    recRef.current = recording;
    await recording.startAsync();

    const ws = new WebSocket(streamUri(incidentId, 'sender'));
    wsRef.current = ws;
  };

  const stopStream = async () => {
    if (recRef.current) {
      await recRef.current.stopAndUnloadAsync().catch(() => {});
      recRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setScreen('done');
    router.back();
  };

  /* ------------------------------------------------------------------ */
  /* Screens                                                              */
  /* ------------------------------------------------------------------ */

  if (screen === 'done') {
    return (
      <View style={styles.center}>
        <Text style={styles.doneText}>✓ Response sent</Text>
      </View>
    );
  }

  if (screen === 'streaming') {
    return (
      <View style={styles.center}>
        <Text style={styles.streamingEmoji}>🎤</Text>
        <Text style={styles.streamingLabel}>Speaking directly to the woodpecker</Text>
        <Text style={styles.streamingSub}>(not recommended)</Text>
        <TouchableOpacity style={styles.stopButton} onPress={stopStream}>
          <Text style={styles.stopButtonText}>Stop</Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (screen === 'speak_warning') {
    return (
      <ScrollView style={styles.root} contentContainerStyle={styles.warningContent}>
        <Text style={styles.warningHeadline}>⚠️  Legal Notice</Text>
        <Text style={styles.warningBody}>
          You are about to speak directly with the woodpecker.
          {'\n\n'}
          Harassment of a woodpecker is a federal crime and is prohibited by our
          terms of use. Please refrain from:
        </Text>

        {[
          'Threatening language',
          'Any reference to home addresses, family names, or other veiled threats',
          'Any non-consensual dialogue of a sexual nature',
        ].map((item) => (
          <View key={item} style={styles.bulletRow}>
            <Text style={styles.bullet}>•</Text>
            <Text style={styles.bulletText}>{item}</Text>
          </View>
        ))}

        <Text style={styles.warningFooter}>
          Pecker Heckler is not responsible for your speech. You are.
        </Text>

        <TouchableOpacity style={styles.understandButton} onPress={startStream}>
          <Text style={styles.understandButtonText}>I understand — proceed</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.cancelButton} onPress={() => setScreen('options')}>
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </ScrollView>
    );
  }

  /* Default: options screen */
  return (
    <View style={styles.root}>
      <Text style={styles.headline}>WOODPECKER{'\n'}DETECTED!</Text>
      <Text style={styles.sub}>How will you respond??</Text>

      <View style={styles.options}>
        {OPTIONS.map((opt) => (
          <TouchableOpacity
            key={opt.action}
            style={[styles.option, { borderLeftColor: opt.color }]}
            onPress={() => respond(opt.action)}
            disabled={!!submitting}
            activeOpacity={0.75}
          >
            <View style={styles.optionLeft}>
              <Text style={styles.optionLabel}>{opt.label}</Text>
              <Text style={styles.optionSub}>{opt.sub}</Text>
            </View>
            {submitting === opt.action && (
              <ActivityIndicator color={opt.color} size="small" />
            )}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root:               { flex: 1, backgroundColor: Colors.bg, padding: 24, justifyContent: 'center' },
  center:             { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', gap: 16 },

  /* Options screen */
  headline:           { color: Colors.text, fontSize: 36, fontWeight: '900', textAlign: 'center', letterSpacing: 1, marginBottom: 8 },
  sub:                { color: Colors.textDim, fontSize: 18, textAlign: 'center', marginBottom: 32 },
  options:            { gap: 14 },
  option:             {
    backgroundColor: Colors.surface, borderRadius: 14, padding: 20,
    borderLeftWidth: 5, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
  },
  optionLeft:         { flex: 1 },
  optionLabel:        { color: Colors.text, fontSize: 20, fontWeight: '700', marginBottom: 4 },
  optionSub:          { color: Colors.textDim, fontSize: 13 },

  /* Streaming screen */
  doneText:           { color: Colors.forest, fontSize: 24, fontWeight: '700' },
  streamingEmoji:     { fontSize: 64 },
  streamingLabel:     { color: Colors.text, fontSize: 20, fontWeight: '700', textAlign: 'center' },
  streamingSub:       { color: Colors.textDim, fontSize: 14 },
  stopButton:         { backgroundColor: Colors.danger, borderRadius: 10, paddingHorizontal: 32, paddingVertical: 14, marginTop: 12 },
  stopButtonText:     { color: Colors.text, fontWeight: '700', fontSize: 16 },

  /* Warning screen */
  warningContent:     { padding: 24, gap: 16 },
  warningHeadline:    { color: Colors.text, fontSize: 24, fontWeight: '900', marginBottom: 4 },
  warningBody:        { color: Colors.textDim, fontSize: 15, lineHeight: 24 },
  bulletRow:          { flexDirection: 'row', gap: 10, paddingLeft: 4 },
  bullet:             { color: Colors.danger, fontSize: 16, marginTop: 2 },
  bulletText:         { color: Colors.text, fontSize: 15, flex: 1, lineHeight: 22 },
  warningFooter:      { color: Colors.textDim, fontSize: 13, fontStyle: 'italic', marginTop: 8 },
  understandButton:   { backgroundColor: '#6b4c9a', borderRadius: 10, paddingVertical: 14, alignItems: 'center', marginTop: 8 },
  understandButtonText: { color: Colors.text, fontWeight: '700', fontSize: 16 },
  cancelButton:       { borderRadius: 10, paddingVertical: 14, alignItems: 'center' },
  cancelButtonText:   { color: Colors.textDim, fontSize: 15 },
});
