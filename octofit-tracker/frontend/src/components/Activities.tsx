import { useEffect, useState } from 'react';
import { getJson } from '../api/client.js';

type Activity = {
  type: string;
  minutes: number;
  points: number;
};

export default function Activities() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadActivities() {
      setLoading(true);
      setError(null);

      try {
        const response = await getJson<{ activities?: Activity[] }>('/api/activities');
        if (!isMounted) return;
        setActivities(response.activities ?? []);
      } catch (err) {
        if (!isMounted) return;
        setActivities([]);
        setError(err instanceof Error ? err.message : 'Unable to load activities');
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    loadActivities();

    return () => {
      isMounted = false;
    };
  }, []);

  const description = 'Track student activity minutes and points.';

  if (loading) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>{description}</p>
          <p role="status">Loading activities...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>{description}</p>
          <p role="alert">Unable to load activities: {error}</p>
        </div>
      </section>
    );
  }

  if (activities.length === 0) {
    return (
      <section className="card h-100">
        <div className="card-body">
          <h2 className="h4">Activities</h2>
          <p>{description}</p>
          <p>No activities</p>
        </div>
      </section>
    );
  }

  return (
    <section className="card h-100">
      <div className="card-body">
        <h2 className="h4">Activities</h2>
        <p>{description}</p>
        <ul className="list-group list-group-flush">
          {activities.map((activity) => (
            <li key={`${activity.type}-${activity.minutes}-${activity.points}`} className="list-group-item d-flex justify-content-between align-items-center">
              <span>{activity.type}</span>
              <span>{activity.minutes} minutes</span>
              <span>{activity.points} pts</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
