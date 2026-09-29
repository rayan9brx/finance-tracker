import { describe, expect, it } from "vitest";
import { createLocalFinanceService, STORAGE_KEY } from "./financeService";
import type { Budget, FinanceData, Transaction } from "../types/finance";
import {
  calculateBudgetBreakdown,
  calculateBudgetLimit,
} from "../utils/finance";
const budget: Budget = {
  id: "b",
  categoryId: "housing",
  month: "2026-09",
  items: [
    { id: "rent", name: "Rent", limit: 90000 },
    { id: "net", name: "Internet", limit: 5000 },
  ],
};
const transaction: Transaction = {
  id: "t",
  type: "expense",
  description: "Rent",
  amount: 85000,
  categoryId: "housing",
  date: "2026-09-01",
  note: "",
  createdAt: "2026-09-01T12:00:00Z",
  budgetItemId: "rent",
};
function setup() {
  const data: FinanceData = {
    version: 1,
    categories: [
      {
        id: "housing",
        name: "Housing",
        type: "expense",
        color: "#24766b",
        icon: "home",
      },
      {
        id: "other",
        name: "Other",
        type: "expense",
        color: "#24766b",
        icon: "tag",
      },
    ],
    budgets: [budget],
    transactions: [transaction],
    settings: { currency: "EUR" },
  };
  const records = new Map([[STORAGE_KEY, JSON.stringify(data)]]);
  const storage = {
    getItem: (key: string) => records.get(key) ?? null,
    setItem: (key: string, value: string) => {
      records.set(key, value);
    },
  };
  return {
    service: createLocalFinanceService(storage),
    records,
    storage,
    data,
  };
}
describe("persisting budget items safely", () => {
  it("round-trips edits without a duplicated parent limit", async () => {
    const { service, storage } = setup();
    await service.saveBudget({
      ...budget,
      items: [
        { id: "rent", name: " Rent & fees ", limit: 100000 },
        { id: "net", name: "Internet", limit: 5000 },
      ],
    });
    const saved = await createLocalFinanceService(storage).load();
    expect(saved.budgets[0].limit).toBeUndefined();
    expect(saved.budgets[0].items![0].name).toBe("Rent & fees");
    expect(calculateBudgetLimit(saved.budgets[0])).toBe(105000);
    expect(saved.transactions[0].budgetItemId).toBe("rent");
  });
  it("retains transactions as unassigned after item removal", async () => {
    const { service } = setup();
    const next = await service.saveBudget({
      ...budget,
      items: [budget.items![1]],
    });
    expect(next.transactions[0].amount).toBe(85000);
    expect(next.transactions[0].budgetItemId).toBeUndefined();
    expect(
      calculateBudgetBreakdown(next.budgets[0], next.transactions).unassigned,
    ).toBe(85000);
    await expect(service.load()).resolves.toEqual(next);
  });
  it.each(["category", "month", "simple", "delete"])(
    "clears invalid assignments when changing %s",
    async (mode) => {
      const { service } = setup();
      const next =
        mode === "delete"
          ? await service.deleteBudget("b")
          : await service.saveBudget(
              mode === "simple"
                ? {
                    id: "b",
                    categoryId: "housing",
                    month: "2026-09",
                    limit: 95000,
                  }
                : {
                    ...budget,
                    ...(mode === "category"
                      ? { categoryId: "other" }
                      : { month: "2026-10" }),
                  },
            );
      expect(next.transactions[0]).toEqual({
        ...transaction,
        budgetItemId: undefined,
      });
      expect(next.transactions).toHaveLength(1);
      await expect(service.load()).resolves.toEqual(next);
    },
  );
  it("rejects invalid transaction assignments without mutating storage", async () => {
    const { service, records } = setup();
    const original = records.get(STORAGE_KEY);
    await expect(
      service.saveTransaction({ ...transaction, date: "2026-10-01" }),
    ).rejects.toThrow("category and month");
    expect(records.get(STORAGE_KEY)).toBe(original);
  });
  it("loads legacy simple budgets and unassigned transactions unchanged", async () => {
    const { service, storage, data } = setup();
    const legacy = {
      ...data,
      budgets: [
        { id: "b", categoryId: "housing", month: "2026-09", limit: 95000 },
      ],
      transactions: [{ ...transaction, budgetItemId: undefined }],
    };
    storage.setItem(STORAGE_KEY, JSON.stringify(legacy));
    expect(await service.load()).toEqual(legacy);
  });
  it("failed writes preserve both item structure and assignments", async () => {
    const { service, storage, records } = setup();
    const original = records.get(STORAGE_KEY);
    storage.setItem = () => {
      throw new Error("Quota");
    };
    await expect(service.deleteBudget("b")).rejects.toThrow("not saved");
    expect(records.get(STORAGE_KEY)).toBe(original);
  });
});
