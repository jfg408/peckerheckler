import { Tabs } from 'expo-router';
import { Colors } from '../../constants/Colors';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        tabBarStyle: { backgroundColor: Colors.bg, borderTopColor: Colors.border },
        tabBarActiveTintColor: Colors.forest,
        tabBarInactiveTintColor: Colors.textDim,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{ title: 'Status', tabBarLabel: 'Status' }}
      />
      <Tabs.Screen
        name="history"
        options={{ title: 'History', tabBarLabel: 'History' }}
      />
    </Tabs>
  );
}
