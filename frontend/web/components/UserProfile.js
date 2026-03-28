// User Profile Component
export default function UserProfile({ profile }) {
  if (!profile) return null;
  return (
    <div style={{ padding: 16 }}>
      <div><b>Name:</b> {profile.name}</div>
      <div><b>Email:</b> {profile.email}</div>
      {/* Add more fields as needed */}
    </div>
  );
}
