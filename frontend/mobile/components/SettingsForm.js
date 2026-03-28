// Settings Form Component
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

export default function SettingsForm({ settings }) {
  if (!settings) return null;
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Notifications: <Text style={styles.value}>{settings.notifications ? 'On' : 'Off'}</Text></Text>
      {/* Add more settings fields as needed */}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16 },
  label: { fontWeight: 'bold', marginBottom: 8 },
  value: { fontWeight: 'normal' },
});
