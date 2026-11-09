import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type LeaderboardEntry = {
  teamName: string;
  totalPoints: number;
  rank: number;
};

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadLeaderboard() {
      setLoading(true);
      setError(null);

      try {
        const response = await getJson<{ leaderboard?: LeaderboardEntry[] }>('/api/leaderboard');
        if (!isMounted) return;
        setEntries(response.leaderboard ?? []);
      } catch (err) {
        if (!isMounted) return;
        setEntries([]);
        setError(err instanceof Error ? err.message : 'Unable to load leaderboard');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadLeaderboard();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Leaderboard" description="Compare team point totals." loading={loading} error={error} empty={entries.length === 0} emptyText="No leaderboard">
      <ul className="list-group list-group-flush">
        {entries.map((entry) => (
          <li key={`${entry.rank}-${entry.teamName}`} className="list-group-item d-flex justify-content-between align-items-center">
            <span>#{entry.rank} {entry.teamName}</span>
            <strong>{entry.totalPoints}</strong>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
