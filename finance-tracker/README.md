# Personal Finance Tracker

A full-stack web application for tracking personal expenses and managing a simple budget overview.

This project is currently under development. The goal is to build a practical finance tracker with a Spring Boot backend, a React TypeScript frontend, and a clean REST API.

## Current Status

Work in progress.

Implemented so far:

- Spring Boot backend
- React TypeScript frontend
- Frontend connected to backend
- Health check endpoint
- Expense API with example data
- Expense list displayed in the frontend
- Total expenses summary

## Tech Stack

### Backend

- Java
- Spring Boot
- REST API
- Spring Security
- PostgreSQL planned

### Frontend

- React
- TypeScript
- Vite
- HTML
- CSS

### Tools

- Git
- GitHub
- IntelliJ IDEA
- Visual Studio Code

## Current API Endpoints

```text
GET /api/health
```

Returns:

```text
Backend is running
```

```text
GET /api/expenses
```

Returns example expenses as JSON.

## Planned Features

- Add expense form
- Delete expenses
- Edit expenses
- PostgreSQL database integration
- User registration and login
- Income tracking
- Category management
- Dashboard with charts

## Project Structure

```text
finance-tracker/
├── backend/
│   └── finance-tracker/     # Spring Boot backend
│
└── frontend/                # React TypeScript frontend
```

## How to Run Locally

### Backend

```bash
cd backend/finance-tracker
.\mvnw.cmd spring-boot:run
```

Backend runs on:

```text
http://localhost:8080
```

### Frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on:

```text
http://localhost:5173
```

## Author

Rayen Brigui  
Computer Science student at Otto von Guericke University Magdeburg
