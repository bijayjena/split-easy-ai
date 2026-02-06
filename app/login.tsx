import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Lock, Mail, Eye, EyeOff } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/components/ThemeToggle';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Get existing users from storage
      const usersData = await AsyncStorage.getItem('users');
      const users = usersData ? JSON.parse(usersData) : [];

      // Find user with matching email and password
      const user = users.find((u: any) => u.email === email && u.password === password);

      if (!user) {
        Alert.alert('Login Failed', 'Invalid email or password');
        setLoading(false);
        return;
      }

      // Store current user
      await AsyncStorage.setItem('currentUser', JSON.stringify(user));

      Alert.alert('Success', 'Logged in successfully!');
      
      // Navigate to home (tabs)
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      <View className="flex-row items-center justify-between px-6 py-4">
        <Text className="text-2xl font-bold text-foreground">Login</Text>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 128 }}>
        {/* Welcome Message */}
        <View className="mb-8">
          <Text className="text-3xl font-bold text-foreground mb-2">Welcome Back!</Text>
          <Text className="text-muted-foreground text-base">
            Sign in to continue splitting bills with your groups
          </Text>
        </View>

        {/* Login Form */}
        <View className="gap-6">
          {/* Email Input */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <View className={`flex-row items-center bg-card border rounded-lg px-4 ${errors.email ? 'border-destructive' : 'border-border'}`}>
              <Mail className="text-muted-foreground mr-3" size={20} />
              <TextInput
                className="flex-1 py-3 text-foreground"
                placeholder="your.email@example.com"
                placeholderTextColor="#999"
                value={email}
                onChangeText={(text) => {
                  setEmail(text);
                  if (errors.email) setErrors({ ...errors, email: undefined });
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
              />
            </View>
            {errors.email && (
              <Text className="text-destructive text-sm mt-1">{errors.email}</Text>
            )}
          </View>

          {/* Password Input */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className={`flex-row items-center bg-card border rounded-lg px-4 ${errors.password ? 'border-destructive' : 'border-border'}`}>
              <Lock className="text-muted-foreground mr-3" size={20} />
              <TextInput
                className="flex-1 py-3 text-foreground"
                placeholder="Enter your password"
                placeholderTextColor="#999"
                value={password}
                onChangeText={(text) => {
                  setPassword(text);
                  if (errors.password) setErrors({ ...errors, password: undefined });
                }}
                secureTextEntry={!showPassword}
                autoCapitalize="none"
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff className="text-muted-foreground" size={20} />
                ) : (
                  <Eye className="text-muted-foreground" size={20} />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && (
              <Text className="text-destructive text-sm mt-1">{errors.password}</Text>
            )}
          </View>

          {/* Login Button */}
          <TouchableOpacity
            className={`bg-primary rounded-lg py-4 items-center ${loading ? 'opacity-50' : ''}`}
            onPress={handleLogin}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">Login</Text>
            )}
          </TouchableOpacity>

          {/* Demo Credentials Card */}
          <View className="bg-accent rounded-lg p-4 border border-border">
            <Text className="font-semibold text-accent-foreground mb-2">Demo Credentials:</Text>
            <Text className="text-muted-foreground text-sm">Email: demo@example.com</Text>
            <Text className="text-muted-foreground text-sm">Password: demo123</Text>
            <TouchableOpacity
              className="mt-3 bg-card rounded-lg py-2 px-3 self-start border border-border"
              onPress={() => {
                setEmail('demo@example.com');
                setPassword('demo123');
              }}
            >
              <Text className="text-foreground text-sm">Use Demo Account</Text>
            </TouchableOpacity>
          </View>

          {/* Signup Link */}
          <View className="flex-row items-center justify-center gap-2 mt-4">
            <Text className="text-muted-foreground">Don't have an account?</Text>
            <TouchableOpacity onPress={() => router.push('/signup')}>
              <Text className="text-primary font-semibold">Sign Up</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}