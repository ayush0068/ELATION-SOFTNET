import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import ConfirmDialog from '../components/ConfirmDialog';
import Toast from '../components/Toast';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORY_STYLES = {
  Electronics: 'bg-sky-50 text-sky-700 border-sky-200',
  Clothing: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  Grocery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Furniture: 'bg-amber-50 text-amber-800 border-amber-200',
  Books: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const LOW_STOCK_THRESHOLD = 10;

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(value);

const formatDate = (value) => {
  if (!value) return '—';
  return new Date(value).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
};

function StatCard({ icon, label, value }) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-surface p-3.5">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/8 text-brand">
        {icon}
      </div>
      <div className="min-w-0">
        <p className="text-xs text-muted">{label}</p>
        <p className="mt-0.5 truncate text-sm font-semibold text-ink">{value}</p>
      </div>
    </div>
  );
}

export default function ProductDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const location = useLocation();

  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [toast, setToast] = useState(location.state?.flash || null);

  useEffect(() => {
    if (location.state?.flash) {
      navigate(location.pathname, { replace: true, state: {} });
    }
  }, []);

  const fetchProduct = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await api.get(`/products/${id}`);
      setProduct(res.data.data.product);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load this product.');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await api.delete(`/products/${id}`);
      navigate('/products', { state: { flash: { type: 'success', message: 'Product deleted successfully' } } });
    } catch (err) {
      setConfirmOpen(false);
      setToast({ type: 'error', message: err.response?.data?.message || 'Could not delete this product.' });
    } finally {
      setDeleting(false);
    }
  };

  const imageUrl = product ? getImageUrl(product.picture) : null;
  const hasDiscount = product?.discountPrice != null && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(100 - (product.discountPrice / product.price) * 100) : 0;

  const stockState = !product
    ? null
    : product.stockQuantity === 0
    ? { dot: 'bg-danger', text: 'text-danger', label: 'Out of stock' }
    : product.stockQuantity <= LOW_STOCK_THRESHOLD
    ? { dot: 'bg-accent-dark', text: 'text-accent-dark', label: `Only ${product.stockQuantity} left` }
    : { dot: 'bg-success', text: 'text-success', label: 'In stock' };

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <div className="mx-auto max-w-5xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-12">
        <div className="animate-fade-in flex items-center justify-between gap-4">
          <nav className="flex min-w-0 items-center gap-1.5 text-sm text-muted">
            <Link to="/products" className="inline-flex shrink-0 items-center gap-1 transition hover:text-brand">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.3">
                <path d="m15 18-6-6 6-6" />
              </svg>
              Products
            </Link>
            <span className="shrink-0">/</span>
            <span className="truncate text-ink">{loading ? 'Loading…' : product?.name || 'Product'}</span>
          </nav>

          {!loading && !error && (
            <div className="hidden shrink-0 gap-2.5 lg:flex">
              <button
                type="button"
                onClick={() => navigate(`/products/${id}/edit`)}
                className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-brand transition hover:bg-accent-dark"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 20h9" />
                  <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
                Edit Product
              </button>
              <button
                type="button"
                onClick={() => setConfirmOpen(true)}
                className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-semibold text-danger transition hover:border-danger hover:bg-danger/5"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M3 6h18" />
                  <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                  <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                </svg>
                Delete
              </button>
            </div>
          )}
        </div>

        {loading ? (
          <div className="mt-6 grid animate-pulse grid-cols-1 gap-8 lg:grid-cols-[420px_1fr]">
            <div className="aspect-square rounded-2xl bg-border/40" />
            <div className="space-y-4 pt-2">
              <div className="h-5 w-40 rounded-full bg-border/40" />
              <div className="h-8 w-2/3 rounded bg-border/40" />
              <div className="h-24 w-full rounded-2xl bg-border/40" />
              <div className="h-28 w-full rounded-2xl bg-border/40" />
            </div>
          </div>
        ) : error ? (
          <div className="mt-6 flex flex-col items-center rounded-xl border border-danger/25 bg-danger/5 px-4 py-14 text-center">
            <p className="text-sm text-danger">{error}</p>
            <Link to="/products" className="mt-4 text-sm font-semibold text-brand hover:underline">
              Back to Products
            </Link>
          </div>
        ) : (
          <div className="animate-rise-in mt-6 grid grid-cols-1 gap-8 lg:grid-cols-[420px_1fr] lg:items-start">
            {/* left product details */}
            <div className="space-y-5 lg:sticky lg:top-6">
              <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-surface">
                {imageUrl ? (
                  <img src={imageUrl} alt={product.name} className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-muted/60">
                    <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <circle cx="9" cy="9" r="2" />
                      <path d="m21 15-5-5L5 21" />
                    </svg>
                  </div>
                )}
                <span
                  className={`absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-semibold shadow-sm ${
                    product.status === 'Active' ? 'bg-success/90 text-white' : 'bg-ink/70 text-white'
                  }`}
                >
                  {product.status}
                </span>
                {hasDiscount && (
                  <span className="absolute right-3 top-3 rounded-full bg-accent px-2.5 py-1 text-xs font-bold text-brand shadow-sm">
                    {discountPercent}% OFF
                  </span>
                )}
              </div>

              <div className="grid grid-cols-3 gap-2.5 lg:grid-cols-1">
                <StatCard
                  label="Stock"
                  value={product.stockQuantity > 0 ? `${product.stockQuantity} units` : 'Out of stock'}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 8V6a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v2" />
                      <path d="M3 8h18l-1.5 11.2a1 1 0 0 1-1 .8H5.5a1 1 0 0 1-1-.8L3 8Z" />
                      <path d="M9 12h6" />
                    </svg>
                  }
                />
                <StatCard
                  label="Added"
                  value={formatDate(product.createdAt)}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <rect x="3" y="4.5" width="18" height="16" rx="2" />
                      <path d="M16 3v3M8 3v3M3 9.5h18" />
                    </svg>
                  }
                />
                <StatCard
                  label="Last updated"
                  value={formatDate(product.updatedAt)}
                  icon={
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M21 12a9 9 0 1 1-2.64-6.36" />
                      <path d="M21 4v5h-5" />
                    </svg>
                  }
                />
              </div>
            </div>

            {/* Right product details */}
            <div className="flex flex-col">
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                    CATEGORY_STYLES[product.category] || 'border-border bg-canvas text-muted'
                  }`}
                >
                  {product.category}
                </span>
                {product.brand && (
                  <span className="inline-flex items-center rounded-full border border-border bg-canvas px-2.5 py-0.5 text-xs font-medium text-muted">
                    {product.brand}
                  </span>
                )}
              </div>

              <h1 className="mt-3 font-display text-2xl font-semibold leading-tight text-ink sm:text-[28px]">
                {product.name}
              </h1>

              {/* Price highlight card */}
              <div className="mt-5 rounded-2xl border border-border bg-gradient-to-br from-brand/[0.04] to-transparent p-5">
                <div className="flex flex-wrap items-baseline gap-2.5">
                  {hasDiscount ? (
                    <>
                      <span className="font-display text-3xl font-semibold text-ink">
                        {formatPrice(product.discountPrice)}
                      </span>
                      <span className="text-base text-muted line-through">{formatPrice(product.price)}</span>
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-xs font-semibold text-success">
                        Save {formatPrice(product.price - product.discountPrice)}
                      </span>
                    </>
                  ) : (
                    <span className="font-display text-3xl font-semibold text-ink">{formatPrice(product.price)}</span>
                  )}
                </div>

                <div className="mt-3.5 flex items-center gap-2 border-t border-border/70 pt-3.5 text-sm">
                  <span className={`h-2 w-2 rounded-full ${stockState.dot}`} />
                  <span className={`font-medium ${stockState.text}`}>{stockState.label}</span>
                  {product.stockQuantity > 0 && (
                    <span className="text-muted">· {product.stockQuantity} units available</span>
                  )}
                </div>
              </div>

              <div className="mt-5 rounded-2xl border border-border bg-surface p-5">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-brand/8 text-brand">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M4 6h16M4 12h10M4 18h16" />
                    </svg>
                  </div>
                  <h2 className="font-display text-[15px] font-semibold text-ink">Description</h2>
                </div>
                <p className="mt-3 whitespace-pre-line text-[15px] leading-relaxed text-muted">
                  {product.description}
                </p>
              </div>

            </div>
          </div>
        )}
      </div>

      {/* Mobile sticky actions */}
      {!loading && !error && (
        <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border bg-surface/95 p-4 backdrop-blur lg:hidden">
          <button
            type="button"
            onClick={() => setConfirmOpen(true)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-semibold text-danger transition hover:border-danger hover:bg-danger/5"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18" />
              <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Delete
          </button>
          <button
            type="button"
            onClick={() => navigate(`/products/${id}/edit`)}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-accent-dark"
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Edit Product
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmOpen}
        danger
        title="Delete this product?"
        message={`"${product?.name}" will be removed from your listing. This can be recovered from the database if needed.`}
        confirmLabel="Delete"
        loading={deleting}
        onConfirm={handleDelete}
        onCancel={() => setConfirmOpen(false)}
      />

      <Toast toast={toast} onClose={() => setToast(null)} />
    </div>
  );
}