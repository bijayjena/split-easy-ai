import React, { useState } from 'react';
import { View, Text, ScrollView, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { ArrowLeft, Plus, X, Users } from 'lucide-react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Member {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  freeCash: number;
}

interface Group {
  id: string;
  name: string;
  description: string;
  members: Member[];
  createdAt: string;
}

export default function CreateGroupScreen() {
  const router = useRouter();
  
  // Group fields
  const [groupName, setGroupName] = useState('');
  const [groupDescription, setGroupDescription] = useState('');
  
  // Member being added
  const [memberName, setMemberName] = useState('');
  const [memberEmail, setMemberEmail] = useState('');
  const [memberPhone, setMemberPhone] = useState('');
  
  // List of added members
  const [members, setMembers] = useState<Member[]>([]);
  
  // Validation errors
  const [errors, setErrors] = useState<{
    groupName?: string;
    members?: string;
    memberName?: string;
  }>({});

  const validateGroupName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, groupName: 'Group name is required' }));
      return false;
    }
    if (name.trim().length < 3) {
      setErrors(prev => ({ ...prev, groupName: 'Group name must be at least 3 characters' }));
      return false;
    }
    setErrors(prev => ({ ...prev, groupName: undefined }));
    return true;
  };

  const validateMemberName = (name: string): boolean => {
    if (!name.trim()) {
      setErrors(prev => ({ ...prev, memberName: 'Member name is required' }));
      return false;
    }
    setErrors(prev => ({ ...prev, memberName: undefined }));
    return true;
  };

  const addMember = () => {
    if (!validateMemberName(memberName)) {
      return;
    }

    // Check for duplicate names
    if (members.some(m => m.name.toLowerCase() === memberName.trim().toLowerCase())) {
      setErrors(prev => ({ ...prev, memberName: 'Member with this name already exists' }));
      return;
    }

    const newMember: Member = {
      id: `member-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      name: memberName.trim(),
      email: memberEmail.trim() || undefined,
      phone: memberPhone.trim() || undefined,
      freeCash: 0,
    };

    setMembers([...members, newMember]);
    
    // Clear form
    setMemberName('');
    setMemberEmail('');
    setMemberPhone('');
    setErrors(prev => ({ ...prev, memberName: undefined }));
  };

  const removeMember = (id: string) => {
    setMembers(members.filter(m => m.id !== id));
    setErrors(prev => ({ ...prev, members: undefined }));
  };

  const saveGroup = async () => {
    // Validate
    const isNameValid = validateGroupName(groupName);
    
    if (!isNameValid) {
      return;
    }

    if (members.length === 0) {
      setErrors(prev => ({ ...prev, members: 'Add at least one member' }));
      return;
    }

    try {
      const group: Group = {
        id: `group-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        name: groupName.trim(),
        description: groupDescription.trim(),
        members,
        createdAt: new Date().toISOString(),
      };

      // Get existing groups
      const existingGroupsJson = await AsyncStorage.getItem('groups');
      const existingGroups: Group[] = existingGroupsJson ? JSON.parse(existingGroupsJson) : [];

      // Add new group
      existingGroups.push(group);

      // Save to storage
      await AsyncStorage.setItem('groups', JSON.stringify(existingGroups));

      Alert.alert('Success', 'Group created successfully!', [
        {
          text: 'OK',
          onPress: () => router.back(),
        },
      ]);
    } catch (error) {
      console.error('Error saving group:', error);
      Alert.alert('Error', 'Failed to create group. Please try again.');
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background">
      {/* Header */}
      <View className="flex-row items-center justify-between px-6 py-4 border-b border-border">
        <View className="flex-row items-center gap-3">
          <TouchableOpacity onPress={() => router.back()}>
            <ArrowLeft className="text-foreground" size={24} />
          </TouchableOpacity>
          <Text className="text-2xl font-bold text-foreground">Create Group</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 24, paddingBottom: 128, gap: 24, paddingTop: 24 }}>
        {/* Group Info Section */}
        <View className="bg-card rounded-xl p-6 border border-border">
          <View className="flex-row items-center gap-2 mb-4">
            <Users className="text-primary" size={20} />
            <Text className="text-lg font-semibold text-foreground">Group Information</Text>
          </View>

          {/* Group Name */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">
              Group Name <Text className="text-destructive">*</Text>
            </Text>
            <TextInput
              className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="e.g., Weekend Trip, Office Lunch"
              placeholderTextColor="#a1a1aa"
              value={groupName}
              onChangeText={(text) => {
                setGroupName(text);
                if (errors.groupName) validateGroupName(text);
              }}
              onBlur={() => validateGroupName(groupName)}
            />
            {errors.groupName && (
              <Text className="text-destructive text-xs mt-1">{errors.groupName}</Text>
            )}
          </View>

          {/* Group Description */}
          <View>
            <Text className="text-sm font-medium text-foreground mb-2">Description (Optional)</Text>
            <TextInput
              className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Add a brief description..."
              placeholderTextColor="#a1a1aa"
              value={groupDescription}
              onChangeText={setGroupDescription}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
          </View>
        </View>

        {/* Add Members Section */}
        <View className="bg-card rounded-xl p-6 border border-border">
          <Text className="text-lg font-semibold text-foreground mb-4">
            Add Members <Text className="text-destructive">*</Text>
          </Text>

          {/* Member Name */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-foreground mb-2">Name</Text>
            <TextInput
              className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="Enter member name"
              placeholderTextColor="#a1a1aa"
              value={memberName}
              onChangeText={(text) => {
                setMemberName(text);
                if (errors.memberName) validateMemberName(text);
              }}
            />
            {errors.memberName && (
              <Text className="text-destructive text-xs mt-1">{errors.memberName}</Text>
            )}
          </View>

          {/* Member Email */}
          <View className="mb-3">
            <Text className="text-sm font-medium text-foreground mb-2">Email (Optional)</Text>
            <TextInput
              className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="email@example.com"
              placeholderTextColor="#a1a1aa"
              value={memberEmail}
              onChangeText={setMemberEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Member Phone */}
          <View className="mb-4">
            <Text className="text-sm font-medium text-foreground mb-2">Phone (Optional)</Text>
            <TextInput
              className="bg-input border border-border rounded-lg px-4 py-3 text-foreground"
              placeholder="+1 234 567 8900"
              placeholderTextColor="#a1a1aa"
              value={memberPhone}
              onChangeText={setMemberPhone}
              keyboardType="phone-pad"
            />
          </View>

          {/* Add Member Button */}
          <TouchableOpacity
            onPress={addMember}
            className="bg-primary rounded-lg py-3 flex-row items-center justify-center gap-2"
          >
            <Plus className="text-primary-foreground" size={20} />
            <Text className="text-primary-foreground font-semibold">Add Member</Text>
          </TouchableOpacity>
        </View>

        {/* Members List */}
        {members.length > 0 && (
          <View className="bg-card rounded-xl p-6 border border-border">
            <View className="flex-row items-center justify-between mb-4">
              <Text className="text-lg font-semibold text-foreground">
                Members ({members.length})
              </Text>
            </View>
            {errors.members && (
              <Text className="text-destructive text-sm mb-3">{errors.members}</Text>
            )}

            <View className="gap-3">
              {members.map((member) => (
                <View
                  key={member.id}
                  className="bg-muted rounded-lg p-4 flex-row items-start justify-between"
                >
                  <View className="flex-1">
                    <Text className="text-foreground font-semibold text-base">{member.name}</Text>
                    {member.email && (
                      <Text className="text-muted-foreground text-sm mt-1">{member.email}</Text>
                    )}
                    {member.phone && (
                      <Text className="text-muted-foreground text-sm mt-0.5">{member.phone}</Text>
                    )}
                  </View>
                  <TouchableOpacity
                    onPress={() => removeMember(member.id)}
                    className="bg-destructive/10 rounded-full p-2"
                  >
                    <X className="text-destructive" size={16} />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Create Group Button */}
        <TouchableOpacity
          onPress={saveGroup}
          className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2 shadow-lg"
        >
          <Users className="text-primary-foreground" size={20} />
          <Text className="text-primary-foreground font-bold text-lg">Create Group</Text>
        </TouchableOpacity>

        {/* Helper Text */}
        <View className="bg-accent/50 rounded-lg p-4">
          <Text className="text-accent-foreground text-sm text-center">
            💡 Tip: You can add more members later from the group detail screen
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}