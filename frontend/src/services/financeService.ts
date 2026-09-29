import type {
  Budget,
  Category,
  FinanceData,
  Settings,
  Transaction,
} from "../types/finance";
import { createSeed } from "../data/seed";
import {
  reconcileBudgetAssignments,
  validateBudget,
  validateTransaction,
} from "../utils/finance";

export interface FinanceService {
  load(): Promise<FinanceData>;
  saveTransaction(value: Transaction): Promise<FinanceData>;
  deleteTransaction(id: string): Promise<FinanceData>;
  saveBudget(value: Budget): Promise<FinanceData>;
  deleteBudget(id: string): Promise<FinanceData>;
  saveCategory(value: Category): Promise<FinanceData>;
  deleteCategory(id: string): Promise<FinanceData>;
  saveSettings(value: Settings): Promise<FinanceData>;
}
export const STORAGE_KEY = "finance-tracker.local.v1";
function assert(condition: unknown, message: string): asserts condition {
  if (!condition) throw new Error(message);
}
function upsert<T extends { id: string }>(rows: T[], value: T): T[] {
  return rows.some((r) => r.id === value.id)
    ? rows.map((r) => (r.id === value.id ? value : r))
    : [...rows, value];
}
function checkErrors(errors: Record<string, string>) {
  assert(Object.keys(errors).length === 0, Object.values(errors).join(" "));
}
function validateData(raw: unknown): FinanceData {
  assert(raw && typeof raw === "object", "Saved data is invalid.");
  const data = raw as FinanceData;
  assert(
    data.version === 1 &&
      Array.isArray(data.transactions) &&
      Array.isArray(data.categories) &&
      Array.isArray(data.budgets) &&
      ["EUR", "USD", "GBP"].includes(data.settings?.currency),
    "Saved data uses an unsupported format.",
  );
  for (const c of data.categories)
    assert(
      c &&
        typeof c.id === "string" &&
        typeof c.name === "string" &&
        typeof c.icon === "string" &&
        /^#[a-fA-F0-9]{6}$/.test(c.color) &&
        ["income", "expense"].includes(c.type),
      "Saved category is invalid.",
    );
  for (const b of data.budgets) {
    assert(
      b && typeof b.id === "string" && typeof b.month === "string",
      "Saved budget is invalid.",
    );
    if (b.items !== undefined)
      assert(
        Array.isArray(b.items) &&
          b.items.every(
            (item) =>
              item &&
              typeof item.id === "string" &&
              typeof item.name === "string",
          ),
        "Saved budget items are invalid.",
      );
    checkErrors(validateBudget(b, data.budgets, data.categories));
  }
  for (const t of data.transactions) {
    assert(
      t &&
        typeof t.id === "string" &&
        typeof t.description === "string" &&
        typeof t.note === "string" &&
        typeof t.createdAt === "string" &&
        typeof t.date === "string",
      "Saved transaction is invalid.",
    );
    checkErrors(validateTransaction(t, data.categories, data.budgets));
  }
  for (const rows of [data.categories, data.transactions, data.budgets])
    assert(
      new Set(rows.map((r) => r.id)).size === rows.length,
      "Saved data contains duplicate identifiers.",
    );
  return data;
}
/** Local adapter. Replace this injected implementation with an HTTP adapter later.
 * Promises express the service contract; no network requests or artificial latency. */
export function createLocalFinanceService(
  storage: Pick<Storage, "getItem" | "setItem">,
): FinanceService {
  function read(): FinanceData {
    const saved = storage.getItem(STORAGE_KEY);
    if (saved === null) {
      const data = createSeed();
      storage.setItem(STORAGE_KEY, JSON.stringify(data));
      return data;
    }
    try {
      return validateData(JSON.parse(saved));
    } catch {
      throw new Error(
        "Could not read saved data. Your stored data has been preserved. Check browser storage or restore a valid backup, then retry.",
      );
    }
  }
  function write(update: (data: FinanceData) => FinanceData): FinanceData {
    const next = update(read());
    try {
      storage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      throw new Error(
        "Could not save locally. Browser storage may be full or disabled. Your changes were not saved.",
      );
    }
    return next;
  }
  return {
    async load() {
      return read();
    },
    async saveTransaction(value) {
      return write((d) => {
        checkErrors(validateTransaction(value, d.categories, d.budgets));
        return {
          ...d,
          transactions: upsert(d.transactions, {
            ...value,
            description: value.description.trim(),
          }),
        };
      });
    },
    async deleteTransaction(id) {
      return write((d) => ({
        ...d,
        transactions: d.transactions.filter((t) => t.id !== id),
      }));
    },
    async saveBudget(value) {
      return write((d) => {
        checkErrors(validateBudget(value, d.budgets, d.categories));
        const normalized = value.items
          ? {
              ...value,
              items: value.items.map((item) => ({
                ...item,
                name: item.name.trim(),
              })),
            }
          : value;
        const budgets = upsert(d.budgets, normalized);
        return {
          ...d,
          budgets,
          transactions: reconcileBudgetAssignments(d.transactions, budgets),
        };
      });
    },
    async deleteBudget(id) {
      return write((d) => {
        const budgets = d.budgets.filter((b) => b.id !== id);
        return {
          ...d,
          budgets,
          transactions: reconcileBudgetAssignments(d.transactions, budgets),
        };
      });
    },
    async saveCategory(value) {
      return write((d) => {
        assert(value.name.trim(), "Enter a category name.");
        assert(
          !d.categories.some(
            (c) =>
              c.id !== value.id &&
              c.name.toLowerCase() === value.name.trim().toLowerCase(),
          ),
          "A category with this name already exists.",
        );
        const old = d.categories.find((c) => c.id === value.id);
        assert(
          !old ||
            old.type === value.type ||
            (!d.transactions.some((t) => t.categoryId === value.id) &&
              !d.budgets.some((b) => b.categoryId === value.id)),
          "The type of a used category cannot be changed.",
        );
        return {
          ...d,
          categories: upsert(d.categories, {
            ...value,
            name: value.name.trim(),
          }),
        };
      });
    },
    async deleteCategory(id) {
      return write((d) => {
        assert(
          !d.transactions.some((t) => t.categoryId === id) &&
            !d.budgets.some((b) => b.categoryId === id),
          "This category is used by transactions or budgets. Reassign or remove them first.",
        );
        return { ...d, categories: d.categories.filter((c) => c.id !== id) };
      });
    },
    async saveSettings(settings) {
      return write((d) => ({ ...d, settings }));
    },
  };
}
