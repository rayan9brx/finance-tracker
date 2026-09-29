import { describe, expect, it } from "vitest";
import type { Budget, Category, Transaction } from "../types/finance";
import {
  availableBudgetItems,
  calculateBudgetBreakdown,
  calculateBudgetItemSpending,
  calculateBudgetLimit,
  calculateBudgetUsage,
  validateBudget,
  validateTransaction,
} from "./finance";
const categories: Category[] = [
  {
    id: "housing",
    name: "Housing",
    type: "expense",
    icon: "home",
    color: "#24766b",
  },
];
const budget: Budget = {
  id: "housing-sept",
  categoryId: "housing",
  month: "2026-09",
  items: [
    { id: "rent", name: "Rent", limit: 90000 },
    { id: "internet", name: "Internet", limit: 5000 },
  ],
};
const transaction = (
  id: string,
  amount: number,
  budgetItemId?: string,
): Transaction => ({
  id,
  description: id,
  amount,
  type: "expense",
  categoryId: "housing",
  date: "2026-09-02",
  note: "",
  createdAt: "2026-09-02T12:00:00Z",
  ...(budgetItemId ? { budgetItemId } : {}),
});
const rows = [
  transaction("rent-paid", 85000, "rent"),
  transaction("internet-paid", 3999, "internet"),
  transaction("unassigned", 2500),
];
describe("hierarchical budget calculations", () => {
  it("derives the parent limit and includes unassigned spending exactly once", () => {
    const result = calculateBudgetBreakdown(budget, rows);
    expect(calculateBudgetLimit(budget)).toBe(95000);
    expect(result).toMatchObject({
      spent: 91499,
      remaining: 3501,
      percentage: 96,
      status: "Near limit",
      unassigned: 2500,
    });
    expect(
      result.items.reduce((sum, item) => sum + item.spent, result.unassigned),
    ).toBe(result.spent);
  });
  it("calculates child spending, remaining and percentage from transactions", () => {
    expect(calculateBudgetItemSpending(budget, budget.items![0], rows)).toBe(
      85000,
    );
    expect(calculateBudgetBreakdown(budget, rows).items[0]).toMatchObject({
      spent: 85000,
      remaining: 5000,
      percentage: 94,
      status: "Near limit",
    });
  });
  it("excludes income, other months and other categories from children and parent", () => {
    const unrelated = [
      { ...rows[0], type: "income" as const },
      { ...rows[0], date: "2026-10-01" },
      { ...rows[0], categoryId: "food" },
    ];
    expect(calculateBudgetBreakdown(budget, unrelated)).toMatchObject({
      spent: 0,
      unassigned: 0,
    });
  });
  it("handles parent and child over-budget spending and negative remaining", () => {
    const result = calculateBudgetBreakdown(budget, [
      ...rows,
      transaction("extra-rent", 10000, "rent"),
    ]);
    expect(result).toMatchObject({ status: "Over budget", remaining: -6499 });
    expect(result.items[0]).toMatchObject({
      percentage: 106,
      remaining: -5000,
      status: "Over budget",
    });
  });
  it("recalculates totals when child limits change without changing spending", () => {
    const edited = {
      ...budget,
      items: budget.items!.map((item) => ({ ...item, limit: item.limit * 2 })),
    };
    expect(calculateBudgetUsage(edited, rows)).toMatchObject({
      limit: 190000,
      spent: 91499,
      remaining: 98501,
      status: "On track",
    });
  });
  it("supports simple legacy budgets and empty transaction sets", () => {
    expect(
      calculateBudgetUsage(
        { id: "old", categoryId: "housing", month: "2026-09", limit: 100000 },
        rows,
      ),
    ).toMatchObject({ spent: 91499, limit: 100000 });
    expect(
      calculateBudgetBreakdown(budget, []).items.every(
        (item) => item.spent === 0 && item.percentage === 0,
      ),
    ).toBe(true);
  });
  it("keeps unmatched references in unassigned spending rather than losing money", () => {
    expect(
      calculateBudgetBreakdown(budget, [transaction("stale", 1200, "removed")])
        .unassigned,
    ).toBe(1200);
  });
});
describe("item validation and transaction mapping", () => {
  it("requires names and positive integer limits", () => {
    const invalid = {
      ...budget,
      items: [{ id: "invalid", name: " ", limit: -1 }],
    };
    expect(validateBudget(invalid, [], categories)).toMatchObject({
      "item-name-0": "Enter an item name.",
      "item-limit-0": "Enter a limit greater than zero, with up to 2 decimals.",
    });
  });
  it("rejects duplicate normalized names, IDs and an empty breakdown", () => {
    expect(
      validateBudget(
        {
          ...budget,
          items: [
            { id: "same", name: "Rent", limit: 100 },
            { id: "same", name: " rent ", limit: 100 },
          ],
        },
        [],
        categories,
      ),
    ).toHaveProperty("item-name-1");
    expect(
      validateBudget({ ...budget, items: [] }, [], categories),
    ).toHaveProperty("items");
  });
  it("rejects redundant parent limits and oversized derived totals", () => {
    expect(
      validateBudget({ ...budget, limit: 95000 }, [], categories),
    ).toHaveProperty("limit");
    expect(
      validateBudget(
        {
          ...budget,
          items: budget.items!.map((i) => ({ ...i, limit: 100_000_000_00 })),
        },
        [],
        categories,
      ),
    ).toHaveProperty("limit");
  });
  it("allows item selection only for matching expense category and month", () => {
    expect(availableBudgetItems(rows[0], [budget])).toHaveLength(2);
    expect(validateTransaction(rows[0], categories, [budget])).toEqual({});
    expect(
      validateTransaction({ ...rows[0], date: "2026-10-01" }, categories, [
        budget,
      ]),
    ).toHaveProperty("budgetItemId");
    expect(
      availableBudgetItems({ ...rows[0], type: "income" }, [budget]),
    ).toEqual([]);
    expect(validateTransaction(rows[2], categories, [budget])).toEqual({});
  });
});
