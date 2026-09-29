import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import {
  calculateCategorySpending,
  formatCurrency,
  formatMonth,
  groupTransactionsByMonth,
  monthsEndingAt,
} from "../utils/finance";
import { MonthlyChart, SpendingChart } from "../components/Charts";
import { Card, EmptyState } from "../components/ui";
export function Analytics({ month }: { month: string }) {
  const { data } = useFinance();
  const [period, setPeriod] = useState(6);
  if (!data) return null;
  const months = monthsEndingAt(month, period),
    rows = data.transactions.filter((t) => months.includes(t.date.slice(0, 7)));
  const series = groupTransactionsByMonth(data.transactions, months);
  const [previous, current] = groupTransactionsByMonth(
    data.transactions,
    monthsEndingAt(month, 2),
  );
  const top = calculateCategorySpending(rows, data.categories);
  const money = (n: number) => formatCurrency(n, data.settings.currency);
  const savings = series.reduce((n, r) => n + r.savings, 0);
  return (
    <>
      <div className="analytics-intro">
        <p>See the habits behind the numbers.</p>
        <label className="inline-label">
          Period
          <select
            aria-label="Period"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
          >
            {[3, 6, 12].map((n) => (
              <option key={n} value={n}>
                Last {n} months
              </option>
            ))}
          </select>
        </label>
      </div>
      <div className="overview-strip">
        <div>
          <small>Saved across this period</small>
          <strong>{money(savings)}</strong>
        </div>
        <div>
          <small>Average monthly spending</small>
          <strong>
            {money(
              Math.round(series.reduce((n, r) => n + r.expenses, 0) / period),
            )}
          </strong>
        </div>
        <div>
          <small>Spending vs. {formatMonth(previous.month, true)}</small>
          <strong>
            {previous.expenses
              ? `${current.expenses >= previous.expenses ? "+" : ""}${Math.round(((current.expenses - previous.expenses) / previous.expenses) * 100)}%`
              : "No prior spending"}
          </strong>
          <small>Selected month; may be incomplete</small>
        </div>
      </div>
      <div className="two-column">
        <Card title="Income & expenses over time">
          <MonthlyChart rows={series} currency={data.settings.currency} />
        </Card>
        <Card title="How your savings are changing">
          <MonthlyChart
            rows={series}
            currency={data.settings.currency}
            savings
          />
        </Card>
        <Card title="Where your money goes">
          <SpendingChart
            transactions={rows}
            categories={data.categories}
            currency={data.settings.currency}
          />
        </Card>
        <Card title="Top spending categories">
          {top.length ? (
            <ol className="ranking">
              {top.slice(0, 5).map((c, i) => (
                <li key={c.id}>
                  <span className="rank">{String(i + 1).padStart(2, "0")}</span>
                  <div>
                    <strong>{c.name}</strong>
                    <div className="progress">
                      <span
                        style={{
                          width: `${(c.amount / top[0].amount) * 100}%`,
                          background: c.color,
                        }}
                      />
                    </div>
                  </div>
                  <strong>{money(c.amount)}</strong>
                </li>
              ))}
            </ol>
          ) : (
            <EmptyState title="No spending to analyze" />
          )}
        </Card>
      </div>
    </>
  );
}
