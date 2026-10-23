# LibroFlow — Library Management System

A full-stack Library Management System:

- **Backend:** Java 17 + Spring Boot 3 (REST API, Spring Security with JWT, Spring Data JPA)
- **Database:** MySQL
- **Frontend:** Plain HTML, CSS, JavaScript (no build step) — professional, minimal-corporate design

Features: book catalog CRUD & search, member management, issue/return workflow with automatic
overdue detection and fine calculation, a login-protected dashboard with live stats, and
role-based accounts (Admin / Librarian).

---

## 1. Prerequisites

- Java 17 or newer (`java -version`)
- Maven 3.8+ (`mvn -version`) — or use your IDE's built-in Maven
- MySQL 8.x running locally
- Any modern browser
- (Optional) A simple static file server, e.g. VS Code "Live Server", or Python's `http.server`

## 2. Database setup

Create the database (tables are created automatically by Hibernate on first run):

```sql
CREATE DATABASE library_db;
```

Then open `backend/src/main/resources/application.properties` and update the credentials if needed:

```properties
spring.datasource.url=jdbc:mysql://localhost:3306/library_db?useSSL=false&serverTimezone=UTC&createDatabaseIfNotExist=true
spring.datasource.username=root
spring.datasource.password=root
```

## 3. Run the backend

```bash
cd backend
mvn spring-boot:run
```

The API starts on **http://localhost:8080**.

On first startup, the app automatically creates:

- Default login accounts:
  - `admin` / `admin123` (ADMIN role)
  - `librarian` / `librarian123` (LIBRARIAN role)
- 5 sample books and 2 sample members, so you have data to explore immediately.

You'll see a confirmation printed in the console the first time it seeds data.

> Change `jwt.secret` in `application.properties` before deploying anywhere beyond your own machine.

## 4. Run the frontend

The frontend is plain static HTML/CSS/JS — no npm install needed. From the `frontend` folder, serve it with any static server, for example:

```bash
cd frontend
python3 -m http.server 5500
```

Then open **http://localhost:5500** in your browser. (Opening `login.html` directly via `file://` also
works in most browsers, since the frontend only talks to the backend over `fetch`.)

If your backend runs on a different host/port, update `API_BASE_URL` in `frontend/js/config.js`.

## 5. Log in

Use one of the seeded accounts:

| Username    | Password       | Role       |
|-------------|----------------|------------|
| admin       | admin123       | ADMIN      |
| librarian   | librarian123   | LIBRARIAN  |

## 6. Project structure

```
library-management-system/
├── backend/
│   ├── pom.xml
│   └── src/main/
│       ├── java/com/library/
│       │   ├── LibraryManagementApplication.java
│       │   ├── config/DataInitializer.java      # seeds admin user + sample data
│       │   ├── model/                           # Book, Member, Transaction, User, enums
│       │   ├── repository/                      # Spring Data JPA repositories
│       │   ├── service/                          # business logic (issue/return, fines, search)
│       │   ├── controller/                       # REST endpoints
│       │   ├── security/                         # JWT filter, util, Spring Security config
│       │   ├── dto/                              # request/response payloads
│       │   └── exception/                        # centralized error handling
│       └── resources/application.properties
└── frontend/
    ├── login.html
    ├── dashboard.html
    ├── books.html
    ├── members.html
    ├── transactions.html
    ├── css/style.css
    └── js/ (config.js, dashboard.js, books.js, members.js, transactions.js)
```

## 7. API reference (quick overview)

All endpoints except `/api/auth/login` require an `Authorization: Bearer <token>` header, obtained by logging in.

| Method | Endpoint                              | Description                        |
|--------|----------------------------------------|-------------------------------------|
| POST   | `/api/auth/login`                     | Log in, returns JWT                 |
| GET    | `/api/books?query=`                   | List / search books                 |
| POST   | `/api/books`                          | Add a book                          |
| PUT    | `/api/books/{id}`                     | Update a book                       |
| DELETE | `/api/books/{id}`                     | Delete a book                       |
| GET    | `/api/members?query=`                 | List / search members               |
| POST   | `/api/members`                        | Add a member                        |
| PUT    | `/api/members/{id}`                   | Update a member                     |
| DELETE | `/api/members/{id}`                   | Delete a member                     |
| GET    | `/api/transactions`                   | List all loan transactions          |
| GET    | `/api/transactions/overdue`           | List overdue loans                  |
| POST   | `/api/transactions/issue`             | Issue a book to a member            |
| POST   | `/api/transactions/return/{id}`       | Return a book, calculates fine      |
| GET    | `/api/dashboard/stats`                | Dashboard summary numbers           |

Fine rule: ₹5 per day overdue past the due date, calculated automatically on return
(and shown live for anything already overdue).

## 8. Notes & next steps

- Passwords are hashed with BCrypt (`DataInitializer` uses Spring's `PasswordEncoder`, never plaintext).
- CORS is open (`*`) for local development — restrict `SecurityConfig.corsConfigurationSource()` to your actual frontend origin before deploying.
- To add more admin/librarian accounts later, insert directly into the `users` table using a BCrypt hash, or extend `AuthController` with a registration endpoint.
