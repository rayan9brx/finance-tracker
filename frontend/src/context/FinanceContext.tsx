import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { FinanceData } from "../types/finance";
import {
  createLocalFinanceService,
  type FinanceService,
} from "../services/financeService";

interface FinanceContextValue {
  data: FinanceData | null;
  loading: boolean;
  error: string;
  notice: string;
  reload: () => Promise<void>;
  mutate: (
    operation: (service: FinanceService) => Promise<FinanceData>,
    message: string,
  ) => Promise<void>;
}
const FinanceContext = createContext<FinanceContextValue | null>(null);
export function FinanceProvider({
  children,
  service,
}: {
  children: ReactNode;
  service?: FinanceService;
}) {
  const [adapter] = useState(
    () =>
      service ??
      createLocalFinanceService({
        getItem: (key) => window.localStorage.getItem(key),
        setItem: (key, value) => window.localStorage.setItem(key, value),
      }),
  );
  const [data, setData] = useState<FinanceData | null>(null);
  const [loading, setLoading] = useState(true),
    [error, setError] = useState(""),
    [notice, setNotice] = useState("");
  const reload = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adapter.load());
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your data.");
    } finally {
      setLoading(false);
    }
  }, [adapter]);
  useEffect(() => {
    void reload();
  }, [reload]);
  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 4500);
    return () => clearTimeout(timer);
  }, [notice]);
  useEffect(() => {
    const sync = () => {
      void reload();
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [reload]);
  async function mutate(
    operation: (s: FinanceService) => Promise<FinanceData>,
    message: string,
  ) {
    setData(await operation(adapter));
    setNotice(message);
  }
  return (
    <FinanceContext.Provider
      value={{ data, loading, error, notice, reload, mutate }}
    >
      {children}
    </FinanceContext.Provider>
  );
}
export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) throw new Error("FinanceProvider is required");
  return context;
}
