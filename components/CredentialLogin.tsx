import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';
import { webStorage } from '../utils/webStorage';

interface CredentialLoginProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

const CredentialLogin: React.FC<CredentialLoginProps> = ({
  visible,
  onClose,
  onAuthSuccess,
}) => {
  const { state } = useAppContext();
  const { darkMode } = state;

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const demoCredentials = [
    {
      email: 'demo.student@hindiapp.com',
      password: 'Student123',
      role: 'Student',
      level: 5,
      xp: 1250,
    },
    {
      email: 'demo.advanced@hindiapp.com',
      password: 'Advanced123',
      role: 'Advanced User',
      level: 15,
      xp: 3750,
    },
  ];

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please enter both email and password');
      return;
    }

    setIsLoading(true);

    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check demo credentials
      const matchingUser = demoCredentials.find(
        cred => cred.email.toLowerCase() === email.toLowerCase() && cred.password === password
      );

      if (matchingUser) {
        const user = {
          id: 'demo_' + Date.now(),
          email: matchingUser.email,
          name: matchingUser.role === 'Student' ? 'Demo Student' : 'Advanced Learner',
          role: matchingUser.role,
          level: matchingUser.level,
          xp: matchingUser.xp,
          verified: true,
          loginMethod: 'credentials',
        };

        // Store user data
        await webStorage.setItem('hindi_learning_user', JSON.stringify(user));
        onAuthSuccess(user);

        Alert.alert(
          '✅ Login Successful!',
          `Welcome back, ${user.name}! Continue your Hindi learning journey.`,
          [{ text: 'Continue', onPress: onClose }]
        );
        
        setEmail('');
        setPassword('');
      } else {
        Alert.alert(
          'Invalid Credentials',
          'Please check your email and password. Use the demo credentials provided in the app.'
        );
      }
    } catch (error) {
      console.error('Login error:', error);
      Alert.alert('Login Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const fillDemoCredentials = (userType: 'student' | 'advanced') => {
    const cred = userType === 'student' ? demoCredentials[0] : demoCredentials[1];
    setEmail(cred.email);
    setPassword(cred.password);
  };

  const renderDemoButtons = () => (
    <View style={styles.demoSection}>
      <Text style={[styles.demoTitle, darkMode && styles.darkText]}>
        Quick Demo Access:
      </Text>
      <View style={styles.demoButtons}>
        <TouchableOpacity
          style={[styles.demoButton, styles.studentButton]}
          onPress={() => fillDemoCredentials('student')}
        >
          <Ionicons name="person" size={16} color="#fff" />
          <Text style={styles.demoButtonText}>Student Demo</Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.demoButton, styles.advancedButton]}
          onPress={() => fillDemoCredentials('advanced')}
        >
          <Ionicons name="star" size={16} color="#fff" />
          <Text style={styles.demoButtonText}>Advanced Demo</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const renderBenefits = () => (
    <View style={[styles.benefitsSection, darkMode && styles.darkBenefitsSection]}>
      <Text style={[styles.benefitsTitle, darkMode && styles.darkText]}>
        🎉 Account Benefits:
      </Text>
      
      <View style={styles.benefitItem}>
        <Ionicons name="trophy" size={18} color="#F59E0B" />
        <Text style={[styles.benefitText, darkMode && styles.darkText]}>
          Track your progress and earn XP
        </Text>
      </View>
      
      <View style={styles.benefitItem}>
        <Ionicons name="flash" size={18} color="#8B5CF6" />
        <Text style={[styles.benefitText, darkMode && styles.darkText]}>
          Unlock achievements and badges
        </Text>
      </View>
      
      <View style={styles.benefitItem}>
        <Ionicons name="stats-chart" size={18} color="#10B981" />
        <Text style={[styles.benefitText, darkMode && styles.darkText]}>
          Detailed learning analytics
        </Text>
      </View>
      
      <View style={styles.benefitItem}>
        <Ionicons name="people" size={18} color="#3B82F6" />
        <Text style={[styles.benefitText, darkMode && styles.darkText]}>
          Compare with other learners
        </Text>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={[styles.container, darkMode && styles.darkContainer]}>
        <View style={[styles.header, darkMode && styles.darkHeader]}>
          <TouchableOpacity onPress={onClose}>
            <Ionicons name="close" size={24} color={darkMode ? "#D1D5DB" : "#374151"} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, darkMode && styles.darkText]}>
            Sign In
          </Text>
          <View style={{ width: 24 }} />
        </View>

        <View style={styles.content}>
          <View style={styles.welcomeSection}>
            <Ionicons name="school" size={48} color={darkMode ? "#A78BFA" : "#4F46E5"} />
            <Text style={[styles.welcomeTitle, darkMode && styles.darkText]}>
              Welcome to Hindi Learning
            </Text>
            <Text style={[styles.welcomeDescription, darkMode && styles.darkDescription]}>
              Sign in with your demo credentials to continue learning Hindi
            </Text>
          </View>

          {renderDemoButtons()}

          <View style={styles.formSection}>
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.darkText]}>Email</Text>
              <View style={[styles.inputContainer, darkMode && styles.darkInputContainer]}>
                <Ionicons name="mail" size={20} color={darkMode ? "#9CA3AF" : "#6B7280"} />
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, darkMode && styles.darkText]}>Password</Text>
              <View style={[styles.inputContainer, darkMode && styles.darkInputContainer]}>
                <Ionicons name="lock-closed" size={20} color={darkMode ? "#9CA3AF" : "#6B7280"} />
                <TextInput
                  style={[styles.input, darkMode && styles.darkInput]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Enter your password"
                  placeholderTextColor={darkMode ? "#6B7280" : "#9CA3AF"}
                  secureTextEntry={!showPassword}
                />
                <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons 
                    name={showPassword ? "eye-off" : "eye"} 
                    size={20} 
                    color={darkMode ? "#9CA3AF" : "#6B7280"} 
                  />
                </TouchableOpacity>
              </View>
            </View>

            <TouchableOpacity
              style={[styles.loginButton, isLoading && styles.disabledButton]}
              onPress={handleLogin}
              disabled={isLoading}
            >
              {isLoading ? (
                <Text style={styles.loginButtonText}>Signing In...</Text>
              ) : (
                <>
                  <Text style={styles.loginButtonText}>Sign In</Text>
                  <Ionicons name="arrow-forward" size={20} color="#fff" />
                </>
              )}
            </TouchableOpacity>
          </View>

          {renderBenefits()}

          <View style={[styles.credentialsInfo, darkMode && styles.darkCredentialsInfo]}>
            <Text style={[styles.credentialsTitle, darkMode && styles.darkText]}>
              Demo Credentials:
            </Text>
            <Text style={[styles.credentialsText, darkMode && styles.darkDescription]}>
              Student: demo.student@hindiapp.com / Student123
            </Text>
            <Text style={[styles.credentialsText, darkMode && styles.darkDescription]}>
              Advanced: demo.advanced@hindiapp.com / Advanced123
            </Text>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
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
  darkHeader: {
    backgroundColor: '#1F2937',
    borderBottomColor: '#4B5563',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  darkText: {
    color: '#F9FAFB',
  },
  darkDescription: {
    color: '#9CA3AF',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 30,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
  },
  demoSection: {
    marginBottom: 24,
  },
  demoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  demoButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  demoButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 12,
    borderRadius: 8,
    gap: 8,
  },
  studentButton: {
    backgroundColor: '#3B82F6',
  },
  advancedButton: {
    backgroundColor: '#8B5CF6',
  },
  demoButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  formSection: {
    marginBottom: 24,
  },
  inputGroup: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 12,
  },
  darkInputContainer: {
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  darkInput: {
    color: '#F9FAFB',
  },
  loginButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    padding: 16,
    borderRadius: 12,
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  benefitsSection: {
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  darkBenefitsSection: {
    backgroundColor: '#1F2937',
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 12,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
  },
  credentialsInfo: {
    backgroundColor: '#EEF2FF',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#4F46E5',
  },
  darkCredentialsInfo: {
    backgroundColor: 'rgba(79, 70, 229, 0.1)',
  },
  credentialsTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#4F46E5',
    marginBottom: 4,
  },
  credentialsText: {
    fontSize: 11,
    color: '#6366F1',
    fontFamily: 'monospace',
  },
});

export default CredentialLogin;