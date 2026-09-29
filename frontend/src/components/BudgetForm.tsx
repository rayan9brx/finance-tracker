import { useState, type FormEvent } from "react";
import { useFinance } from "../context/FinanceContext";
import type { Budget } from "../types/finance";
import {
  calculateBudgetLimit,
  formatCurrency,
  parseMoney,
  validateBudget,
} from "../utils/finance";
import { Field, Modal } from "./ui";
interface ItemDraft {
  id: string;
  name: string;
  amount: string;
}
const newItem = (): ItemDraft => ({
  id: crypto.randomUUID(),
  name: "",
  amount: "",
});
export function BudgetForm({
  budget,
  month,
  onClose,
}: {
  budget?: Budget;
  month: string;
  onClose: () => void;
}) {
  const { data, mutate } = useFinance();
  const [id] = useState(() => budget?.id ?? crypto.randomUUID());
  const [categoryId, setCategoryId] = useState(budget?.categoryId ?? "");
  const [budgetMonth, setBudgetMonth] = useState(budget?.month ?? month);
  const [detailed, setDetailed] = useState(!!budget?.items);
  const [amount, setAmount] = useState(
    budget ? String(calculateBudgetLimit(budget) / 100) : "",
  );
  const [items, setItems] = useState<ItemDraft[]>(
    () =>
      budget?.items?.map((item) => ({
        id: item.id,
        name: item.name,
        amount: String(item.limit / 100),
      })) ?? [newItem()],
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  if (!data) return null;
  const draft: Budget = {
    id,
    categoryId,
    month: budgetMonth,
    ...(detailed
      ? {
          items: items.map((item) => ({
            id: item.id,
            name: item.name,
            limit: parseMoney(item.amount) ?? 0,
          })),
        }
      : { limit: parseMoney(amount) ?? 0 }),
  };
  const props = (name: string) => ({
    id: name,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  function updateItem(index: number, changes: Partial<ItemDraft>) {
    setItems(
      items.map((item, i) => (i === index ? { ...item, ...changes } : item)),
    );
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!data || busy) return;
    const nextErrors = validateBudget(draft, data.budgets, data.categories);
    setErrors(nextErrors);
    setFailure("");
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        document.getElementById(Object.keys(nextErrors)[0])?.focus(),
      );
      return;
    }
    setBusy(true);
    try {
      await mutate(
        (s) => s.saveBudget(draft),
        `Budget ${budget ? "updated" : "created"}.`,
      );
      onClose();
    } catch (e) {
      setFailure(e instanceof Error ? e.message : "Could not save budget.");
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={budget ? "Edit budget" : "Add budget"}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form noValidate onSubmit={submit}>
        <p className="muted">
          Set one monthly limit, or plan the details with budget items.
        </p>
        <Field label="Category" name="categoryId" error={errors.categoryId}>
          <select
            {...props("categoryId")}
            value={categoryId}
            onChange={(e) => setCategoryId(e.target.value)}
          >
            <option value="">Select a category</option>
            {data.categories
              .filter((c) => c.type === "expense")
              .map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
          </select>
        </Field>
        <Field label="Budget month" name="month" error={errors.month}>
          <input
            {...props("month")}
            type="month"
            value={budgetMonth}
            onChange={(e) => setBudgetMonth(e.target.value)}
          />
        </Field>
        <Field label="Budget structure" name="budget-structure">
          <select
            id="budget-structure"
            value={detailed ? "breakdown" : "simple"}
            onChange={(e) => {
              const next = e.target.value === "breakdown";
              if (!next)
                setAmount(String(calculateBudgetLimit(draft) / 100 || ""));
              setDetailed(next);
              setErrors({});
            }}
          >
            <option value="simple">Simple budget</option>
            <option value="breakdown">Budget with breakdown</option>
          </select>
        </Field>
        {detailed ? (
          <div className="budget-items-editor">
            <div className="items-editor-heading">
              <h3>Budget items</h3>
              <small>Limits in {data.settings.currency}</small>
            </div>
            {items.map((item, index) => (
              <fieldset className="item-editor" key={item.id}>
                <legend>Item {index + 1}</legend>
                <div className="item-editor-fields">
                  <Field
                    label="Item name"
                    name={`item-name-${index}`}
                    error={errors[`item-name-${index}`]}
                  >
                    <input
                      {...props(`item-name-${index}`)}
                      value={item.name}
                      maxLength={80}
                      placeholder="e.g. Rent"
                      onChange={(e) =>
                        updateItem(index, { name: e.target.value })
                      }
                    />
                  </Field>
                  <Field
                    label="Item limit"
                    name={`item-limit-${index}`}
                    error={errors[`item-limit-${index}`]}
                  >
                    <input
                      {...props(`item-limit-${index}`)}
                      inputMode="decimal"
                      placeholder="0.00"
                      value={item.amount}
                      onChange={(e) =>
                        updateItem(index, { amount: e.target.value })
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  className="text-button negative remove-item"
                  aria-label={`Remove item ${index + 1}${item.name ? `: ${item.name}` : ""}`}
                  onClick={() => setItems(items.filter((_, i) => i !== index))}
                >
                  Remove item
                </button>
              </fieldset>
            ))}
            {errors.items && (
              <p className="field-error" id="items-error" role="alert">
                {errors.items}
              </p>
            )}
            <button
              type="button"
              id="items"
              className="button secondary"
              onClick={() => setItems([...items, newItem()])}
            >
              + Add item
            </button>
            <div className="derived-budget-total" role="status">
              <span>Total monthly budget</span>
              <strong>
                {formatCurrency(
                  calculateBudgetLimit(draft),
                  data.settings.currency,
                )}
              </strong>
            </div>
            <p className="muted">
              Calculated from item limits. Spending without an item still counts
              toward this total.
            </p>
            {errors.limit && (
              <p role="alert" className="field-error">
                {errors.limit}
              </p>
            )}
          </div>
        ) : (
          <Field
            label={`Amount (${data.settings.currency})`}
            name="limit"
            error={errors.limit}
          >
            <input
              {...props("limit")}
              inputMode="decimal"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0.00"
            />
          </Field>
        )}
        {budget?.items && (
          <p className="budget-edit-notice">
            Removing an item, switching to a simple budget, or changing the
            category or month clears affected item assignments. Transactions and
            their amounts are kept.
          </p>
        )}
        {failure && (
          <p className="error" role="alert">
            {failure}
          </p>
        )}
        <div className="dialog-actions">
          <button
            type="button"
            className="button secondary"
            disabled={busy}
            onClick={onClose}
          >
            Cancel
          </button>
          <button className="button" disabled={busy}>
            {busy ? "Saving…" : budget ? "Save changes" : "Add budget"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
