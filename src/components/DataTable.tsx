import { useState, useMemo, type ReactNode } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, ArrowDown, ArrowUpDown, MoreVertical } from 'lucide-react';

export type SortDir = 'asc' | 'desc';

export interface Column<T> {
  key: string;
  label: string;
  sortable?: boolean;
  render: (row: T) => ReactNode;
  sortValue?: (row: T) => string | number;
  className?: string;
}

interface Props<T> {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  onRowClick?: (row: T) => void;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  rowMenu?: (row: T) => ReactNode;
  emptyState?: ReactNode;
  pageSize?: number;
}

export function DataTable<T>({
  rows,
  columns,
  getRowId,
  onRowClick,
  selectable,
  selectedIds,
  onSelectionChange,
  rowMenu,
  emptyState,
  pageSize = 10,
}: Props<T>) {
  const [sortKey, setSortKey] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>('asc');
  const [page, setPage] = useState(0);
  const [menuOpenId, setMenuOpenId] = useState<string | null>(null);

  const sorted = useMemo(() => {
    if (!sortKey) return rows;
    const col = columns.find((c) => c.key === sortKey);
    if (!col?.sortValue) return rows;
    const dir = sortDir === 'asc' ? 1 : -1;
    return [...rows].sort((a, b) => {
      const av = col.sortValue!(a);
      const bv = col.sortValue!(b);
      if (av < bv) return -1 * dir;
      if (av > bv) return 1 * dir;
      return 0;
    });
  }, [rows, sortKey, sortDir, columns]);

  const pageCount = Math.ceil(sorted.length / pageSize);
  const pageRows = sorted.slice(page * pageSize, page * pageSize + pageSize);

  const toggleSort = (key: string) => {
    if (sortKey === key) {
      setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const allOnPageSelected = Boolean(
    selectable && pageRows.length > 0 && pageRows.every((r) => selectedIds?.has(getRowId(r))),
  );
  const someSelected = Boolean(selectable && (selectedIds?.size ?? 0) > 0);

  const toggleAll = () => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (allOnPageSelected) {
      pageRows.forEach((r) => next.delete(getRowId(r)));
    } else {
      pageRows.forEach((r) => next.add(getRowId(r)));
    }
    onSelectionChange(next);
  };

  const toggleOne = (id: string) => {
    if (!onSelectionChange) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  if (rows.length === 0 && emptyState) {
    return <>{emptyState}</>;
  }

  return (
    <div className="card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border-subtle">
              {selectable && (
                <th className="w-10 px-4 py-3">
                  <input
                    type="checkbox"
                    checked={allOnPageSelected}
                    ref={(el) => {
                      if (el) el.indeterminate = someSelected && !allOnPageSelected;
                    }}
                    onChange={toggleAll}
                    className="accent-accent w-4 h-4 cursor-pointer"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={`text-left px-4 py-3 text-xs font-semibold text-text-muted uppercase tracking-wider ${col.className ?? ''}`}
                >
                  {col.sortable ? (
                    <button
                      onClick={() => toggleSort(col.key)}
                      className="inline-flex items-center gap-1 hover:text-text-primary transition-colors"
                    >
                      {col.label}
                      {sortKey === col.key ? (
                        sortDir === 'asc' ? (
                          <ArrowUp className="w-3 h-3 text-accent" />
                        ) : (
                          <ArrowDown className="w-3 h-3 text-accent" />
                        )
                      ) : (
                        <ArrowUpDown className="w-3 h-3 opacity-40" />
                      )}
                    </button>
                  ) : (
                    col.label
                  )}
                </th>
              ))}
              {rowMenu && <th className="w-10" />}
            </tr>
          </thead>
          <tbody>
            {pageRows.map((row) => {
              const id = getRowId(row);
              const selected = selectedIds?.has(id);
              return (
                <motion.tr
                  key={id}
                  layout
                  onClick={() => onRowClick?.(row)}
                  className={`border-b border-border-subtle last:border-0 transition-colors ${
                    selected ? 'bg-accent/5' : 'hover:bg-surface-hover'
                  } ${onRowClick ? 'cursor-pointer' : ''}`}
                >
                  {selectable && (
                    <td className="px-4 py-3" onClick={(e) => e.stopPropagation()}>
                      <input
                        type="checkbox"
                        checked={selected ?? false}
                        onChange={() => toggleOne(id)}
                        className="accent-accent w-4 h-4 cursor-pointer"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} className={`px-4 py-3 text-text-primary ${col.className ?? ''}`}>
                      {col.render(row)}
                    </td>
                  ))}
                  {rowMenu && (
                    <td className="px-2 py-3 text-right relative" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => setMenuOpenId(menuOpenId === id ? null : id)}
                        className="p-1.5 rounded-lg text-text-muted hover:text-text-primary hover:bg-surface-hover transition-colors"
                      >
                        <MoreVertical className="w-4 h-4" />
                      </button>
                      {menuOpenId === id && (
                        <>
                          <div className="fixed inset-0 z-10" onClick={() => setMenuOpenId(null)} />
                          <div className="absolute right-2 top-full mt-1 z-20 bg-surface border border-border-subtle rounded-lg shadow-xl shadow-black/40 py-1 min-w-[160px]">
                            {rowMenu(row)}
                          </div>
                        </>
                      )}
                    </td>
                  )}
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 px-4 py-3 border-t border-border-subtle text-xs text-text-muted">
        <span>
          Showing {page * pageSize + 1}–{Math.min(page * pageSize + pageSize, sorted.length)} of {sorted.length}
        </span>
        {pageCount > 1 && (
          <div className="flex items-center gap-1">
            <button
              disabled={page === 0}
              onClick={() => setPage((p) => p - 1)}
              className="px-2 py-1 rounded hover:bg-surface-hover disabled:opacity-30"
            >
              Prev
            </button>
            {Array.from({ length: pageCount }).map((_, i) => (
              <button
                key={i}
                onClick={() => setPage(i)}
                className={`w-7 h-7 rounded text-xs ${
                  page === i ? 'bg-accent text-black font-semibold' : 'hover:bg-surface-hover'
                }`}
              >
                {i + 1}
              </button>
            ))}
            <button
              disabled={page >= pageCount - 1}
              onClick={() => setPage((p) => p + 1)}
              className="px-2 py-1 rounded hover:bg-surface-hover disabled:opacity-30"
            >
              Next
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
