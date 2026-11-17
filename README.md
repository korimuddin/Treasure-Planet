# Treasure Planet

A marketplace for unfinished and dormant software projects (web apps, SaaS,
mobile, desktop and games). Sellers list a project, choose whether it is
anonymous and whether buyers must sign a mutual NDA, and approve who sees the
private details. Purchases are paid through Stripe and held until the buyer
confirms receipt.

Stack: Next.js 14 (App Router), TypeScript, Supabase (Postgres + Auth), Stripe
Connect, Resend, hosted on Netlify.

## How it works

1. **List** - a seller creates a listing with three tiers of detail: public,
   registered (signed-in users) and private.
2. **Request access** - a buyer signs the mutual NDA by typing their name
   (unless the seller switched the NDA off) and sends a request.
3. **Approve** - the seller approves or declines. Approved buyers see the
   private details and can chat.
4. **Agree terms** - either side proposes a price; the other accepts.
5. **Pay** - the buyer pays through Stripe Checkout (Pay by Bank; cards only
   for small amounts). The money sits on the platform's Stripe balance.
6. **Transfer and release** - the seller hands the project over, the buyer
   confirms receipt, and the price minus the platform fee is transferred to the
   seller's Stripe account. Either side can report a problem, which freezes the
   payment until an admin releases or refunds it.

Only outright purchases ("acquire") are paid through the site. Co-found and
merge deals are introductions.

## Security model

- The browser keys (`anon` / signed-in) can only **read**, and only the rows
  and columns the database allows. Private listing columns are never readable
  with a browser key.
- Every write, and every read of another user's data, goes through a server
  route using the service-role key (`lib/supabase/admin.ts`, via
  `requireUser()` in `lib/auth/session.ts`). Those routes scope each query by
  hand.
- Money columns are integer **pence**, including the ones named `*_gbp`.

## Setup

```bash
npm install
cp .env.example .env.local   # then fill it in
npm run dev
```

### Supabase

1. Run every file in `supabase/migrations/` in order (SQL editor or
   `supabase db push`).
2. Before running `007` on a database that has real users, read the note at
   the top of that file about checking for unexpected admin accounts.
3. Authentication -> Providers -> Email: turn **Confirm email** on. The site
   refuses listing, access requests and deals until the address is confirmed.
4. Authentication -> URL Configuration: set the Site URL to your domain.
5. To make yourself an admin, run in the SQL editor:
   `update public.profiles set role = 'admin' where email = 'you@example.com';`

### Stripe

1. Enable **Connect** and the **Pay by Bank** payment method in the dashboard.
2. Describe the business accurately when Stripe asks: a marketplace where
   individuals sell software projects, with payment held until the buyer
   confirms receipt.
3. Add a webhook endpoint at `https://<your-domain>/api/webhooks/stripe` with
   these events, and put its signing secret in `STRIPE_WEBHOOK_SECRET`:
   `checkout.session.completed`, `checkout.session.async_payment_succeeded`,
   `checkout.session.async_payment_failed`, `checkout.session.expired`,
   `charge.dispute.created`, `account.updated`.
4. Run one complete deal in **test mode** (two accounts, a test Connect
   seller) before switching to live keys.

Never describe the payment hold as "escrow" anywhere in the product. Stripe
does not provide escrow services.

### Before launch

- Replace the starter NDA wording in `lib/nda/template.ts` and bump
  `NDA_VERSION`.
- Read the starter terms and privacy policy in
  `app/(platform)/legal/page.tsx` and make sure every line is true for you.
- Set `NEXT_PUBLIC_CONTACT_EMAIL` to an inbox you read.

## Checks

```bash
npx tsc --noEmit
npm run lint
npm run build
```
