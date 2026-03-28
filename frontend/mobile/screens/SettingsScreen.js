// Settings Screen
import React, { useEffect, useState } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import SettingsForm from '../components/SettingsForm';
import { getSettings } from '../services/settingsService';

export default function SettingsScreen() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSettings()
      .then((res) => {
        setSettings(res.data);
        setLoading(false);
      })
      .catch((err) => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <View style={styles.center}><ActivityIndicator size="large" /></View>;
  }
  if (error) {
    return <View style={styles.center}><Text>{error}</Text></View>;
  }
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.header}>Settings</Text>
      <SettingsForm settings={settings} />
    </View>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { fontSize: 22, fontWeight: 'bold', margin: 16 },
});
