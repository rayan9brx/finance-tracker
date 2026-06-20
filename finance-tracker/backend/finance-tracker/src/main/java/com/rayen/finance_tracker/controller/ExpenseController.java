package com.rayen.finance_tracker.controller;

import com.rayen.finance_tracker.model.Expense;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
public class ExpenseController {

    @GetMapping("/api/expenses")
    public List<Expense> getExpenses() {
        return List.of(
                new Expense(1L, "Rent", 350.0, "Housing"),
                new Expense(2L, "Food", 45.0, "Groceries"),
                new Expense(3L, "Transport", 30.0, "Mobility"),
                new Expense(4L, "Internet", 29.99, "Utilities")
        );
    }
}
