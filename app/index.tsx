import React, { useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useAuth } from '@/components/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Users, FileText, Plus, TrendingUp } from 'lucide-react-native';

export default function HomeScreen() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && !user) {
      router.replace('/login');
    }
  }, [user, loading]);

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <View>
          <Text className="text-muted-foreground">Welcome back,</Text>
          <Text className="text-2xl font-bold text-foreground">{user.name}</Text>
        </View>
        <View className="flex-row items-center gap-4">
          <ThemeToggle />
          <TouchableOpacity onPress={() => router.push('/profile')}>
            <View className="w-10 h-10 rounded-full bg-primary items-center justify-center">
              <Text className="text-primary-foreground font-bold">
                {user.name.charAt(0).toUpperCase()}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 24 }}>
        {/* Quick Actions */}
        <View className="gap-4">
          <Text className="text-xl font-bold text-foreground">Quick Actions</Text>
          <View className="flex-row gap-4">
            <TouchableOpacity 
              className="flex-1"
              onPress={() => router.push('/create-group')}
            >
              <View className="bg-card border border-border rounded-xl p-4 items-center gap-2">
                <Users className="text-primary" size={32} />
                <Text className="font-semibold text-foreground">New Group</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity 
              className="flex-1"
              onPress={() => router.push('/create-bill')}
            >
              <View className="bg-card border border-border rounded-xl p-4 items-center gap-2">
                <FileText className="text-primary" size={32} />
                <Text className="font-semibold text-foreground">New Bill</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Stats Overview */}
        <View className="gap-4">
          <Text className="text-xl font-bold text-foreground">Overview</Text>
          <View className="flex-row gap-4">
            <View className="flex-1 bg-card border border-border rounded-xl p-4">
              <Users className="text-primary mb-2" size={24} />
              <Text className="text-2xl font-bold text-foreground">0</Text>
              <Text className="text-sm text-muted-foreground">Groups</Text>
            </View>
            <View className="flex-1 bg-card border border-border rounded-xl p-4">
              <FileText className="text-primary mb-2" size={24} />
              <Text className="text-2xl font-bold text-foreground">0</Text>
              <Text className="text-sm text-muted-foreground">Bills</Text>
            </View>
          </View>
        </View>

        {/* Recent Activity */}
        <View className="gap-4">
          <Text className="text-xl font-bold text-foreground">Recent Activity</Text>
          <View className="bg-card border border-border rounded-xl p-6 items-center">
            <TrendingUp className="text-muted-foreground mb-2" size={48} />
            <Text className="text-lg font-semibold text-foreground">No Activity Yet</Text>
            <Text className="text-muted-foreground text-center mt-2">
              Create your first group or bill to get started
            </Text>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}