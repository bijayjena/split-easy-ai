import { Stack } from 'expo-router';
import '@/global.css';
import { ThemeProvider } from '@/components/ThemeProvider';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/components/AuthContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <SafeAreaProvider>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="login" />
            <Stack.Screen name="signup" />
            <Stack.Screen name="index" />
            <Stack.Screen name="profile" />
            <Stack.Screen name="create-group" />
            <Stack.Screen name="create-bill" />
            <Stack.Screen name="group-detail" />
            <Stack.Screen name="item-entry" />
            <Stack.Screen name="item-assignment" />
            <Stack.Screen name="split-preview" />
            <Stack.Screen name="split-summary" />
          </Stack>
        </SafeAreaProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}