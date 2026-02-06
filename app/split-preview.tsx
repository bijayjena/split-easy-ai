import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Calculator, DollarSign, Percent, TrendingDown, Wallet, ArrowRight, AlertCircle, Edit2 } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ThemeToggle } from '@/components/ThemeToggle';

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  freeCash: number;
}

interface Item {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

interface ItemAssignment {
  itemId: string;
  assignedMembers: string[]; // member IDs
}

interface Bill {
  id: string;
  groupId: string;
  title: string;
  invoiceUrl: string;
  items: Item[];
  assignments: ItemAssignment[];
  platformFeePercent: number;
  discountPercent: number;
  splits: PersonSplit[];
  totalExtracted: number;
  totalFinal: number;
  status: string;
  createdAt: string;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

interface PersonSplit {
  memberId: string;
  memberName: string;
  actualCost: number;
  platformFee: number;
  freeCashUsed: number;
  discount: number;
  finalPayable: number;
}

export default function SplitPreviewScreen() {
  const router = useRouter();
  const { billId } = useLocalSearchParams();
  const [loading, setLoading] = useState(true);
  const [bill, setBill] = useState<Bill | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [platformFeePercent, setPlatformFeePercent] = useState('2.5');
  const [discountPercent, setDiscountPercent] = useState('0');
  const [splits, setSplits] = useState<PersonSplit[]>([]);
  const [editingFee, setEditingFee] = useState(false);
  const [editingDiscount, setEditingDiscount] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    if (bill && group) {
      calculateSplits();
    }
  }, [platformFeePercent, discountPercent, bill, group]);

  const loadData = async () => {
    try {
      // Load bill
      const billsJson = await AsyncStorage.getItem('bills');
      const bills: Bill[] = billsJson ? JSON.parse(billsJson) : [];
      const foundBill = bills.find((b) => b.id === billId);

      if (!foundBill) {
        Alert.alert('Error', 'Bill not found');
        router.back();
        return;
      }

      // Load group
      const groupsJson = await AsyncStorage.getItem('groups');
      const groups: Group[] = groupsJson ? JSON.parse(groupsJson) : [];
      const foundGroup = groups.find((g) => g.id === foundBill.groupId);

      if (!foundGroup) {
        Alert.alert('Error', 'Group not found');
        router.back();
        return;
      }

      setBill(foundBill);
      setGroup(foundGroup);
      setPlatformFeePercent(foundBill.platformFeePercent.toString());
      setDiscountPercent(foundBill.discountPercent.toString());
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const calculateSplits = () => {
    if (!bill || !group) return;

    const feePercent = parseFloat(platformFeePercent) || 0;
    const discPercent = parseFloat(discountPercent) || 0;

    const personSplits: PersonSplit[] = [];

    // Calculate for each member
    group.members.forEach((member) => {
      let actualCost = 0;

      // Sum up items assigned to this member
      bill.items.forEach((item) => {
        const assignment = bill.assignments.find((a) => a.itemId === item.id);
        if (assignment && assignment.assignedMembers.includes(member.id)) {
          const itemTotal = item.price * item.quantity;
          const shareCount = assignment.assignedMembers.length;
          actualCost += itemTotal / shareCount;
        }
      });

      // Calculate platform fee
      const platformFee = (actualCost * feePercent) / 100;

      // Calculate free cash to use (can't exceed actual cost + fee)
      const costBeforeDiscount = actualCost + platformFee;
      const freeCashUsed = Math.min(member.freeCash, costBeforeDiscount);

      // Calculate discount on remaining amount
      const amountAfterFreeCash = costBeforeDiscount - freeCashUsed;
      const discount = (amountAfterFreeCash * discPercent) / 100;

      // Final payable
      const finalPayable = Math.max(0, amountAfterFreeCash - discount);

      personSplits.push({
        memberId: member.id,
        memberName: member.name,
        actualCost,
        platformFee,
        freeCashUsed,
        discount,
        finalPayable,
      });
    });

    setSplits(personSplits);
  };

  const saveSplitsAndProceed = async () => {
    if (!bill) return;

    try {
      // Update bill with splits and totals
      const billsJson = await AsyncStorage.getItem('bills');
      const bills: Bill[] = billsJson ? JSON.parse(billsJson) : [];
      const billIndex = bills.findIndex((b) => b.id === bill.id);

      if (billIndex !== -1) {
        const subtotal = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const totalCollected = splits.reduce((sum, split) => sum + split.finalPayable, 0);

        bills[billIndex] = {
          ...bill,
          platformFeePercent: parseFloat(platformFeePercent) || 0,
          discountPercent: parseFloat(discountPercent) || 0,
          splits,
          totalExtracted: subtotal,
          totalFinal: totalCollected,
        };

        await AsyncStorage.setItem('bills', JSON.stringify(bills));

        // Navigate to summary
        router.push(`/split-summary?billId=${bill.id}`);
      }
    } catch (error) {
      console.error('Error saving splits:', error);
      Alert.alert('Error', 'Failed to save splits');
    }
  };

  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-orange-500',
      'bg-teal-500',
      'bg-indigo-500',
    ];
    const index = name.charCodeAt(0) % colors.length;
    return colors[index];
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!bill || !group) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground">Data not found</Text>
      </SafeAreaView>
    );
  }

  const subtotal = bill.items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const totalCollected = splits.reduce((sum, split) => sum + split.finalPayable, 0);
  const difference = totalCollected - subtotal;

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <View className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-lg font-bold text-foreground">{bill.title}</Text>
            <Text className="text-sm text-muted-foreground">Split Preview</Text>
          </View>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 16 }}>
        {/* Editable Fees Section */}
        <View className="bg-card border border-border rounded-lg p-4 mt-4">
          <View className="flex-row items-center gap-2 mb-4">
            <Calculator className="text-primary" size={20} />
            <Text className="text-lg font-bold text-foreground">Fee Configuration</Text>
          </View>

          {/* Platform Fee */}
          <View className="mb-4">
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-foreground">Platform Fee %</Text>
              <TouchableOpacity onPress={() => setEditingFee(!editingFee)}>
                <Edit2 className="text-primary" size={16} />
              </TouchableOpacity>
            </View>
            {editingFee ? (
              <TextInput
                value={platformFeePercent}
                onChangeText={setPlatformFeePercent}
                keyboardType="decimal-pad"
                className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="0.0"
                onBlur={() => setEditingFee(false)}
                autoFocus
              />
            ) : (
              <View className="bg-muted rounded-lg px-4 py-3 flex-row items-center justify-between">
                <Text className="text-foreground font-semibold">{platformFeePercent}%</Text>
                <Percent className="text-muted-foreground" size={16} />
              </View>
            )}
          </View>

          {/* Discount */}
          <View>
            <View className="flex-row items-center justify-between mb-2">
              <Text className="text-sm font-medium text-foreground">Discount %</Text>
              <TouchableOpacity onPress={() => setEditingDiscount(!editingDiscount)}>
                <Edit2 className="text-primary" size={16} />
              </TouchableOpacity>
            </View>
            {editingDiscount ? (
              <TextInput
                value={discountPercent}
                onChangeText={setDiscountPercent}
                keyboardType="decimal-pad"
                className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
                placeholder="0.0"
                onBlur={() => setEditingDiscount(false)}
                autoFocus
              />
            ) : (
              <View className="bg-muted rounded-lg px-4 py-3 flex-row items-center justify-between">
                <Text className="text-foreground font-semibold">{discountPercent}%</Text>
                <TrendingDown className="text-muted-foreground" size={16} />
              </View>
            )}
          </View>
        </View>

        {/* Total Summary */}
        <View className="bg-accent border border-border rounded-lg p-4">
          <View className="flex-row items-center gap-2 mb-3">
            <DollarSign className="text-accent-foreground" size={20} />
            <Text className="text-lg font-bold text-accent-foreground">Total Summary</Text>
          </View>
          <View className="gap-2">
            <View className="flex-row justify-between">
              <Text className="text-accent-foreground">Invoice Total:</Text>
              <Text className="font-bold text-accent-foreground">${subtotal.toFixed(2)}</Text>
            </View>
            <View className="flex-row justify-between">
              <Text className="text-accent-foreground">Total Collected:</Text>
              <Text className="font-bold text-accent-foreground">${totalCollected.toFixed(2)}</Text>
            </View>
            <View className="h-px bg-border my-1" />
            <View className="flex-row justify-between">
              <Text className="text-accent-foreground font-semibold">Difference:</Text>
              <Text
                className={`font-bold ${
                  difference > 0 ? 'text-green-600' : difference < 0 ? 'text-destructive' : 'text-accent-foreground'
                }`}
              >
                {difference > 0 ? '+' : ''}${difference.toFixed(2)}
              </Text>
            </View>
          </View>
        </View>

        {/* Warning if negative difference */}
        {difference < 0 && (
          <View className="bg-destructive/10 border border-destructive rounded-lg p-4 flex-row gap-3">
            <AlertCircle className="text-destructive" size={20} />
            <View className="flex-1">
              <Text className="text-destructive font-semibold">Collection Shortfall</Text>
              <Text className="text-destructive text-sm mt-1">
                Total collected is ${Math.abs(difference).toFixed(2)} less than invoice total. Consider adjusting fees or discounts.
              </Text>
            </View>
          </View>
        )}

        {/* Per-Person Breakdown */}
        <View className="gap-4">
          <Text className="text-xl font-bold text-foreground">Per-Person Breakdown</Text>

          {splits.map((split) => {
            const member = group.members.find((m) => m.id === split.memberId);
            if (!member) return null;

            return (
              <View key={split.memberId} className="bg-card border border-border rounded-lg overflow-hidden">
                {/* Member Header */}
                <View className="bg-muted p-4 flex-row items-center gap-3">
                  <View className={`w-12 h-12 rounded-full ${getAvatarColor(member.name)} items-center justify-center`}>
                    <Text className="text-white font-bold text-lg">{getInitials(member.name)}</Text>
                  </View>
                  <View className="flex-1">
                    <Text className="text-lg font-bold text-foreground">{member.name}</Text>
                    <Text className="text-sm text-muted-foreground">
                      Free Cash: ${member.freeCash.toFixed(2)}
                    </Text>
                  </View>
                </View>

                {/* Step-by-Step Calculation */}
                <View className="p-4 gap-3">
                  {/* Step 1: Actual Cost */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                        <Text className="text-primary-foreground text-xs font-bold">1</Text>
                      </View>
                      <Text className="text-foreground">Actual Cost</Text>
                    </View>
                    <Text className="font-semibold text-foreground">${split.actualCost.toFixed(2)}</Text>
                  </View>

                  {/* Step 2: Platform Fee */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View className="w-6 h-6 bg-primary rounded-full items-center justify-center">
                        <Text className="text-primary-foreground text-xs font-bold">2</Text>
                      </View>
                      <Text className="text-foreground">
                        Platform Fee ({platformFeePercent}%)
                      </Text>
                    </View>
                    <Text className="font-semibold text-foreground">+${split.platformFee.toFixed(2)}</Text>
                  </View>

                  {/* Subtotal */}
                  <View className="flex-row justify-between items-center pl-8 bg-muted rounded-lg p-2">
                    <Text className="text-muted-foreground text-sm">Subtotal</Text>
                    <Text className="font-bold text-foreground">
                      ${(split.actualCost + split.platformFee).toFixed(2)}
                    </Text>
                  </View>

                  {/* Step 3: Free Cash */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View className="w-6 h-6 bg-green-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">3</Text>
                      </View>
                      <Text className="text-foreground">Free Cash Used</Text>
                    </View>
                    <Text className="font-semibold text-green-600">-${split.freeCashUsed.toFixed(2)}</Text>
                  </View>

                  {/* Step 4: Discount */}
                  <View className="flex-row justify-between items-center">
                    <View className="flex-row items-center gap-2">
                      <View className="w-6 h-6 bg-orange-500 rounded-full items-center justify-center">
                        <Text className="text-white text-xs font-bold">4</Text>
                      </View>
                      <Text className="text-foreground">
                        Discount ({discountPercent}%)
                      </Text>
                    </View>
                    <Text className="font-semibold text-orange-600">-${split.discount.toFixed(2)}</Text>
                  </View>

                  {/* Final Payable */}
                  <View className="h-px bg-border my-1" />
                  <View className="flex-row justify-between items-center bg-primary/10 rounded-lg p-3">
                    <View className="flex-row items-center gap-2">
                      <Wallet className="text-primary" size={20} />
                      <Text className="text-lg font-bold text-foreground">Final Payable</Text>
                    </View>
                    <Text className="text-2xl font-bold text-primary">${split.finalPayable.toFixed(2)}</Text>
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Helper Tip */}
        <View className="bg-accent/20 border border-accent rounded-lg p-4 flex-row gap-3">
          <AlertCircle className="text-accent-foreground" size={20} />
          <Text className="flex-1 text-accent-foreground text-sm">
            Review each person's breakdown carefully. You can edit the platform fee and discount percentages above to adjust the splits.
          </Text>
        </View>
      </ScrollView>

      {/* Fixed Bottom Button */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
        <TouchableOpacity
          onPress={saveSplitsAndProceed}
          className="bg-primary rounded-lg py-4 flex-row items-center justify-center gap-2"
        >
          <Text className="text-primary-foreground font-bold text-lg">Continue to Summary</Text>
          <ArrowRight className="text-primary-foreground" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}