import { useFinance } from "../context/FinanceContext";
import {
  calculateBudgetLimit,
  calculateBudgetUsage,
  formatCurrency,
} from "../utils/finance";
import { BudgetProgress } from "../components/BudgetProgress";
import { BudgetBreakdown } from "../components/BudgetBreakdown";
import { Card, EmptyState } from "../components/ui";
import type { Budget } from "../types/finance";
export function Budgets({
  month,
  onEdit,
  onDelete,
}: {
  month: string;
  onEdit: (b: Budget) => void;
  onDelete: (b: Budget) => void;
}) {
  const { data } = useFinance();
  if (!data) return null;
  const budgets = data.budgets.filter((b) => b.month === month);
  const total = budgets.reduce((n, b) => n + calculateBudgetLimit(b), 0),
    spent = budgets.reduce(
      (n, b) => n + calculateBudgetUsage(b, data.transactions).spent,
      0,
    );
  return (
    <>
      <div className="overview-strip">
        <div>
          <small>Total budgeted</small>
          <strong>{formatCurrency(total, data.settings.currency)}</strong>
        </div>
        <div>
          <small>Spent in budgeted categories</small>
          <strong>{formatCurrency(spent, data.settings.currency)}</strong>
        </div>
        <div>
          <small>{total >= spent ? "Remaining" : "Over total budget"}</small>
          <strong>
            {formatCurrency(Math.abs(total - spent), data.settings.currency)}
          </strong>
        </div>
      </div>
      {budgets.length ? (
        <div className="budget-grid">
          {budgets.map((b) => (
            <Card key={b.id}>
              <BudgetProgress budget={b} detailed />
              {!!b.items?.length && <BudgetBreakdown budget={b} />}
              <div className="card-actions">
                <button className="text-button" onClick={() => onEdit(b)}>
                  Edit budget
                </button>
                <button
                  className="text-button negative"
                  onClick={() => onDelete(b)}
                >
                  Delete
                </button>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <EmptyState title="No budget created for this month">
            Add a budget to give each category a monthly spending limit.
          </EmptyState>
        </Card>
      )}
    </>
  );
}
