import { useFinance } from "../context/FinanceContext";
import {
  calculateMonthlySummary,
  formatCurrency,
  groupTransactionsByMonth,
  monthsEndingAt,
} from "../utils/finance";
import { Card, EmptyState, Icon } from "../components/ui";
import { MonthlyChart, SpendingChart } from "../components/Charts";
import { TransactionsList } from "../components/TransactionsList";
import { BudgetProgress } from "../components/BudgetProgress";
import type { Transaction } from "../types/finance";
export function Dashboard({
  month,
  onEdit,
}: {
  month: string;
  onEdit: (t: Transaction) => void;
}) {
  const { data } = useFinance();
  if (!data) return null;
  const summary = calculateMonthlySummary(data.transactions, month);
  const rows = data.transactions
    .filter((t) => t.date.startsWith(month))
    .sort((a, b) => b.date.localeCompare(a.date));
  const budgets = data.budgets.filter((b) => b.month === month);
  const stats = [
    [
      "Total balance",
      summary.balance,
      "wallet",
      "All recorded activity through today",
    ],
    [
      "Monthly income",
      summary.income,
      "transactions",
      `${rows.filter((t) => t.type === "income").length} income transactions`,
    ],
    [
      "Monthly expenses",
      summary.expenses,
      "bag",
      `${rows.filter((t) => t.type === "expense").length} expense transactions`,
    ],
    [
      "Monthly savings",
      summary.savings,
      "spark",
      summary.income
        ? `${Math.round((summary.savings / summary.income) * 100)}% of income saved`
        : "Income minus expenses",
    ],
  ] as const;
  return (
    <>
      <div className="stats-grid">
        {stats.map(([title, value, icon, detail], i) => (
          <div className={`stat-card ${i === 0 ? "featured" : ""}`} key={title}>
            <div className="stat-label">
              {title}
              <Icon name={icon} size={18} />
            </div>
            <strong>{formatCurrency(value, data.settings.currency)}</strong>
            <small>{detail}</small>
          </div>
        ))}
      </div>
      <div className="dashboard-charts">
        <Card
          title="Income vs. expenses"
          action={<span className="subtle-label">Last 6 months</span>}
        >
          <MonthlyChart
            rows={groupTransactionsByMonth(
              data.transactions,
              monthsEndingAt(month, 6),
            )}
            currency={data.settings.currency}
          />
        </Card>
        <Card title="Spending breakdown">
          <SpendingChart
            transactions={rows}
            categories={data.categories}
            currency={data.settings.currency}
          />
        </Card>
      </div>
      <div className="dashboard-bottom">
        <Card
          title="Recent transactions"
          action={
            <a className="text-link" href="#/transactions">
              View all transactions <Icon name="arrow" size={14} />
            </a>
          }
          className="recent-card"
        >
          <TransactionsList rows={rows.slice(0, 5)} onEdit={onEdit} />
        </Card>
        <Card
          title="Monthly budgets"
          action={
            <a className="text-link" href="#/budgets">
              Manage <Icon name="arrow" size={14} />
            </a>
          }
        >
          {budgets.length ? (
            budgets
              .slice(0, 4)
              .map((b) => <BudgetProgress key={b.id} budget={b} />)
          ) : (
            <EmptyState title="No budgets this month">
              Set a monthly limit to stay on track.
            </EmptyState>
          )}
        </Card>
      </div>
      <div className="local-footnote">
        <span className="status-dot" /> Your own little financial picture.
        Sample data, stored on this device.
      </div>
    </>
  );
}
