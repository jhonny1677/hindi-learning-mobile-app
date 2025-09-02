import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function MinimalApp() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Hindi Learning App</Text>
      <Text style={styles.subtitle}>App is working!</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F0F4F8',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 20,
    color: '#4F46E5',
    textAlign: 'center',
    fontWeight: '600',
  },
});