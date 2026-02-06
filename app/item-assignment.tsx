import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, Users, AlertTriangle, ArrowRight, CheckCircle } from 'lucide-react-native';
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
  splits: any[];
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

// Generate avatar color based on name
const getAvatarColor = (name: string): string => {
  const colors = ['#FB7185', '#14B8A6', '#8B5CF6', '#F59E0B', '#059669', '#EC4899', '#06B6D4'];
  const index = name.charCodeAt(0) % colors.length;
  return colors[index];
};

export default function ItemAssignmentScreen() {
  const router = useRouter();
  const { billId } = useLocalSearchParams();
  
  const [bill, setBill] = useState<Bill | null>(null);
  const [group, setGroup] = useState<Group | null>(null);
  const [assignments, setAssignments] = useState<ItemAssignment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, [billId]);

  const loadData = async () => {
    try {
      // Load bill
      const billsData = await AsyncStorage.getItem('bills');
      const bills: Bill[] = billsData ? JSON.parse(billsData) : [];
      const currentBill = bills.find(b => b.id === billId);
      
      if (!currentBill) {
        Alert.alert('Error', 'Bill not found');
        router.back();
        return;
      }

      // Load group
      const groupsData = await AsyncStorage.getItem('groups');
      const groups: Group[] = groupsData ? JSON.parse(groupsData) : [];
      const currentGroup = groups.find(g => g.id === currentBill.groupId);

      if (!currentGroup) {
        Alert.alert('Error', 'Group not found');
        router.back();
        return;
      }

      setBill(currentBill);
      setGroup(currentGroup);

      // Initialize assignments from bill or create empty ones
      if (currentBill.assignments && currentBill.assignments.length > 0) {
        setAssignments(currentBill.assignments);
      } else {
        // Create empty assignments for each item
        const initialAssignments = currentBill.items.map(item => ({
          itemId: item.id,
          assignedMembers: []
        }));
        setAssignments(initialAssignments);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      Alert.alert('Error', 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const toggleMemberForItem = (itemId: string, memberId: string) => {
    setAssignments(prev => {
      const updated = [...prev];
      const assignmentIndex = updated.findIndex(a => a.itemId === itemId);
      
      if (assignmentIndex >= 0) {
        const assignment = updated[assignmentIndex];
        const memberIndex = assignment.assignedMembers.indexOf(memberId);
        
        if (memberIndex >= 0) {
          // Remove member
          assignment.assignedMembers = assignment.assignedMembers.filter(id => id !== memberId);
        } else {
          // Add member
          assignment.assignedMembers = [...assignment.assignedMembers, memberId];
        }
      }
      
      return updated;
    });
  };

  const assignAllMembers = (itemId: string) => {
    if (!group) return;
    
    setAssignments(prev => {
      const updated = [...prev];
      const assignmentIndex = updated.findIndex(a => a.itemId === itemId);
      
      if (assignmentIndex >= 0) {
        updated[assignmentIndex].assignedMembers = group.members.map(m => m.id);
      }
      
      return updated;
    });
  };

  const clearAllMembers = (itemId: string) => {
    setAssignments(prev => {
      const updated = [...prev];
      const assignmentIndex = updated.findIndex(a => a.itemId === itemId);
      
      if (assignmentIndex >= 0) {
        updated[assignmentIndex].assignedMembers = [];
      }
      
      return updated;
    });
  };

  const getUnassignedItems = (): Item[] => {
    if (!bill) return [];
    return bill.items.filter(item => {
      const assignment = assignments.find(a => a.itemId === item.id);
      return !assignment || assignment.assignedMembers.length === 0;
    });
  };

  const handleNext = async () => {
    const unassignedItems = getUnassignedItems();
    
    if (unassignedItems.length > 0) {
      const itemNames = unassignedItems.map(i => i.name).join(', ');
      Alert.alert(
        'Unassigned Items',
        `The following items are not assigned to anyone: ${itemNames}\n\nDo you want to continue anyway?`,
        [
          { text: 'Go Back', style: 'cancel' },
          { text: 'Continue', onPress: () => saveAndProceed() }
        ]
      );
    } else {
      saveAndProceed();
    }
  };

  const saveAndProceed = async () => {
    try {
      if (!bill) return;

      // Update bill with assignments
      const billsData = await AsyncStorage.getItem('bills');
      const bills: Bill[] = billsData ? JSON.parse(billsData) : [];
      const billIndex = bills.findIndex(b => b.id === bill.id);

      if (billIndex >= 0) {
        bills[billIndex] = {
          ...bills[billIndex],
          assignments
        };
        await AsyncStorage.setItem('bills', JSON.stringify(bills));
      }

      // Navigate to split preview
      router.push(`/split-preview?billId=${bill.id}`);
    } catch (error) {
      console.error('Error saving assignments:', error);
      Alert.alert('Error', 'Failed to save assignments');
    }
  };

  const isMemberAssigned = (itemId: string, memberId: string): boolean => {
    const assignment = assignments.find(a => a.itemId === itemId);
    return assignment ? assignment.assignedMembers.includes(memberId) : false;
  };

  const getAssignedCount = (itemId: string): number => {
    const assignment = assignments.find(a => a.itemId === itemId);
    return assignment ? assignment.assignedMembers.length : 0;
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!bill || !group) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Data not found</Text>
      </SafeAreaView>
    );
  }

  const unassignedItems = getUnassignedItems();

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <View className="flex-row items-center gap-3 flex-1">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <View className="flex-1">
            <Text className="text-xl font-bold text-foreground">Assign Items</Text>
            <Text className="text-sm text-muted-foreground">{bill.title}</Text>
          </View>
        </View>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 160 }}>
        {/* Warning for unassigned items */}
        {unassignedItems.length > 0 && (
          <View className="mx-6 mt-6 p-4 bg-destructive/10 border border-destructive/20 rounded-lg flex-row items-start gap-3">
            <AlertTriangle className="text-destructive mt-0.5" size={20} />
            <View className="flex-1">
              <Text className="font-semibold text-destructive mb-1">
                {unassignedItems.length} Unassigned Item{unassignedItems.length > 1 ? 's' : ''}
              </Text>
              <Text className="text-sm text-destructive/80">
                {unassignedItems.map(i => i.name).join(', ')}
              </Text>
            </View>
          </View>
        )}

        {/* Helper tip */}
        <View className="mx-6 mt-6 p-4 bg-accent/20 border border-accent rounded-lg">
          <Text className="text-sm text-foreground">
            <Text className="font-semibold">Tip:</Text> Tap members to assign them to each item. Use "Assign to All" for items shared by everyone.
          </Text>
        </View>

        {/* Items list */}
        <View className="px-6 mt-6 gap-6">
          {bill.items.map((item) => {
            const assignedCount = getAssignedCount(item.id);
            const itemTotal = item.price * item.quantity;
            const hasAssignments = assignedCount > 0;

            return (
              <View key={item.id} className="border border-border rounded-lg overflow-hidden bg-card">
                {/* Item header */}
                <View className="p-4 border-b border-border bg-muted/30">
                  <View className="flex-row items-start justify-between mb-2">
                    <View className="flex-1">
                      <Text className="text-lg font-bold text-foreground">{item.name}</Text>
                      <Text className="text-sm text-muted-foreground">
                        ${item.price.toFixed(2)} × {item.quantity} = ${itemTotal.toFixed(2)}
                      </Text>
                    </View>
                    {hasAssignments && (
                      <View className="bg-primary/10 px-3 py-1 rounded-full flex-row items-center gap-1">
                        <CheckCircle className="text-primary" size={14} />
                        <Text className="text-primary font-semibold text-sm">
                          {assignedCount} assigned
                        </Text>
                      </View>
                    )}
                  </View>

                  {/* Quick actions */}
                  <View className="flex-row gap-2 mt-2">
                    <TouchableOpacity
                      onPress={() => assignAllMembers(item.id)}
                      className="flex-1 bg-primary px-3 py-2 rounded-lg"
                    >
                      <Text className="text-primary-foreground text-center font-semibold text-sm">
                        Assign to All
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      onPress={() => clearAllMembers(item.id)}
                      className="flex-1 bg-secondary px-3 py-2 rounded-lg"
                    >
                      <Text className="text-secondary-foreground text-center font-semibold text-sm">
                        Clear All
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Member chips */}
                <View className="p-4">
                  <Text className="text-sm font-semibold text-foreground mb-3">
                    Select Members:
                  </Text>
                  <View className="flex-row flex-wrap gap-2">
                    {group.members.map((member) => {
                      const isAssigned = isMemberAssigned(item.id, member.id);
                      const avatarColor = getAvatarColor(member.name);

                      return (
                        <TouchableOpacity
                          key={member.id}
                          onPress={() => toggleMemberForItem(item.id, member.id)}
                          className={`flex-row items-center gap-2 px-3 py-2 rounded-full border-2 ${
                            isAssigned
                              ? 'bg-primary border-primary'
                              : 'bg-card border-border'
                          }`}
                        >
                          {/* Avatar */}
                          <View
                            style={{
                              backgroundColor: isAssigned ? 'rgba(255,255,255,0.3)' : avatarColor,
                              width: 24,
                              height: 24,
                              borderRadius: 12,
                              alignItems: 'center',
                              justifyContent: 'center'
                            }}
                          >
                            <Text
                              style={{
                                color: isAssigned ? '#fff' : '#fff',
                                fontSize: 10,
                                fontWeight: 'bold'
                              }}
                            >
                              {member.name.substring(0, 2).toUpperCase()}
                            </Text>
                          </View>
                          
                          {/* Name */}
                          <Text
                            className={`font-semibold ${
                              isAssigned ? 'text-primary-foreground' : 'text-foreground'
                            }`}
                          >
                            {member.name}
                          </Text>

                          {/* Check icon */}
                          {isAssigned && (
                            <CheckCircle className="text-primary-foreground" size={16} />
                          )}
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>
            );
          })}
        </View>

        {/* Summary card */}
        <View className="mx-6 mt-6 p-4 bg-accent/20 border border-accent rounded-lg">
          <View className="flex-row items-center gap-2 mb-2">
            <Users className="text-foreground" size={20} />
            <Text className="text-lg font-bold text-foreground">Assignment Summary</Text>
          </View>
          <Text className="text-sm text-muted-foreground">
            {bill.items.length} item{bill.items.length > 1 ? 's' : ''} • {' '}
            {bill.items.length - unassignedItems.length} assigned • {' '}
            {unassignedItems.length} unassigned
          </Text>
        </View>
      </ScrollView>

      {/* Fixed bottom action */}
      <View className="absolute bottom-0 left-0 right-0 p-6 bg-background border-t border-border">
        <TouchableOpacity
          onPress={handleNext}
          className="bg-primary py-4 rounded-lg flex-row items-center justify-center gap-2"
        >
          <Text className="text-primary-foreground font-bold text-lg">
            Continue to Split Preview
          </Text>
          <ArrowRight className="text-primary-foreground" size={20} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}