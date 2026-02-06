import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Plus, Edit2, Trash2, ShoppingCart, ArrowRight } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface Bill {
  id: string;
  groupId: string;
  title: string;
  invoiceUrl: string;
  items: Item[];
  platformFeePercent: number;
  discountPercent: number;
  splits: any[];
  totalExtracted: number;
  totalFinal: number;
  status: string;
  createdAt: string;
}

export default function ItemEntryScreen() {
  const router = useRouter();
  const { billId } = useLocalSearchParams();
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Add/Edit modal state
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState<Item | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemPrice, setItemPrice] = useState('');
  const [itemQuantity, setItemQuantity] = useState('1');
  const [errors, setErrors] = useState<{ name?: string; price?: string; quantity?: string }>({});

  useEffect(() => {
    loadBill();
  }, [billId]);

  const loadBill = async () => {
    try {
      const billsJson = await AsyncStorage.getItem('bills');
      if (billsJson) {
        const bills = JSON.parse(billsJson);
        const foundBill = bills.find((b: Bill) => b.id === billId);
        if (foundBill) {
          setBill(foundBill);
          setItems(foundBill.items || []);
        } else {
          Alert.alert('Error', 'Bill not found');
          router.back();
        }
      }
    } catch (error) {
      console.error('Error loading bill:', error);
      Alert.alert('Error', 'Failed to load bill');
    } finally {
      setLoading(false);
    }
  };

  const calculateSubtotal = () => {
    return items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  };

  const openAddModal = () => {
    setEditingItem(null);
    setItemName('');
    setItemPrice('');
    setItemQuantity('1');
    setErrors({});
    setShowModal(true);
  };

  const openEditModal = (item: Item) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemPrice(item.price.toString());
    setItemQuantity(item.quantity.toString());
    setErrors({});
    setShowModal(true);
  };

  const validateItem = () => {
    const newErrors: { name?: string; price?: string; quantity?: string } = {};
    
    if (!itemName.trim()) {
      newErrors.name = 'Item name is required';
    }
    
    const price = parseFloat(itemPrice);
    if (!itemPrice || isNaN(price) || price <= 0) {
      newErrors.price = 'Valid price is required';
    }
    
    const quantity = parseInt(itemQuantity);
    if (!itemQuantity || isNaN(quantity) || quantity < 1) {
      newErrors.quantity = 'Quantity must be at least 1';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const saveItem = async () => {
    if (!validateItem()) return;

    try {
      const newItem: Item = {
        id: editingItem?.id || `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: itemName.trim(),
        price: parseFloat(itemPrice),
        quantity: parseInt(itemQuantity),
      };

      let updatedItems: Item[];
      if (editingItem) {
        // Update existing item
        updatedItems = items.map(item => item.id === editingItem.id ? newItem : item);
      } else {
        // Add new item
        updatedItems = [...items, newItem];
      }

      setItems(updatedItems);

      // Update bill in storage
      const billsJson = await AsyncStorage.getItem('bills');
      if (billsJson) {
        const bills = JSON.parse(billsJson);
        const updatedBills = bills.map((b: Bill) => 
          b.id === billId ? { ...b, items: updatedItems } : b
        );
        await AsyncStorage.setItem('bills', JSON.stringify(updatedBills));
      }

      setShowModal(false);
      Alert.alert('Success', editingItem ? 'Item updated' : 'Item added');
    } catch (error) {
      console.error('Error saving item:', error);
      Alert.alert('Error', 'Failed to save item');
    }
  };

  const deleteItem = (itemId: string) => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const updatedItems = items.filter(item => item.id !== itemId);
              setItems(updatedItems);

              // Update bill in storage
              const billsJson = await AsyncStorage.getItem('bills');
              if (billsJson) {
                const bills = JSON.parse(billsJson);
                const updatedBills = bills.map((b: Bill) => 
                  b.id === billId ? { ...b, items: updatedItems } : b
                );
                await AsyncStorage.setItem('bills', JSON.stringify(updatedBills));
              }

              Alert.alert('Success', 'Item deleted');
            } catch (error) {
              console.error('Error deleting item:', error);
              Alert.alert('Error', 'Failed to delete item');
            }
          }
        }
      ]
    );
  };

  const proceedToAssignment = () => {
    if (items.length === 0) {
      Alert.alert('No Items', 'Please add at least one item before proceeding.');
      return;
    }
    router.push(`/item-assignment?billId=${billId}`);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </SafeAreaView>
    );
  }

  const subtotal = calculateSubtotal();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <View>
            <Text className="text-xl font-bold text-foreground">Add Items</Text>
            <Text className="text-sm text-muted-foreground">{bill?.title}</Text>
          </View>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 180 }}>
        {/* Items List */}
        <View className="p-6 gap-3">
          {items.length === 0 ? (
            <View className="items-center py-12">
              <ShoppingCart className="text-muted-foreground mb-4" size={48} />
              <Text className="text-lg font-semibold text-foreground mb-2">No Items Yet</Text>
              <Text className="text-muted-foreground text-center">
                Add items from your invoice to split the bill
              </Text>
            </View>
          ) : (
            items.map((item, index) => (
              <View key={item.id} className="bg-card border border-border rounded-lg p-4">
                <View className="flex-row justify-between items-start mb-2">
                  <View className="flex-1 mr-3">
                    <Text className="text-base font-semibold text-foreground">{item.name}</Text>
                    <Text className="text-sm text-muted-foreground mt-1">
                      ${item.price.toFixed(2)} × {item.quantity}
                    </Text>
                  </View>
                  <View className="flex-row items-center gap-3">
                    <TouchableOpacity onPress={() => openEditModal(item)}>
                      <Edit2 className="text-primary" size={18} />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => deleteItem(item.id)}>
                      <Trash2 className="text-destructive" size={18} />
                    </TouchableOpacity>
                  </View>
                </View>
                <View className="flex-row justify-between items-center mt-2 pt-2 border-t border-border">
                  <Text className="text-xs text-muted-foreground">Item Total</Text>
                  <Text className="text-base font-bold text-foreground">
                    ${(item.price * item.quantity).toFixed(2)}
                  </Text>
                </View>
              </View>
            ))
          )}

          {/* Add Item Button */}
          <TouchableOpacity
            onPress={openAddModal}
            className="bg-primary/10 border-2 border-dashed border-primary rounded-lg p-4 items-center"
          >
            <Plus className="text-primary mb-2" size={24} />
            <Text className="text-primary font-semibold">Add Item</Text>
          </TouchableOpacity>

          {/* Helper Tip */}
          {items.length > 0 && (
            <View className="bg-accent/50 rounded-lg p-4 mt-2">
              <Text className="text-sm text-accent-foreground">
                💡 <Text className="font-semibold">Tip:</Text> Make sure all items from your invoice are added before proceeding to assignment.
              </Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Summary & Action */}
      <View className="absolute bottom-0 left-0 right-0 bg-card border-t border-border p-6 gap-4">
        {/* Subtotal */}
        <View className="flex-row justify-between items-center">
          <View>
            <Text className="text-sm text-muted-foreground">Subtotal</Text>
            <Text className="text-xs text-muted-foreground mt-1">{items.length} item{items.length !== 1 ? 's' : ''}</Text>
          </View>
          <Text className="text-2xl font-bold text-foreground">${subtotal.toFixed(2)}</Text>
        </View>

        {/* Next Button */}
        <TouchableOpacity
          onPress={proceedToAssignment}
          disabled={items.length === 0}
          className={`flex-row items-center justify-center gap-2 rounded-lg py-4 ${
            items.length === 0 ? 'bg-muted' : 'bg-primary'
          }`}
        >
          <Text className={`font-semibold text-base ${
            items.length === 0 ? 'text-muted-foreground' : 'text-primary-foreground'
          }`}>
            Proceed to Assignment
          </Text>
          <ArrowRight className={items.length === 0 ? 'text-muted-foreground' : 'text-primary-foreground'} size={20} />
        </TouchableOpacity>
      </View>

      {/* Add/Edit Item Modal */}
      {showModal && (
        <View className="absolute inset-0 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View style={{ backgroundColor: '#ffffff', width: '85%', borderRadius: 16, padding: 24 }}>
            <Text style={{ fontSize: 20, fontWeight: 'bold', marginBottom: 20, color: '#000' }}>
              {editingItem ? 'Edit Item' : 'Add Item'}
            </Text>

            {/* Item Name */}
            <View style={{ marginBottom: 16 }}>
              <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Item Name</Text>
              <TextInput
                value={itemName}
                onChangeText={setItemName}
                placeholder="e.g., Margherita Pizza"
                placeholderTextColor="#999"
                style={{
                  borderWidth: 1,
                  borderColor: errors.name ? '#dc2626' : '#e5e5e5',
                  borderRadius: 8,
                  padding: 12,
                  fontSize: 16,
                  color: '#000',
                  backgroundColor: '#fff'
                }}
              />
              {errors.name && <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.name}</Text>}
            </View>

            {/* Price and Quantity Row */}
            <View style={{ flexDirection: 'row', gap: 12, marginBottom: 16 }}>
              {/* Price */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Price ($)</Text>
                <TextInput
                  value={itemPrice}
                  onChangeText={setItemPrice}
                  placeholder="0.00"
                  placeholderTextColor="#999"
                  keyboardType="decimal-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.price ? '#dc2626' : '#e5e5e5',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
                {errors.price && <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.price}</Text>}
              </View>

              {/* Quantity */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '500', marginBottom: 8, color: '#000' }}>Quantity</Text>
                <TextInput
                  value={itemQuantity}
                  onChangeText={setItemQuantity}
                  placeholder="1"
                  placeholderTextColor="#999"
                  keyboardType="number-pad"
                  style={{
                    borderWidth: 1,
                    borderColor: errors.quantity ? '#dc2626' : '#e5e5e5',
                    borderRadius: 8,
                    padding: 12,
                    fontSize: 16,
                    color: '#000',
                    backgroundColor: '#fff'
                  }}
                />
                {errors.quantity && <Text style={{ color: '#dc2626', fontSize: 12, marginTop: 4 }}>{errors.quantity}</Text>}
              </View>
            </View>

            {/* Item Total Preview */}
            {itemPrice && itemQuantity && !isNaN(parseFloat(itemPrice)) && !isNaN(parseInt(itemQuantity)) && (
              <View style={{ backgroundColor: '#f3f4f6', borderRadius: 8, padding: 12, marginBottom: 20 }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: 14, color: '#666' }}>Item Total</Text>
                  <Text style={{ fontSize: 18, fontWeight: 'bold', color: '#000' }}>
                    ${(parseFloat(itemPrice) * parseInt(itemQuantity)).toFixed(2)}
                  </Text>
                </View>
              </View>
            )}

            {/* Action Buttons */}
            <View style={{ flexDirection: 'row', gap: 12 }}>
              <TouchableOpacity
                onPress={() => setShowModal(false)}
                style={{
                  flex: 1,
                  backgroundColor: '#f3f4f6',
                  borderRadius: 8,
                  padding: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#666', fontWeight: '600', fontSize: 16 }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={saveItem}
                style={{
                  flex: 1,
                  backgroundColor: '#18181b',
                  borderRadius: 8,
                  padding: 14,
                  alignItems: 'center'
                }}
              >
                <Text style={{ color: '#fff', fontWeight: '600', fontSize: 16 }}>
                  {editingItem ? 'Update' : 'Add'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}