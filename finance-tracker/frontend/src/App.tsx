import { useEffect, useMemo, useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
};

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("http://localhost:8080/api/expenses")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to load expenses");
        }
        return response.json();
      })
      .then((data: Expense[]) => {
        setExpenses(data);
        setError("");
      })
      .catch(() => {
        setError("Could not connect to backend");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  const totalExpenses = useMemo(() => {
    return expenses.reduce((sum, expense) => sum + expense.amount, 0);
  }, [expenses]);

  return (
    <main className="app-container">
      <section className="hero-card">
        <p className="eyebrow">Full-stack finance app</p>
        <h1>Personal Finance Tracker</h1>
        <p className="subtitle">Track your expenses and manage your budget.</p>
      </section>

      <section className="summary-grid">
        <div className="summary-card">
          <span>Total expenses</span>
          <strong>{totalExpenses.toFixed(2)} €</strong>
        </div>
        <div className="summary-card">
          <span>Number of expenses</span>
          <strong>{expenses.length}</strong>
        </div>
      </section>

      <section className="content-card">
        <h2>Expenses</h2>

        {loading && <p>Loading expenses...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && (
          <div className="expense-list">
            {expenses.map((expense) => (
              <article className="expense-card" key={expense.id}>
                <div>
                  <h3>{expense.title}</h3>
                  <p>{expense.category}</p>
                </div>
                <strong>{expense.amount.toFixed(2)} €</strong>
              </article>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

export default App;
