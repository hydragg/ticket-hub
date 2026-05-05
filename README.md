# TicketHub

## Setup

```bash
# Install dependencies
pnpm install

# Start dev server (http://localhost:3000)
pnpm dev
```

### Other commands

```bash
pnpm build          # Production build
pnpm typecheck      # TypeScript type check
pnpm lint           # ESLint
pnpm lint:fix       # ESLint with auto-fix
pnpm format         # Prettier
pnpm test:run       # Run all unit tests (single run)
pnpm test           # Unit tests in watch mode
pnpm test:coverage  # Generate v8 coverage report
```

---

## Test Data

### Login credentials

Use the following to log in without registering:

| Field | Value |
|-------|-------|
| Email | `demo@example.com` |
| Password | `password123` |

> You can also **register** with any email and any password (≥ 8 chars, upper + lower + number). MSW will accept it and return a mock token.

---

### Payment form

On checkout Step 2 (Payment), use any values that match the format rules below:

| Field | Example | Format |
|-------|---------|--------|
| Cardholder name | `Test User` | At least 2 characters |
| Card number | `4242 4242 4242 4242` | 16 digits (spaces optional) |
| Expiry | `12/28` | MM/YY |
| CVV | `123` | 3–4 digits |

---

### Change password

| Field | Value |
|-------|-------|
| Current password | `password123` |
| New password | Any password that meets the rules |

---

## Booking Flow

1. Browse the event list → select an event
2. Choose ticket type and quantity → click **Buy Now** (login required)
3. MSW locks the seats and starts a **20-minute countdown**
4. **Step 1**: Select seats from the seat map
5. **Step 2**: Fill in payment details
6. **Step 3**: Order confirmed — view it in the Dashboard

> If you close the page mid-flow, go to **Dashboard → My Orders** to find the incomplete order and resume from where you left off.

---

## Routes

| Path | Description |
|------|-------------|
| `/` | Home |
| `/events` | Event list (filter + pagination) |
| `/events/[slug]` | Event detail |
| `/checkout` | Checkout flow (login required) |
| `/auth/login` | Login |
| `/auth/register` | Register |
| `/auth/forgot-password` | Forgot password |
| `/dashboard/profile` | Profile (login required) |
| `/dashboard/orders` | My orders (login required) |
| `/dashboard/orders/[id]` | Order detail (login required) |
| `/dashboard/password` | Change password (login required) |
