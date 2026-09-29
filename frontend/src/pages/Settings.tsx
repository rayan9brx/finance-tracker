import { useState } from "react";
import { useFinance } from "../context/FinanceContext";
import { Card, Field, Icon } from "../components/ui";
import type { Currency } from "../types/finance";
export function Settings() {
  const { data, mutate } = useFinance();
  const [error, setError] = useState(""),
    [busy, setBusy] = useState(false);
  if (!data) return null;
  return (
    <div className="settings-layout">
      <Card title="Preferences">
        <Field label="Display currency" name="currency">
          <select
            id="currency"
            value={data.settings.currency}
            disabled={busy}
            onChange={async (e) => {
              const currency = e.target.value as Currency;
              setBusy(true);
              setError("");
              try {
                await mutate(
                  (s) => s.saveSettings({ currency }),
                  "Currency preference saved.",
                );
              } catch (err) {
                setError(
                  err instanceof Error
                    ? err.message
                    : "Could not save preference.",
                );
              } finally {
                setBusy(false);
              }
            }}
          >
            <option value="EUR">EUR · Euro</option>
            <option value="USD">USD · US Dollar</option>
            <option value="GBP">GBP · British Pound</option>
          </select>
        </Field>
        <p className="muted">
          Applies one currency to all records. Changing this preference changes
          the display symbol, without converting amounts or applying exchange
          rates.
        </p>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
      </Card>
      <Card title="About this workspace">
        <div className="workspace-note">
          <Icon name="wallet" size={28} />
          <div>
            <h3>Local demo workspace</h3>
            <p>
              Your changes are saved in this browser. The starting records are
              fictional sample data. There is no bank connection, account, or
              cloud synchronization.
            </p>
            <p>
              Clearing browser storage will remove your saved changes. Use this
              workspace for demo data only.
            </p>
          </div>
        </div>
      </Card>
    </div>
  );
}
