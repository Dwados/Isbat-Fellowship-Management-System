import { ChevronRight, Users } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Alert from '../components/Alert';
import Avatar from '../components/Avatar';
import EmptyState from '../components/EmptyState';
import LoadingBlock from '../components/LoadingBlock';
import PageHeader from '../components/PageHeader';
import SearchInput from '../components/SearchInput';
import { useDebounce } from '../hooks/useDebounce';
import { getMembers } from '../services/membersService';
import { friendlyError } from '../utils/errors';

export default function MembersPage() {
  const [search, setSearch] = useState('');
  const debouncedSearch = useDebounce(search, 300);
  const [members, setMembers] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let active = true;
    setError(null);
    getMembers(debouncedSearch)
      .then((data) => active && setMembers(data))
      .catch((err) => active && setError(friendlyError(err)));
    return () => { active = false; };
  }, [debouncedSearch]);

  const subtitle = members
    ? members.length + (members.length === 1 ? ' member' : ' members')
    : 'All registered members';

  return (
    <>
      <PageHeader title="Members" subtitle={subtitle}>
        <div className="w-full sm:w-72">
          <SearchInput value={search} onChange={setSearch} placeholder="Search name or phone…" />
        </div>
      </PageHeader>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {members === null ? (
        <LoadingBlock label="Loading members…" />
      ) : members.length === 0 ? (
        <div className="card">
          <EmptyState
            icon={Users}
            title={search ? 'No members match your search' : 'No members yet'}
            message={
              search
                ? 'Try a different name or phone number.'
                : 'Members appear here after they register through the QR kiosk.'
            }
          />
        </div>
      ) : (
        <div className="card overflow-hidden">
          <ul className="divide-y divide-stone-100">
            {members.map((m) => (
              <li key={m.id}>
                <Link
                  to={'/members/' + m.id}
                  className="flex items-center gap-3.5 px-5 py-4 transition-colors hover:bg-stone-50"
                >
                  <Avatar name={m.name} />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-stone-900">{m.name}</p>
                    <p className="truncate text-sm text-stone-500">
                      {m.phone}
                      {m.course ? ' · ' + m.course : ''}
                    </p>
                  </div>
                  <ChevronRight className="h-4 w-4 shrink-0 text-stone-300" />
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  );
}
