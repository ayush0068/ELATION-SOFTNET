import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="flex items-center justify-between border-b border-border bg-surface px-6 py-3.5 sm:px-8">
      <div className="font-display text-base font-bold tracking-tight text-ink">
        Elation<span className="text-accent-dark">Softnet</span>
      </div>
      <div className="flex items-center gap-4">
        {user && (
          <span className="hidden text-sm text-muted sm:inline">
            Hi, {user.fullName.split(' ')[0]}
          </span>
        )}
        <button
          type="button"
          onClick={handleLogout}
          className="rounded-lg border border-border bg-canvas px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
        >
          Logout
        </button>
      </div>
    </header>
  );
}