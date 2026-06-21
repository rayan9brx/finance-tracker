import { useEffect, useState } from "react";

type Expense = {
  id: number;
  title: string;
  amount: number;
  category: string;
};

// Formats numbers as euro amounts for the expense cards.
function formatEuro(amount: number) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "EUR",
  }).format(amount);
}

function App() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const totalExpenses = expenses.reduce((total, expense) => {
    return total + expense.amount;
  }, 0);

  useEffect(() => {
    // Loads expenses from the Spring Boot backend when the page opens.
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
        setError("Could not reach the backend. Please make sure it is running.");
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  return (
    <main className="app-container">
      <section className="content-card">
        <header className="page-header">
          <h1>Personal Finance Tracker</h1>
          <p>Track your expenses and manage your budget</p>
        </header>

        <section className="summary-card">
          <div>
            <p>Total Expenses</p>
            <strong>{formatEuro(totalExpenses)}</strong>
          </div>
          <div>
            <p>Number of Expenses</p>
            <strong>{expenses.length}</strong>
          </div>
        </section>

        {loading && <p>Loading expenses...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && !error && expenses.length === 0 && (
          <p>No expenses found.</p>
        )}

        {!loading && !error && expenses.length > 0 && (
          <ul className="expense-list">
            {expenses.map((expense) => (
              <li className="expense-card" key={expense.id}>
                <p className="expense-category">{expense.category}</p>
                <h2>{expense.title}</h2>
                <strong>{formatEuro(expense.amount)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

export default App;
