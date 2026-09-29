import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { FinanceProvider, useFinance } from "./context/FinanceContext";
import { Transactions } from "./pages/Transactions";
import { Budgets } from "./pages/Budgets";
import { Categories } from "./pages/Categories";
import { Settings } from "./pages/Settings";
import { DeleteDialog, EntityForm, type Editor } from "./components/EntityForm";
import { Icon } from "./components/ui";
import { today } from "./utils/finance";
import type { FinanceService } from "./services/financeService";
const Dashboard = lazy(() =>
  import("./pages/Dashboard").then((module) => ({ default: module.Dashboard })),
);
const Analytics = lazy(() =>
  import("./pages/Analytics").then((module) => ({ default: module.Analytics })),
);
const pages = [
  {
    id: "dashboard",
    title: "Dashboard",
    icon: "grid",
    description: "A clear view of your money. A little more peace of mind.",
  },
  {
    id: "transactions",
    title: "Transactions",
    icon: "transactions",
    description: "Every little detail, all in one place.",
  },
  {
    id: "budgets",
    title: "Budgets",
    icon: "wallet",
    description: "Make room for what matters to you.",
  },
  {
    id: "analytics",
    title: "Analytics",
    icon: "chart",
    description: "Understand your patterns. Make more informed choices.",
  },
  {
    id: "categories",
    title: "Categories",
    icon: "tag",
    description: "A place for every kind of income and expense.",
  },
  {
    id: "settings",
    title: "Settings",
    icon: "settings",
    description: "Make this workspace feel like yours.",
  },
];
const route = () => window.location.hash.replace("#/", "") || "dashboard";
function Workspace() {
  const { data, loading, error, notice, reload, mutate } = useFinance();
  const [page, setPage] = useState(route),
    [month, setMonth] = useState(today().slice(0, 7));
  const [editor, setEditor] = useState<Editor | null>(null);
  const [deletion, setDeletion] = useState<{
    title: string;
    operation: (s: FinanceService) => ReturnType<FinanceService["load"]>;
  } | null>(null);
  const [menu, setMenu] = useState(false);
  const heading = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    const change = () => {
      setPage(route());
      setMenu(false);
      requestAnimationFrame(() => heading.current?.focus());
    };
    window.addEventListener("hashchange", change);
    return () => window.removeEventListener("hashchange", change);
  }, []);
  const current = pages.find((p) => p.id === page);
  useEffect(() => {
    document.title = `${current?.title ?? "Page not found"} · Finance Tracker`;
  }, [current]);
  const addKind =
    page === "budgets"
      ? "budget"
      : page === "categories"
        ? "category"
        : "transaction";
  return (
    <div className="app-shell">
      <a
        className="skip-link"
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
      >
        Skip to content
      </a>
      <aside className={`sidebar ${menu ? "is-open" : ""}`}>
        <a className="brand" href="#/dashboard">
          <span className="brand-mark">
            <Icon name="chart" size={24} />
          </span>
          <span>
            finance<span className="brand-light">tracker</span>
            <small>MAKE ROOM FOR MORE</small>
          </span>
        </a>
        <div className="nav-label">WORKSPACE</div>
        <nav aria-label="Main navigation" id="main-navigation">
          {pages.map((p) => (
            <a
              key={p.id}
              href={`#/${p.id}`}
              onClick={() => setMenu(false)}
              className={page === p.id ? "active" : ""}
              aria-current={page === p.id ? "page" : undefined}
            >
              <Icon name={p.icon} />
              {p.title}
              {page === p.id && <span className="nav-active-dot" />}
            </a>
          ))}
        </nav>
        <div className="sidebar-note">
          <span className="status-dot" /> LOCAL WORKSPACE
          <p>Your money, in perspective.</p>
          <small>Built for a more intentional everyday.</small>
        </div>
        <div className="sidebar-profile">
          <span className="avatar">FT</span>
          <div>
            <strong>Personal workspace</strong>
            <small>Sample data · on this device</small>
          </div>
        </div>
      </aside>
      <div className="main-area">
        <header className="topbar">
          <button
            className="mobile-toggle icon-button"
            aria-label="Toggle navigation"
            aria-expanded={menu}
            aria-controls="main-navigation"
            onClick={() => setMenu(!menu)}
          >
            ☰
          </button>
          <div className="breadcrumb">
            Workspace <span>/</span>{" "}
            <strong>{current?.title ?? "Not found"}</strong>
          </div>
          <span className="local-badge">
            <span className="status-dot" />
            Local demo
          </span>
        </header>
        <main id="main" tabIndex={-1}>
          <div className="page-header">
            <div>
              <p className="eyebrow">YOUR FINANCES, SIMPLIFIED</p>
              <h1 ref={heading} tabIndex={-1}>
                {current?.title ?? "Page not found"}
              </h1>
              <p>
                {current?.description ??
                  "This page does not exist. Choose a section from the navigation."}
              </p>
            </div>
            <div className="page-actions">
              {["dashboard", "budgets", "analytics"].includes(page) && (
                <label className="month-picker">
                  <span className="sr-only">Selected month</span>
                  <input
                    aria-label="Selected month"
                    type="month"
                    value={month}
                    onChange={(e) => {
                      if (/^\d{4}-(0[1-9]|1[0-2])$/.test(e.target.value))
                        setMonth(e.target.value);
                    }}
                  />
                </label>
              )}
              {current && page !== "settings" && page !== "analytics" && (
                <button
                  className="button"
                  disabled={!data || loading || !!error}
                  onClick={() => setEditor({ kind: addKind })}
                >
                  <Icon name="plus" size={17} />
                  Add {addKind}
                </button>
              )}
            </div>
          </div>
          {loading ? (
            <div role="status" className="state-card">
              Loading your financial picture…
            </div>
          ) : error ? (
            <div role="alert" className="state-card">
              <h2>Unable to open your workspace</h2>
              <p>{error}</p>
              <button className="button" onClick={() => void reload()}>
                Try again
              </button>
            </div>
          ) : (
            data && (
              <Suspense
                fallback={
                  <div role="status" className="state-card">
                    Loading your overview…
                  </div>
                }
              >
                {page === "dashboard" && (
                  <Dashboard
                    month={month}
                    onEdit={(value) =>
                      setEditor({ kind: "transaction", value })
                    }
                  />
                )}
                {page === "transactions" && (
                  <Transactions
                    onEdit={(value) =>
                      setEditor({ kind: "transaction", value })
                    }
                    onDelete={(t) =>
                      setDeletion({
                        title: "transaction",
                        operation: (s) => s.deleteTransaction(t.id),
                      })
                    }
                  />
                )}
                {page === "budgets" && (
                  <Budgets
                    month={month}
                    onEdit={(value) => setEditor({ kind: "budget", value })}
                    onDelete={(b) =>
                      setDeletion({
                        title: "budget",
                        operation: (s) => s.deleteBudget(b.id),
                      })
                    }
                  />
                )}
                {page === "analytics" && <Analytics month={month} />}
                {page === "categories" && (
                  <Categories
                    onEdit={(value) => setEditor({ kind: "category", value })}
                    onDelete={(c) =>
                      setDeletion({
                        title: "category",
                        operation: (s) => s.deleteCategory(c.id),
                      })
                    }
                  />
                )}
                {page === "settings" && <Settings />}
              </Suspense>
            )
          )}
        </main>
      </div>
      {notice && (
        <div className="toast" role="status">
          <span>✓</span>
          {notice}
        </div>
      )}
      {editor && (
        <EntityForm
          editor={editor}
          month={month}
          onClose={() => setEditor(null)}
        />
      )}{" "}
      {deletion && (
        <DeleteDialog
          title={deletion.title}
          onDelete={() =>
            mutate(
              deletion.operation,
              `${deletion.title[0].toUpperCase()}${deletion.title.slice(1)} deleted.`,
            )
          }
          onClose={() => setDeletion(null)}
        />
      )}
    </div>
  );
}
export default function App() {
  return (
    <FinanceProvider>
      <Workspace />
    </FinanceProvider>
  );
}
