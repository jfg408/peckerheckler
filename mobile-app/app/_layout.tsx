import { Stack } from 'expo-router';
import { StatusBar } from 'react-native';
import { Colors } from '../constants/Colors';

export default function RootLayout() {
  return (
    <>
      <StatusBar barStyle="light-content" backgroundColor={Colors.bg} />
      <Stack
        screenOptions={{
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.text,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: Colors.bg },
        }}
      >
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="incident/[id]"
          options={{
            title: '⚠️  Woodpecker Detected',
            headerBackTitle: 'Back',
            presentation: 'modal',
          }}
        />
      </Stack>
    </>
  );
}
