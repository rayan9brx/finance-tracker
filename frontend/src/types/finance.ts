export type TransactionType = "income" | "expense";
export type Currency = "EUR" | "USD" | "GBP";
export interface Category {
  id: string;
  name: string;
  type: TransactionType;
  icon: string;
  color: string;
}
/** All monetary values are integer minor units (cents), never decimal currency. */
export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  description: string;
  categoryId: string;
  date: string;
  note: string;
  createdAt: string;
  /** Optional item in the budget matching this transaction's category and month. */
  budgetItemId?: string;
}
export interface BudgetItem {
  id: string;
  name: string;
  limit: number;
}
export interface Budget {
  id: string;
  categoryId: string;
  month: string;
  /** Simple budgets store a limit; detailed budgets store items instead. */
  limit?: number;
  items?: BudgetItem[];
}
export interface Settings {
  currency: Currency;
}
export interface FinanceData {
  version: 1;
  transactions: Transaction[];
  categories: Category[];
  budgets: Budget[];
  settings: Settings;
}
export interface FinancialSummary {
  income: number;
  expenses: number;
  savings: number;
  balance: number;
}
export interface MonthlyFinancialData extends FinancialSummary {
  month: string;
}
export type Entity = Transaction | Budget | Category;
