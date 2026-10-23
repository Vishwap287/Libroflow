# User Management & Fine Management Modules (Member Portal)

This document covers **only the two new modules** added on top of your existing admin
Library Management System: a self-service **member portal** (registration, login, profile)
and a **fine management** system tied to it.

**Nothing in your existing admin module was modified, replaced, or removed.** These modules
live in entirely new files/packages, use new database tables, and only touch
`SecurityConfig.java` with two small additive lines (registering the new module's own
auth routes and JWT filter) needed to wire it in — no existing line was changed or deleted.

---

## What was added

### New database tables (auto-created by Hibernate, separate from existing tables)
- `portal_users` — user_id, full_name, email, phone, department, password (hashed), status, created_at
- `fines` — fine_id, user_id, issue_date, due_date, return_date, overdue_days, fine_amount, payment_status, payment_date

These are completely independent of your existing `users`, `members`, `books`, and
`transactions` tables.

### New backend package: `com.library.portal`
```
backend/src/main/java/com/library/portal/
├── model/           PortalUser, Fine, PaymentStatus
├── repository/      PortalUserRepository, FineRepository
├── dto/             Register/Login/Profile/Fine request & response DTOs
├── security/        PortalJwtAuthFilter (separate from the admin auth filter)
├── service/         PortalUserService, FineService
├── controller/      PortalAuthController, PortalProfileController, FineController
├── exception/       Scoped exception handling (only for portal controllers)
└── config/          PortalDataInitializer (seeds 2 demo member accounts + sample fines)
```

### New frontend folder: `frontend/user/`
```
frontend/user/
├── login.html
├── register.html
├── forgot-password.html
├── dashboard.html      (welcome, profile summary, fine stats, recent history)
├── profile.html        (view/edit profile, change password)
├── fines.html           (search, filter Paid/Unpaid, pagination, pay fines)
├── css/portal.css      (additive only — extends ../../css/style.css, doesn't edit it)
└── js/                  (portal.js config + one file per page)
```

The one-line change to `backend/.../security/SecurityConfig.java`: added
`.requestMatchers("/api/portal/auth/**").permitAll()` and registered the new
`PortalJwtAuthFilter` bean alongside the existing admin filter. Everything else in that
file is untouched.

---

## How the two logins coexist

Your existing admin/librarian login (`/api/auth/login`) and the new member login
(`/api/portal/auth/login`) are fully independent:

| | Admin module (existing) | Member portal (new) |
|---|---|---|
| Table | `users` | `portal_users` |
| Login endpoint | `/api/auth/login` | `/api/portal/auth/login` |
| JWT filter | `JwtAuthFilter` | `PortalJwtAuthFilter` |
| Roles | ADMIN, LIBRARIAN | USER |
| Frontend | `frontend/login.html` | `frontend/user/login.html` |

Both filters run in the same request pipeline; each only recognizes its own token type
and quietly does nothing for the other's tokens, so there's no conflict.

## Demo member accounts (seeded automatically on first run)

| Email | Password |
|---|---|
| karthik.raja@example.com | user123 |
| divya.menon@example.com | user123 |

Sample fine records (paid, unpaid/overdue, and a clean return) are seeded for
`karthik.raja@example.com` and `divya.menon@example.com` so the dashboard/fines page
has real data to show immediately.

## Running it

No extra setup beyond what you already have running:

1. Your existing `mvn spring-boot:run` in `backend/` picks up the new module automatically
   (Spring component-scans the whole `com.library` package tree).
2. Serve `frontend/` as you already do (e.g. `python3 -m http.server 5500`).
3. Visit `http://localhost:5500/user/login.html` for the member portal (as opposed to
   `http://localhost:5500/login.html` for the existing admin login).

## API reference (new endpoints only)

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/portal/auth/register` | none | Create a member account |
| POST | `/api/portal/auth/login` | none | Member login, returns JWT |
| POST | `/api/portal/auth/forgot-password` | none | Verifies email+phone, sets new password |
| GET | `/api/portal/users/me` | member JWT | View own profile |
| PUT | `/api/portal/users/me` | member JWT | Edit own profile |
| PUT | `/api/portal/users/me/password` | member JWT | Change own password |
| GET | `/api/portal/users/me/dashboard` | member JWT | Dashboard summary (fine totals + recent history) |
| GET | `/api/portal/fines?query=&status=&page=&size=` | member JWT | Search/filter/paginate own fines |
| POST | `/api/portal/fines/{id}/pay` | member JWT | Mark own fine as paid |
| POST | `/api/portal/fines` | **admin/librarian JWT** | Staff logs a new fine/loan record for a member |

Fine calculation rule: **₹5 per overdue day**, computed automatically as
`max(0, days between due date and return date — or today, if not yet returned)`.
Unpaid fines are recalculated live each time they're fetched (so an ongoing overdue
keeps climbing daily); once paid, the amount is frozen as a historical record.

### Logging a fine as staff

Since portal members can't fine themselves, an admin or librarian (using their
**existing** admin login/JWT — nothing new needed there) can log a fine record via:

```
POST /api/portal/fines
Authorization: Bearer <admin-or-librarian-JWT>
Content-Type: application/json

{
  "userId": 1,
  "issueDate": "2026-06-20",
  "dueDate": "2026-07-04",
  "returnDate": null
}
```

(No dedicated admin UI screen was built for this yet, since it wasn't requested — this
is available via API only for now. Happy to add a small "Log a fine" screen to the
existing admin dashboard if useful — just say the word.)
