import { useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import '../styles/navbar.css';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <header className="navbar">
      <div className="navbar__brand">Elation<span>Softnet</span></div>
      <div className="navbar__right">
        {user && <span className="navbar__user">Hi, {user.fullName.split(' ')[0]}</span>}
        <button type="button" className="navbar__logout" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </header>
  );
}