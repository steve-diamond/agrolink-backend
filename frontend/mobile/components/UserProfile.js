// User Profile Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function UserProfile({ profile }) {
  if (!profile) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Name: <Text style={styles.value}>{profile.name}</Text></Text>
      <Text style={styles.label}>Email: <Text style={styles.value}>{profile.email}</Text></Text>
      {/* Add more fields as needed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: 'bold', marginBottom: 8 },
  value: { fontWeight: 'normal' },
});
