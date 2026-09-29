import type { Budget } from "../types/finance";
import { useFinance } from "../context/FinanceContext";
import { calculateBudgetUsage, formatCurrency } from "../utils/finance";
import { Icon } from "./ui";
export function BudgetProgress({
  budget,
  detailed = false,
}: {
  budget: Budget;
  detailed?: boolean;
}) {
  const { data } = useFinance();
  if (!data) return null;
  const category = data.categories.find((c) => c.id === budget.categoryId);
  const usage = calculateBudgetUsage(budget, data.transactions);
  const money = (n: number) => formatCurrency(n, data.settings.currency);
  return (
    <div
      className={`budget-progress ${usage.status === "Over budget" ? "over" : usage.status === "Near limit" ? "near" : ""}`}
    >
      <div className="budget-top">
        <span className="budget-name">
          <Icon name={category?.icon ?? "tag"} size={18} />
          {category?.name}
        </span>
        <small>{usage.percentage}% used</small>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-label={`${category?.name} budget`}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-valuenow={Math.min(100, usage.percentage)}
        aria-valuetext={`${usage.percentage}% used. ${usage.status}`}
      >
        <span style={{ width: `${Math.min(100, usage.percentage)}%` }} />
      </div>
      <div className="budget-bottom">
        <span>
          <strong>{money(usage.spent)}</strong>{" "}
          <span className="muted">/ {money(usage.limit)}</span>
        </span>
        <span className="budget-status">{usage.status}</span>
      </div>
      {detailed && (
        <p className="budget-remaining">
          {money(Math.abs(usage.remaining))}{" "}
          {usage.remaining < 0 ? "over the limit" : "remaining this month"}
        </p>
      )}
    </div>
  );
}
