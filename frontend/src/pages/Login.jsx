import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const gridBg = {
  backgroundImage:
    'linear-gradient(rgba(255,255,255,0.06) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.06) 1px, transparent 1px)',
  backgroundSize: '34px 34px',
};

const inputClass = (hasError) =>
  `w-full rounded-lg border bg-surface px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-2 ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/15'
      : 'border-border focus:border-brand focus:ring-brand/10'
  }`;

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [form, setForm] = useState({ identifier: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.identifier.trim()) next.identifier = 'Email or mobile number is required';
    if (!form.password) next.password = 'Password is required';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await login(form);
      const redirectTo = location.state?.from?.pathname || '/products';
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const res = err.response;
      if (res && res.status >= 400 && res.status < 500 && res.data?.errors) {
        setErrors(res.data.errors);
      } else {
        setErrors({ form: res?.data?.message || 'Invalid email/mobile or password' });
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen bg-canvas">
      {/* Brand panel */}
      <aside className="relative hidden w-[42%] flex-col justify-between overflow-hidden bg-brand px-12 py-14 text-white md:flex">
        <div className="pointer-events-none absolute inset-0" style={gridBg} />
        <div className="relative font-display text-xl font-bold tracking-tight">
          Elation<span className="text-accent">Softnet</span>
        </div>
        <div className="relative max-w-sm">
          <h2 className="font-display text-3xl font-semibold leading-tight">
            Your catalog, right where you left it.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            Log back in to pick up product listings, stock levels and pricing exactly where you
            left them.
          </p>
        </div>
        <div className="relative flex flex-wrap gap-x-6 gap-y-2 text-sm text-white/60">
          <span>Search</span>
          <span>Category filters</span>
          <span>Stock status</span>
        </div>
      </aside>

      {/* Form panel */}
      <main className="flex flex-1 items-center justify-center px-6 py-14">
        <div className="w-full max-w-sm">
          <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
          <p className="mt-1.5 text-[15px] text-muted">Login to continue to your product catalog</p>

          {errors.form && (
            <div className="mt-5 rounded-lg border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
              {errors.form}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-7">
            <div className="mb-5">
              <label htmlFor="identifier" className="mb-1.5 block text-sm font-medium text-ink">
                Email or Mobile Number
              </label>
              <input
                id="identifier"
                name="identifier"
                type="text"
                value={form.identifier}
                onChange={handleChange}
                placeholder="you@example.com or 9876543210"
                autoComplete="username"
                className={inputClass(errors.identifier)}
              />
              {errors.identifier && <p className="mt-1.5 text-sm text-danger">{errors.identifier}</p>}
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-ink">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="Your password"
                autoComplete="current-password"
                className={inputClass(errors.password)}
              />
              {errors.password && <p className="mt-1.5 text-sm text-danger">{errors.password}</p>}
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-[15px] font-semibold text-brand transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            Don't have an account?{' '}
            <Link to="/register" className="font-semibold text-brand hover:underline">
              Register
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}