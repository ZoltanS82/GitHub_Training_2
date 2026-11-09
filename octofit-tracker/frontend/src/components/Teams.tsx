import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';
import { CapabilityCard } from './CapabilityCard.js';

type Team = {
  name: string;
  members: string[];
};

export default function Teams() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadTeams() {
      setLoading(true);
      setError(null);

      try {
        const response = await getJson<{ teams?: Team[] }>('/api/teams');
        if (!isMounted) return;
        setTeams(response.teams ?? []);
      } catch (err) {
        if (!isMounted) return;
        setTeams([]);
        setError(err instanceof Error ? err.message : 'Unable to load teams');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadTeams();

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <CapabilityCard title="Teams" description="Manage teams and members." loading={loading} error={error} empty={teams.length === 0} emptyText="No teams">
      <ul className="list-group list-group-flush">
        {teams.map((team) => (
          <li key={team.name} className="list-group-item">
            <strong>{team.name}</strong>
            <div>{team.members.join(', ')}</div>
          </li>
        ))}
      </ul>
    </CapabilityCard>
  );
}
