import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import api from '../api/axios';
import { getImageUrl } from '../utils/imageUrl';

const FALLBACK_CATEGORIES = ['Electronics', 'Clothing', 'Grocery', 'Furniture', 'Books'];
const FALLBACK_STATUSES = ['Active', 'Inactive'];
const ALLOWED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
const MAX_FILE_MB = 5;
const DESCRIPTION_LIMIT = 500;

const CATEGORY_STYLES = {
  Electronics: 'bg-sky-50 text-sky-700 border-sky-200',
  Clothing: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  Grocery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Furniture: 'bg-amber-50 text-amber-800 border-amber-200',
  Books: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const EMPTY_FORM = {
  name: '',
  description: '',
  category: '',
  brand: '',
  price: '',
  discountPrice: '',
  stockQuantity: '',
  status: 'Active',
};

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(
    Number(value) || 0
  );

const inputClass = (hasError, extra = '') =>
  `w-full rounded-lg border bg-canvas px-3.5 py-2.5 text-[15px] text-ink placeholder:text-muted/70 transition focus:outline-none focus:ring-2 focus:bg-surface ${
    hasError
      ? 'border-danger focus:border-danger focus:ring-danger/15'
      : 'border-border focus:border-brand focus:ring-brand/10'
  } ${extra}`;

function Field({ id, label, error, required, children, hint }) {
  return (
    <div>
      <label htmlFor={id} className="mb-1.5 flex items-baseline justify-between text-sm font-medium text-ink">
        <span>
          {label} {required && <span className="text-danger">*</span>}
        </span>
        {hint && <span className="text-xs font-normal text-muted">{hint}</span>}
      </label>
      {children}
      {error && <p className="mt-1.5 text-sm text-danger">{error}</p>}
    </div>
  );
}

function SelectField({ id, value, onChange, options, placeholder, error }) {
  return (
    <div className="relative">
      <select
        id={id}
        name={id}
        value={value}
        onChange={onChange}
        className={inputClass(error, 'appearance-none pr-9')}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o} value={o}>
            {o}
          </option>
        ))}
      </select>
      <svg
        width="15"
        height="15"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-muted"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </div>
  );
}

function SectionCard({ step, icon, title, description, children }) {
  return (
    <section className="animate-rise-in overflow-hidden rounded-2xl border border-border bg-surface">
      <div className="flex items-start gap-3.5 border-b border-border/70 px-6 py-5">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand/8 text-brand">
          {icon}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-[11px] font-semibold text-muted">{step}</span>
            <h2 className="font-display text-[15px] font-semibold text-ink">{title}</h2>
          </div>
          <p className="mt-0.5 text-sm text-muted">{description}</p>
        </div>
      </div>
      <div className="space-y-5 px-6 py-6">{children}</div>
    </section>
  );
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  const [categories, setCategories] = useState(FALLBACK_CATEGORIES);
  const [statuses, setStatuses] = useState(FALLBACK_STATUSES);

  const [form, setForm] = useState(EMPTY_FORM);
  const [errors, setErrors] = useState({});
  const [pictureFile, setPictureFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [removeExistingPicture, setRemoveExistingPicture] = useState(false);
  const [dragActive, setDragActive] = useState(false);

  const [pageLoading, setPageLoading] = useState(isEdit);
  const [pageError, setPageError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api
      .get('/products/meta/options')
      .then((res) => {
        const { categories: c, statuses: s } = res.data.data;
        if (c?.length) setCategories(c);
        if (s?.length) setStatuses(s);
      })
      .catch(() => {
        /* fall back to local defaults */
      });
  }, []);

  useEffect(() => {
    if (!isEdit) return;
    let cancelled = false;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- standard fetch-on-mount pattern
    setPageLoading(true);
    api
      .get(`/products/${id}`)
      .then((res) => {
        if (cancelled) return;
        const p = res.data.data.product;
        setForm({
          name: p.name || '',
          description: p.description || '',
          category: p.category || '',
          brand: p.brand || '',
          price: p.price ?? '',
          discountPrice: p.discountPrice ?? '',
          stockQuantity: p.stockQuantity ?? '',
          status: p.status || 'Active',
        });
        setPreviewUrl(getImageUrl(p.picture));
      })
      .catch((err) => {
        if (!cancelled) setPageError(err.response?.data?.message || 'Could not load this product.');
      })
      .finally(() => {
        if (!cancelled) setPageLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, isEdit]);

  // Revoke the object URL used for a locally-picked file when it's replaced/unmounted
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith('blob:')) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'description' && value.length > DESCRIPTION_LIMIT) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    setErrors((prev) => ({ ...prev, [name]: undefined }));
  };

  const applyFile = useCallback((file) => {
    if (!file) return;
    if (!ALLOWED_TYPES.includes(file.type)) {
      setErrors((prev) => ({ ...prev, picture: 'Only JPG, PNG, and WEBP images are allowed' }));
      return;
    }
    if (file.size > MAX_FILE_MB * 1024 * 1024) {
      setErrors((prev) => ({ ...prev, picture: `Image size must not exceed ${MAX_FILE_MB}MB` }));
      return;
    }
    setErrors((prev) => ({ ...prev, picture: undefined }));
    setPictureFile(file);
    setRemoveExistingPicture(false);
    setPreviewUrl(URL.createObjectURL(file));
  }, []);

  const handleFileInput = (e) => applyFile(e.target.files?.[0]);

  const handleDrop = (e) => {
    e.preventDefault();
    setDragActive(false);
    applyFile(e.dataTransfer.files?.[0]);
  };

  const clearPicture = () => {
    setPictureFile(null);
    setPreviewUrl(null);
    setRemoveExistingPicture(true);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const validate = () => {
    const next = {};
    if (!form.name.trim()) next.name = 'Product name is required';
    if (!form.description.trim()) next.description = 'Description is required';
    if (!form.category) next.category = 'Category is required';

    if (form.price === '' || form.price === null) next.price = 'Price is required';
    else if (Number.isNaN(Number(form.price)) || Number(form.price) <= 0)
      next.price = 'Price must be a positive number';

    if (form.discountPrice !== '' && form.discountPrice !== null) {
      const d = Number(form.discountPrice);
      if (Number.isNaN(d) || d < 0) next.discountPrice = 'Discount price must be a positive number';
      else if (form.price !== '' && !Number.isNaN(Number(form.price)) && d > Number(form.price)) {
        next.discountPrice = 'Discount price cannot be greater than the price';
      }
    }

    if (form.stockQuantity === '' || form.stockQuantity === null) next.stockQuantity = 'Stock quantity is required';
    else if (!Number.isInteger(Number(form.stockQuantity)) || Number(form.stockQuantity) < 0)
      next.stockQuantity = 'Stock quantity must be a non-negative whole number';

    if (!form.status) next.status = 'Status is required';

    return next;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const clientErrors = validate();
    if (Object.keys(clientErrors).length > 0) {
      setErrors(clientErrors);
      const firstKey = Object.keys(clientErrors)[0];
      document.getElementById(firstKey)?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setSubmitting(true);
    setErrors({});
    try {
      const fd = new FormData();
      fd.append('name', form.name.trim());
      fd.append('description', form.description.trim());
      fd.append('category', form.category);
      fd.append('brand', form.brand.trim());
      fd.append('price', form.price);
      fd.append('discountPrice', form.discountPrice === '' ? '' : form.discountPrice);
      fd.append('stockQuantity', form.stockQuantity);
      fd.append('status', form.status);
      if (pictureFile) fd.append('picture', pictureFile);
      if (isEdit && removeExistingPicture && !pictureFile) fd.append('removePicture', 'true');

      const flash = { type: 'success', message: isEdit ? 'Product updated successfully' : 'Product added successfully' };

      if (isEdit) {
        await api.put(`/products/${id}`, fd);
      } else {
        await api.post('/products', fd);
      }
      navigate('/products', { state: { flash } });
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

  const checklist = useMemo(
    () => [
      { label: 'Product name', done: Boolean(form.name.trim()) },
      { label: 'Description', done: Boolean(form.description.trim()) },
      { label: 'Category', done: Boolean(form.category) },
      { label: 'Price', done: Number(form.price) > 0 },
      { label: 'Stock quantity', done: form.stockQuantity !== '' && Number(form.stockQuantity) >= 0 },
      { label: 'Photo', done: Boolean(previewUrl) },
    ],
    [form, previewUrl]
  );
  const completedCount = checklist.filter((c) => c.done).length;

  const hasDiscount = form.discountPrice !== '' && Number(form.discountPrice) > 0 && Number(form.discountPrice) < Number(form.price || 0);
  const discountPercent = hasDiscount ? Math.round(100 - (Number(form.discountPrice) / Number(form.price)) * 100) : 0;

  if (pageLoading) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
          <div className="animate-pulse space-y-5">
            <div className="h-7 w-48 rounded bg-border/60" />
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_380px]">
              <div className="space-y-6">
                <div className="h-40 rounded-2xl bg-border/40" />
                <div className="h-64 rounded-2xl bg-border/40" />
              </div>
              <div className="h-80 rounded-2xl bg-border/40" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (pageError) {
    return (
      <div className="min-h-screen bg-canvas">
        <Navbar />
        <div className="mx-auto max-w-lg px-4 py-16 text-center sm:px-6">
          <p className="rounded-lg border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">{pageError}</p>
          <Link to="/products" className="mt-5 inline-block text-sm font-semibold text-brand hover:underline">
            Back to Products
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-canvas">
      <Navbar />

      <div className="mx-auto max-w-6xl px-4 pb-28 pt-8 sm:px-6 lg:px-8 lg:pb-12">
        <nav className="animate-fade-in flex items-center gap-1.5 text-sm text-muted">
          <Link to="/products" className="transition hover:text-brand">
            Products
          </Link>
          <span>/</span>
          <span className="text-ink">{isEdit ? 'Edit Product' : 'Add Product'}</span>
        </nav>

        <div className="animate-fade-in mt-3 flex flex-wrap items-start justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-brand text-accent">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                {isEdit ? (
                  <>
                    <path d="M12 20h9" />
                    <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
                  </>
                ) : (
                  <>
                    <path d="M20 7h-3.5l-1-2h-7l-1 2H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1Z" />
                    <circle cx="12" cy="13" r="3.5" />
                  </>
                )}
              </svg>
            </div>
            <div>
              <h1 className="font-display text-2xl font-semibold text-ink">
                {isEdit ? 'Edit Product' : 'Add New Product'}
              </h1>
              <p className="mt-0.5 text-sm text-muted">
                {isEdit ? 'Update the details below and save your changes.' : 'Add a product to your catalog with photos, pricing and stock.'}
              </p>
            </div>
          </div>
        </div>

        {errors.form && (
          <div className="animate-fade-in mt-5 rounded-lg border border-danger/25 bg-danger/5 px-4 py-3 text-sm text-danger">
            {errors.form}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="mt-7 grid grid-cols-1 gap-6 lg:grid-cols-[1fr_360px] lg:items-start">
          {/* Left: form sections */}
          <div className="space-y-6">
            <SectionCard
              step="STEP 1"
              title="Product photo"
              description="A clear photo helps customers recognize the product at a glance."
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <rect x="3" y="5" width="18" height="14" rx="2" />
                  <circle cx="9" cy="11" r="2" />
                  <path d="m21 16-4.5-4.5a1.5 1.5 0 0 0-2.1 0L7 19" />
                </svg>
              }
            >
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragActive(true);
                }}
                onDragLeave={() => setDragActive(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`group relative flex cursor-pointer flex-col items-center justify-center overflow-hidden rounded-xl border-2 border-dashed transition ${
                  previewUrl ? 'aspect-[16/9] sm:aspect-[21/9]' : 'aspect-[16/9] sm:aspect-[3/1]'
                } ${
                  dragActive
                    ? 'border-brand bg-brand/5'
                    : errors.picture
                    ? 'border-danger'
                    : 'border-border bg-canvas hover:border-brand/50 hover:bg-brand/[0.03]'
                }`}
              >
                {previewUrl ? (
                  <>
                    <img src={previewUrl} alt="Product preview" className="h-full w-full object-cover" />
                    <div className="absolute inset-0 flex items-end justify-between bg-gradient-to-t from-ink/60 via-transparent to-transparent p-3 opacity-0 transition group-hover:opacity-100">
                      <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-ink">
                        Click to replace
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearPicture();
                      }}
                      title="Remove image"
                      className="absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full bg-ink/70 text-white backdrop-blur transition hover:bg-danger"
                    >
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M18 6 6 18" />
                        <path d="m6 6 12 12" />
                      </svg>
                    </button>
                  </>
                ) : (
                  <div className="flex flex-col items-center gap-2.5 px-4 text-center">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-surface text-brand shadow-sm transition group-hover:scale-105">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                        <path d="M17 8l-5-5-5 5" />
                        <path d="M12 3v12" />
                      </svg>
                    </div>
                    <p className="text-sm font-medium text-ink">Drag a photo here, or click to browse</p>
                    <p className="text-xs text-muted">JPG, PNG or WEBP · up to {MAX_FILE_MB}MB</p>
                  </div>
                )}
              </div>
              <input
                ref={fileInputRef}
                id="picture"
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleFileInput}
                className="hidden"
              />
              {errors.picture && <p className="text-sm text-danger">{errors.picture}</p>}
            </SectionCard>

            <SectionCard
              step="STEP 2"
              title="Product details"
              description="Name and describe the product so customers know what it is."
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M9 3h6l1 2h4v14H4V5h4l1-2Z" />
                  <path d="M9 11h6" />
                  <path d="M9 15h4" />
                </svg>
              }
            >
              <Field id="name" label="Product Name" required error={errors.name}>
                <input
                  id="name"
                  name="name"
                  type="text"
                  value={form.name}
                  onChange={handleChange}
                  placeholder="e.g. Wireless Headphones"
                  className={inputClass(errors.name)}
                />
              </Field>

              <Field id="description" label="Description" required error={errors.description}>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  value={form.description}
                  onChange={handleChange}
                  placeholder="Describe the product's features, materials and what makes it worth buying…"
                  className={`${inputClass(errors.description)} resize-none`}
                />
                <div className="mt-1.5 flex justify-end">
                  <span className={`text-xs ${form.description.length >= DESCRIPTION_LIMIT ? 'text-danger' : 'text-muted'}`}>
                    {form.description.length}/{DESCRIPTION_LIMIT}
                  </span>
                </div>
              </Field>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="category" label="Category" required error={errors.category}>
                  <SelectField
                    id="category"
                    value={form.category}
                    onChange={handleChange}
                    options={categories}
                    placeholder="Select category"
                    error={errors.category}
                  />
                </Field>

                <Field id="brand" label="Brand" hint="optional" error={errors.brand}>
                  <input
                    id="brand"
                    name="brand"
                    type="text"
                    value={form.brand}
                    onChange={handleChange}
                    placeholder="e.g. Sony"
                    className={inputClass(errors.brand)}
                  />
                </Field>
              </div>
            </SectionCard>

            <SectionCard
              step="STEP 3"
              title="Pricing & inventory"
              description="Set what customers pay and how many units are in stock."
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                  <path d="M12 2v20" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              }
            >
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="price" label="Price" required error={errors.price}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">
                      ₹
                    </span>
                    <input
                      id="price"
                      name="price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.price}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass(errors.price, 'pl-7')}
                    />
                  </div>
                </Field>

                <Field id="discountPrice" label="Discount Price" hint="optional" error={errors.discountPrice}>
                  <div className="relative">
                    <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[15px] text-muted">
                      ₹
                    </span>
                    <input
                      id="discountPrice"
                      name="discountPrice"
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.discountPrice}
                      onChange={handleChange}
                      placeholder="0.00"
                      className={inputClass(errors.discountPrice, 'pl-7')}
                    />
                  </div>
                </Field>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Field id="stockQuantity" label="Stock Quantity" required error={errors.stockQuantity}>
                  <input
                    id="stockQuantity"
                    name="stockQuantity"
                    type="number"
                    min="0"
                    step="1"
                    value={form.stockQuantity}
                    onChange={handleChange}
                    placeholder="0"
                    className={inputClass(errors.stockQuantity)}
                  />
                </Field>

                <Field id="status" label="Status" required error={errors.status}>
                  <SelectField
                    id="status"
                    value={form.status}
                    onChange={handleChange}
                    options={statuses}
                    error={errors.status}
                  />
                </Field>
              </div>
            </SectionCard>

            {/* Desktop actions */}
            <div className="hidden justify-end gap-3 lg:flex">
              <button
                type="button"
                onClick={() => navigate(-1)}
                disabled={submitting}
                className="rounded-lg border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="inline-flex items-center justify-center gap-2 rounded-lg bg-accent px-5 py-2.5 text-sm font-semibold text-brand transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting && <Spinner />}
                {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
              </button>
            </div>
          </div>

          {/* Right: live preview */}
          <div className="animate-rise-in hidden lg:sticky lg:top-6 lg:block" style={{ animationDelay: '80ms' }}>
            <div className="overflow-hidden rounded-2xl border border-border bg-surface">
              <div className="border-b border-border/70 px-5 py-4">
                <p className="text-sm font-semibold text-ink">Live preview</p>
                <p className="mt-0.5 text-xs text-muted">This is how the product card will look in your catalog.</p>
              </div>

              <div className="p-5">
                <div className="overflow-hidden rounded-xl border border-border">
                  <div className="relative aspect-[4/3] w-full bg-canvas">
                    {previewUrl ? (
                      <img src={previewUrl} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center text-muted/60">
                        <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="9" cy="9" r="2" />
                          <path d="m21 15-5-5L5 21" />
                        </svg>
                      </div>
                    )}
                    <span
                      className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
                        form.status === 'Active' ? 'bg-success/10 text-success' : 'bg-ink/10 text-muted'
                      }`}
                    >
                      {form.status || 'Active'}
                    </span>
                    {hasDiscount && (
                      <span className="absolute right-2.5 top-2.5 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white shadow-sm">
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  <div className="space-y-2 p-3.5">
                    <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-ink">
                      {form.name || 'Product name'}
                    </h3>
                    {form.category ? (
                      <span
                        className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
                          CATEGORY_STYLES[form.category] || 'border-border bg-canvas text-muted'
                        }`}
                      >
                        {form.category}
                      </span>
                    ) : (
                      <span className="inline-flex w-fit items-center rounded-full border border-dashed border-border px-2 py-0.5 text-xs text-muted">
                        Category
                      </span>
                    )}
                    <p className="line-clamp-2 text-sm leading-relaxed text-muted">
                      {form.description || 'Your product description will appear here.'}
                    </p>
                    <div className="flex items-end justify-between pt-1">
                      <div>
                        {hasDiscount ? (
                          <div className="flex items-baseline gap-1.5">
                            <span className="font-display text-base font-semibold text-ink">
                              {formatPrice(form.discountPrice)}
                            </span>
                            <span className="text-xs text-muted line-through">{formatPrice(form.price)}</span>
                          </div>
                        ) : (
                          <span className="font-display text-base font-semibold text-ink">
                            {form.price ? formatPrice(form.price) : '₹0'}
                          </span>
                        )}
                        <p className="mt-0.5 text-xs text-muted">
                          {form.stockQuantity ? `${form.stockQuantity} in stock` : 'Stock not set'}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-5">
                  <div className="flex items-center justify-between text-xs font-medium text-muted">
                    <span>Listing readiness</span>
                    <span>{completedCount}/{checklist.length}</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-border/70">
                    <div
                      className="h-full rounded-full bg-accent transition-all duration-300"
                      style={{ width: `${(completedCount / checklist.length) * 100}%` }}
                    />
                  </div>
                  <ul className="mt-3.5 space-y-2">
                    {checklist.map((item) => (
                      <li key={item.label} className="flex items-center gap-2 text-sm">
                        <span
                          className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full ${
                            item.done ? 'bg-success text-white' : 'bg-canvas text-transparent'
                          }`}
                        >
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20 6 9 17l-5-5" />
                          </svg>
                        </span>
                        <span className={item.done ? 'text-ink' : 'text-muted'}>{item.label}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </form>
      </div>

      {/* Mobile sticky actions */}
      <div className="fixed inset-x-0 bottom-0 z-30 flex gap-3 border-t border-border bg-surface/95 p-4 backdrop-blur lg:hidden">
        <button
          type="button"
          onClick={() => navigate(-1)}
          disabled={submitting}
          className="flex-1 rounded-lg border border-border bg-canvas px-4 py-2.5 text-sm font-semibold text-ink transition hover:border-brand hover:text-brand disabled:opacity-60"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-brand transition hover:bg-accent-dark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {submitting && <Spinner />}
          {submitting ? 'Saving…' : isEdit ? 'Save Changes' : 'Add Product'}
        </button>
      </div>
    </div>
  );
}

function Spinner() {
  return (
    <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v4a4 4 0 00-4 4H4z" />
    </svg>
  );
}