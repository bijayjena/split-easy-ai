import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Receipt, Camera, Image as ImageIcon, X, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Group {
  id: string;
  name: string;
  description: string;
  members: any[];
  createdAt: string;
}

export default function CreateBillScreen() {
  const router = useRouter();
  const { groupId } = useLocalSearchParams();
  
  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Form state
  const [title, setTitle] = useState('');
  const [invoiceUrl, setInvoiceUrl] = useState('');
  const [errors, setErrors] = useState<{ title?: string }>({});

  useEffect(() => {
    loadGroup();
  }, [groupId]);

  const loadGroup = async () => {
    try {
      const groupsJson = await AsyncStorage.getItem('groups');
      if (groupsJson) {
        const groups = JSON.parse(groupsJson);
        const foundGroup = groups.find((g: Group) => g.id === groupId);
        if (foundGroup) {
          setGroup(foundGroup);
        } else {
          Alert.alert('Error', 'Group not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading group:', error);
      Alert.alert('Error', 'Failed to load group');
    } finally {
      setLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { title?: string } = {};

    if (!title.trim()) {
      newErrors.title = 'Bill title is required';
    } else if (title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSimulateUpload = () => {
    Alert.alert(
      'Image Upload',
      'Choose upload method:',
      [
        {
          text: 'Camera',
          onPress: () => simulateImageCapture('camera'),
        },
        {
          text: 'Gallery',
          onPress: () => simulateImageCapture('gallery'),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ]
    );
  };

  const simulateImageCapture = (source: 'camera' | 'gallery') => {
    // Simulate image upload with a placeholder
    const placeholderImages = [
      'https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=800',
      'https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?w=800',
      'https://images.unsplash.com/photo-1554224154-26032ffc0d07?w=800',
    ];
    
    const randomImage = placeholderImages[Math.floor(Math.random() * placeholderImages.length)];
    setInvoiceUrl(randomImage);
    
    Alert.alert(
      'Success',
      `Invoice image uploaded from ${source}!\n\nNote: In production, this would use expo-image-picker to capture real photos.`
    );
  };

  const handleRemoveImage = () => {
    Alert.alert(
      'Remove Invoice',
      'Are you sure you want to remove the invoice image?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => setInvoiceUrl(''),
        },
      ]
    );
  };

  const handleProceed = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      // Create bill object
      const billId = `bill-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      const newBill = {
        id: billId,
        groupId: groupId as string,
        title: title.trim(),
        invoiceUrl: invoiceUrl || '',
        items: [], // Will be added in next screen
        platformFeePercent: 2.5,
        discountPercent: 0,
        splits: [],
        totalExtracted: 0,
        totalFinal: 0,
        status: 'pending' as const,
        createdAt: new Date().toISOString(),
      };

      // Save to AsyncStorage
      const billsJson = await AsyncStorage.getItem('bills');
      const bills = billsJson ? JSON.parse(billsJson) : [];
      bills.push(newBill);
      await AsyncStorage.setItem('bills', JSON.stringify(bills));

      // Navigate to item entry screen
      router.push(`/item-entry?billId=${billId}`);
    } catch (error) {
      console.error('Error creating bill:', error);
      Alert.alert('Error', 'Failed to create bill. Please try again.');
    }
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-foreground">New Bill</Text>
            <Text className="text-sm text-muted-foreground">{group?.name}</Text>
          </View>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ padding: 24, paddingBottom: 128, gap: 24 }}>
        {/* Bill Title */}
        <View className="gap-2">
          <View className="flex-row items-center gap-2">
            <Receipt className="text-primary" size={20} />
            <Text className="text-base font-semibold text-foreground">Bill Title</Text>
          </View>
          <TextInput
            className="bg-card border border-border rounded-lg px-4 py-3 text-foreground"
            placeholder="e.g., Team Lunch, Grocery Shopping"
            placeholderTextColor="#9CA3AF"
            value={title}
            onChangeText={(text) => {
              setTitle(text);
              if (errors.title) {
                setErrors({ ...errors, title: undefined });
              }
            }}
            autoCapitalize="words"
          />
          {errors.title && (
            <Text className="text-sm text-red-500">{errors.title}</Text>
          )}
        </View>

        {/* Invoice Upload */}
        <View className="gap-3">
          <View className="flex-row items-center gap-2">
            <Camera className="text-primary" size={20} />
            <Text className="text-base font-semibold text-foreground">Invoice Image</Text>
            <Text className="text-sm text-muted-foreground">(Optional)</Text>
          </View>

          {!invoiceUrl ? (
            <View className="gap-3">
              <TouchableOpacity
                onPress={handleSimulateUpload}
                className="bg-card border-2 border-dashed border-border rounded-xl p-8 items-center gap-3"
              >
                <View className="bg-primary/10 rounded-full p-4">
                  <ImageIcon className="text-primary" size={32} />
                </View>
                <Text className="text-base font-medium text-foreground">Upload Invoice</Text>
                <Text className="text-sm text-muted-foreground text-center">
                  Take a photo or choose from gallery
                </Text>
              </TouchableOpacity>

              <View className="flex-row gap-3">
                <TouchableOpacity
                  onPress={() => simulateImageCapture('camera')}
                  className="flex-1 bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
                >
                  <Camera className="text-white" size={20} />
                  <Text className="text-white font-semibold">Camera</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={() => simulateImageCapture('gallery')}
                  className="flex-1 bg-secondary rounded-lg py-3 flex-row items-center justify-center gap-2"
                >
                  <ImageIcon className="text-secondary-foreground" size={20} />
                  <Text className="text-secondary-foreground font-semibold">Gallery</Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View className="gap-3">
              <View className="bg-card border border-border rounded-xl overflow-hidden">
                <Image
                  source={{ uri: invoiceUrl }}
                  style={{ width: '100%', height: 300 }}
                  resizeMode="cover"
                />
                <TouchableOpacity
                  onPress={handleRemoveImage}
                  className="absolute top-3 right-3 bg-destructive rounded-full p-2"
                >
                  <X className="text-white" size={20} />
                </TouchableOpacity>
              </View>

              <View className="bg-primary/10 border border-primary/20 rounded-lg p-4 flex-row gap-3">
                <Text className="text-primary">✓</Text>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-primary">Invoice Uploaded</Text>
                  <Text className="text-xs text-primary/70 mt-1">
                    Tap the X button to remove and upload a different image
                  </Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Info Card */}
        <View className="bg-accent/30 border border-accent rounded-lg p-4 gap-2">
          <Text className="text-sm font-medium text-accent-foreground">💡 Next Steps</Text>
          <Text className="text-xs text-accent-foreground/80 leading-5">
            After creating the bill, you'll be able to:
            {'\n'}• Add individual items with prices
            {'\n'}• Assign items to group members
            {'\n'}• Calculate automatic splits
            {'\n'}• Share payment details
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 bg-background border-t border-border p-6">
        <TouchableOpacity
          onPress={handleProceed}
          className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
          disabled={!title.trim()}
          style={{ opacity: title.trim() ? 1 : 0.5 }}
        >
          <Text className="text-white font-bold text-base">Continue to Items</Text>
          <ArrowRight className="text-white" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}