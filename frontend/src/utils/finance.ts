import type {
  Budget,
  BudgetItem,
  Category,
  Currency,
  FinancialSummary,
  MonthlyFinancialData,
  Transaction,
} from "../types/finance";

export const today = () => localDate(new Date());
export function localDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}
export function monthsEndingAt(month: string, count: number): string[] {
  const [year, m] = month.split("-").map(Number);
  return Array.from({ length: count }, (_, i) =>
    localDate(new Date(year, m - count + i, 1)).slice(0, 7),
  );
}
export const formatMonth = (month: string, short = false) =>
  new Intl.DateTimeFormat("en-GB", {
    month: short ? "short" : "long",
    ...(short ? {} : { year: "numeric" }),
  }).format(new Date(`${month}-01T12:00:00`));
export const formatDate = (date: string) =>
  new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(`${date}T12:00:00`));
export const formatCurrency = (cents: number, currency: Currency = "EUR") =>
  new Intl.NumberFormat("en-IE", { style: "currency", currency }).format(
    cents / 100,
  );
export function parseMoney(value: string): number | null {
  if (!/^\d+(\.\d{1,2})?$/.test(value.trim())) return null;
  const [whole, fraction = ""] = value.trim().split(".");
  const cents = Number(whole) * 100 + Number(fraction.padEnd(2, "0"));
  return Number.isSafeInteger(cents) && cents > 0 && cents <= 100_000_000_00
    ? cents
    : null;
}
export const calculateTotalIncome = (rows: Transaction[]) =>
  rows.filter((t) => t.type === "income").reduce((n, t) => n + t.amount, 0);
export const calculateTotalExpenses = (rows: Transaction[]) =>
  rows.filter((t) => t.type === "expense").reduce((n, t) => n + t.amount, 0);
export const calculateBalance = (rows: Transaction[]) =>
  calculateTotalIncome(rows) - calculateTotalExpenses(rows);
export const calculateSavings = calculateBalance;
export function calculateMonthlySummary(
  rows: Transaction[],
  month: string,
): FinancialSummary {
  const selected = rows.filter((t) => t.date.startsWith(month));
  const income = calculateTotalIncome(selected),
    expenses = calculateTotalExpenses(selected);
  return {
    income,
    expenses,
    savings: income - expenses,
    balance: calculateBalance(rows.filter((t) => t.date <= today())),
  };
}
export function groupTransactionsByMonth(
  rows: Transaction[],
  months: string[],
): MonthlyFinancialData[] {
  return months.map((month) => ({
    month,
    ...calculateMonthlySummary(rows, month),
  }));
}
export function calculateCategorySpending(
  rows: Transaction[],
  categories: Category[],
) {
  return categories
    .filter((c) => c.type === "expense")
    .map((c) => ({
      ...c,
      amount: rows
        .filter((t) => t.type === "expense" && t.categoryId === c.id)
        .reduce((n, t) => n + t.amount, 0),
    }))
    .filter((c) => c.amount > 0)
    .sort((a, b) => b.amount - a.amount);
}
export function calculateBudgetUsage(budget: Budget, rows: Transaction[]) {
  const spent = calculateTotalExpenses(
    rows.filter(
      (t) =>
        t.categoryId === budget.categoryId && t.date.startsWith(budget.month),
    ),
  );
  return calculateUsage(spent, calculateBudgetLimit(budget));
}
export function calculateBudgetLimit(budget: Budget): number {
  return budget.items
    ? budget.items.reduce((sum, item) => sum + item.limit, 0)
    : (budget.limit ?? 0);
}
export function calculateUsage(spent: number, limit: number) {
  const percentage = limit > 0 ? Math.round((spent / limit) * 100) : 0;
  return {
    spent,
    limit,
    remaining: limit - spent,
    percentage,
    status:
      spent > limit
        ? "Over budget"
        : percentage >= 80
          ? "Near limit"
          : "On track",
  };
}
export function calculateBudgetItemSpending(
  budget: Budget,
  item: BudgetItem,
  rows: Transaction[],
): number {
  return calculateTotalExpenses(
    rows.filter(
      (t) =>
        t.categoryId === budget.categoryId &&
        t.date.startsWith(budget.month) &&
        t.budgetItemId === item.id,
    ),
  );
}
export function calculateBudgetBreakdown(budget: Budget, rows: Transaction[]) {
  const items = (budget.items ?? []).map((item) => ({
    ...item,
    ...calculateUsage(
      calculateBudgetItemSpending(budget, item, rows),
      item.limit,
    ),
  }));
  const parent = calculateBudgetUsage(budget, rows);
  return {
    items,
    unassigned: parent.spent - items.reduce((sum, item) => sum + item.spent, 0),
    ...parent,
  };
}
export function availableBudgetItems(
  t: Pick<Transaction, "type" | "categoryId" | "date">,
  budgets: Budget[],
): BudgetItem[] {
  return t.type === "expense"
    ? (budgets.find(
        (b) => b.categoryId === t.categoryId && b.month === t.date.slice(0, 7),
      )?.items ?? [])
    : [];
}
/** Retain financial history when an assignment becomes invalid after a budget edit/delete. */
export function reconcileBudgetAssignments(
  transactions: Transaction[],
  budgets: Budget[],
): Transaction[] {
  return transactions.map((t) => {
    if (
      !t.budgetItemId ||
      availableBudgetItems(t, budgets).some(
        (item) => item.id === t.budgetItemId,
      )
    )
      return t;
    const { budgetItemId: removed, ...unassigned } = t;
    void removed;
    return unassigned;
  });
}
export interface TransactionFilters {
  search: string;
  type: string;
  categoryId: string;
  from: string;
  to: string;
  sort: string;
}
export function filterTransactions(
  rows: Transaction[],
  filters: TransactionFilters,
) {
  return rows
    .filter(
      (t) =>
        t.description.toLowerCase().includes(filters.search.toLowerCase()) &&
        (!filters.type || t.type === filters.type) &&
        (!filters.categoryId || t.categoryId === filters.categoryId) &&
        (!filters.from || t.date >= filters.from) &&
        (!filters.to || t.date <= filters.to),
    )
    .sort((a, b) =>
      filters.sort === "highest"
        ? b.amount - a.amount
        : filters.sort === "lowest"
          ? a.amount - b.amount
          : filters.sort === "oldest"
            ? a.date.localeCompare(b.date)
            : b.date.localeCompare(a.date),
    );
}
export function validDate(value: string) {
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(value) &&
    !Number.isNaN(Date.parse(value)) &&
    new Date(`${value}T12:00:00Z`).toISOString().slice(0, 10) === value
  );
}
export function validateTransaction(
  t: Omit<Transaction, "id" | "createdAt">,
  categories: Category[],
  budgets: Budget[] = [],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (
    !Number.isSafeInteger(t.amount) ||
    t.amount <= 0 ||
    t.amount > 100_000_000_00
  )
    errors.amount =
      "Enter an amount greater than zero, with up to 2 decimal places.";
  if (!t.description.trim()) errors.description = "Enter a description.";
  if (!categories.some((c) => c.id === t.categoryId && c.type === t.type))
    errors.categoryId = "Choose a category matching the transaction type.";
  if (!validDate(t.date)) errors.date = "Enter a valid date.";
  if (
    t.budgetItemId !== undefined &&
    !availableBudgetItems(t, budgets).some((item) => item.id === t.budgetItemId)
  )
    errors.budgetItemId =
      "Choose an item belonging to this category and month, or leave it unassigned.";
  return errors;
}
export function validateBudget(
  b: Budget,
  budgets: Budget[],
  categories: Category[],
): Record<string, string> {
  const errors: Record<string, string> = {};
  if (!categories.some((c) => c.id === b.categoryId && c.type === "expense"))
    errors.categoryId = "Choose an expense category.";
  const limit = calculateBudgetLimit(b);
  if (b.items !== undefined) {
    if (b.limit !== undefined)
      errors.limit = "A budget with breakdown derives its total from items.";
    if (!b.items.length) errors.items = "Add at least one budget item.";
    const names = new Set<string>(),
      ids = new Set<string>();
    b.items.forEach((item, index) => {
      const name = item.name.trim().toLowerCase();
      if (!name) errors[`item-name-${index}`] = "Enter an item name.";
      else if (names.has(name))
        errors[`item-name-${index}`] =
          "Item names must be unique within this budget.";
      names.add(name);
      if (
        !Number.isSafeInteger(item.limit) ||
        item.limit <= 0 ||
        item.limit > 100_000_000_00
      )
        errors[`item-limit-${index}`] =
          "Enter a limit greater than zero, with up to 2 decimals.";
      if (
        !item.id ||
        ids.has(item.id) ||
        budgets.some(
          (other) =>
            other.id !== b.id && other.items?.some((i) => i.id === item.id),
        )
      )
        errors.items = "Each budget item must have a unique identifier.";
      ids.add(item.id);
    });
  }
  if (!Number.isSafeInteger(limit) || limit <= 0 || limit > 100_000_000_00)
    errors.limit =
      "Enter a monthly limit greater than zero (up to 2 decimals).";
  if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(b.month))
    errors.month = "Choose a valid month.";
  if (
    budgets.some(
      (other) =>
        other.id !== b.id &&
        other.month === b.month &&
        other.categoryId === b.categoryId,
    )
  )
    errors.categoryId = "This category already has a budget for this month.";
  return errors;
}
