import * as Speech from 'expo-speech';
import { Platform, Vibration, Alert } from 'react-native';

export const speakHindi = async (text: string): Promise<void> => {
  // For React Native (mobile)
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      const isSpeaking = await Speech.isSpeakingAsync();
      if (isSpeaking) {
        await Speech.stop();
      }

      Vibration.vibrate(30);

      // Try hi-IN first; fall back to hi on error
      console.log('[speakHindi] calling Speech.speak:', text);
      Speech.speak(text, {
        language: 'hi-IN',
        pitch: 1.0,
        rate: 0.75,
        volume: 1.0,
        onError: (err) => {
          console.warn('[speakHindi] hi-IN failed, falling back to hi:', err);
          Speech.speak(text, {
            language: 'hi',
            pitch: 1.0,
            rate: 0.75,
            volume: 1.0,
          });
        },
      });
    } catch (error) {
      console.warn('Speech not available:', error);
    }
  } 
  // For Web
  else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    try {
      // Stop any current speech
      speechSynthesis.cancel();
      
      // Wait for voices to load
      const loadVoices = () => {
        return new Promise<void>((resolve) => {
          const voices = speechSynthesis.getVoices();
          if (voices.length > 0) {
            resolve();
          } else {
            speechSynthesis.onvoiceschanged = () => {
              resolve();
            };
          }
        });
      };
      
      await loadVoices();
      
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.7; // Slower for Hindi pronunciation
      utterance.pitch = 1.0;
      utterance.volume = 1.0;
      
      // Try to find the best Hindi voice
      const voices = speechSynthesis.getVoices();
      console.log('Available voices:', voices.map(v => ({ name: v.name, lang: v.lang })));
      
      // Priority order for voice selection
      const voicePreferences = [
        (v: any) => v.lang === 'hi-IN',
        (v: any) => v.lang === 'hi',
        (v: any) => v.lang.includes('hi'),
        (v: any) => v.lang === 'en-IN',
        (v: any) => v.lang === 'en-US',
        (v: any) => v.default === true,
      ];
      
      let selectedVoice = null;
      for (const preference of voicePreferences) {
        selectedVoice = voices.find(preference);
        if (selectedVoice) break;
      }
      
      if (selectedVoice) {
        utterance.voice = selectedVoice;
        utterance.lang = selectedVoice.lang;
        console.log('Selected voice:', selectedVoice.name, selectedVoice.lang);
      } else {
        utterance.lang = 'hi-IN';
      }
      
      // Add error handling
      utterance.onerror = (event) => {
        console.warn('Speech synthesis error:', event.error);
        // Show visual feedback instead of alert
        const notification = document.createElement('div');
        notification.textContent = `🔊 Pronunciation: ${text}`;
        notification.style.cssText = `
          position: fixed; top: 20px; right: 20px; z-index: 9999;
          background: #4F46E5; color: white; padding: 12px 20px;
          border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
        `;
        document.body.appendChild(notification);
        setTimeout(() => document.body.removeChild(notification), 3000);
      };
      
      utterance.onstart = () => {
        console.log('Speaking:', text);
      };
      
      utterance.onend = () => {
        console.log('Speech finished');
      };
      
      speechSynthesis.speak(utterance);
    } catch (error) {
      console.warn('Web speech synthesis error:', error);
      // Visual fallback
      const notification = document.createElement('div');
      notification.textContent = `🔊 Pronunciation: ${text}`;
      notification.style.cssText = `
        position: fixed; top: 20px; right: 20px; z-index: 9999;
        background: #4F46E5; color: white; padding: 12px 20px;
        border-radius: 8px; font-size: 14px; box-shadow: 0 4px 12px rgba(0,0,0,0.3);
      `;
      document.body.appendChild(notification);
      setTimeout(() => document.body.removeChild(notification), 3000);
    }
  } else {
    console.warn('Speech synthesis not supported in this environment');
    // Fallback: show pronunciation text
    if (Platform.OS === 'web') {
      alert(`Pronunciation: ${text}`);
    } else {
      Alert.alert('Pronunciation', text);
    }
  }
};