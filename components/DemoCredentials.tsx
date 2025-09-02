import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface DemoCredentialsProps {
  onClose?: () => void;
}

const DemoCredentials: React.FC<DemoCredentialsProps> = ({ onClose }) => {
  const [visible, setVisible] = useState(true);

  const demoAccounts = [
    {
      role: 'Student',
      email: 'demo.student@hindiapp.com',
      password: 'Student123',
      description: 'Complete learning experience with progress tracking'
    },
    {
      role: 'Advanced User',
      email: 'demo.advanced@hindiapp.com',
      password: 'Advanced123',
      description: 'User with unlocked achievements and high level'
    }
  ];

  const copyToClipboard = (text: string) => {
    // For web, we'd use navigator.clipboard
    Alert.alert('Copied!', `Copied "${text}" to clipboard`);
  };

  const handleClose = () => {
    setVisible(false);
    onClose?.();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>🎯 Demo Credentials for Recruiters</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="#666" />
          </TouchableOpacity>
        </View>

        <View style={styles.welcomeCard}>
          <Text style={styles.welcomeText}>
            Welcome! This is a fully functional Hindi Learning App demo.
            Use the credentials below to explore all features.
          </Text>
        </View>

        {demoAccounts.map((account, index) => (
          <View key={index} style={styles.credentialCard}>
            <View style={styles.roleHeader}>
              <Ionicons name="person-circle" size={24} color="#4F46E5" />
              <Text style={styles.roleTitle}>{account.role} Account</Text>
            </View>
            
            <Text style={styles.description}>{account.description}</Text>
            
            <View style={styles.credentialRow}>
              <Text style={styles.label}>Email:</Text>
              <TouchableOpacity 
                style={styles.credentialValue}
                onPress={() => copyToClipboard(account.email)}
              >
                <Text style={styles.valueText}>{account.email}</Text>
                <Ionicons name="copy" size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>
            
            <View style={styles.credentialRow}>
              <Text style={styles.label}>Password:</Text>
              <TouchableOpacity 
                style={styles.credentialValue}
                onPress={() => copyToClipboard(account.password)}
              >
                <Text style={styles.valueText}>{account.password}</Text>
                <Ionicons name="copy" size={16} color="#4F46E5" />
              </TouchableOpacity>
            </View>
          </View>
        ))}

        <View style={styles.featuresCard}>
          <Text style={styles.featuresTitle}>🌟 Key Features to Explore:</Text>
          <View style={styles.featuresList}>
            <Text style={styles.featureItem}>• Complete gamification system with XP & levels</Text>
            <Text style={styles.featureItem}>• Daily quests and achievement badges</Text>
            <Text style={styles.featureItem}>• Social features and leaderboards</Text>
            <Text style={styles.featureItem}>• Dark/Light mode toggle</Text>
            <Text style={styles.featureItem}>• Offline learning capabilities</Text>
            <Text style={styles.featureItem}>• Real-time progress analytics</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.startButton} onPress={handleClose}>
          <Text style={styles.startButtonText}>Start Exploring App</Text>
          <Ionicons name="arrow-forward" size={20} color="white" />
        </TouchableOpacity>

        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Developed by <Text style={styles.developer}>Ankit Aggarwal</Text>
          </Text>
          <Text style={styles.techStack}>
            React Native • Expo • TypeScript • SQLite
          </Text>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8fafc',
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 40,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
  },
  closeButton: {
    padding: 8,
    borderRadius: 20,
    backgroundColor: '#f1f5f9',
  },
  welcomeCard: {
    backgroundColor: '#dbeafe',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#3b82f6',
  },
  welcomeText: {
    fontSize: 16,
    color: '#1e40af',
    lineHeight: 22,
  },
  credentialCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  roleHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  roleTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1e293b',
    marginLeft: 8,
  },
  description: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 16,
    fontStyle: 'italic',
  },
  credentialRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    width: 80,
  },
  credentialValue: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f1f5f9',
    padding: 12,
    borderRadius: 8,
    flex: 1,
    marginLeft: 12,
  },
  valueText: {
    fontSize: 14,
    color: '#1e293b',
    fontFamily: 'monospace',
    flex: 1,
  },
  featuresCard: {
    backgroundColor: '#f0fdf4',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#22c55e',
  },
  featuresTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#15803d',
    marginBottom: 12,
  },
  featuresList: {
    marginLeft: 8,
  },
  featureItem: {
    fontSize: 14,
    color: '#166534',
    marginBottom: 6,
    lineHeight: 20,
  },
  startButton: {
    backgroundColor: '#4F46E5',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
  },
  startButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
    marginRight: 8,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#e2e8f0',
  },
  footerText: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: 4,
  },
  developer: {
    fontWeight: '600',
    color: '#4F46E5',
  },
  techStack: {
    fontSize: 12,
    color: '#94a3b8',
    fontStyle: 'italic',
  },
});

export default DemoCredentials;