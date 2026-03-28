// User Profile Dashboard
import { useEffect, useState } from 'react';
import UserProfile from '../../components/UserProfile';
import { getProfile } from '../../services/profileService';

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getProfile()
      .then((res) => {
        setProfile(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load profile');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h2>User Profile</h2>
      <UserProfile profile={profile} />
    </div>
  );
}
