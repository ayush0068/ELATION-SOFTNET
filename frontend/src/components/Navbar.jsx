import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  const initial = user?.fullName?.trim()?.[0]?.toUpperCase() || 'U';

  return (
    <div className="sticky top-0 z-40 bg-canvas/80 px-4 pt-4 backdrop-blur-sm sm:px-6">
      <header className="mx-auto flex max-w-6xl items-center justify-between rounded-full border border-border bg-surface/95 px-4 py-2 shadow-sm shadow-black/[0.04] backdrop-blur-sm sm:px-5 sm:py-2.5">
        <div className="flex items-center gap-2.5 font-display text-base font-bold tracking-tight text-ink">
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-brand text-[13px] font-bold text-accent">
            E
          </span>
          <span className="hidden sm:inline">
            Elation<span className="text-accent-dark">Softnet</span>
          </span>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          {user && (
            <span className="hidden items-center gap-2 rounded-full bg-canvas py-1 pl-1 pr-3.5 text-sm font-medium text-ink sm:flex">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-accent/20 text-[11px] font-bold text-accent-dark">
                {initial}
              </span>
              Hi, {user.fullName.split(' ')[0]}
            </span>
          )}
          <button
            type="button"
            onClick={handleLogout}
            className="rounded-full border border-border bg-canvas px-4 py-1.5 text-sm font-semibold text-ink transition hover:border-brand hover:bg-brand hover:text-white active:scale-95"
          >
            Logout
          </button>
        </div>
      </header>
    </div>
  );
}