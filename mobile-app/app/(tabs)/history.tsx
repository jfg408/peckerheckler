import { useCallback, useState } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  RefreshControl, TouchableOpacity,
} from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import { api } from '../../lib/api';
import { Incident } from '../../types';
import { Colors } from '../../constants/Colors';

const ACTION_LABEL: Record<string, string> = {
  hawk:        '🦅 Hawk',
  eagle:       '🦆 Eagle',
  polar_bear:  '🐻 Polar Bear',
  stream:      '🎤 Spoke directly',
};

function IncidentCard({ item }: { item: Incident }) {
  const router = useRouter();
  const date   = new Date(item.detected_at);
  const responded = !!item.response_action;

  return (
    <TouchableOpacity
      style={[styles.incidentCard, !responded && styles.incidentCardPending]}
      onPress={() => router.push(`/incident/${item.id}`)}
      activeOpacity={0.8}
    >
      <View style={styles.incidentHeader}>
        <Text style={styles.incidentTitle}>🪵 Woodpecker detected</Text>
        {!responded && (
          <View style={styles.pendingBadge}>
            <Text style={styles.pendingBadgeText}>RESPOND</Text>
          </View>
        )}
      </View>
      <Text style={styles.incidentTime}>{date.toLocaleString()}</Text>
      {responded && (
        <Text style={styles.incidentResponse}>
          Response: {ACTION_LABEL[item.response_action!] ?? item.response_action}
        </Text>
      )}
    </TouchableOpacity>
  );
}

export default function HistoryScreen() {
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading]     = useState(true);

  const load = useCallback(async () => {
    try {
      const data = await api.getIncidents();
      setIncidents(data);
    } catch {}
    finally { setLoading(false); }
  }, []);

  useFocusEffect(useCallback(() => { load(); }, [load]));

  if (!loading && incidents.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>No incidents yet.</Text>
        <Text style={styles.emptySubText}>Monitoring is active — you'll be notified when a woodpecker is detected.</Text>
      </View>
    );
  }

  return (
    <FlatList
      style={styles.root}
      data={incidents}
      keyExtractor={item => String(item.id)}
      renderItem={({ item }) => <IncidentCard item={item} />}
      contentContainerStyle={styles.list}
      refreshControl={
        <RefreshControl refreshing={loading} onRefresh={load} tintColor={Colors.forest} />
      }
    />
  );
}

const styles = StyleSheet.create({
  root:                 { flex: 1, backgroundColor: Colors.bg },
  list:                 { padding: 16, gap: 12 },
  incidentCard:         {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    borderLeftWidth: 4,
    borderLeftColor: Colors.forest,
    gap: 6,
  },
  incidentCardPending:  {
    borderLeftColor: Colors.amber,
    backgroundColor: Colors.surfaceHigh,
  },
  incidentHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  incidentTitle:        { color: Colors.text, fontSize: 17, fontWeight: '700' },
  incidentTime:         { color: Colors.textDim, fontSize: 13 },
  incidentResponse:     { color: Colors.forestLight, fontSize: 14, fontWeight: '500' },
  pendingBadge:         {
    backgroundColor: Colors.amber,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  pendingBadgeText:     { color: Colors.bg, fontSize: 11, fontWeight: '800' },
  empty:                { flex: 1, backgroundColor: Colors.bg, justifyContent: 'center', alignItems: 'center', padding: 32 },
  emptyText:            { color: Colors.text, fontSize: 18, fontWeight: '700', marginBottom: 8 },
  emptySubText:         { color: Colors.textDim, fontSize: 14, textAlign: 'center', lineHeight: 22 },
});
