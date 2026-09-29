import type { Transaction } from "../types/finance";
import { useFinance } from "../context/FinanceContext";
import {
  availableBudgetItems,
  formatCurrency,
  formatDate,
} from "../utils/finance";
import { EmptyState, Icon } from "./ui";
export function TransactionsList({
  rows,
  onEdit,
  onDelete,
}: {
  rows: Transaction[];
  onEdit: (t: Transaction) => void;
  onDelete?: (t: Transaction) => void;
}) {
  const { data } = useFinance();
  if (!data) return null;
  if (!rows.length)
    return (
      <EmptyState title="No transactions found">
        Add a transaction or adjust your filters to get started.
      </EmptyState>
    );
  return (
    <div className="transaction-list" role="list" aria-label="Transactions">
      <div
        aria-hidden="true"
        className={`transaction-head ${onDelete ? "with-actions" : ""}`}
      >
        <span>Transaction</span>
        <span>Category</span>
        <span>Date</span>
        <span className="align-right">Amount</span>
        {onDelete && <span className="align-right">Actions</span>}
      </div>
      {rows.map((t) => {
        const c = data.categories.find((c) => c.id === t.categoryId);
        const item = availableBudgetItems(t, data.budgets).find(
          (item) => item.id === t.budgetItemId,
        );
        return (
          <div
            role="listitem"
            className={`transaction-row ${onDelete ? "with-actions" : ""}`}
            key={t.id}
          >
            <div className="merchant">
              <span className="category-icon" style={{ color: c?.color }}>
                <Icon name={c?.icon ?? "tag"} />
              </span>
              <div>
                <button
                  className="text-button merchant-name"
                  onClick={() => onEdit(t)}
                >
                  {t.description}
                </button>
                <small>
                  {t.type === "income" ? "Income" : "Expense"}
                  <span className="mobile-category"> · {c?.name}</span>
                  {item && ` · ${item.name}`}
                  {t.note && ` · ${t.note}`}
                </small>
              </div>
            </div>
            <span className="transaction-category">
              <span className="badge">{c?.name ?? "Uncategorized"}</span>
            </span>
            <time dateTime={t.date}>{formatDate(t.date)}</time>
            <strong
              className={`amount ${t.type === "income" ? "positive" : ""}`}
            >
              {t.type === "income" ? "+" : "−"}
              {formatCurrency(t.amount, data.settings.currency)}
            </strong>
            {onDelete && (
              <div className="row-actions">
                <button
                  className="text-button"
                  aria-label={`Edit ${t.description}`}
                  onClick={() => onEdit(t)}
                >
                  Edit
                </button>
                <button
                  className="text-button negative"
                  aria-label={`Delete ${t.description}`}
                  onClick={() => onDelete(t)}
                >
                  Delete
                </button>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
