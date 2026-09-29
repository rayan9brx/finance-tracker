import { useState, type FormEvent } from "react";
import { useFinance } from "../context/FinanceContext";
import type {
  Budget,
  Category,
  Transaction,
  TransactionType,
} from "../types/finance";
import {
  availableBudgetItems,
  parseMoney,
  today,
  validateTransaction,
} from "../utils/finance";
import { categoryColors, categoryIcons } from "../utils/categoryOptions";
import { BudgetForm } from "./BudgetForm";
import { Field, Modal } from "./ui";

export type Editor =
  | { kind: "transaction"; value?: Transaction }
  | { kind: "budget"; value?: Budget }
  | { kind: "category"; value?: Category };
export function EntityForm({
  editor,
  month,
  onClose,
}: {
  editor: Editor;
  month: string;
  onClose: () => void;
}) {
  return editor.kind === "budget" ? (
    <BudgetForm budget={editor.value} month={month} onClose={onClose} />
  ) : (
    <RecordForm editor={editor} onClose={onClose} />
  );
}
function RecordForm({
  editor,
  onClose,
}: {
  editor: Exclude<Editor, { kind: "budget" }>;
  onClose: () => void;
}) {
  const { data, mutate } = useFinance();
  const transaction = editor.kind === "transaction" ? editor.value : undefined;
  const category = editor.kind === "category" ? editor.value : undefined;
  const [type, setType] = useState<TransactionType>(
    transaction?.type ?? category?.type ?? "expense",
  );
  const [amount, setAmount] = useState(
    transaction ? String(transaction.amount / 100) : "",
  );
  const [description, setDescription] = useState(
    transaction?.description ?? category?.name ?? "",
  );
  const [categoryId, setCategoryId] = useState(transaction?.categoryId ?? "");
  const [date, setDate] = useState(transaction?.date ?? today());
  const [note, setNote] = useState(transaction?.note ?? "");
  const [budgetItemId, setBudgetItemId] = useState(
    transaction?.budgetItemId ?? "",
  );
  const [color, setColor] = useState(category?.color ?? categoryColors[0]);
  const [icon, setIcon] = useState(category?.icon ?? categoryIcons[0]);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [failure, setFailure] = useState(""),
    [busy, setBusy] = useState(false);
  if (!data) return null;
  const referenced =
    category &&
    (data.transactions.some((t) => t.categoryId === category.id) ||
      data.budgets.some((b) => b.categoryId === category.id));
  const items = availableBudgetItems({ type, categoryId, date }, data.budgets);
  const props = (name: string) => ({
    id: name,
    "aria-invalid": !!errors[name],
    "aria-describedby": errors[name] ? `${name}-error` : undefined,
  });
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!data || busy) return;
    setFailure("");
    const id = editor.value?.id ?? crypto.randomUUID();
    const action = editor.value ? "updated" : "created";
    const value: Transaction = {
      id,
      type,
      amount: parseMoney(amount) ?? 0,
      description,
      categoryId,
      date,
      note,
      createdAt: transaction?.createdAt ?? new Date().toISOString(),
      ...(budgetItemId ? { budgetItemId } : {}),
    };
    const nextErrors =
      editor.kind === "transaction"
        ? validateTransaction(value, data.categories, data.budgets)
        : !description.trim()
          ? { description: "Enter a category name." }
          : data.categories.some(
                (c) =>
                  c.id !== id &&
                  c.name.toLowerCase() === description.trim().toLowerCase(),
              )
            ? { description: "A category with this name already exists." }
            : {};
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) {
      requestAnimationFrame(() =>
        document.getElementById(Object.keys(nextErrors)[0])?.focus(),
      );
      return;
    }
    setBusy(true);
    try {
      if (editor.kind === "transaction")
        await mutate((s) => s.saveTransaction(value), `Transaction ${action}.`);
      else
        await mutate(
          (s) => s.saveCategory({ id, name: description, type, color, icon }),
          `Category ${action}.`,
        );
      onClose();
    } catch (e) {
      setFailure(
        e instanceof Error ? e.message : "Could not save. Please try again.",
      );
    } finally {
      setBusy(false);
    }
  }
  return (
    <Modal
      title={`${editor.value ? "Edit" : "Add"} ${editor.kind}`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <form noValidate onSubmit={submit}>
        <p className="muted">
          {editor.kind === "transaction"
            ? "Keep your financial picture up to date."
            : "Organize your money in a way that makes sense to you."}
        </p>
        <Field label="Type" name="type">
          <select
            id="type"
            value={type}
            disabled={!!referenced}
            onChange={(e) => {
              setType(e.target.value as TransactionType);
              setCategoryId("");
              setBudgetItemId("");
            }}
          >
            <option value="expense">Expense</option>
            <option value="income">Income</option>
          </select>
          {referenced && (
            <small>Type is fixed because this category is in use.</small>
          )}
        </Field>
        <Field
          label={editor.kind === "category" ? "Category name" : "Description"}
          name="description"
          error={errors.description}
        >
          <input
            {...props("description")}
            maxLength={100}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              editor.kind === "category"
                ? "e.g. Travel"
                : "e.g. Weekly groceries"
            }
          />
        </Field>
        {editor.kind === "transaction" && (
          <>
            <Field
              label={`Amount (${data.settings.currency})`}
              name="amount"
              error={errors.amount}
            >
              <input
                {...props("amount")}
                inputMode="decimal"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
              />
            </Field>
            <Field label="Category" name="categoryId" error={errors.categoryId}>
              <select
                {...props("categoryId")}
                value={categoryId}
                onChange={(e) => {
                  setCategoryId(e.target.value);
                  setBudgetItemId("");
                }}
              >
                <option value="">Select a category</option>
                {data.categories
                  .filter((c) => c.type === type)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
              </select>
            </Field>
            <Field label="Date" name="date" error={errors.date}>
              <input
                {...props("date")}
                type="date"
                value={date}
                onChange={(e) => {
                  if (e.target.value.slice(0, 7) !== date.slice(0, 7))
                    setBudgetItemId("");
                  setDate(e.target.value);
                }}
              />
            </Field>
            {!!items.length && (
              <Field
                label="Budget item (optional)"
                name="budgetItemId"
                error={errors.budgetItemId}
              >
                <select
                  {...props("budgetItemId")}
                  value={budgetItemId}
                  onChange={(e) => setBudgetItemId(e.target.value)}
                >
                  <option value="">Unassigned</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
                </select>
                <small>
                  Items for this category and transaction month. Unassigned
                  expenses still count toward the parent budget.
                </small>
              </Field>
            )}
            {!!transaction?.budgetItemId && !budgetItemId && (
              <p className="muted">
                This transaction will be saved without an item assignment.
              </p>
            )}
            <Field label="Note (optional)" name="note">
              <textarea
                id="note"
                maxLength={500}
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Anything you’d like to remember"
                rows={2}
              />
            </Field>
          </>
        )}
        {editor.kind === "category" && (
          <div className="form-grid">
            <Field label="Icon" name="icon">
              <select
                id="icon"
                value={icon}
                onChange={(e) => setIcon(e.target.value)}
              >
                {categoryIcons.map((i) => (
                  <option key={i}>{i}</option>
                ))}
              </select>
            </Field>
            <Field label="Color" name="color">
              <select
                id="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
              >
                {categoryColors.map((c, i) => (
                  <option value={c} key={c}>
                    {
                      [
                        "Teal",
                        "Sage",
                        "Mint",
                        "Gold",
                        "Lavender",
                        "Blue",
                        "Terracotta",
                        "Olive",
                      ][i]
                    }
                  </option>
                ))}
              </select>
            </Field>
          </div>
        )}
        {failure && (
          <p role="alert" className="error">
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
            {busy
              ? "Saving…"
              : editor.value
                ? "Save changes"
                : `Add ${editor.kind}`}
          </button>
        </div>
      </form>
    </Modal>
  );
}
export function DeleteDialog({
  title,
  onDelete,
  onClose,
}: {
  title: string;
  onDelete: () => Promise<void>;
  onClose: () => void;
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  return (
    <Modal
      title={`Delete ${title}?`}
      onClose={() => {
        if (!busy) onClose();
      }}
    >
      <p>This will permanently remove this {title} from your local records.</p>
      {title === "budget" && (
        <p>
          Transactions are kept. Any assignments to this budget’s items will be
          cleared.
        </p>
      )}
      {error && (
        <p role="alert" className="error">
          {error}
        </p>
      )}
      <div className="dialog-actions">
        <button
          className="button secondary"
          disabled={busy}
          onClick={onClose}
          autoFocus
        >
          Keep {title}
        </button>
        <button
          className="button danger"
          disabled={busy}
          onClick={async () => {
            setBusy(true);
            try {
              await onDelete();
              onClose();
            } catch (e) {
              setError(e instanceof Error ? e.message : "Could not delete.");
            } finally {
              setBusy(false);
            }
          }}
        >
          {busy ? "Deleting…" : "Delete"}
        </button>
      </div>
    </Modal>
  );
}
