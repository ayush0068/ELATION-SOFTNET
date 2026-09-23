import Navbar from '../components/Navbar';
import { useAuth } from '../hooks/useAuth';

// TEMPORARY placeholder — this file will be replaced in Phase 4 with the full
// Product Listing (search, category filter, status filter, product grid, etc.)
// It exists right now only to prove the full auth -> protected route flow works.
export default function ProductListing() {
  const { user } = useAuth();

  return (
    <div>
      <Navbar />
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        <h2>You're logged in, {user?.fullName}!</h2>
        <p style={{ color: '#5b6072' }}>
          This is a placeholder for the Product Listing page — it will be built in Phase 4.
        </p>
      </div>
    </div>
  );
}