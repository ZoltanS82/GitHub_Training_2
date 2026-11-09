import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type WorkoutSuggestion = {
  title: string;
  reason: string;
};

export default function Workouts() {
  const [suggestions, setSuggestions] = useState<WorkoutSuggestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;
    const userEmail = 'mona@example.com';

    async function loadSuggestions() {
      setLoading(true);
      setError(null);

      try {
        const response = await getJson<{ suggestions?: WorkoutSuggestion[] }>(`/api/workouts/suggestions/${encodeURIComponent(userEmail)}`);
        if (!isMounted) return;
        setSuggestions(response.suggestions ?? []);
      } catch (err) {
        if (!isMounted) return;
        setSuggestions([]);
        setError(err instanceof Error ? err.message : 'Unable to load workout suggestions');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadSuggestions();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Workout suggestions" description="Recommend workouts from activity patterns." loading={loading} error={error} empty={suggestions.length === 0} emptyText="No workout suggestions">
      <ul className="list-group list-group-flush">
        {suggestions.map((suggestion) => (
          <li key={suggestion.title} className="list-group-item">
            <strong>{suggestion.title}</strong>
            <div>{suggestion.reason}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
