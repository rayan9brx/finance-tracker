package com.rayen.finance_tracker.controller;

import com.rayen.finance_tracker.model.Expense;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.List;

@RestController
public class ExpenseController {

    private final List<Expense> expenses = new ArrayList<>();
    private Long nextId = 5L;

    public ExpenseController() {
        expenses.add(new Expense(1L, "Rent", 350.0, "Housing"));
        expenses.add(new Expense(2L, "Food", 45.0, "Groceries"));
        expenses.add(new Expense(3L, "Transport", 30.0, "Mobility"));
        expenses.add(new Expense(4L, "Internet", 29.99, "Utilities"));
    }

    @GetMapping("/api/expenses")
    public List<Expense> getExpenses() {
        return expenses;
    }

    @PostMapping("/api/expenses")
    public Expense addExpense(@RequestBody CreateExpenseRequest request) {
        Expense expense = new Expense(
                nextId,
                request.getTitle(),
                request.getAmount(),
                request.getCategory()
        );

        expenses.add(expense);
        nextId++;

        return expense;
    }

    @DeleteMapping("/api/expenses/{id}")
    public ResponseEntity<Void> deleteExpense(@PathVariable Long id) {
        boolean deleted = expenses.removeIf(expense -> expense.getId().equals(id));

        if (!deleted) {
            return ResponseEntity.notFound().build();
        }

        return ResponseEntity.noContent().build();
    }

    public static class CreateExpenseRequest {
        private String title;
        private Double amount;
        private String category;

        public String getTitle() {
            return title;
        }

        public void setTitle(String title) {
            this.title = title;
        }

        public Double getAmount() {
            return amount;
        }

        public void setAmount(Double amount) {
            this.amount = amount;
        }

        public String getCategory() {
            return category;
        }

        public void setCategory(String category) {
            this.category = category;
        }
    }
}
