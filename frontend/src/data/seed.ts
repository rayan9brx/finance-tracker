import type {
  Budget,
  Category,
  FinanceData,
  Transaction,
} from "../types/finance";
import { monthsEndingAt, today } from "../utils/finance";
import { categoryColors, categoryIcons } from "../utils/categoryOptions";
export function createSeed(): FinanceData {
  const names = [
    "Housing",
    "Groceries",
    "Transportation",
    "Entertainment",
    "Health",
    "Education",
    "Shopping",
    "Salary",
    "Freelance",
    "Other",
  ];
  const categories: Category[] = names.map((name, i) => ({
    id: `category-${i}`,
    name,
    type: i === 7 || i === 8 ? "income" : "expense",
    icon: categoryIcons[i],
    color: categoryColors[i % categoryColors.length],
  }));
  const month = today().slice(0, 7);
  const housing: Budget = {
    id: "budget-0",
    categoryId: "category-0",
    month,
    items: [
      { id: "housing-rent", name: "Rent", limit: 105000 },
      { id: "housing-internet", name: "Internet", limit: 5000 },
      { id: "housing-electricity", name: "Electricity", limit: 12000 },
      { id: "housing-insurance", name: "Insurance", limit: 8000 },
      { id: "housing-other", name: "Other", limit: 10000 },
    ],
  };
  const transactions: Transaction[] = [];
  monthsEndingAt(month, 12).forEach((m, index) => {
    const entries: [number, string, number, number][] = [
      [7, "Northstar Studio · Salary", 345000, 1],
      [0, "Apartment rent", 98000, 2],
      [8, "Brand identity project", 42000 + index * 1200, 6],
      [1, "REWE · Weekly groceries", 8240 + index * 130, 5],
      [1, "Local farmers market", 4860, 12],
      [1, "EDEKA · Pantry restock", 11235 + index * 190, 20],
      [2, "Deutschlandticket", 6300, 3],
      [2, "Bike repair", 3800, 14],
      [3, "Spotify Premium", 1099, 8],
      [3, "Dinner with friends", 7850 + index * 90, 19],
      [4, "Urban Sports Club", 6900, 10],
      [5, "Design & development course", 4900, 15],
      [6, "ARKET · Autumn essentials", 12900 + index * 350, 22],
      [0, "Home internet", 3999, 4],
      [1, "Coffee & fresh bread", 1860, 24],
      [3, "Cinema evening", 2800, 25],
      [0, "Electricity bill", 9500, 7],
      [0, "Home insurance", 6000, 9],
      [0, "Spare keys", 2500, 11],
    ];
    entries.forEach(([c, description, amount, day], j) => {
      const date = `${m}-${String(day).padStart(2, "0")}`;
      if (date <= today())
        transactions.push({
          id: `sample-${index}-${j}`,
          type: categories[c].type,
          amount,
          description,
          categoryId: categories[c].id,
          date,
          note: "",
          createdAt: `${date}T12:00:00Z`,
          ...(m === month && c === 0 && description !== "Spare keys"
            ? {
                budgetItemId:
                  description === "Apartment rent"
                    ? "housing-rent"
                    : description === "Home internet"
                      ? "housing-internet"
                      : description === "Electricity bill"
                        ? "housing-electricity"
                        : "housing-insurance",
              }
            : {}),
        });
    });
  });
  return {
    version: 1,
    categories,
    transactions,
    budgets: [
      housing,
      ...[1, 2, 3, 6].map((c, i) => ({
        id: `budget-${i + 1}`,
        categoryId: categories[c].id,
        month,
        limit: [40000, 18000, 14000, 15000][i],
      })),
    ],
    settings: { currency: "EUR" },
  };
}
