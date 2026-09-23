import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

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

function Field({ id, label, error, children }) {
  return (
    <div className="mb-5">
      <label htmlFor={id} className="mb-1.5 block text-sm font-medium text-ink">
        {label}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ fullName: '', email: '', mobile: '', password: '' });
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const validate = () => {
    const next = {};
    if (!form.fullName.trim()) next.fullName = 'Full name is required';
    if (!form.email.trim()) next.email = 'Email is required';
    else if (!EMAIL_REGEX.test(form.email.trim())) next.email = 'Enter a valid email address';
    if (!form.mobile.trim()) next.mobile = 'Mobile number is required';
    else if (!MOBILE_REGEX.test(form.mobile.trim())) next.mobile = 'Enter a valid 10-digit mobile number';
    if (!form.password) next.password = 'Password is required';
    else if (form.password.length < 6) next.password = 'Password must be at least 6 characters';
    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccessMsg('');
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      return;
    }

    setSubmitting(true);
    try {
      await register(form);
      setSuccessMsg('Account created successfully. Redirecting to login...');
      setTimeout(() => navigate('/login'), 1200);
    } catch (err) {
      const res = err.response;
      if (res && res.status >= 400 && res.status < 500 && res.data?.errors) {
        setErrors(res.data.errors);
      } else {
        setErrors({ form: res?.data?.message || 'Something went wrong. Please try again.' });
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
            Keep every product accounted for.
          </h2>
          <p className="mt-4 text-[15px] leading-relaxed text-white/70">
            One place to register, list, search and track stock across your entire catalog —
            built for teams who'd rather manage inventory than spreadsheets.
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
          <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
          <p className="mt-1.5 text-[15px] text-muted">Register to manage your product catalog</p>

          {errors.form && (
            <div className="mt-5 rounded-lg border border-danger/25 bg-danger/5 px-3.5 py-2.5 text-sm text-danger">
              {errors.form}
            </div>
          )}
          {successMsg && (
            <div className="mt-5 rounded-lg border border-success/25 bg-success/5 px-3.5 py-2.5 text-sm text-success">
              {successMsg}
            </div>
          )}

          <form onSubmit={handleSubmit} noValidate className="mt-7">
            <Field id="fullName" label="Full Name" error={errors.fullName}>
              <input
                id="fullName"
                name="fullName"
                type="text"
                value={form.fullName}
                onChange={handleChange}
                placeholder="Ayush Kumar"
                autoComplete="name"
                className={inputClass(errors.fullName)}
              />
            </Field>

            <Field id="email" label="Email" error={errors.email}>
              <input
                id="email"
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                autoComplete="email"
                className={inputClass(errors.email)}
              />
            </Field>

            <Field id="mobile" label="Mobile Number" error={errors.mobile}>
              <input
                id="mobile"
                name="mobile"
                type="tel"
                value={form.mobile}
                onChange={handleChange}
                placeholder="9876543210"
                autoComplete="tel"
                maxLength={10}
                className={inputClass(errors.mobile)}
              />
            </Field>

            <Field id="password" label="Password" error={errors.password}>
              <input
                id="password"
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                placeholder="At least 6 characters"
                autoComplete="new-password"
                className={inputClass(errors.password)}
              />
            </Field>

            <button
              type="submit"
              disabled={submitting}
              className="mt-2 w-full rounded-lg bg-accent px-4 py-2.5 text-[15px] font-semibold text-brand transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {submitting ? 'Creating account...' : 'Register'}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-muted">
            Already have an account?{' '}
            <Link to="/login" className="font-semibold text-brand hover:underline">
              Login
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}