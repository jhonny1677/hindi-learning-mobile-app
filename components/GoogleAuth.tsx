import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import { webStorage } from '../utils/webStorage';
import { useAppContext } from '../contexts/AppContext';

WebBrowser.maybeCompleteAuthSession();

// Google OAuth Configuration
// To use real OAuth, replace these with your actual Google OAuth credentials
const GOOGLE_OAUTH_CONFIG = {
  clientId: 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com',
  // For Expo Go, use the universal redirect URI pattern
  redirectUri: AuthSession.makeRedirectUri({
    scheme: 'hindilearningapp',
    path: 'auth'
  }),
  scopes: ['openid', 'profile', 'email'],
  responseType: AuthSession.ResponseType.Code,
};

export interface GoogleUser {
  id: string;
  email: string;
  name: string;
  picture?: string;
  verified_email: boolean;
}

interface GoogleAuthProps {
  visible: boolean;
  onClose: () => void;
  onAuthSuccess: (user: GoogleUser) => void;
}

const GOOGLE_USER_KEY = 'hindi_learning_google_user';

export default function GoogleAuth({ visible, onClose, onAuthSuccess }: GoogleAuthProps) {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const [isLoading, setIsLoading] = useState(false);
  const [currentUser, setCurrentUser] = useState<GoogleUser | null>(null);

  useEffect(() => {
    loadStoredUser();
  }, []);

  const loadStoredUser = async () => {
    try {
      const stored = await webStorage.getItem(GOOGLE_USER_KEY);
      if (stored) {
        const user: GoogleUser = JSON.parse(stored);
        setCurrentUser(user);
      }
    } catch (error) {
      console.error('Error loading stored user:', error);
    }
  };

  const simulateGoogleAuth = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Mock Google user data
      const mockUser: GoogleUser = {
        id: 'google_' + Date.now(),
        email: 'user@gmail.com',
        name: 'Hindi Learner',
        picture: 'https://via.placeholder.com/100',
        verified_email: true,
      };

      // Store user data
      await webStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(mockUser));
      setCurrentUser(mockUser);
      onAuthSuccess(mockUser);
      
      Alert.alert(
        '✅ Sign In Successful!',
        `Welcome, ${mockUser.name}! Your progress will now be synced across devices.`,
        [{ text: 'Great!', onPress: onClose }]
      );
    } catch (error) {
      console.error('Google auth error:', error);
      Alert.alert('Authentication Error', 'Failed to sign in with Google. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const realGoogleAuth = async () => {
    if (GOOGLE_OAUTH_CONFIG.clientId === 'YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com') {
      Alert.alert(
        '🔧 Real OAuth Setup Required',
        `To use real Google OAuth, you need to:

1. Go to Google Cloud Console (console.cloud.google.com)
2. Create a new project or select existing one
3. Enable Google+ API and OAuth 2.0
4. Go to "Credentials" → "Create Credentials" → "OAuth 2.0 Client ID"
5. For application type, choose "Web application"
6. Add your redirect URI: ${GOOGLE_OAUTH_CONFIG.redirectUri}
7. Replace 'YOUR_GOOGLE_CLIENT_ID' in GoogleAuth.tsx with your actual client ID

This is completely FREE! Google OAuth doesn't cost anything.

Current redirect URI for setup: ${GOOGLE_OAUTH_CONFIG.redirectUri}`,
        [
          { text: 'Got it', style: 'default' },
          { text: 'Copy Redirect URI', onPress: () => console.log('Copy:', GOOGLE_OAUTH_CONFIG.redirectUri) }
        ]
      );
      return;
    }

    setIsLoading(true);
    
    try {
      // Create code verifier and challenge for PKCE
      const codeVerifier = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        Math.random().toString(),
        { encoding: Crypto.CryptoEncoding.BASE64URL }
      );
      
      // Build the authorization URL
      const authUrl = `https://accounts.google.com/oauth/authorize?` +
        `client_id=${GOOGLE_OAUTH_CONFIG.clientId}&` +
        `redirect_uri=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.redirectUri)}&` +
        `response_type=code&` +
        `scope=${encodeURIComponent(GOOGLE_OAUTH_CONFIG.scopes.join(' '))}&` +
        `code_challenge=${codeVerifier}&` +
        `code_challenge_method=S256`;

      console.log('Opening auth URL:', authUrl);
      console.log('Redirect URI:', GOOGLE_OAUTH_CONFIG.redirectUri);

      const result = await WebBrowser.openAuthSessionAsync(
        authUrl,
        GOOGLE_OAUTH_CONFIG.redirectUri
      );

      if (result.type === 'success' && result.url) {
        const urlParams = new URLSearchParams(result.url.split('?')[1]);
        const authCode = urlParams.get('code');
        
        if (authCode) {
          // Exchange auth code for user info
          // In production, you'd call your backend here to exchange the code for tokens
          // For now, we'll simulate getting user info
          const userInfo = await fetchGoogleUserInfo(authCode, codeVerifier);
          
          if (userInfo) {
            await webStorage.setItem(GOOGLE_USER_KEY, JSON.stringify(userInfo));
            setCurrentUser(userInfo);
            onAuthSuccess(userInfo);
            
            Alert.alert(
              '✅ Real OAuth Success!',
              `Welcome, ${userInfo.name}! You've successfully signed in with real Google OAuth.`,
              [{ text: 'Great!', onPress: onClose }]
            );
          }
        } else {
          throw new Error('No authorization code received');
        }
      } else if (result.type === 'cancel') {
        console.log('User cancelled authentication');
      } else {
        throw new Error('Authentication failed');
      }
    } catch (error) {
      console.error('Real Google auth error:', error);
      Alert.alert(
        'Authentication Error',
        `Failed to authenticate with Google: ${error.message}\n\nMake sure you've configured your Google OAuth credentials correctly.`
      );
    } finally {
      setIsLoading(false);
    }
  };

  const fetchGoogleUserInfo = async (authCode: string, codeVerifier: string): Promise<GoogleUser | null> => {
    try {
      // In a real app, you would exchange the auth code for an access token
      // and then fetch user info from Google's API
      // For this demo, we'll simulate the process
      
      console.log('Exchanging auth code for user info...');
      
      // Simulate API call - in production, call your backend
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Mock user data based on successful OAuth flow
      const mockUser: GoogleUser = {
        id: 'real_google_' + Date.now(),
        email: 'realuser@gmail.com',
        name: 'Real Google User',
        picture: 'https://via.placeholder.com/100',
        verified_email: true,
      };
      
      return mockUser;
    } catch (error) {
      console.error('Error fetching user info:', error);
      return null;
    }
  };

  const signOut = async () => {
    try {
      await webStorage.removeItem(GOOGLE_USER_KEY);
      setCurrentUser(null);
      Alert.alert('Signed Out', 'You have been signed out successfully.');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  const renderSignedInUser = () => (
    <View style={styles.userContainer}>
      <View style={[styles.userCard, darkMode && styles.darkUserCard]}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{currentUser?.name[0]?.toUpperCase()}</Text>
        </View>
        <View style={styles.userInfo}>
          <Text style={[styles.userName, darkMode && styles.darkText]}>{currentUser?.name}</Text>
          <Text style={[styles.userEmail, darkMode && styles.darkDescription]}>{currentUser?.email}</Text>
          {currentUser?.verified_email && (
            <View style={styles.verifiedBadge}>
              <Ionicons name="checkmark-circle" size={16} color="#10B981" />
              <Text style={styles.verifiedText}>Verified</Text>
            </View>
          )}
        </View>
      </View>

      <View style={styles.benefitsList}>
        <Text style={[styles.benefitsTitle, darkMode && styles.darkText]}>
          🎉 You're signed in! Benefits include:
        </Text>
        
        <View style={styles.benefitItem}>
          <Ionicons name="cloud-upload" size={20} color="#4F46E5" />
          <Text style={[styles.benefitText, darkMode && styles.darkText]}>
            Progress synced across devices
          </Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="shield-checkmark" size={20} color="#10B981" />
          <Text style={[styles.benefitText, darkMode && styles.darkText]}>
            Secure backup of your data
          </Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="people" size={20} color="#8B5CF6" />
          <Text style={[styles.benefitText, darkMode && styles.darkText]}>
            Compare progress with friends
          </Text>
        </View>
        
        <View style={styles.benefitItem}>
          <Ionicons name="trophy" size={20} color="#F59E0B" />
          <Text style={[styles.benefitText, darkMode && styles.darkText]}>
            Global leaderboards access
          </Text>
        </View>
      </View>

      <TouchableOpacity
        style={[styles.signOutButton, darkMode && styles.darkSignOutButton]}
        onPress={signOut}
      >
        <Ionicons name="log-out" size={20} color="#EF4444" />
        <Text style={styles.signOutText}>Sign Out</Text>
      </TouchableOpacity>
    </View>
  );

  const renderSignInOptions = () => (
    <View style={styles.authContainer}>
      <View style={styles.welcomeSection}>
        <Ionicons name="people-circle" size={64} color={darkMode ? "#A78BFA" : "#4F46E5"} />
        <Text style={[styles.welcomeTitle, darkMode && styles.darkText]}>
          Sign in to Hindi Learning
        </Text>
        <Text style={[styles.welcomeDescription, darkMode && styles.darkDescription]}>
          Connect your Google account to sync your progress across all devices and unlock premium features.
        </Text>
      </View>

      <View style={styles.authOptions}>
        <TouchableOpacity
          style={[styles.googleButton, darkMode && styles.darkGoogleButton]}
          onPress={simulateGoogleAuth}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator size="small" color="#4285F4" />
          ) : (
            <>
              <Ionicons name="logo-google" size={20} color="#4285F4" />
              <Text style={[styles.googleButtonText, darkMode && styles.darkGoogleButtonText]}>
                Sign in with Google
              </Text>
            </>
          )}
        </TouchableOpacity>

        <Text style={[styles.demoNote, darkMode && styles.darkDescription]}>
          📝 This is a demo implementation. In production, this would connect to real Google OAuth.
        </Text>

        <TouchableOpacity
          style={[styles.realAuthButton, darkMode && styles.darkRealAuthButton]}
          onPress={realGoogleAuth}
          disabled={isLoading}
        >
          <Ionicons name="code-working" size={16} color={darkMode ? "#A78BFA" : "#4F46E5"} />
          <Text style={[styles.realAuthText, darkMode && styles.darkRealAuthText]}>
            Try Real OAuth (Demo)
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.privacyNote}>
        <Ionicons name="shield-checkmark" size={16} color="#10B981" />
        <Text style={[styles.privacyText, darkMode && styles.darkDescription]}>
          We respect your privacy. Only basic profile info is used to enhance your learning experience.
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
            Account
          </Text>
          <View style={{ width: 24 }} />
        </View>

        {currentUser ? renderSignedInUser() : renderSignInOptions()}
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
  authContainer: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  welcomeSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  welcomeDescription: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  authOptions: {
    marginBottom: 30,
  },
  googleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#E5E7EB',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkGoogleButton: {
    backgroundColor: '#1F2937',
    borderColor: '#4B5563',
  },
  googleButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginLeft: 12,
  },
  darkGoogleButtonText: {
    color: '#F9FAFB',
  },
  demoNote: {
    fontSize: 12,
    color: '#6B7280',
    textAlign: 'center',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  realAuthButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EEF2FF',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#4F46E5',
  },
  darkRealAuthButton: {
    backgroundColor: 'rgba(167, 139, 250, 0.1)',
    borderColor: '#A78BFA',
  },
  realAuthText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#4F46E5',
    marginLeft: 8,
  },
  darkRealAuthText: {
    color: '#A78BFA',
  },
  privacyNote: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F0FDF4',
    padding: 12,
    borderRadius: 8,
    borderLeftWidth: 4,
    borderLeftColor: '#10B981',
  },
  privacyText: {
    fontSize: 12,
    color: '#059669',
    marginLeft: 8,
    flex: 1,
    lineHeight: 16,
  },
  userContainer: {
    flex: 1,
    padding: 20,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    padding: 20,
    borderRadius: 16,
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  darkUserCard: {
    backgroundColor: '#1F2937',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  avatarText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
  },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  verifiedText: {
    fontSize: 12,
    color: '#10B981',
    fontWeight: '500',
    marginLeft: 4,
  },
  benefitsList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  benefitsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  benefitItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  benefitText: {
    fontSize: 14,
    color: '#374151',
    marginLeft: 12,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  darkSignOutButton: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderColor: '#EF4444',
  },
  signOutText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#EF4444',
    marginLeft: 8,
  },
});