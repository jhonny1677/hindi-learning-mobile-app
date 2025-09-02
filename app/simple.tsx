import React, { useState } from 'react';
import { SafeAreaView, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { useAppContext } from '../contexts/AppContext';

export default function SimpleApp() {
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const [score, setScore] = useState({ correct: 0, total: 0 });

  const { setDifficulty, resetScore } = useAppContext();

  const difficulties = [
    { name: 'Beginner', color: '#10B981', description: 'Start your Hindi journey' },
    { name: 'Intermediate', color: '#F59E0B', description: 'Build on your skills' },
    { name: 'Advanced', color: '#3B82F6', description: 'Challenge yourself' },
    { name: 'Expert', color: '#EF4444', description: 'Master the language' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      {difficulties.map((diff) => (
        <TouchableOpacity
          key={diff.name}
          style={[styles.button, { backgroundColor: diff.color }]}
          onPress={() => {
            setSelectedDifficulty(diff.name);
            setDifficulty(diff.name.toLowerCase() as any);
            resetScore();
          }}
        >
          <Text style={styles.text}>{diff.name}</Text>
          <Text style={styles.desc}>{diff.description}</Text>
        </TouchableOpacity>
      ))}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 10 },
  button: { padding: 15, borderRadius: 10, marginBottom: 10 },
  text: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  desc: { color: '#fff', fontSize: 14 }
});
