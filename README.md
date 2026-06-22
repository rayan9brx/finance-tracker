# Personal Finance Tracker

A full-stack personal finance tracker for viewing, adding, and deleting expenses.

This project is a work in progress. The current version connects a React TypeScript frontend to a Spring Boot backend through a simple REST API. Expenses are stored in memory for now, so data resets when the backend restarts.

## Tech Stack

- Java
- Spring Boot
- React
- TypeScript
- REST API
- Vite
- CSS

## Current Features

- View expenses
- Add expenses
- Delete expenses
- Total expenses summary
- Frontend connected to backend
- In-memory expense storage for development

## Planned Features

- PostgreSQL database
- User authentication
- Income tracking
- Charts and dashboard

## API Endpoints

```text
GET /api/health
GET /api/expenses
POST /api/expenses
DELETE /api/expenses/{id}
```

The expense API currently uses JSON and stores data in memory.

Example request body for adding an expense:

```json
{
  "title": "Groceries",
  "amount": 45.5,
  "category": "Food"
}
```

## Project Structure

```text
finance-tracker/
+-- backend/
|   +-- finance-tracker/     Spring Boot backend
+-- frontend/                React TypeScript frontend
```

## Run Locally

### Backend

From the project root:

```bash
cd backend/finance-tracker
./mvnw spring-boot:run
```

On Windows PowerShell, use:

```powershell
cd backend/finance-tracker
.\mvnw.cmd spring-boot:run
```

The backend runs at:

```text
http://localhost:8080
```

### Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

The frontend runs at:

```text
http://localhost:5173
```

## Notes

- The backend must be running before the frontend can load, add, or delete expenses.
- The current backend does not use a database yet.
- This project is still under active development.

## Author

Rayen Brigui  
Computer Science student at Otto von Guericke University Magdeburg
