import { useCallback, useEffect, useMemo, useState } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import api from '../api/axios';

const FALLBACK_CATEGORIES = ['Electronics', 'Clothing', 'Grocery', 'Furniture', 'Books'];
const FALLBACK_STATUSES = ['Active', 'Inactive'];
const PAGE_SIZE = 12;

function SkeletonCard() {
  return (
    <div className="animate-pulse overflow-hidden rounded-xl border border-border bg-surface">
      <div className="aspect-[4/3] w-full bg-canvas" />
      <div className="space-y-2.5 p-4">
        <div className="h-4 w-3/4 rounded bg-canvas" />
        <div className="h-3 w-1/3 rounded bg-canvas" />
        <div className="h-3 w-full rounded bg-canvas" />
        <div className="h-3 w-2/3 rounded bg-canvas" />
        <div className="h-5 w-1/2 rounded bg-canvas" />
      </div>
    </div>
  );
}

export default function ProductListing() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);

  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('All');
  const [status, setStatus] = useState('All');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, totalPages: 1 });

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Debounce the search box so we don't fire a request on every keystroke.
  // A filter change should also snap the user back to page 1.
  useEffect(() => {
    const t = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 400);
    return () => clearTimeout(t);
  }, [searchInput]);

  const handleCategoryChange = (c) => {
    setCategory(c);
    setPage(1);
  };

  const handleStatusChange = (s) => {
    setStatus(s);
    setPage(1);
  };

  // Dropdown/category+status options straight from the backend, once
  useEffect(() => {
    api
      .get('/products/meta/options')
      .then((res) => {
        const { categories: c, statuses: s } = res.data.data;
        if (c?.length) setCategories(c);
        if (s?.length) setStatuses(s);
      })
      .catch(() => {
        /* fall back to the local defaults above */
      });
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = { page, limit: PAGE_SIZE };
      if (search) params.search = search;
      if (category !== 'All') params.category = category;
      if (status !== 'All') params.status = status;

      const res = await api.get('/products', { params });
      setProducts(res.data.data.products);
      setPagination(res.data.data.pagination);
    } catch (err) {
      setError(err.response?.data?.message || 'Could not load products. Please try again.');
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [page, search, category, status]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount/filter-change pattern
    fetchProducts();
  }, [fetchProducts]);

  const hasActiveFilters = Boolean(search) || category !== 'All' || status !== 'All';

  const clearFilters = () => {
    setSearchInput('');
    setSearch('');
    setCategory('All');
    setStatus('All');
    setPage(1);
  };

  const pageNumbers = useMemo(() => {
    const total = pagination.totalPages || 1;
    const span = Math.min(5, total);
    let start = Math.max(1, page - Math.floor(span / 2));
    const end = Math.min(total, start + span - 1);
    start = Math.max(1, end - span + 1);
    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  }, [pagination.totalPages, page]);

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="font-display text-2xl font-semibold text-ink">Products</h1>
            <p className="mt-1 text-sm text-muted">
              {loading
                ? 'Loading catalog…'
                : `${pagination.total} product${pagination.total === 1 ? '' : 's'} in your catalog`}
            </p>
          </div>
          {/* Wired up in Phase 5 (Add Product form) */}
          <button
            type="button"
            title="Add Product"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-accent-dark"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Filters */}
        <div className="mt-6 space-y-4 rounded-xl border border-border bg-surface p-4">
          <div className="relative">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              type="text"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              placeholder="Search products by name…"
              className="w-full rounded-lg border border-border bg-canvas py-2.5 pl-10 pr-4 text-[15px] text-ink placeholder:text-muted/70 transition focus:border-brand focus:bg-surface focus:outline-none focus:ring-2 focus:ring-brand/10"
            />
          </div>

          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1">
              {['All', ...categories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => handleCategoryChange(c)}
                  className={`shrink-0 rounded-full border px-3.5 py-1.5 text-sm font-medium transition ${
                    category === c
                      ? 'border-brand bg-brand text-white'
                      : 'border-border bg-canvas text-muted hover:border-brand/40 hover:text-ink'
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>

            <div className="inline-flex shrink-0 gap-1 rounded-full border border-border bg-canvas p-1">
              {['All', ...statuses].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => handleStatusChange(s)}
                  className={`rounded-full px-3.5 py-1.5 text-sm font-medium transition ${
                    status === s ? 'bg-brand text-white shadow-sm' : 'text-muted hover:text-ink'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="mt-6">
          {error && (
            <div className="mb-5 rounded-lg border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
              {error}
            </div>
          )}

          {loading ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="flex flex-col items-center rounded-xl border border-dashed border-border bg-surface py-20 text-center">
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-canvas text-muted">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <circle cx="11" cy="11" r="7" />
                  <path d="m21 21-4.35-4.35" />
                </svg>
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold text-ink">No products found</h3>
              <p className="mt-1.5 max-w-xs text-sm text-muted">
                {hasActiveFilters
                  ? 'Try a different search term or clear your filters.'
                  : 'Products you add will show up here.'}
              </p>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="mt-5 rounded-lg border border-border bg-canvas px-4 py-2 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand"
                >
                  Clear filters
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {products.map((product, i) => (
                <ProductCard key={product._id} product={product} index={i} />
              ))}
            </div>
          )}

          {/* Pagination */}
          {!loading && products.length > 0 && pagination.totalPages > 1 && (
            <div className="mt-8 flex flex-wrap items-center justify-center gap-1.5">
              <button
                type="button"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                Prev
              </button>
              {pageNumbers[0] > 1 && <span className="px-1 text-muted">…</span>}
              {pageNumbers.map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setPage(n)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                    n === page
                      ? 'bg-brand text-white'
                      : 'border border-border bg-surface text-ink hover:border-brand hover:text-brand'
                  }`}
                >
                  {n}
                </button>
              ))}
              {pageNumbers[pageNumbers.length - 1] < pagination.totalPages && (
                <span className="px-1 text-muted">…</span>
              )}
              <button
                type="button"
                onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
                disabled={page === pagination.totalPages}
                className="rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-ink transition hover:border-brand hover:text-brand disabled:cursor-not-allowed disabled:opacity-40"
              >
                Next
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}