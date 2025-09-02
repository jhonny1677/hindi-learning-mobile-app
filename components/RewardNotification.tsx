import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useAppContext } from '../contexts/AppContext';

interface RewardNotificationProps {
  visible: boolean;
  onClose: () => void;
  type: 'xp' | 'badge' | 'quest' | 'levelup';
  title: string;
  description: string;
  xpAmount?: number;
  iconName?: keyof typeof Ionicons.glyphMap;
  rarity?: 'common' | 'rare' | 'epic' | 'legendary';
}

const { width } = Dimensions.get('window');

const RewardNotification: React.FC<RewardNotificationProps> = ({
  visible,
  onClose,
  type,
  title,
  description,
  xpAmount,
  iconName = 'trophy',
  rarity = 'common',
}) => {
  const { state } = useAppContext();
  const { darkMode } = state;
  
  const [slideAnim] = useState(new Animated.Value(-200));
  const [scaleAnim] = useState(new Animated.Value(0.8));
  const [glowAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      // Entrance animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 120,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.loop(
          Animated.sequence([
            Animated.timing(glowAnim, {
              toValue: 1,
              duration: 1000,
              useNativeDriver: false,
            }),
            Animated.timing(glowAnim, {
              toValue: 0,
              duration: 1000,
              useNativeDriver: false,
            }),
          ])
        ),
      ]).start();

      // Auto dismiss after 4 seconds
      const timer = setTimeout(() => {
        handleClose();
      }, 4000);

      return () => clearTimeout(timer);
    }
  }, [visible, slideAnim, scaleAnim, glowAnim]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -200,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 0.8,
        duration: 300,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  const getTypeColor = () => {
    switch (type) {
      case 'xp':
        return '#3B82F6';
      case 'badge':
        return getRarityColor();
      case 'quest':
        return '#10B981';
      case 'levelup':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getRarityColor = () => {
    switch (rarity) {
      case 'common':
        return '#10B981';
      case 'rare':
        return '#3B82F6';
      case 'epic':
        return '#8B5CF6';
      case 'legendary':
        return '#F59E0B';
      default:
        return '#6B7280';
    }
  };

  const getTypeEmoji = () => {
    switch (type) {
      case 'xp':
        return '⭐';
      case 'badge':
        return '🏆';
      case 'quest':
        return '✅';
      case 'levelup':
        return '🚀';
      default:
        return '🎉';
    }
  };

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Animated.View
        style={[
          styles.notification,
          darkMode && styles.darkNotification,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim },
            ],
            borderColor: getTypeColor(),
            shadowColor: getTypeColor(),
          },
        ]}
      >
        {/* Glow effect */}
        <Animated.View
          style={[
            styles.glowEffect,
            {
              backgroundColor: getTypeColor(),
              opacity: glowAnim,
            },
          ]}
        />

        {/* Close button */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={handleClose}
        >
          <Ionicons
            name="close"
            size={20}
            color={darkMode ? '#9CA3AF' : '#6B7280'}
          />
        </TouchableOpacity>

        {/* Content */}
        <View style={styles.content}>
          {/* Icon and emoji */}
          <View style={[styles.iconContainer, { backgroundColor: getTypeColor() }]}>
            <Text style={styles.emoji}>{getTypeEmoji()}</Text>
            <Ionicons
              name={iconName}
              size={32}
              color="#FFFFFF"
              style={styles.icon}
            />
          </View>

          {/* Text content */}
          <View style={styles.textContent}>
            <Text style={[styles.title, darkMode && styles.darkText]}>
              {title}
            </Text>
            <Text style={[styles.description, darkMode && styles.darkDescription]}>
              {description}
            </Text>
            
            {xpAmount && xpAmount > 0 && (
              <View style={[styles.xpBadge, { backgroundColor: getTypeColor() }]}>
                <Ionicons name="flash" size={16} color="#FFFFFF" />
                <Text style={styles.xpText}>+{xpAmount} XP</Text>
              </View>
            )}
          </View>
        </View>

        {/* Bottom accent */}
        <View style={[styles.accent, { backgroundColor: getTypeColor() }]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9999,
    pointerEvents: 'none',
  },
  notification: {
    position: 'absolute',
    top: 80,
    left: 20,
    right: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
    pointerEvents: 'auto',
  },
  darkNotification: {
    backgroundColor: '#1F2937',
  },
  glowEffect: {
    position: 'absolute',
    top: -2,
    left: -2,
    right: -2,
    bottom: -2,
    borderRadius: 18,
    opacity: 0.2,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 4,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.1)',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    position: 'relative',
  },
  emoji: {
    position: 'absolute',
    top: -8,
    right: -8,
    fontSize: 20,
    zIndex: 1,
  },
  icon: {
    // Icon styling
  },
  textContent: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 4,
  },
  darkText: {
    color: '#F9FAFB',
  },
  description: {
    fontSize: 14,
    color: '#6B7280',
    marginBottom: 8,
    lineHeight: 20,
  },
  darkDescription: {
    color: '#9CA3AF',
  },
  xpBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  xpText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  accent: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 4,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 16,
  },
});

export default RewardNotification;