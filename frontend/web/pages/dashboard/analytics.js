// Analytics Dashboard
import { useEffect, useState } from 'react';
import AnalyticsChart from '../../components/AnalyticsChart';
import { getAnalytics } from '../../services/analyticsService';

export default function Analytics() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    getAnalytics()
      .then((res) => {
        setData(res.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load analytics');
        setLoading(false);
      });
  }, []);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  return (
    <div>
      <h2>Analytics Dashboard</h2>
      <AnalyticsChart data={data} />
    </div>
  );
}
