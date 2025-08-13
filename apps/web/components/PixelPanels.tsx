import React, { useEffect, useState } from 'react';

async function j(u: string) {
  const r = await fetch(u);
  return r.json();
}

export default function PixelPanels() {
  const [seeded, setSeeded] = useState(false);
  const [people, setPeople] = useState<any[]>([]);
  const [timeline, setTimeline] = useState<any[]>([]);
  const [durations, setDurations] = useState<any[]>([]);
  const [utm, setUtm] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      if (!seeded) {
        setLoading(true);
        setError(null);
        
        try {
          // Use the new live API endpoint instead of test data
          console.log('Fetching live pixel data...');
          const liveDataResponse = await j('/api/studio/pixel/fetch-live');
          
          if (liveDataResponse.success) {
            console.log('Live data imported successfully:', liveDataResponse.message);
            setSeeded(true);
          } else {
            throw new Error(liveDataResponse.error || 'Failed to import live data');
          }
        } catch (err) {
          console.error('Error importing live data:', err);
          setError(err instanceof Error ? err.message : 'Failed to import live data');
          setLoading(false);
          return;
        } finally {
          setLoading(false);
        }
      }
      
      // Fetch the processed data from DuckDB
      try {
        const p = await j('/api/studio/pixel/people');
        const t = await j('/api/studio/pixel/timeline');
        const d = await j('/api/studio/pixel/durations');
        const u = await j('/api/studio/pixel/utm');
        setPeople(p.rows || []);
        setTimeline(t.rows || []);
        setDurations(d.rows || []);
        setUtm(u.rows || []);
      } catch (err) {
        console.error('Error fetching processed data:', err);
        setError('Failed to fetch processed data');
      }
    })();
  }, [seeded]);

  if (loading) {
    return (
      <div className="mt-6 space-y-8">
        <div className="text-center py-8">
          <p className="text-gray-600">Loading live pixel data...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="mt-6 space-y-8">
        <div className="text-center py-8">
          <p className="text-red-600">Error: {error}</p>
          <button 
            onClick={() => setSeeded(false)} 
            className="mt-4 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mt-6 space-y-8">
      <section>
        <h3 className="font-semibold">People (HemSha256)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>HemSha256</th>
              <th>Events</th>
              <th>First Seen</th>
              <th>Last Seen</th>
            </tr>
          </thead>
          <tbody>
            {people.map((r, i) => (
              <tr key={i}>
                <td>{r.HemSha256}</td>
                <td>{r.events_count}</td>
                <td>{r.first_seen}</td>
                <td>{r.last_seen}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-semibold">Timeline (ordered)</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>HemSha256</th>
              <th>ts</th>
              <th>EventType</th>
              <th>Order</th>
            </tr>
          </thead>
          <tbody>
            {timeline.map((r, i) => (
              <tr key={i}>
                <td>{r.HemSha256}</td>
                <td>{r.ts}</td>
                <td>{r.EventType}</td>
                <td>{r.event_order}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-semibold">Durations</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>HemSha256</th>
              <th>ts</th>
              <th>EventType</th>
              <th>Duration (s)</th>
            </tr>
          </thead>
          <tbody>
            {durations.map((r, i) => (
              <tr key={i}>
                <td>{r.HemSha256}</td>
                <td>{r.ts}</td>
                <td>{r.EventType}</td>
                <td>{r.duration_seconds}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h3 className="font-semibold">UTM Breakdown</h3>
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th>utm_source</th>
              <th>utm_medium</th>
              <th>utm_campaign</th>
              <th>events</th>
            </tr>
          </thead>
          <tbody>
            {utm.map((r, i) => (
              <tr key={i}>
                <td>{r.utm_source}</td>
                <td>{r.utm_medium}</td>
                <td>{r.utm_campaign}</td>
                <td>{r.events}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  );
} 