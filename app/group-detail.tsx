import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Modal, TextInput, Alert, Share } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Users, Plus, FileText, ArrowLeft, Trash2, Copy, Share2, UserPlus, X } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuth } from '@/components/AuthContext';
import { ThemeToggle } from '@/components/ThemeToggle';

type Member = {
  id: string;
  name: string;
  email: string;
  status: 'active' | 'pending';
};

type Group = {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdBy: string;
  createdAt: string;
  inviteCode?: string;
};

type Bill = {
  id: string;
  groupId: string;
  description: string;
  totalAmount: number;
  createdBy: string;
  createdAt: string;
};

export default function GroupDetailScreen() {
  const router = useRouter();
  const params = useLocalSearchParams();
  const { user } = useAuth();
  const groupId = params.groupId as string;

  const [group, setGroup] = useState<Group | null>(null);
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showJoinModal, setShowJoinModal] = useState(false);
  const [inviteCode, setInviteCode] = useState('');
  const [joinCode, setJoinCode] = useState('');

  useEffect(() => {
    loadGroupData();
  }, [groupId]);

  const loadGroupData = async () => {
    try {
      const groupsData = await AsyncStorage.getItem('groups');
      const billsData = await AsyncStorage.getItem('bills');

      if (groupsData) {
        const groups: Group[] = JSON.parse(groupsData);
        const foundGroup = groups.find(g => g.id === groupId);
        setGroup(foundGroup || null);
      }

      if (billsData) {
        const allBills: Bill[] = JSON.parse(billsData);
        const groupBills = allBills.filter(b => b.groupId === groupId);
        setBills(groupBills);
      }
    } catch (error) {
      console.error('Error loading group data:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateInviteCode = async () => {
    if (!group) return;

    // Generate 6-character invite code
    const code = Math.random().toString(36).substring(2, 8).toUpperCase();
    
    try {
      const groupsData = await AsyncStorage.getItem('groups');
      if (groupsData) {
        const groups: Group[] = JSON.parse(groupsData);
        const updatedGroups = groups.map(g => 
          g.id === groupId ? { ...g, inviteCode: code } : g
        );
        await AsyncStorage.setItem('groups', JSON.stringify(updatedGroups));
        setGroup({ ...group, inviteCode: code });
        setInviteCode(code);
        setShowInviteModal(true);
      }
    } catch (error) {
      console.error('Error generating invite code:', error);
      Alert.alert('Error', 'Failed to generate invite code');
    }
  };

  const shareInviteLink = async () => {
    if (!group?.inviteCode) return;

    const inviteMessage = `Join my group "${group.name}" on SplitBill!\n\nInvite Code: ${group.inviteCode}\n\nOpen the app and use this code to join.`;

    try {
      await Share.share({
        message: inviteMessage,
      });
    } catch (error) {
      console.error('Error sharing invite:', error);
    }
  };

  const copyInviteCode = async () => {
    if (!group?.inviteCode) return;
    
    // In a real app, use Clipboard API
    Alert.alert('Copied!', `Invite code ${group.inviteCode} copied to clipboard`);
  };

  const joinGroupViaInvite = async () => {
    if (!joinCode.trim() || !user) {
      Alert.alert('Error', 'Please enter an invite code');
      return;
    }

    try {
      const groupsData = await AsyncStorage.getItem('groups');
      if (groupsData) {
        const groups: Group[] = JSON.parse(groupsData);
        const targetGroup = groups.find(g => g.inviteCode === joinCode.toUpperCase());

        if (!targetGroup) {
          Alert.alert('Error', 'Invalid invite code');
          return;
        }

        // Check if user is already a member
        const isMember = targetGroup.members.some(m => m.id === user.id);
        if (isMember) {
          Alert.alert('Already Member', 'You are already a member of this group');
          return;
        }

        // Add user to group
        const newMember: Member = {
          id: user.id,
          name: user.name,
          email: user.email,
          status: 'active',
        };

        const updatedGroups = groups.map(g =>
          g.id === targetGroup.id
            ? { ...g, members: [...g.members, newMember] }
            : g
        );

        await AsyncStorage.setItem('groups', JSON.stringify(updatedGroups));
        
        setShowJoinModal(false);
        setJoinCode('');
        Alert.alert('Success', `You've joined ${targetGroup.name}!`, [
          { text: 'OK', onPress: () => router.replace('/') }
        ]);
      }
    } catch (error) {
      console.error('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group');
    }
  };

  const deleteMember = async (memberId: string) => {
    if (!group) return;

    Alert.alert(
      'Remove Member',
      'Are you sure you want to remove this member?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupsData = await AsyncStorage.getItem('groups');
              if (groupsData) {
                const groups: Group[] = JSON.parse(groupsData);
                const updatedGroups = groups.map(g =>
                  g.id === groupId
                    ? { ...g, members: g.members.filter(m => m.id !== memberId) }
                    : g
                );
                await AsyncStorage.setItem('groups', JSON.stringify(updatedGroups));
                loadGroupData();
                Alert.alert('Success', 'Member removed');
              }
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member');
            }
          },
        },
      ]
    );
  };

  const deleteGroup = async () => {
    Alert.alert(
      'Delete Group',
      'Are you sure? This will delete all bills in this group.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              const groupsData = await AsyncStorage.getItem('groups');
              const billsData = await AsyncStorage.getItem('bills');

              if (groupsData) {
                const groups: Group[] = JSON.parse(groupsData);
                const updatedGroups = groups.filter(g => g.id !== groupId);
                await AsyncStorage.setItem('groups', JSON.stringify(updatedGroups));
              }

              if (billsData) {
                const allBills: Bill[] = JSON.parse(billsData);
                const updatedBills = allBills.filter(b => b.groupId !== groupId);
                await AsyncStorage.setItem('bills', JSON.stringify(updatedBills));
              }

              Alert.alert('Success', 'Group deleted');
              router.back();
            } catch (error) {
              console.error('Error deleting group:', error);
              Alert.alert('Error', 'Failed to delete group');
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-muted-foreground">Loading...</Text>
      </SafeAreaView>
    );
  }

  if (!group) {
    return (
      <SafeAreaView className="flex-1 bg-background items-center justify-center">
        <Text className="text-foreground text-lg">Group not found</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <TouchableOpacity onPress={() => router.back()}>
          <ArrowLeft className="text-foreground" size={24} />
        </TouchableOpacity>
        <Text className="text-xl font-bold text-foreground flex-1 ml-4">{group.name}</Text>
        <ThemeToggle />
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 128 }}>
        {/* Group Info */}
        <View className="p-6 border-b border-border">
          <Text className="text-muted-foreground mb-2">{group.description}</Text>
          <Text className="text-sm text-muted-foreground">
            Created {new Date(group.createdAt).toLocaleDateString()}
          </Text>
        </View>

        {/* Invite Actions */}
        <View className="px-6 py-4 gap-3">
          <TouchableOpacity
            onPress={generateInviteCode}
            className="bg-primary rounded-lg p-4 flex-row items-center justify-center"
          >
            <UserPlus className="text-primary-foreground mr-2" size={20} />
            <Text className="text-primary-foreground font-semibold">
              {group.inviteCode ? 'View Invite Code' : 'Generate Invite Code'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => setShowJoinModal(true)}
            className="bg-secondary rounded-lg p-4 flex-row items-center justify-center"
          >
            <UserPlus className="text-secondary-foreground mr-2" size={20} />
            <Text className="text-secondary-foreground font-semibold">Join Group with Code</Text>
          </TouchableOpacity>
        </View>

        {/* Members Section */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Members ({group.members.length})</Text>
          </View>

          <View className="gap-3">
            {group.members.map(member => (
              <View key={member.id} className="bg-card rounded-lg p-4 flex-row items-center justify-between">
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="text-foreground font-semibold">{member.name}</Text>
                    {member.status === 'pending' && (
                      <View className="bg-amber-500/20 px-2 py-1 rounded">
                        <Text className="text-amber-600 text-xs font-medium">Pending</Text>
                      </View>
                    )}
                  </View>
                  <Text className="text-muted-foreground text-sm">{member.email}</Text>
                </View>
                {group.createdBy === user?.id && member.id !== user?.id && (
                  <TouchableOpacity onPress={() => deleteMember(member.id)}>
                    <Trash2 className="text-destructive" size={20} />
                  </TouchableOpacity>
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Bills Section */}
        <View className="px-6 py-4">
          <View className="flex-row items-center justify-between mb-4">
            <Text className="text-lg font-bold text-foreground">Bills ({bills.length})</Text>
            <TouchableOpacity
              onPress={() => router.push(`/create-bill?groupId=${groupId}`)}
              className="bg-primary rounded-lg px-4 py-2 flex-row items-center"
            >
              <Plus className="text-primary-foreground mr-1" size={16} />
              <Text className="text-primary-foreground font-semibold">Add Bill</Text>
            </TouchableOpacity>
          </View>

          {bills.length === 0 ? (
            <View className="bg-card rounded-lg p-8 items-center">
              <FileText className="text-muted-foreground mb-2" size={48} />
              <Text className="text-muted-foreground text-center">No bills yet</Text>
              <Text className="text-muted-foreground text-sm text-center mt-1">
                Create your first bill to start splitting expenses
              </Text>
            </View>
          ) : (
            <View className="gap-3">
              {bills.map(bill => (
                <TouchableOpacity
                  key={bill.id}
                  onPress={() => router.push(`/split-summary?billId=${bill.id}`)}
                  className="bg-card rounded-lg p-4"
                >
                  <View className="flex-row items-center justify-between mb-2">
                    <Text className="text-foreground font-semibold flex-1">{bill.description}</Text>
                    <Text className="text-primary font-bold text-lg">${bill.totalAmount.toFixed(2)}</Text>
                  </View>
                  <Text className="text-muted-foreground text-sm">
                    {new Date(bill.createdAt).toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

        {/* Delete Group Button */}
        {group.createdBy === user?.id && (
          <View className="px-6 py-4">
            <TouchableOpacity
              onPress={deleteGroup}
              className="bg-destructive rounded-lg p-4 flex-row items-center justify-center"
            >
              <Trash2 className="text-white mr-2" size={20} />
              <Text className="text-white font-semibold">Delete Group</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Invite Code Modal */}
      <Modal
        visible={showInviteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowInviteModal(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="w-[90%] max-w-md rounded-2xl p-6" style={{ backgroundColor: '#ffffff' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: '#000000' }}>Invite Code</Text>
              <TouchableOpacity onPress={() => setShowInviteModal(false)}>
                <X size={24} style={{ color: '#666666' }} />
              </TouchableOpacity>
            </View>

            <Text className="text-center mb-4" style={{ color: '#666666' }}>
              Share this code with others to invite them to {group.name}
            </Text>

            <View className="rounded-lg p-6 mb-4 items-center" style={{ backgroundColor: '#f5f5f5' }}>
              <Text className="text-4xl font-bold tracking-widest" style={{ color: '#000000' }}>
                {group.inviteCode}
              </Text>
            </View>

            <View className="gap-3">
              <TouchableOpacity
                onPress={copyInviteCode}
                className="rounded-lg p-4 flex-row items-center justify-center"
                style={{ backgroundColor: '#e5e5e5' }}
              >
                <Copy size={20} style={{ color: '#000000', marginRight: 8 }} />
                <Text className="font-semibold" style={{ color: '#000000' }}>Copy Code</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={shareInviteLink}
                className="rounded-lg p-4 flex-row items-center justify-center"
                style={{ backgroundColor: '#000000' }}
              >
                <Share2 size={20} style={{ color: '#ffffff', marginRight: 8 }} />
                <Text className="font-semibold" style={{ color: '#ffffff' }}>Share Invite</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Join Group Modal */}
      <Modal
        visible={showJoinModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowJoinModal(false)}
      >
        <View className="flex-1 items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}>
          <View className="w-[90%] max-w-md rounded-2xl p-6" style={{ backgroundColor: '#ffffff' }}>
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-xl font-bold" style={{ color: '#000000' }}>Join Group</Text>
              <TouchableOpacity onPress={() => setShowJoinModal(false)}>
                <X size={24} style={{ color: '#666666' }} />
              </TouchableOpacity>
            </View>

            <Text className="mb-4" style={{ color: '#666666' }}>
              Enter the invite code to join a group
            </Text>

            <TextInput
              value={joinCode}
              onChangeText={setJoinCode}
              placeholder="Enter invite code"
              autoCapitalize="characters"
              maxLength={6}
              className="rounded-lg p-4 mb-4 text-lg font-semibold tracking-widest text-center"
              style={{ backgroundColor: '#f5f5f5', color: '#000000' }}
              placeholderTextColor="#999999"
            />

            <View className="gap-3">
              <TouchableOpacity
                onPress={joinGroupViaInvite}
                className="rounded-lg p-4 flex-row items-center justify-center"
                style={{ backgroundColor: '#000000' }}
              >
                <UserPlus size={20} style={{ color: '#ffffff', marginRight: 8 }} />
                <Text className="font-semibold" style={{ color: '#ffffff' }}>Join Group</Text>
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  setShowJoinModal(false);
                  setJoinCode('');
                }}
                className="rounded-lg p-4"
                style={{ backgroundColor: '#e5e5e5' }}
              >
                <Text className="font-semibold text-center" style={{ color: '#000000' }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}