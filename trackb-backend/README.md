# TrackB Backend (starter)

Backend REST API for the uploaded TrackB/SmartBus HTML frontend.

## Requirements
- Node.js 20 or newer
- npm

## Setup
1. Extract this folder.
2. In this folder run:
   ```bash
   npm install
   ```
3. Copy `.env.example` to `.env`.
4. Set `JWT_SECRET` to a random secret of at least 32 characters.
5. Set `FRONTEND_ORIGIN` to the exact origin serving your frontend. For example, when using `python -m http.server 8000`, use `http://localhost:8000`.
6. Start the API:
   ```bash
   npm run dev
   ```
7. Check `http://localhost:4000/api/health`.

The SQLite database and demo route data are created automatically on first run.

## API endpoints

| Method | Endpoint | Auth | Purpose |
|---|---|---:|---|
| GET | `/api/health` | No | Health check |
| POST | `/api/auth/register` | No | Create account |
| POST | `/api/auth/login` | No | Sign in |
| GET | `/api/auth/me` | Bearer token | Current user |
| GET | `/api/routes?from=Delhi&to=Manali&date=2026-12-01` | No | Search routes |
| POST | `/api/bookings` | Bearer token | Create booking / reserve seats |
| GET | `/api/bookings` | Bearer token | Current user's bookings |
| POST | `/api/bookings/:id/cancel` | Bearer token | Cancel upcoming booking |
| GET | `/api/tracking/:routeId` | No | Read stored bus GPS position |
| PUT | `/api/tracking/:routeId/position` | Development only | Update demo GPS position |
| POST | `/api/newsletter` | No | Subscribe an email |

### Example request bodies

Register:
```json
{ "name": "Aarav Mehta", "email": "aarav@example.com", "password": "use-a-long-password" }
```

Login:
```json
{ "email": "aarav@example.com", "password": "use-a-long-password" }
```

Create a booking (send `Authorization: Bearer <token>`):
```json
{ "routeId": 1, "travelDate": "2026-12-01", "seats": 2, "passengerName": "Aarav Mehta" }
```

Newsletter:
```json
{ "email": "traveller@example.com" }
```

Development GPS update:
```json
{ "latitude": 28.6139, "longitude": 77.2090, "speedKph": 42 }
```
Use `PUT /api/tracking/1/position` for the example seeded route with ID 1.

## Connecting the existing frontend
The uploaded home page currently validates login/signup forms in the browser and displays a message for route searches. Replace those demo handlers with `fetch()` calls to these endpoints. Send the login/register token in the `Authorization` header for protected routes. For example:

```js
const API_BASE = "http://localhost:4000/api";

const response = await fetch(`${API_BASE}/routes?from=${encodeURIComponent(from)}&to=${encodeURIComponent(to)}`);
const data = await response.json();
if (!response.ok) throw new Error(data.error || "Request failed");
console.log(data.results);
```

For login:
```js
const response = await fetch(`${API_BASE}/auth/login`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({ email, password })
});
const data = await response.json();
if (!response.ok) throw new Error(data.error || "Login failed");
// Store the token carefully and use it as a Bearer token for protected requests.
```

## Important production gaps
- This starter does **not** process payments, send email, issue refunds, or connect to a real GPS device.
- Demo route inventory and prices are sample data, not live operator inventory.
- The development GPS write endpoint is intentionally disabled in production; secure it with device authentication before enabling it.
- Before deployment, use HTTPS, a strong secret manager, backups, monitoring, account recovery, email verification, privacy/retention policies, and a production database. Consider secure HttpOnly cookies instead of localStorage for browser authentication.
- Seat reservation is a basic transactional prototype. A production booking flow should add departure instances, seat-level inventory, payment authorization/confirmation, idempotency, and cancellation/refund policies.
