import { test, expect } from "@playwright/test";

test("transaction lifecycle updates dashboard and persists; form validation and filters work", async ({
  page,
}) => {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (msg) => {
    if (msg.type() === "error") errors.push(msg.text());
  });
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: "Dashboard", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".stat-card")).toHaveCount(4);
  const before = await page
    .locator(".stat-card")
    .nth(2)
    .locator(":scope > strong")
    .innerText();
  await page.screenshot({
    path: "test-results/dashboard-desktop.png",
    fullPage: true,
  });
  await page
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add transaction" })
    .click();
  await expect(
    page.getByText("Enter a description.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Description", { exact: true }).fill("QA groceries");
  await page.getByLabel("Amount (EUR)").fill("12.34");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Groceries" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add transaction" })
    .click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.locator(".stat-card").nth(2).locator(":scope > strong"),
  ).not.toHaveText(before);
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await page.getByLabel("Search transactions").fill("QA groceries");
  await expect(page.locator(".transaction-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Edit QA groceries", exact: true })
    .click();
  await page.getByLabel("Amount (EUR)").fill("23.45");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.locator(".transaction-row .amount")).toHaveText("−€23.45");
  await page.reload();
  await page.getByLabel("Search transactions").fill("QA groceries");
  await expect(page.locator(".transaction-row .amount")).toHaveText("−€23.45");
  await page
    .getByRole("button", { name: "Delete QA groceries", exact: true })
    .click();
  await page.getByRole("button", { name: "Keep transaction" }).click();
  await expect(page.locator(".transaction-row")).toHaveCount(1);
  await page
    .getByRole("button", { name: "Delete QA groceries", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByText("No transactions found")).toBeVisible();
  await page.getByRole("link", { name: "Dashboard", exact: true }).click();
  await expect(
    page.locator(".stat-card").nth(2).locator(":scope > strong"),
  ).toHaveText(before);
  expect(errors).toEqual([]);
});

test("budgets, categories and settings can be managed", async ({ page }) => {
  await page.goto("/#/budgets");
  await page.getByRole("button", { name: "Add budget", exact: true }).click();
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Groceries" });
  await page.getByLabel("Amount (EUR)").fill("100");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add budget" })
    .click();
  await expect(
    page.getByText("This category already has a budget for this month."),
  ).toBeVisible();
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Health" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add budget" })
    .click();
  const card = page.locator(".budget-grid .card").filter({ hasText: "Health" });
  await expect(card).toContainText("€100.00");
  await card.getByRole("button", { name: "Edit budget" }).click();
  await page.getByLabel("Amount (EUR)").fill("200");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(card).toContainText("€200.00");
  await card.getByRole("button", { name: "Delete", exact: true }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(card).toHaveCount(0);
  await page.getByRole("link", { name: "Categories", exact: true }).click();
  await expect(
    page
      .locator(".category-grid .card")
      .filter({ hasText: "Groceries" })
      .getByRole("button", { name: "Delete" }),
  ).toBeDisabled();
  await page.getByRole("button", { name: "Add category", exact: true }).click();
  await page.getByLabel("Category name").fill("Travel");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add category" })
    .click();
  const travel = page
    .locator(".category-grid .card")
    .filter({ hasText: "Travel" });
  await travel.getByRole("button", { name: "Edit category" }).click();
  await page.getByLabel("Category name").fill("Holidays");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page
    .locator(".category-grid .card")
    .filter({ hasText: "Holidays" })
    .getByRole("button", { name: "Delete" })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Delete", exact: true })
    .click();
  await expect(page.getByRole("heading", { name: "Holidays" })).toHaveCount(0);
  await page.getByRole("link", { name: "Settings", exact: true }).click();
  await page.getByLabel("Display currency").selectOption("GBP");
  await expect(page.getByRole("status")).toHaveText(
    "✓Currency preference saved.",
  );
  await page.reload();
  await expect(page.getByLabel("Display currency")).toHaveValue("GBP");
});

test("mobile routes fit 320px, navigation and modal keyboard behavior work", async ({
  page,
}) => {
  await page.setViewportSize({ width: 320, height: 780 });
  await page.goto("/");
  await expect(page.locator(".stat-card")).toHaveCount(4);
  await page.screenshot({
    path: "test-results/dashboard-mobile.png",
    fullPage: true,
  });
  for (const title of [
    "Transactions",
    "Budgets",
    "Analytics",
    "Categories",
    "Settings",
    "Dashboard",
  ]) {
    await page.getByRole("button", { name: "Toggle navigation" }).click();
    await page.getByRole("link", { name: title, exact: true }).click();
    await expect(
      page.getByRole("heading", { name: title, exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
  }
  await page
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await expect(page.getByRole("dialog")).toBeVisible();
  for (let i = 0; i < 13; i++) {
    await page.keyboard.press("Tab");
    expect(
      await page.evaluate(() => !!document.activeElement?.closest("dialog")),
    ).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Add transaction", exact: true }),
  ).toBeFocused();
});

test("filters, analytics periods, empty and error states are usable", async ({
  page,
}) => {
  await page.goto("/#/transactions");
  await page.getByLabel("Type", { exact: true }).selectOption("income");
  await expect(page.locator(".transaction-row")).toHaveCount(20);
  await expect(page.locator(".transaction-row .amount").first()).toContainText(
    "+",
  );
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Groceries" });
  await expect(page.getByText("No transactions found")).toBeVisible();
  await page.getByRole("button", { name: "Clear filters" }).click();
  await page.getByLabel("From", { exact: true }).fill("2099-01-01");
  await expect(page.getByText("No transactions found")).toBeVisible();
  await page.getByRole("link", { name: "Analytics", exact: true }).click();
  await page.getByLabel("Period", { exact: true }).selectOption("12");
  await page.locator(".chart-data summary").first().click();
  await expect(
    page.locator(".chart-data").first().locator("tbody tr"),
  ).toHaveCount(12);
  await page.getByLabel("Selected month").fill("2099-01");
  await expect(page.getByText("No data available for this period")).toHaveCount(
    2,
  );
  await page.getByRole("link", { name: "Budgets", exact: true }).click();
  await expect(
    page.getByText("No budget created for this month"),
  ).toBeVisible();
  await page.evaluate(() =>
    localStorage.setItem("finance-tracker.local.v1", "corrupted"),
  );
  await page.reload();
  await expect(page.getByRole("alert")).toContainText(
    "Your stored data has been preserved",
  );
  await page.getByRole("button", { name: "Try again" }).click();
  await expect(page.getByRole("alert")).toBeVisible();
});

test("tablet and laptop layouts have no horizontal overflow", async ({
  page,
}) => {
  for (const width of [768, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 });
    for (const route of [
      "dashboard",
      "transactions",
      "budgets",
      "analytics",
      "categories",
      "settings",
    ]) {
      await page.goto("/#/" + route);
      await expect(page.locator("main h1")).toBeVisible();
      await expect(
        page.getByText("Loading your financial picture…"),
      ).toHaveCount(0);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      ).toBe(true);
    }
  }
});
