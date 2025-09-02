import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { webStorage } from '../utils/webStorage';
import { useAppContext } from '../contexts/AppContext';

export interface UserProfileData {
  id: string;
  name: string;
  email?: string;
  learningGoal: 'casual' | 'regular' | 'intensive';
  nativeLanguage: string;
  hindiLevel: 'beginner' | 'intermediate' | 'advanced';
  dailyGoalMinutes: number;
  createdAt: string;
  lastSyncAt?: string;
  totalWordsLearned: number;
  totalStudyTime: number;
  achievements: string[];
  preferences: {
    notifications: boolean;
    soundEffects: boolean;
    darkMode: boolean;
    autoplay: boolean;
  };
}

interface UserProfileProps {
  visible: boolean;
  onClose: () => void;
  onProfileUpdate?: (profile: UserProfileData) => void;
}

const PROFILE_STORAGE_KEY = 'hindi_learning_profile';

const defaultProfile: Partial<UserProfileData> = {
  name: '',
  learningGoal: 'regular',
  nativeLanguage: 'English',
  hindiLevel: 'beginner',
  dailyGoalMinutes: 15,
  totalWordsLearned: 0,
  totalStudyTime: 0,
  achievements: [],
  preferences: {
    notifications: true,
    soundEffects: true,
    darkMode: false,
    autoplay: true,
  },
};

export default function UserProfile({ visible, onClose, onProfileUpdate }: UserProfileProps) {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const [profile, setProfile] = useState<UserProfileData | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedProfile, setEditedProfile] = useState<Partial<UserProfileData>>({});
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (visible) {
      loadProfile();
    }
  }, [visible]);

  const loadProfile = async () => {
    try {
      setIsLoading(true);
      const stored = await webStorage.getItem(PROFILE_STORAGE_KEY);
      if (stored) {
        const profileData: UserProfileData = JSON.parse(stored);
        setProfile(profileData);
        setEditedProfile(profileData);
      } else {
        // Create new profile
        const newProfile: UserProfileData = {
          id: Date.now().toString(),
          ...defaultProfile,
          createdAt: new Date().toISOString(),
        } as UserProfileData;
        setProfile(newProfile);
        setEditedProfile(newProfile);
        setIsEditing(true);
      }
    } catch (error) {
      console.error('Error loading profile:', error);
      Alert.alert('Error', 'Failed to load profile data');
    } finally {
      setIsLoading(false);
    }
  };

  const saveProfile = async () => {
    if (!editedProfile.name?.trim()) {
      Alert.alert('Error', 'Please enter your name');
      return;
    }

    try {
      setIsLoading(true);
      const updatedProfile: UserProfileData = {
        ...profile!,
        ...editedProfile,
        lastSyncAt: new Date().toISOString(),
      };
      
      await webStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(updatedProfile));
      setProfile(updatedProfile);
      setIsEditing(false);
      onProfileUpdate?.(updatedProfile);
      Alert.alert('Success', 'Profile updated successfully!');
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to save profile');
    } finally {
      setIsLoading(false);
    }
  };

  const resetProgress = () => {
    Alert.alert(
      'Reset Progress',
      'Are you sure you want to reset all learning progress? This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reset',
          style: 'destructive',
          onPress: async () => {
            const resetProfile = {
              ...profile!,
              totalWordsLearned: 0,
              totalStudyTime: 0,
              achievements: [],
            };
            setProfile(resetProfile);
            await webStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(resetProfile));
            Alert.alert('Success', 'Progress has been reset');
          },
        },
      ]
    );
  };

  const renderEditForm = () => (
    <ScrollView style={styles.form}>
      <View style={styles.inputGroup}>
        <Text style={styles.label}>Name *</Text>
        <TextInput
          style={styles.input}
          value={editedProfile.name || ''}
          onChangeText={(text) => setEditedProfile({ ...editedProfile, name: text })}
          placeholder="Enter your name"
          placeholderTextColor="#9CA3AF"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Email (optional)</Text>
        <TextInput
          style={styles.input}
          value={editedProfile.email || ''}
          onChangeText={(text) => setEditedProfile({ ...editedProfile, email: text })}
          placeholder="Enter your email"
          placeholderTextColor="#9CA3AF"
          keyboardType="email-address"
        />
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Learning Goal</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'casual', label: 'Casual (5-10 min/day)' },
            { key: 'regular', label: 'Regular (10-20 min/day)' },
            { key: 'intensive', label: 'Intensive (20+ min/day)' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                editedProfile.learningGoal === option.key && styles.selectedOption,
              ]}
              onPress={() => setEditedProfile({ ...editedProfile, learningGoal: option.key as any })}
            >
              <Text
                style={[
                  styles.optionText,
                  editedProfile.learningGoal === option.key && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Hindi Level</Text>
        <View style={styles.optionsContainer}>
          {[
            { key: 'beginner', label: 'Beginner' },
            { key: 'intermediate', label: 'Intermediate' },
            { key: 'advanced', label: 'Advanced' },
          ].map((option) => (
            <TouchableOpacity
              key={option.key}
              style={[
                styles.option,
                editedProfile.hindiLevel === option.key && styles.selectedOption,
              ]}
              onPress={() => setEditedProfile({ ...editedProfile, hindiLevel: option.key as any })}
            >
              <Text
                style={[
                  styles.optionText,
                  editedProfile.hindiLevel === option.key && styles.selectedOptionText,
                ]}
              >
                {option.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <View style={styles.inputGroup}>
        <Text style={styles.label}>Daily Goal (minutes)</Text>
        <View style={styles.goalContainer}>
          {[5, 10, 15, 20, 30].map((minutes) => (
            <TouchableOpacity
              key={minutes}
              style={[
                styles.goalOption,
                editedProfile.dailyGoalMinutes === minutes && styles.selectedGoal,
              ]}
              onPress={() => setEditedProfile({ ...editedProfile, dailyGoalMinutes: minutes })}
            >
              <Text
                style={[
                  styles.goalText,
                  editedProfile.dailyGoalMinutes === minutes && styles.selectedGoalText,
                ]}
              >
                {minutes}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    </ScrollView>
  );

  const renderProfileView = () => (
    <ScrollView style={styles.profileView}>
      <View style={styles.profileHeader}>
        <View style={styles.avatarContainer}>
          <Text style={styles.avatarText}>{profile?.name?.[0]?.toUpperCase() || '?'}</Text>
        </View>
        <Text style={styles.profileName}>{profile?.name}</Text>
        {profile?.email && <Text style={styles.profileEmail}>{profile.email}</Text>}
      </View>

      <View style={styles.statsContainer}>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.totalWordsLearned || 0}</Text>
          <Text style={styles.statLabel}>Words Learned</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{Math.floor((profile?.totalStudyTime || 0) / 60)}</Text>
          <Text style={styles.statLabel}>Hours Studied</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statNumber}>{profile?.achievements?.length || 0}</Text>
          <Text style={styles.statLabel}>Achievements</Text>
        </View>
      </View>

      <View style={styles.infoSection}>
        <Text style={styles.sectionTitle}>Learning Details</Text>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Hindi Level:</Text>
          <Text style={styles.infoValue}>{profile?.hindiLevel}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Learning Goal:</Text>
          <Text style={styles.infoValue}>{profile?.learningGoal}</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Daily Goal:</Text>
          <Text style={styles.infoValue}>{profile?.dailyGoalMinutes} minutes</Text>
        </View>
        <View style={styles.infoItem}>
          <Text style={styles.infoLabel}>Member Since:</Text>
          <Text style={styles.infoValue}>
            {profile?.createdAt ? new Date(profile.createdAt).toLocaleDateString() : 'Unknown'}
          </Text>
        </View>
      </View>
    </ScrollView>
  );

  if (!profile && !isLoading) return null;

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={darkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={[styles.title, darkMode && styles.darkText]}>{isEditing ? 'Edit Profile' : 'Your Profile'}</Text>
          <TouchableOpacity
            onPress={isEditing ? saveProfile : () => setIsEditing(true)}
            disabled={isLoading}
          >
            <Text style={[styles.actionText, darkMode && styles.darkActionText]}>
              {isLoading ? 'Saving...' : isEditing ? 'Save' : 'Edit'}
            </Text>
          </TouchableOpacity>
        </View>

        {isEditing ? renderEditForm() : renderProfileView()}

        {!isEditing && (
          <View style={styles.bottomActions}>
            <TouchableOpacity style={styles.resetButton} onPress={resetProgress}>
              <Ionicons name="refresh" size={20} color="#EF4444" />
              <Text style={styles.resetText}>Reset Progress</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
  },
  darkContainer: {
    backgroundColor: '#111827',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 60,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#4F46E5',
  },
  form: {
    flex: 1,
    padding: 20,
  },
  inputGroup: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    backgroundColor: '#FFFFFF',
    color: '#1F2937',
  },
  optionsContainer: {
    gap: 8,
  },
  option: {
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  selectedOption: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  optionText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedOptionText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  goalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  goalOption: {
    flex: 1,
    margin: 4,
    padding: 12,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
  },
  selectedGoal: {
    borderColor: '#4F46E5',
    backgroundColor: '#EEF2FF',
  },
  goalText: {
    fontSize: 14,
    color: '#6B7280',
  },
  selectedGoalText: {
    color: '#4F46E5',
    fontWeight: '600',
  },
  profileView: {
    flex: 1,
    padding: 20,
  },
  profileHeader: {
    alignItems: 'center',
    marginBottom: 30,
  },
  avatarContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#4F46E5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  profileName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
  },
  profileEmail: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 4,
  },
  statsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 20,
  },
  statItem: {
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#4F46E5',
  },
  statLabel: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 4,
  },
  infoSection: {
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#1F2937',
    textTransform: 'capitalize',
  },
  bottomActions: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  resetText: {
    color: '#EF4444',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  // Dark mode styles
  darkHeader: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#4B5563',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkActionText: {
    color: '#A78BFA',
  },
});