import { useNavigate } from 'react-router-dom';
import { getImageUrl } from '../utils/imageUrl';

const CATEGORY_STYLES = {
  Electronics: 'bg-sky-50 text-sky-700 border-sky-200',
  Clothing: 'bg-fuchsia-50 text-fuchsia-700 border-fuchsia-200',
  Grocery: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  Furniture: 'bg-amber-50 text-amber-800 border-amber-200',
  Books: 'bg-indigo-50 text-indigo-700 border-indigo-200',
};

const formatPrice = (value) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductCard({ product, index = 0, onDelete }) {
  const navigate = useNavigate();
  const hasDiscount = product.discountPrice != null && product.discountPrice < product.price;
  const discountPercent = hasDiscount ? Math.round(100 - (product.discountPrice / product.price) * 100) : 0;
  const imageUrl = getImageUrl(product.picture);

  return (
    <div
      onClick={() => navigate(`/products/${product._id}`)}
      className="animate-card-in group flex cursor-pointer flex-col overflow-hidden rounded-xl border border-border bg-surface transition duration-200 hover:-translate-y-1 hover:shadow-lg hover:shadow-ink/5"
      style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
    >
      <div className="relative aspect-[4/3] w-full overflow-hidden bg-canvas">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt={product.name}
            loading="lazy"
            className="h-full w-full object-cover transition duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-muted">
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <circle cx="9" cy="9" r="2" />
              <path d="m21 15-5-5L5 21" />
            </svg>
          </div>
        )}
        <span
          className={`absolute left-2.5 top-2.5 rounded-full px-2.5 py-1 text-xs font-semibold ${
            product.status === 'Active' ? 'bg-success/10 text-success' : 'bg-ink/10 text-muted'
          }`}
        >
          {product.status}
        </span>
        {hasDiscount && (
          <span className="absolute right-2.5 top-2.5 rounded-full bg-success px-2.5 py-1 text-xs font-bold text-white shadow-sm">
            {discountPercent}% OFF
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-1 font-display text-[15px] font-semibold text-ink">{product.name}</h3>

        <span
          className={`inline-flex w-fit items-center rounded-full border px-2 py-0.5 text-xs font-medium ${
            CATEGORY_STYLES[product.category] || 'border-border bg-canvas text-muted'
          }`}
        >
          {product.category}
        </span>

        <p className="line-clamp-2 text-sm leading-relaxed text-muted">{product.description}</p>

        <div className="mt-auto flex items-end justify-between pt-2">
          <div>
            {hasDiscount ? (
              <div className="flex items-baseline gap-1.5">
                <span className="font-display text-base font-semibold text-ink">
                  {formatPrice(product.discountPrice)}
                </span>
                <span className="text-xs text-muted line-through">{formatPrice(product.price)}</span>
              </div>
            ) : (
              <span className="font-display text-base font-semibold text-ink">{formatPrice(product.price)}</span>
            )}
            <p className="mt-0.5 text-xs text-muted">
              {product.stockQuantity > 0 ? `${product.stockQuantity} in stock` : 'Out of stock'}
            </p>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              title="Edit"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/products/${product._id}/edit`);
              }}
              className="rounded-lg border border-border p-2 text-muted transition hover:border-brand hover:text-brand"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 20h9" />
                <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
            </button>
            <button
              type="button"
              title="Delete"
              onClick={(e) => {
                e.stopPropagation();
                onDelete?.(product);
              }}
              className="rounded-lg border border-border p-2 text-muted transition hover:border-danger hover:text-danger"
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 6h18" />
                <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}