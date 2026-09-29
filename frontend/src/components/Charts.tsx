import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import type {
  Category,
  Currency,
  MonthlyFinancialData,
  Transaction,
} from "../types/finance";
import {
  calculateCategorySpending,
  formatCurrency,
  formatMonth,
} from "../utils/finance";
import { EmptyState } from "./ui";

export function MonthlyChart({
  rows,
  currency,
  savings = false,
}: {
  rows: MonthlyFinancialData[];
  currency: Currency;
  savings?: boolean;
}) {
  if (!rows.some((r) => r.income || r.expenses))
    return <EmptyState title="No data available for this period" />;
  const values = rows.map((r) => ({ ...r, label: formatMonth(r.month, true) }));
  const axis = (
    <>
      <CartesianGrid vertical={false} stroke="#e9eeeb" strokeDasharray="3 4" />
      <XAxis
        dataKey="label"
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#78827e", fontSize: 11 }}
      />
      <YAxis
        width={45}
        axisLine={false}
        tickLine={false}
        tick={{ fill: "#78827e", fontSize: 11 }}
        tickFormatter={(n) => `${Number(n) / 100000}k`}
      />
      <Tooltip
        formatter={(value) => formatCurrency(Number(value), currency)}
        labelFormatter={(_, payload) =>
          payload?.[0]?.payload?.month
            ? formatMonth(String(payload[0].payload.month))
            : ""
        }
        contentStyle={{
          borderRadius: 10,
          border: "1px solid #e0e6e2",
          fontSize: 12,
        }}
      />
    </>
  );
  return (
    <>
      <div className="chart-legend">
        {savings ? (
          <span>
            <i className="income-dot" />
            Net savings
          </span>
        ) : (
          <>
            <span>
              <i className="income-dot" />
              Income
            </span>
            <span>
              <i className="expense-dot" />
              Expenses
            </span>
          </>
        )}
        <span className="muted">{currency}</span>
      </div>
      <div
        className="chart-frame"
        role="img"
        aria-label={
          savings
            ? "Monthly savings trend. Exact values follow in the accessible data table."
            : "Monthly income and expenses. Exact values follow in the accessible data table."
        }
      >
        <ResponsiveContainer width="100%" height="100%">
          {savings ? (
            <LineChart
              data={values}
              margin={{ top: 15, right: 10, bottom: 0, left: 0 }}
            >
              {axis}
              <Line
                name="Savings"
                type="monotone"
                dataKey="savings"
                stroke="#287c6c"
                strokeWidth={2.5}
                dot={{ r: 3 }}
                isAnimationActive={false}
              />
            </LineChart>
          ) : (
            <BarChart
              data={values}
              barGap={5}
              margin={{ top: 15, right: 5, bottom: 0, left: 0 }}
            >
              {axis}
              <Bar
                name="Income"
                dataKey="income"
                fill="#287c6c"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
              <Bar
                name="Expenses"
                dataKey="expenses"
                fill="#c5d8d0"
                radius={[4, 4, 0, 0]}
                maxBarSize={24}
                isAnimationActive={false}
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </div>
      <details className="chart-data">
        <summary>View chart data</summary>
        <table>
          <caption className="sr-only">Monthly financial values</caption>
          <thead>
            <tr>
              <th>Month</th>
              <th>Income</th>
              <th>Expenses</th>
              <th>Savings</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.month}>
                <th>{formatMonth(r.month, true)}</th>
                <td>{formatCurrency(r.income, currency)}</td>
                <td>{formatCurrency(r.expenses, currency)}</td>
                <td>{formatCurrency(r.savings, currency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </>
  );
}
export function SpendingChart({
  transactions,
  categories,
  currency,
}: {
  transactions: Transaction[];
  categories: Category[];
  currency: Currency;
}) {
  const rows = calculateCategorySpending(transactions, categories);
  const total = rows.reduce((n, c) => n + c.amount, 0);
  if (!rows.length) return <EmptyState title="No spending in this period" />;
  return (
    <div className="spending-layout">
      <div
        className="donut"
        role="img"
        aria-label={`Total spending ${formatCurrency(total, currency)}. Category breakdown follows.`}
      >
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={rows}
              dataKey="amount"
              nameKey="name"
              innerRadius="73%"
              outerRadius="94%"
              paddingAngle={3}
              stroke="none"
              isAnimationActive={false}
            >
              {rows.map((c) => (
                <Cell key={c.id} fill={c.color} />
              ))}
            </Pie>
            <Tooltip formatter={(v) => formatCurrency(Number(v), currency)} />
          </PieChart>
        </ResponsiveContainer>
        <div className="donut-label">
          <small>Total spent</small>
          <strong>{formatCurrency(total, currency)}</strong>
        </div>
      </div>
      <ul className="category-legend">
        {rows.map((c) => (
          <li key={c.id}>
            <span>
              <i style={{ background: c.color }} />
              {c.name}
            </span>
            <strong>{Math.round((c.amount / total) * 100)}%</strong>
            <small>{formatCurrency(c.amount, currency)}</small>
          </li>
        ))}
      </ul>
    </div>
  );
}
