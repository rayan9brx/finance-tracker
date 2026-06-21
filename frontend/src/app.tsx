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
  const [formError, setFormError] = useState("");
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
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

  function handleAddExpense(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const newAmount = Number(amount);

    if (title.trim() === "" || category.trim() === "" || newAmount <= 0) {
      setFormError("Please enter a title, category, and amount greater than 0.");
      return;
    }

    const newExpense: Expense = {
      id: Date.now(),
      title: title.trim(),
      amount: newAmount,
      category: category.trim(),
    };

    setExpenses([...expenses, newExpense]);
    setTitle("");
    setAmount("");
    setCategory("");
    setFormError("");
  }

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

        <form className="expense-form" onSubmit={handleAddExpense}>
          <div className="form-field">
            <label htmlFor="expense-title">Title</label>
            <input
              id="expense-title"
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="expense-amount">Amount</label>
            <input
              id="expense-amount"
              type="number"
              min="0"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
            />
          </div>

          <div className="form-field">
            <label htmlFor="expense-category">Category</label>
            <input
              id="expense-category"
              type="text"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
            />
          </div>

          {formError && <p className="error-message">{formError}</p>}

          <button type="submit">Add Expense</button>
        </form>

        {loading && <p>Loading expenses...</p>}
        {error && <p className="error-message">{error}</p>}

        {!loading && expenses.length === 0 && <p>No expenses found.</p>}

        {!loading && expenses.length > 0 && (
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
