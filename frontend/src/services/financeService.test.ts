import { describe, expect, it } from "vitest";
import { createLocalFinanceService, STORAGE_KEY } from "./financeService";
import type { Transaction } from "../types/finance";
function setup() {
  const records = new Map<string, string>();
  const storage = {
    getItem: (k: string) => records.get(k) ?? null,
    setItem: (k: string, v: string) => {
      records.set(k, v);
    },
  };
  return { records, storage, service: createLocalFinanceService(storage) };
}
describe("local finance adapter", () => {
  it("seeds once and persists CRUD through a new adapter", async () => {
    const { service, storage } = setup();
    const initial = await service.load();
    const transaction: Transaction = {
      id: "test",
      type: "expense",
      amount: 1250,
      description: "Test",
      categoryId: "category-1",
      date: "2026-01-01",
      note: "",
      createdAt: "2026-01-01T00:00:00Z",
    };
    expect(
      (await service.saveTransaction(transaction)).transactions.length,
    ).toBe(initial.transactions.length + 1);
    expect(
      (await createLocalFinanceService(storage).load()).transactions.find(
        (t) => t.id === "test",
      )?.amount,
    ).toBe(1250);
    expect(
      (
        await service.saveTransaction({ ...transaction, amount: 2500 })
      ).transactions.find((t) => t.id === "test")?.amount,
    ).toBe(2500);
    expect((await service.deleteTransaction("test")).transactions.length).toBe(
      initial.transactions.length,
    );
  });
  it("protects referenced categories and their type", async () => {
    const { service } = setup();
    const data = await service.load();
    await expect(service.deleteCategory("category-1")).rejects.toThrow("used");
    await expect(
      service.saveCategory({ ...data.categories[1], type: "income" }),
    ).rejects.toThrow("type");
  });
  it("allows creating, renaming and deleting an unused category", async () => {
    const { service } = setup();
    const c = {
      id: "custom",
      name: "Travel",
      type: "expense" as const,
      icon: "train",
      color: "#24766b",
    };
    await service.saveCategory(c);
    expect(
      (await service.saveCategory({ ...c, name: "Holidays" })).categories.find(
        (c) => c.id === "custom",
      )?.name,
    ).toBe("Holidays");
    expect(
      (await service.deleteCategory("custom")).categories.some(
        (c) => c.id === "custom",
      ),
    ).toBe(false);
  });
  it("preserves corrupted storage instead of overwriting it", async () => {
    const { service, records } = setup();
    records.set(STORAGE_KEY, "broken");
    await expect(service.load()).rejects.toThrow("preserved");
    expect(records.get(STORAGE_KEY)).toBe("broken");
  });
  it("rejects storage failures without claiming success", async () => {
    const { service, storage } = setup();
    await service.load();
    storage.setItem = () => {
      throw new Error("quota");
    };
    await expect(service.deleteTransaction("sample-0-0")).rejects.toThrow(
      "not saved",
    );
  });
  it("enforces duplicate monthly budgets and supports updates/deletion", async () => {
    const { service } = setup();
    const data = await service.load();
    const budget = data.budgets[1];
    await expect(
      service.saveBudget({ ...budget, id: "duplicate" }),
    ).rejects.toThrow("already");
    expect(
      (await service.saveBudget({ ...budget, limit: 12300 })).budgets[1].limit,
    ).toBe(12300);
    expect((await service.deleteBudget(budget.id)).budgets).toHaveLength(
      data.budgets.length - 1,
    );
  });
});
