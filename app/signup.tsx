import React, { useState } from 'react';
import { View, Text, TextInput, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react-native';
import { ThemeToggle } from '@/components/ThemeToggle';
import AsyncStorage from '@react-native-async-storage/async-storage';

type User = {
  id: string;
  name: string;
  email: string;
  password: string;
  createdAt: string;
};

export default function SignupScreen() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; confirmPassword?: string }>({});
  const [loading, setLoading] = useState(false);

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; confirmPassword?: string } = {};
    let isValid = true;

    // Name validation
    if (!name.trim()) {
      newErrors.name = 'Name is required';
      isValid = false;
    } else if (name.trim().length < 2) {
      newErrors.name = 'Name must be at least 2 characters';
      isValid = false;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      newErrors.email = 'Email is required';
      isValid = false;
    } else if (!emailRegex.test(email)) {
      newErrors.email = 'Please enter a valid email';
      isValid = false;
    }

    // Password validation
    if (!password) {
      newErrors.password = 'Password is required';
      isValid = false;
    } else if (password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
      isValid = false;
    }

    // Confirm password validation
    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
      isValid = false;
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleSignup = async () => {
    if (!validateForm()) return;

    setLoading(true);
    try {
      // Get existing users
      const usersJson = await AsyncStorage.getItem('users');
      const users: User[] = usersJson ? JSON.parse(usersJson) : [];

      // Check if email already exists
      const emailExists = users.some(u => u.email.toLowerCase() === email.toLowerCase());
      if (emailExists) {
        setErrors({ email: 'This email is already registered' });
        setLoading(false);
        return;
      }

      // Create new user
      const newUser: User = {
        id: `user-${Date.now()}`,
        name: name.trim(),
        email: email.trim().toLowerCase(),
        password,
        createdAt: new Date().toISOString(),
      };

      // Save user
      users.push(newUser);
      await AsyncStorage.setItem('users', JSON.stringify(users));

      // Auto-login
      await AsyncStorage.setItem('currentUser', JSON.stringify(newUser));

      Alert.alert('Success', 'Account created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to create account. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const clearError = (field: keyof typeof errors) => {
    setErrors(prev => ({ ...prev, [field]: undefined }));
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4">
        <TouchableOpacity onPress={() => router.back()} className="p-2 -ml-2">
          <ArrowLeft size={24} className="text-foreground" />
        </TouchableOpacity>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 24 }}>
        {/* Title */}
        <View className="pt-8">
          <Text className="text-3xl font-bold text-foreground">Create Account</Text>
          <Text className="text-muted-foreground mt-2">Sign up to get started</Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          {/* Name Field */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Full Name</Text>
            <View className={`flex-row items-center bg-card border ${errors.name ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-3`}>
              <User size={20} className={errors.name ? 'text-destructive' : 'text-muted-foreground'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="Enter your name"
                placeholderTextColor="text-muted-foreground"
                value={name}
                onChangeText={(value) => {
                  setName(value);
                  clearError('name');
                }}
                autoCapitalize="words"
              />
            </View>
            {errors.name && <Text className="text-destructive text-xs mt-1 ml-1">{errors.name}</Text>}
          </View>

          {/* Email Field */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Email</Text>
            <View className={`flex-row items-center bg-card border ${errors.email ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-3`}>
              <Mail size={20} className={errors.email ? 'text-destructive' : 'text-muted-foreground'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="Enter your email"
                placeholderTextColor="text-muted-foreground"
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  clearError('email');
                }}
                keyboardType="email-address"
                autoCapitalize="none"
              />
            </View>
            {errors.email && <Text className="text-destructive text-xs mt-1 ml-1">{errors.email}</Text>}
          </View>

          {/* Password Field */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Password</Text>
            <View className={`flex-row items-center bg-card border ${errors.password ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-3`}>
              <Lock size={20} className={errors.password ? 'text-destructive' : 'text-muted-foreground'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="Create a password"
                placeholderTextColor="text-muted-foreground"
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  clearError('password');
                }}
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                {showPassword ? (
                  <EyeOff size={20} className="text-muted-foreground" />
                ) : (
                  <Eye size={20} className="text-muted-foreground" />
                )}
              </TouchableOpacity>
            </View>
            {errors.password && <Text className="text-destructive text-xs mt-1 ml-1">{errors.password}</Text>}
          </View>

          {/* Confirm Password Field */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Confirm Password</Text>
            <View className={`flex-row items-center bg-card border ${errors.confirmPassword ? 'border-destructive' : 'border-border'} rounded-xl px-4 py-3`}>
              <Lock size={20} className={errors.confirmPassword ? 'text-destructive' : 'text-muted-foreground'} />
              <TextInput
                className="flex-1 ml-3 text-foreground"
                placeholder="Confirm your password"
                placeholderTextColor="text-muted-foreground"
                value={confirmPassword}
                onChangeText={(value) => {
                  setConfirmPassword(value);
                  clearError('confirmPassword');
                }}
                secureTextEntry={!showConfirmPassword}
              />
              <TouchableOpacity onPress={() => setShowConfirmPassword(!showConfirmPassword)}>
                {showConfirmPassword ? (
                  <EyeOff size={20} className="text-muted-foreground" />
                ) : (
                  <Eye size={20} className="text-muted-foreground" />
                )}
              </TouchableOpacity>
            </View>
            {errors.confirmPassword && <Text className="text-destructive text-xs mt-1 ml-1">{errors.confirmPassword}</Text>}
            
            {/* Password Match Indicator */}
            {confirmPassword && !errors.confirmPassword && password === confirmPassword && (
              <Text className="text-green-500 text-xs mt-1 ml-1 flex-row items-center">
                ✓ Passwords match
              </Text>
            )}
          </View>

          {/* Sign Up Button */}
          <TouchableOpacity
            onPress={handleSignup}
            disabled={loading}
            className="bg-primary rounded-xl py-4 items-center justify-center mt-4"
          >
            {loading ? (
              <ActivityIndicator color="white" />
            ) : (
              <Text className="text-primary-foreground font-semibold text-base">Create Account</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Login Link */}
        <View className="flex-row items-center justify-center mt-4">
          <Text className="text-muted-foreground">Already have an account? </Text>
          <TouchableOpacity onPress={() => router.push('/login')}>
            <Text className="text-primary font-semibold">Sign In</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}