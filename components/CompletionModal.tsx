import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
} from 'react-native';

interface CompletionModalProps {
  visible: boolean;
  difficulty: 'beginner' | 'intermediate' | 'advanced' | 'expert' | null;
  onClose: () => void;
  onContinue?: () => void;
  onNextLevel?: () => void;
}

const CompletionModal: React.FC<CompletionModalProps> = ({
  visible,
  difficulty,
  onClose,
  onContinue,
  onNextLevel,
}) => {
  const scaleValue = React.useRef(new Animated.Value(0)).current;
  const fadeValue = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleValue, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 8,
        }),
        Animated.timing(fadeValue, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      scaleValue.setValue(0);
      fadeValue.setValue(0);
    }
  }, [visible, scaleValue, fadeValue]);

  const getDifficultyInfo = (difficulty: string) => {
    if (!difficulty) return {
      color: '#757575',
      emoji: '✨',
      title: 'Level Complete!',
      message: 'Congratulations on your achievement!',
      nextLevel: ''
    };
    
    switch (difficulty.toLowerCase()) {
      case 'beginner':
        return {
          color: '#4CAF50',
          emoji: '🌟',
          title: 'Beginner Level Complete!',
          message: 'Great start! You\'ve mastered the basics of Hindi.',
          nextLevel: 'Ready for Intermediate?'
        };
      case 'intermediate':
        return {
          color: '#FF9800',
          emoji: '🏆',
          title: 'Intermediate Level Complete!',
          message: 'Impressive! You\'re building strong Hindi skills.',
          nextLevel: 'Ready for Advanced?'
        };
      case 'advanced':
        return {
          color: '#2196F3',
          emoji: '🎯',
          title: 'Advanced Level Complete!',
          message: 'Excellent! You\'ve mastered complex Hindi concepts.',
          nextLevel: 'Ready for Expert?'
        };
      case 'expert':
        return {
          color: '#9C27B0',
          emoji: '👑',
          title: 'Expert Level Complete!',
          message: 'Outstanding! You\'ve achieved Hindi mastery!',
          nextLevel: ''
        };
      default:
        return {
          color: '#757575',
          emoji: '✨',
          title: 'Level Complete!',
          message: 'Congratulations on your achievement!',
          nextLevel: ''
        };
    }
  };

  const info = getDifficultyInfo(difficulty || '');
  const isExpert = difficulty === 'expert';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeValue }]}>
        <Animated.View
          style={[
            styles.modal,
            { transform: [{ scale: scaleValue }] },
            { borderTopColor: info.color }
          ]}
        >
          <View style={styles.header}>
            <Text style={styles.emoji}>{info.emoji}</Text>
            <Text style={[styles.title, { color: info.color }]}>
              {info.title}
            </Text>
          </View>

          <View style={styles.content}>
            <Text style={styles.message}>{info.message}</Text>
            
            <View style={styles.statsContainer}>
              <Text style={styles.statsText}>
                All cards completed successfully! 🎉
              </Text>
            </View>
          </View>

          <View style={styles.buttonContainer}>
            <TouchableOpacity
              style={[styles.button, styles.closeButton]}
              onPress={onClose}
            >
              <Text style={styles.closeButtonText}>Back to Home</Text>
            </TouchableOpacity>
            
            {onContinue && (
              <TouchableOpacity
                style={[styles.button, styles.nextButton, { backgroundColor: info.color }]}
                onPress={onContinue}
              >
                <Text style={styles.nextButtonText}>Continue Learning</Text>
              </TouchableOpacity>
            )}
            
            {!isExpert && onNextLevel && (
              <TouchableOpacity
                style={[styles.button, styles.nextButton, { backgroundColor: info.color }]}
                onPress={onNextLevel}
              >
                <Text style={styles.nextButtonText}>{info.nextLevel}</Text>
              </TouchableOpacity>
            )}
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 20,
    width: '100%',
    maxWidth: 350,
    borderTopWidth: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    padding: 24,
    paddingBottom: 16,
  },
  emoji: {
    fontSize: 48,
    marginBottom: 8,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  message: {
    fontSize: 16,
    textAlign: 'center',
    color: '#555',
    lineHeight: 24,
    marginBottom: 16,
  },
  statsContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  statsText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '500',
  },
  buttonContainer: {
    padding: 24,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  nextButton: {
    backgroundColor: '#4CAF50',
  },
  nextButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});

export default CompletionModal;