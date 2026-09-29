import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { filterTransactions, type TransactionFilters } from "../utils/finance";
import { TransactionsList } from "../components/TransactionsList";
import { Card, Field } from "../components/ui";
import type { Transaction } from "../types/finance";
const initial: TransactionFilters = {
  search: "",
  type: "",
  categoryId: "",
  from: "",
  to: "",
  sort: "newest",
};
export function Transactions({
  onEdit,
  onDelete,
}: {
  onEdit: (t: Transaction) => void;
  onDelete: (t: Transaction) => void;
}) {
  const { data } = useFinance();
  const [filters, setFilters] = useState(initial),
    [limit, setLimit] = useState(20);
  if (!data) return null;
  const change = (key: keyof TransactionFilters, value: string) => {
    setFilters({ ...filters, [key]: value });
    setLimit(20);
  };
  const rows = filterTransactions(data.transactions, filters);
  return (
    <>
      <Card className="filters-card">
        <div className="filters">
          <Field label="Search transactions" name="search">
            <input
              id="search"
              type="search"
              placeholder="Search by description…"
              value={filters.search}
              onChange={(e) => change("search", e.target.value)}
            />
          </Field>
          <Field label="Type" name="filter-type">
            <select
              id="filter-type"
              value={filters.type}
              onChange={(e) => change("type", e.target.value)}
            >
              <option value="">All types</option>
              <option value="income">Income</option>
              <option value="expense">Expense</option>
            </select>
          </Field>
          <Field label="Category" name="filter-category">
            <select
              id="filter-category"
              value={filters.categoryId}
              onChange={(e) => change("categoryId", e.target.value)}
            >
              <option value="">All categories</option>
              {data.categories.map((c) => (
                <option value={c.id} key={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Sort by" name="sort">
            <select
              id="sort"
              value={filters.sort}
              onChange={(e) => change("sort", e.target.value)}
            >
              <option value="newest">Newest first</option>
              <option value="oldest">Oldest first</option>
              <option value="highest">Highest amount</option>
              <option value="lowest">Lowest amount</option>
            </select>
          </Field>
        </div>
        <div className="date-filters">
          <Field label="From" name="from">
            <input
              id="from"
              type="date"
              value={filters.from}
              onChange={(e) => change("from", e.target.value)}
            />
          </Field>
          <Field label="To" name="to">
            <input
              id="to"
              type="date"
              min={filters.from}
              value={filters.to}
              onChange={(e) => change("to", e.target.value)}
            />
          </Field>
          <button
            className="text-button"
            onClick={() => {
              setFilters(initial);
              setLimit(20);
            }}
          >
            Clear filters
          </button>
          <span className="results-count" aria-live="polite">
            {rows.length} transactions
          </span>
        </div>
        {filters.from && filters.to && filters.from > filters.to && (
          <p className="error" role="alert">
            The end date must be on or after the start date.
          </p>
        )}
      </Card>
      <Card>
        <TransactionsList
          rows={rows.slice(0, limit)}
          onEdit={onEdit}
          onDelete={onDelete}
        />
        {rows.length > limit && (
          <button
            className="button secondary load-more"
            onClick={() => setLimit(limit + 20)}
          >
            Show more transactions
          </button>
        )}
      </Card>
    </>
  );
}
