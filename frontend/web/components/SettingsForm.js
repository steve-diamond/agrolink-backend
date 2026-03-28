// Settings Form Component
export default function SettingsForm({ settings }) {
  if (!settings) return null;
  return (
    <form style={{ padding: 16 }}>
      <div><b>Notifications:</b> {settings.notifications ? 'On' : 'Off'}</div>
      {/* Add more settings fields as needed */}
    </form>
  );
}
