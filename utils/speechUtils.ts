import * as Speech from 'expo-speech';
import { Platform, Alert, Vibration } from 'react-native';

export const speakHindi = async (text: string): Promise<void> => {
  // For React Native (mobile)
  if (Platform.OS === 'ios' || Platform.OS === 'android') {
    try {
      // Check if speech is available
      const speechAvailable = await Speech.isSpeakingAsync();
      console.log('Speech available:', !speechAvailable);
      
      // Stop any current speech
      if (speechAvailable) {
        await Speech.stop();
      }
      
      // Vibrate to indicate button press
      Vibration.vibrate(50);
      
      // Try different language options for better compatibility
      const languageOptions = ['hi-IN', 'hi', 'en-IN', 'en-US'];
      
      for (const language of languageOptions) {
        try {
          await Speech.speak(text, {
            language: language,
            pitch: 1.0,
            rate: 0.75,
            volume: 1.0,
            quality: Speech.VoiceQuality.Enhanced,
            onStart: () => {
              console.log(`Speaking with ${language}:`, text);
              // Show visual feedback
              Alert.alert('🔊 Audio', `Playing: ${text}`, [{ text: 'OK' }], { cancelable: true });
            },
            onDone: () => {
              console.log('Speech finished successfully');
            },
            onStopped: () => {
              console.log('Speech stopped');
            },
            onError: (error) => {
              console.warn(`Speech error with ${language}:`, error);
            }
          });
          // If we reach here, speech started successfully
          return;
        } catch (langError) {
          console.warn(`Failed with language ${language}:`, langError);
          continue;
        }
      }
      
      // If all languages failed, show fallback
      Alert.alert('🔊 Pronunciation', `"${text}"`, [
        { text: 'OK' }
      ]);
      
    } catch (error) {
      console.warn('Speech not available:', error);
      Alert.alert('🔊 Pronunciation', `"${text}"`, [
        { text: 'OK' }
      ]);
    }
  } 
  // For Web
  else if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
    // Stop any current speech
    speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'hi-IN';
    utterance.rate = 0.8; // Slightly slower for clarity
    utterance.pitch = 1.0;
    utterance.volume = 1.0;
    
    // Add error handling
    utterance.onerror = (event) => {
      console.warn('Speech synthesis error:', event.error);
      alert(`Pronunciation: ${text}`);
    };
    
    utterance.onstart = () => {
      console.log('Speaking:', text);
    };
    
    // Try to get Hindi voice if available
    const voices = speechSynthesis.getVoices();
    const hindiVoice = voices.find(voice => 
      voice.lang.includes('hi') || 
      voice.lang.includes('IN') ||
      voice.name.toLowerCase().includes('hindi')
    );
    
    if (hindiVoice) {
      utterance.voice = hindiVoice;
    }
    
    speechSynthesis.speak(utterance);
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