import { describe, expect, it } from "vitest";
import {
  calculateBalance,
  calculateBudgetUsage,
  calculateCategorySpending,
  calculateMonthlySummary,
  filterTransactions,
  formatCurrency,
  groupTransactionsByMonth,
  monthsEndingAt,
  parseMoney,
  validDate,
  validateBudget,
  validateTransaction,
} from "./finance";
import type { Budget, Category, Transaction } from "../types/finance";
const categories: Category[] = [
  {
    id: "food",
    name: "Food",
    type: "expense",
    icon: "basket",
    color: "#24766b",
  },
  {
    id: "salary",
    name: "Salary",
    type: "income",
    icon: "wallet",
    color: "#24766b",
  },
];
const make = (
  id: string,
  type: "income" | "expense",
  amount: number,
  date: string,
): Transaction => ({
  id,
  type,
  amount,
  date,
  categoryId: type === "expense" ? "food" : "salary",
  description: id,
  note: "",
  createdAt: `${date}T12:00:00Z`,
});
const rows = [
  make("Salary", "income", 300000, "2026-01-01"),
  make("Groceries", "expense", 10, "2026-01-02"),
  make("Coffee", "expense", 20, "2026-01-03"),
  make("February", "expense", 10000, "2026-02-01"),
];
describe("money and dates", () => {
  it("parses decimals exactly without floating point addition", () => {
    expect(parseMoney("0.10")! + parseMoney("0.20")!).toBe(30);
    expect(parseMoney("12.3")).toBe(1230);
  });
  it.each([
    "0",
    "-1",
    "NaN",
    "Infinity",
    "1e3",
    "1.001",
    "",
    "1000000000000000",
  ])("rejects invalid money %s", (value) =>
    expect(parseMoney(value)).toBeNull(),
  );
  it("formats signed amounts in the selected currency", () => {
    expect(formatCurrency(12345)).toBe("€123.45");
    expect(formatCurrency(-12345, "GBP")).toBe("-£123.45");
  });
  it("handles year boundaries and leap dates", () => {
    expect(monthsEndingAt("2026-01", 3)).toEqual([
      "2025-11",
      "2025-12",
      "2026-01",
    ]);
    expect(validDate("2026-02-30")).toBe(false);
    expect(validDate("2024-02-29")).toBe(true);
  });
});
describe("derived financial data", () => {
  it("keeps income, expenses, savings and balance consistent", () => {
    expect(calculateMonthlySummary(rows, "2026-01")).toMatchObject({
      income: 300000,
      expenses: 30,
      savings: 299970,
    });
    expect(calculateBalance(rows)).toBe(289970);
  });
  it("provides zeros for months without transactions", () => {
    expect(groupTransactionsByMonth([], ["2026-01"])[0]).toEqual({
      month: "2026-01",
      income: 0,
      expenses: 0,
      savings: 0,
      balance: 0,
    });
  });
  it("groups only expenses by category", () => {
    expect(calculateCategorySpending(rows, categories)).toEqual([
      { ...categories[0], amount: 10030 },
    ]);
  });
  it("filters inclusively and sorts without changing the source", () => {
    const result = filterTransactions(rows, {
      search: "o",
      type: "expense",
      categoryId: "food",
      from: "2026-01-02",
      to: "2026-01-03",
      sort: "highest",
    });
    expect(result.map((t) => t.id)).toEqual(["Coffee", "Groceries"]);
    expect(rows[0].id).toBe("Salary");
  });
  it("excludes future transactions from available balance", () => {
    expect(
      calculateMonthlySummary(
        [make("Future", "income", 10000, "2099-01-01")],
        "2099-01",
      ).balance,
    ).toBe(0);
  });
});
describe("budgets and validation", () => {
  const budget: Budget = {
    id: "b",
    categoryId: "food",
    month: "2026-01",
    limit: 100,
  };
  it.each([
    [100, "On track"],
    [35, "Near limit"],
    [20, "Over budget"],
  ])("calculates budget state for limit %s", (limit, status) => {
    expect(calculateBudgetUsage({ ...budget, limit }, rows)).toMatchObject({
      spent: 30,
      remaining: limit - 30,
      status,
    });
  });
  it("rejects duplicates but allows edits and different months", () => {
    expect(
      validateBudget({ ...budget, id: "new" }, [budget], categories).categoryId,
    ).toBeTruthy();
    expect(validateBudget(budget, [budget], categories)).toEqual({});
    expect(
      validateBudget({ ...budget, month: "2026-02" }, [budget], categories),
    ).toEqual({});
  });
  it("rejects mismatched type, missing description, bad date and amount", () => {
    expect(
      Object.keys(
        validateTransaction(
          {
            ...rows[0],
            amount: NaN,
            description: " ",
            categoryId: "food",
            date: "bad",
          },
          categories,
        ),
      ),
    ).toEqual(["amount", "description", "categoryId", "date"]);
  });
});
