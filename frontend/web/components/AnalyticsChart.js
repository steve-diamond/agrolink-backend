// Analytics Chart Component
// You can replace this with a real chart using recharts or similar
export default function AnalyticsChart({ data }) {
  return (
    <div style={{ padding: 16 }}>
      <h4>Analytics Data</h4>
      <pre>{JSON.stringify(data, null, 2)}</pre>
    </div>
  );
}
