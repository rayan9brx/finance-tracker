package com.rayen.finance_tracker.model;

public class Expense {

    private Long id;
    private String title;
    private Double amount;
    private String category;

    public Expense(Long id, String title, Double amount, String category) {
        this.id = id;
        this.title = title;
        this.amount = amount;
        this.category = category;
    }

    public Long getId() {
        return id;
    }

    public String getTitle() {
        return title;
    }

    public Double getAmount() {
        return amount;
    }

    public String getCategory() {
        return category;
    }
}
