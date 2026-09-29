import { test, expect } from "@playwright/test";

test("detailed budget editing, assignments, unassigned totals and safe removal", async ({
  page,
}) => {
  test.setTimeout(60000);
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  await page.goto("/#/budgets");
  const month = await page.getByLabel("Selected month").inputValue();
  await page.getByRole("button", { name: "Add budget", exact: true }).click();
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Health" });
  await page.getByLabel("Budget structure").selectOption("breakdown");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add budget", exact: true })
    .click();
  await expect(
    page.getByText("Enter an item name.", { exact: true }),
  ).toBeVisible();
  await page.getByLabel("Item name", { exact: true }).fill("Gym");
  await page.getByLabel("Item limit", { exact: true }).fill("50");
  await page.getByRole("button", { name: "+ Add item", exact: true }).click();
  const second = page.getByRole("group", { name: "Item 2", exact: true });
  await second.getByLabel("Item name", { exact: true }).fill(" gym ");
  await second.getByLabel("Item limit", { exact: true }).fill("25");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add budget", exact: true })
    .click();
  await expect(
    page.getByText("Item names must be unique within this budget."),
  ).toBeVisible();
  await second.getByLabel("Item name", { exact: true }).fill("Medicine");
  await expect(page.locator(".derived-budget-total")).toContainText("€75.00");
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add budget", exact: true })
    .click();
  const health = page
    .locator(".budget-grid .card")
    .filter({ has: page.locator(".budget-name", { hasText: "Health" }) });
  await expect(
    health.getByRole("button", { name: /View breakdown/ }),
  ).toHaveAttribute("aria-expanded", "false");
  await health.getByRole("button", { name: /View breakdown/ }).click();
  await expect(health.locator(".budget-bottom")).toContainText("€75.00");
  const initialUnassigned = await health
    .locator(".unassigned-spending strong")
    .last()
    .innerText();
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await page
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await page.getByLabel("Description", { exact: true }).fill("Gym day pass");
  await page.getByLabel("Amount (EUR)").fill("20");
  await page
    .getByLabel("Category", { exact: true })
    .selectOption({ label: "Health" });
  await page.getByLabel("Date", { exact: true }).fill(`${month}-01`);
  await page
    .getByLabel("Budget item (optional)")
    .selectOption({ label: "Gym" });
  await page
    .getByRole("dialog")
    .getByRole("button", { name: "Add transaction", exact: true })
    .click();
  await page.getByLabel("Search transactions").fill("Gym day pass");
  await expect(page.locator(".transaction-row")).toContainText("Gym");
  await page.getByRole("link", { name: "Budgets", exact: true }).click();
  await expect(
    health.getByRole("button", { name: /Hide breakdown/ }),
  ).toHaveAttribute("aria-expanded", "true");
  const gym = health.locator(".budget-item-list li").filter({ hasText: "Gym" });
  await expect(gym).toContainText("€20.00");
  await expect(gym).toContainText("40% used");
  await expect(health.locator(".unassigned-spending strong").last()).toHaveText(
    initialUnassigned,
  );
  await health
    .getByRole("button", { name: "Edit budget", exact: true })
    .click();
  await page
    .getByRole("group", { name: "Item 1", exact: true })
    .getByLabel("Item limit")
    .fill("100");
  await expect(page.locator(".derived-budget-total")).toContainText("€125.00");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(gym).toContainText("20% used");
  await page.reload();
  await health.getByRole("button", { name: /View breakdown/ }).click();
  await expect(gym).toContainText("€100.00");
  await health
    .getByRole("button", { name: "Edit budget", exact: true })
    .click();
  await page
    .getByRole("button", { name: "Remove item 1: Gym", exact: true })
    .click();
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(gym).toHaveCount(0);
  const original = Number(initialUnassigned.replace(/[^0-9.]/g, ""));
  await expect(health.locator(".unassigned-spending strong").last()).toHaveText(
    `€${(original + 20).toFixed(2)}`,
  );
  await page.getByRole("link", { name: "Transactions", exact: true }).click();
  await page.getByLabel("Search transactions").fill("Gym day pass");
  await page
    .getByRole("button", { name: "Edit Gym day pass", exact: true })
    .click();
  await expect(page.getByLabel("Budget item (optional)")).toHaveValue("");
  await page
    .getByLabel("Budget item (optional)")
    .selectOption({ label: "Medicine" });
  await page.getByLabel("Date", { exact: true }).fill("2099-01-01");
  await expect(page.getByLabel("Budget item (optional)")).toHaveCount(0);
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("seeded breakdown is compact, keyboard accessible and fits mobile", async ({
  page,
}) => {
  await page.goto("/#/budgets");
  const housing = page
    .locator(".budget-grid .card")
    .filter({ has: page.locator(".budget-name", { hasText: "Housing" }) });
  const toggle = housing.getByRole("button", { name: /View breakdown/ });
  await expect(toggle).toHaveAttribute("aria-expanded", "false");
  await toggle.focus();
  await page.keyboard.press("Enter");
  await expect(housing.locator(".budget-item-list li")).toHaveCount(5);
  await expect(housing.locator(".unassigned-spending")).toContainText(
    "Unassigned",
  );
  await page.screenshot({
    path: "test-results/budgets-desktop.png",
    fullPage: true,
  });
  await page.setViewportSize({ width: 320, height: 780 });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: "test-results/budgets-mobile.png",
    fullPage: true,
  });
  await housing
    .getByRole("button", { name: "Edit budget", exact: true })
    .click();
  await expect(page.getByLabel("Budget structure")).toHaveValue("breakdown");
  expect(
    await page
      .getByRole("dialog")
      .evaluate((el) => el.scrollWidth <= el.clientWidth),
  ).toBe(true);
  await page.screenshot({ path: "test-results/budget-form-mobile.png" });
  await page.keyboard.press("Escape");
  await housing.getByRole("button", { name: /Hide breakdown/ }).click();
  await expect(housing.locator(".breakdown-panel")).toBeHidden();
});

test("a simple budget can gain a breakdown and return to a simple limit", async ({
  page,
}) => {
  await page.goto("/#/budgets");
  const groceries = page
    .locator(".budget-grid .card")
    .filter({ has: page.locator(".budget-name", { hasText: "Groceries" }) });
  await expect(
    groceries.getByRole("button", { name: /View breakdown/ }),
  ).toHaveCount(0);
  const before = await groceries.locator(".budget-bottom strong").innerText();
  await groceries
    .getByRole("button", { name: "Edit budget", exact: true })
    .click();
  await page.getByLabel("Budget structure").selectOption("breakdown");
  await page.getByLabel("Item name", { exact: true }).fill("Weekly shopping");
  await page.getByLabel("Item limit", { exact: true }).fill("400");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await groceries.getByRole("button", { name: /View breakdown/ }).click();
  await expect(
    groceries.locator(".unassigned-spending strong").last(),
  ).toHaveText(before);
  await groceries
    .getByRole("button", { name: "Edit budget", exact: true })
    .click();
  await page.getByLabel("Budget structure").selectOption("simple");
  await expect(page.getByLabel("Amount (EUR)")).toHaveValue("400");
  await page.getByRole("button", { name: "Save changes", exact: true }).click();
  await expect(
    groceries.getByRole("button", { name: /View breakdown/ }),
  ).toHaveCount(0);
  await expect(groceries.locator(".budget-bottom strong")).toHaveText(before);
});
