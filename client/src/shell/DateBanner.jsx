import { useQuery } from '@tanstack/react-query';
import { api } from '../api.js';
import { formatDateLong } from '../format.js';

// Always visible. Orange and loud when the Time Machine has moved the date, quiet when it is the real date.
export default function DateBanner() {
  const { data, isError } = useQuery({
    queryKey: ['clock'],
    queryFn: () => api('/clock'),
    refetchInterval: 3000,
  });

  if (isError) {
    return (
      <div className="date-banner date-banner--error" role="alert">
        Server not reachable. Start it with <code>npm run dev</code> and check <code>server/.env</code>.
      </div>
    );
  }
  if (!data) return <div className="date-banner date-banner--live">Loading date…</div>;

  if (data.simulated) {
    return (
      <div className="date-banner date-banner--simulated" role="status">
        <strong>SIMULATED DATE: {formatDateLong(data.today)}</strong>
        <span>
          Billing, overdue and reminders behave as if this is today. The real date is {formatDateLong(data.realToday)}.
        </span>
      </div>
    );
  }
  return (
    <div className="date-banner date-banner--live" role="status">
      <span className="date-banner__dot" /> Live date · {formatDateLong(data.today)}
    </div>
  );
}
