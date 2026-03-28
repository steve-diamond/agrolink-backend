// Settings Dashboard
import { useEffect, useState } from 'react';
import SettingsForm from '../../components/SettingsForm';
import { getSettings } from '../../services/settingsService';

export default function Settings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getSettings()
      .then((res) => {
        setSettings(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load settings');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h2>Settings</h2>
      <SettingsForm settings={settings} />
    </div>
  );
}
