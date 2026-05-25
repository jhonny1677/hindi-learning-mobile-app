import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Crypto from 'expo-crypto';
import { useAppContext } from '../contexts/AppContext';
import { webStorage } from '../utils/webStorage';

interface CredentialLoginProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: any) => void;
}

interface StoredAccount {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
}

const ACCOUNTS_KEY = 'hindi_accounts';
const PASSWORD_SALT = 'seekho_hindi_2025';

async function hashPassword(password: string): Promise<string> {
  return Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    password + PASSWORD_SALT,
    { encoding: Crypto.CryptoEncoding.HEX }
  );
}

const CredentialLogin: React.FC<CredentialLoginProps> = ({ visible, onClose, onAuthSuccess }) => {
  const { state } = useAppContext();
  const { darkMode } = state;

  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const resetForm = () => {
    setName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setShowPassword(false);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const switchMode = (newMode: 'signin' | 'signup') => {
    resetForm();
    setMode(newMode);
  };

  const handleSignIn = async () => {
    if (!email.trim() || !password) {
      Alert.alert('Missing Info', 'Please enter your email and password.');
      return;
    }
    setIsLoading(true);
    try {
      const stored = await webStorage.getItem(ACCOUNTS_KEY);
      const accounts: StoredAccount[] = stored ? JSON.parse(stored) : [];
      const account = accounts.find(a => a.email.toLowerCase() === email.toLowerCase().trim());
      if (!account) {
        Alert.alert('Account Not Found', 'No account found with that email. Please sign up first.');
        return;
      }
      const hash = await hashPassword(password);
      if (hash !== account.passwordHash) {
        Alert.alert('Wrong Password', 'Incorrect password. Please try again.');
        return;
      }
      const user = { id: account.id, name: account.name, email: account.email, loginMethod: 'local' };
      await webStorage.setItem('hindi_learning_user', JSON.stringify(user));
      onAuthSuccess(user);
      handleClose();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignUp = async () => {
    if (!name.trim() || !email.trim() || !password || !confirmPassword) {
      Alert.alert('Missing Info', 'Please fill in all fields.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    if (password.length < 6) {
      Alert.alert('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    if (password !== confirmPassword) {
      Alert.alert('Passwords Do Not Match', 'Please make sure both passwords are the same.');
      return;
    }
    setIsLoading(true);
    try {
      const stored = await webStorage.getItem(ACCOUNTS_KEY);
      const accounts: StoredAccount[] = stored ? JSON.parse(stored) : [];
      if (accounts.find(a => a.email.toLowerCase() === email.toLowerCase().trim())) {
        Alert.alert('Already Registered', 'An account with this email already exists. Please sign in.');
        setMode('signin');
        return;
      }
      const passwordHash = await hashPassword(password);
      const newAccount: StoredAccount = {
        id: 'user_' + Date.now(),
        name: name.trim(),
        email: email.toLowerCase().trim(),
        passwordHash,
        createdAt: new Date().toISOString(),
      };
      accounts.push(newAccount);
      await webStorage.setItem(ACCOUNTS_KEY, JSON.stringify(accounts));
      const user = { id: newAccount.id, name: newAccount.name, email: newAccount.email, loginMethod: 'local' };
      await webStorage.setItem('hindi_learning_user', JSON.stringify(user));
      onAuthSuccess(user);
      handleClose();
    } catch {
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueAsGuest = () => {
    onAuthSuccess({ id: 'guest_' + Date.now(), name: 'Guest', email: '', loginMethod: 'guest' });
    handleClose();
  };

  const bg = (light: string, dark: string) => (darkMode ? dark : light);

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'android' ? 0 : 0}
      >
        <View style={[styles.container, { backgroundColor: bg('#F9FAFB', '#111827') }]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderBottomColor: bg('#E5E7EB', '#4B5563') }]}>
            <TouchableOpacity onPress={handleClose}>
              <Ionicons name="close" size={24} color={bg('#374151', '#D1D5DB')} />
            </TouchableOpacity>
            <Text style={[styles.headerTitle, { color: bg('#1F2937', '#F9FAFB') }]}>
              {mode === 'signin' ? 'Sign In' : 'Create Account'}
            </Text>
            <View style={{ width: 24 }} />
          </View>

          <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Icon + Title */}
            <View style={styles.iconSection}>
              <View style={[styles.iconCircle, { backgroundColor: bg('#EEF2FF', '#312E81') }]}>
                <Ionicons name="school" size={40} color={bg('#4F46E5', '#A78BFA')} />
              </View>
              <Text style={[styles.welcomeTitle, { color: bg('#1F2937', '#F9FAFB') }]}>
                Seekho Hindi
              </Text>
              <Text style={[styles.welcomeSub, { color: bg('#6B7280', '#9CA3AF') }]}>
                {mode === 'signin'
                  ? 'Welcome back! Sign in to continue your journey.'
                  : 'Join thousands learning Hindi every day.'}
              </Text>
            </View>

            {/* Mode Tabs */}
            <View style={[styles.tabs, { backgroundColor: bg('#F3F4F6', '#374151') }]}>
              <TouchableOpacity
                style={[styles.tab, mode === 'signin' && { backgroundColor: bg('#FFFFFF', '#1F2937') }]}
                onPress={() => switchMode('signin')}
              >
                <Text style={[styles.tabText, { color: mode === 'signin' ? bg('#4F46E5', '#A78BFA') : bg('#6B7280', '#9CA3AF') }]}>
                  Sign In
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'signup' && { backgroundColor: bg('#FFFFFF', '#1F2937') }]}
                onPress={() => switchMode('signup')}
              >
                <Text style={[styles.tabText, { color: mode === 'signup' ? bg('#4F46E5', '#A78BFA') : bg('#6B7280', '#9CA3AF') }]}>
                  Sign Up
                </Text>
              </TouchableOpacity>
            </View>

            {/* Form */}
            <View style={styles.form}>
              {mode === 'signup' && (
                <View style={styles.field}>
                  <Text style={[styles.label, { color: bg('#374151', '#D1D5DB') }]}>Full Name</Text>
                  <View style={[styles.inputRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderColor: bg('#D1D5DB', '#4B5563') }]}>
                    <Ionicons name="person-outline" size={18} color={bg('#9CA3AF', '#6B7280')} />
                    <TextInput
                      style={[styles.input, { color: bg('#1F2937', '#F9FAFB') }]}
                      value={name}
                      onChangeText={setName}
                      placeholder="Your name"
                      placeholderTextColor={bg('#9CA3AF', '#6B7280')}
                      autoCapitalize="words"
                    />
                  </View>
                </View>
              )}

              <View style={styles.field}>
                <Text style={[styles.label, { color: bg('#374151', '#D1D5DB') }]}>Email</Text>
                <View style={[styles.inputRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderColor: bg('#D1D5DB', '#4B5563') }]}>
                  <Ionicons name="mail-outline" size={18} color={bg('#9CA3AF', '#6B7280')} />
                  <TextInput
                    style={[styles.input, { color: bg('#1F2937', '#F9FAFB') }]}
                    value={email}
                    onChangeText={setEmail}
                    placeholder="you@example.com"
                    placeholderTextColor={bg('#9CA3AF', '#6B7280')}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={styles.field}>
                <Text style={[styles.label, { color: bg('#374151', '#D1D5DB') }]}>Password</Text>
                <View style={[styles.inputRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderColor: bg('#D1D5DB', '#4B5563') }]}>
                  <Ionicons name="lock-closed-outline" size={18} color={bg('#9CA3AF', '#6B7280')} />
                  <TextInput
                    style={[styles.input, { color: bg('#1F2937', '#F9FAFB') }]}
                    value={password}
                    onChangeText={setPassword}
                    placeholder={mode === 'signup' ? 'At least 6 characters' : 'Enter your password'}
                    placeholderTextColor={bg('#9CA3AF', '#6B7280')}
                    secureTextEntry={!showPassword}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                    <Ionicons name={showPassword ? 'eye-off-outline' : 'eye-outline'} size={18} color={bg('#9CA3AF', '#6B7280')} />
                  </TouchableOpacity>
                </View>
              </View>

              {mode === 'signup' && (
                <View style={styles.field}>
                  <Text style={[styles.label, { color: bg('#374151', '#D1D5DB') }]}>Confirm Password</Text>
                  <View style={[styles.inputRow, { backgroundColor: bg('#FFFFFF', '#1F2937'), borderColor: bg('#D1D5DB', '#4B5563') }]}>
                    <Ionicons name="lock-closed-outline" size={18} color={bg('#9CA3AF', '#6B7280')} />
                    <TextInput
                      style={[styles.input, { color: bg('#1F2937', '#F9FAFB') }]}
                      value={confirmPassword}
                      onChangeText={setConfirmPassword}
                      placeholder="Repeat your password"
                      placeholderTextColor={bg('#9CA3AF', '#6B7280')}
                      secureTextEntry={!showPassword}
                    />
                  </View>
                </View>
              )}

              <TouchableOpacity
                style={[styles.primaryBtn, isLoading && { opacity: 0.6 }]}
                onPress={mode === 'signin' ? handleSignIn : handleSignUp}
                disabled={isLoading}
              >
                <Text style={styles.primaryBtnText}>
                  {isLoading ? 'Please wait...' : mode === 'signin' ? 'Sign In' : 'Create Account'}
                </Text>
                {!isLoading && <Ionicons name="arrow-forward" size={18} color="#fff" />}
              </TouchableOpacity>
            </View>

            {/* Divider */}
            <View style={styles.divider}>
              <View style={[styles.dividerLine, { backgroundColor: bg('#E5E7EB', '#4B5563') }]} />
              <Text style={[styles.dividerText, { color: bg('#9CA3AF', '#6B7280') }]}>or</Text>
              <View style={[styles.dividerLine, { backgroundColor: bg('#E5E7EB', '#4B5563') }]} />
            </View>

            {/* Guest */}
            <TouchableOpacity
              style={[styles.guestBtn, { backgroundColor: bg('#F3F4F6', '#374151'), borderColor: bg('#E5E7EB', '#4B5563') }]}
              onPress={handleContinueAsGuest}
            >
              <Ionicons name="person-outline" size={18} color={bg('#6B7280', '#9CA3AF')} />
              <Text style={[styles.guestBtnText, { color: bg('#374151', '#D1D5DB') }]}>Continue as Guest</Text>
            </TouchableOpacity>

            <Text style={[styles.privacyNote, { color: bg('#9CA3AF', '#6B7280') }]}>
              Your account is stored locally on this device. No data is sent to external servers.
            </Text>
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 16,
    borderBottomWidth: 1,
  },
  headerTitle: { fontSize: 18, fontWeight: '600' },
  content: { padding: 24 },
  iconSection: { alignItems: 'center', marginBottom: 28 },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  welcomeTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 6 },
  welcomeSub: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
  tabs: {
    flexDirection: 'row',
    borderRadius: 10,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 8,
  },
  tabText: { fontSize: 15, fontWeight: '600' },
  form: { gap: 16, marginBottom: 24 },
  field: { gap: 6 },
  label: { fontSize: 13, fontWeight: '500' },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    gap: 10,
  },
  input: { flex: 1, fontSize: 15 },
  primaryBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  primaryBtnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  dividerLine: { flex: 1, height: 1 },
  dividerText: { fontSize: 13 },
  guestBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 12,
    gap: 8,
    marginBottom: 20,
  },
  guestBtnText: { fontSize: 15, fontWeight: '500' },
  privacyNote: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 16,
  },
});

export default CredentialLogin;
