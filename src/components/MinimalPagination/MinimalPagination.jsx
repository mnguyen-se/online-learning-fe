import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import './MinimalPagination.css';

/**
 * Pagination tối giản: ◀ | currentPage/totalPages | ▶
 * Disable nút khi trang đầu / trang cuối.
 */
function MinimalPagination({ currentPage, totalPages, onPrev, onNext }) {
  const total = Math.max(1, Number(totalPages) || 1);
  const current = Math.min(Math.max(1, Number(currentPage) || 1), total);
  const atFirst = current <= 1;
  const atLast = current >= total;

  return (
    <div className="minimal-pagination">
      <button
        type="button"
        className="minimal-pagination__btn minimal-pagination__btn--prev"
        onClick={onPrev}
        disabled={atFirst}
        aria-label="Trang trước"
      >
        <ChevronLeft size={20} strokeWidth={2} />
      </button>
      <div className="minimal-pagination__box" aria-live="polite">
        {current}/{total}
      </div>
      <button
        type="button"
        className="minimal-pagination__btn minimal-pagination__btn--next"
        onClick={onNext}
        disabled={atLast}
        aria-label="Trang sau"
      >
        <ChevronRight size={20} strokeWidth={2} />
      </button>
    </div>
  );
}

export default MinimalPagination;
