import { useFinance } from "../context/FinanceContext";
import { Card, EmptyState, Icon } from "../components/ui";
import type { Category } from "../types/finance";
export function Categories({
  onEdit,
  onDelete,
}: {
  onEdit: (c: Category) => void;
  onDelete: (c: Category) => void;
}) {
  const { data } = useFinance();
  if (!data) return null;
  return (
    <>
      {(["expense", "income"] as const).map((type) => (
        <section className="category-section" key={type}>
          <h2>
            {type === "expense" ? "Expense" : "Income"} categories{" "}
            <span className="count-badge">
              {data.categories.filter((c) => c.type === type).length}
            </span>
          </h2>
          <div className="category-grid">
            {data.categories
              .filter((c) => c.type === type)
              .map((c) => {
                const count = data.transactions.filter(
                    (t) => t.categoryId === c.id,
                  ).length,
                  used =
                    count > 0 ||
                    data.budgets.some((b) => b.categoryId === c.id);
                return (
                  <Card key={c.id}>
                    <div className="category-top">
                      <span
                        className="category-icon"
                        style={{ color: c.color }}
                      >
                        <Icon name={c.icon} />
                      </span>
                      <div>
                        <h3>{c.name}</h3>
                        <small>{count} transactions</small>
                      </div>
                    </div>
                    <div className="card-actions">
                      <button className="text-button" onClick={() => onEdit(c)}>
                        Edit category
                      </button>
                      <button
                        className="text-button negative"
                        disabled={used}
                        title={
                          used
                            ? "Reassign transactions and remove budgets before deleting this category."
                            : undefined
                        }
                        onClick={() => onDelete(c)}
                      >
                        Delete
                      </button>
                    </div>
                    {used && (
                      <small className="category-hint">
                        In use · protected from deletion
                      </small>
                    )}
                  </Card>
                );
              })}
          </div>
          {!data.categories.some((c) => c.type === type) && (
            <EmptyState title={`No ${type} categories yet`} />
          )}
        </section>
      ))}
    </>
  );
}
