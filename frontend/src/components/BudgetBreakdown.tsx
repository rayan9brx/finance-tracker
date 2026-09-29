import { useId, useState } from "react";
import { useFinance } from "../context/FinanceContext";
import type { Budget } from "../types/finance";
import { calculateBudgetBreakdown, formatCurrency } from "../utils/finance";

// Retain disclosure choices across page navigation during this app session.
const expandedBudgets = new Set<string>();
export function BudgetBreakdown({ budget }: { budget: Budget }) {
  const { data } = useFinance();
  const [expanded, setExpanded] = useState(() =>
    expandedBudgets.has(budget.id),
  );
  const panelId = useId();
  if (!data) return null;
  const breakdown = calculateBudgetBreakdown(budget, data.transactions);
  const money = (amount: number) =>
    formatCurrency(amount, data.settings.currency);
  return (
    <div className="budget-breakdown">
      <button
        className="breakdown-toggle"
        aria-expanded={expanded}
        aria-controls={panelId}
        onClick={() => {
          setExpanded(!expanded);
          if (expanded) expandedBudgets.delete(budget.id);
          else expandedBudgets.add(budget.id);
        }}
      >
        <span>
          {expanded ? "Hide breakdown" : "View breakdown"}{" "}
          <small>· {breakdown.items.length} items</small>
        </span>
        <span
          className={`breakdown-chevron ${expanded ? "expanded" : ""}`}
          aria-hidden="true"
        >
          ⌄
        </span>
      </button>
      <div id={panelId} hidden={!expanded} className="breakdown-panel">
        <ul className="budget-item-list">
          {breakdown.items.map((item) => (
            <li
              key={item.id}
              className={
                item.status === "Over budget"
                  ? "over"
                  : item.status === "Near limit"
                    ? "near"
                    : ""
              }
            >
              <div className="budget-item-heading">
                <strong>{item.name}</strong>
                <span className="budget-status">{item.status}</span>
              </div>
              <div className="budget-item-values">
                <span>
                  {money(item.spent)}{" "}
                  <span className="muted">/ {money(item.limit)}</span>
                </span>
                <small>{item.percentage}% used</small>
              </div>
              <div
                className="progress"
                role="progressbar"
                aria-label={`${item.name} item budget`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={Math.min(100, item.percentage)}
                aria-valuetext={`${item.percentage}% used. ${item.status}`}
              >
                <span style={{ width: `${Math.min(100, item.percentage)}%` }} />
              </div>
            </li>
          ))}
        </ul>
        <div className="unassigned-spending">
          <div>
            <strong>Unassigned</strong>
            <strong>{money(breakdown.unassigned)}</strong>
          </div>
          <p>
            Category spending without a budget item. Included in the parent
            total; no separate item limit.
          </p>
        </div>
      </div>
    </div>
  );
}
