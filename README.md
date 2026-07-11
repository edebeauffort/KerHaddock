# The Holiday House

Family holiday house hub — login, room booking with real availability
checking, and starter pages for weather, webcam, gallery, tips, and
restaurants. Built with Next.js (App Router) + Supabase.

This is Phase 0–3 of the fuller build plan (see
`holiday-house-website-build-plan.md` alongside this project). Gallery, tips,
and restaurants are stubbed with "not built yet" pages ready for Phase 4–5.

## 1. Create a Supabase project

1. Go to [supabase.com](https://supabase.com) → New project (free tier is enough).
2. Once it's ready, open **Project Settings → API** and copy the **Project URL**,
   the **anon public key**, and the **service_role secret key**.
3. Copy `.env.local.example` to `.env.local` and paste those three values in.
   The service role key is server-only (never `NEXT_PUBLIC_`) — it's what lets
   a host invite/remove users from the Utilisateurs page. Keep it secret and
   never commit it.

## 2. Set up the database

1. In the Supabase dashboard, open **SQL Editor → New query**.
2. Paste the contents of `supabase/schema.sql` and run it. This creates the
   `profiles`, `rooms`, and `bookings` tables, turns on row-level security so
   only logged-in family members can read/write anything, and adds a database
   constraint that rejects overlapping bookings for the same room (this is
   what makes "availability" actually reliable, not just a UI suggestion).
3. Edit the seed rooms at the bottom of that file to match your real house
   before running it, or edit the `rooms` table afterwards in the Table
   Editor.

**Already have this project running from an earlier zip?** Don't re-run the
full `schema.sql` — instead run just the new migration file(s) you haven't
applied yet, in order, from `supabase/migrations/`. The newest one is
`0008_priority_periods_and_approvals.sql`, which adds the priority-booking-
period and approval-request feature described below.

## 2.5 Set up email (Resend)

Approval-request emails ("requested holiday during your period" and "holiday
period granted") are sent via [Resend](https://resend.com):

1. Create a free Resend account and grab an API key from the dashboard.
2. Add it to `.env.local` as `RESEND_API_KEY`.
3. By default, emails send from Resend's shared `onboarding@resend.dev`
   address, which **only delivers to the email you signed up to Resend
   with** — fine for testing alone, not for the whole family. For real
   delivery to everyone, verify your own domain in Resend and set
   `RESEND_FROM_EMAIL` in `.env.local` to an address on it.
4. If `RESEND_API_KEY` isn't set, the app still works — it just skips
   sending the email (logged to the server console) instead of failing the
   booking or approval.

## 3. Invite the family (no public sign-up, on purpose)

This app has no self-serve registration — it's meant to stay closed to your
family. Once you're logged in as a host, use the **Utilisateurs** page in the
nav to invite people directly (sends them an email invite, and lets you set
their name, family branch, and role — `host` or `guest` — right away).

`e.debeauffort@gmail.com` is set as the first host automatically by the
migrations. Hosts can create, edit, and delete any account from Utilisateurs;
guests can only edit their own name/branch from the Compte page.

## 3.5 Add the booking option photos (optional)

The booking page shows one big photo button per option — each whole house,
and each individual bedroom. Save your own photos to `public/options/` with
the exact filenames listed in `src/lib/bookingOptionImages.ts` (e.g.
`grande-maison-entiere.jpg`, `dortoir.jpg`). Any option missing a file just
shows a plain colored button instead of a photo, nothing breaks.

## 3.6 Homepage photo carousel (optional)

The homepage hero cycles through photos automatically. Drop any number of
photos into `public/hero/` (any filenames, `.jpg`/`.jpeg`/`.png`/`.webp`) —
they're picked up automatically in filename order, no code changes needed.
If `public/hero/` is empty or missing, it falls back to a single
`public/homepage.jpg` if you have one from before.

## 4. Run it locally

```bash
npm install   # already done if you're reading this from the generated project
npm run dev
```

Visit `http://localhost:3000` — you'll be redirected to `/login`.

## 5. Deploy to Vercel

1. Push this project to a GitHub repo (private is fine).
2. [vercel.com/new](https://vercel.com/new) → import the repo.
3. Add the two environment variables from `.env.local` in the Vercel project
   settings (Environment Variables).
4. Deploy. Vercel's free tier is plenty for a family site.

## What's implemented vs. stubbed

| Feature | Status |
|---|---|
| Login (invite-only, Supabase Auth) | ✅ working |
| Booking: one shared calendar + guest count, then pick any combination of whole houses / independent bedrooms as large photo buttons | ✅ working — see `supabase/schema.sql` for the overlap-prevention constraint. If your Supabase project already had the old (house-less) schema, run `supabase/migrations/0002_add_houses.sql` instead of the full `schema.sql`. |
| Weather (Windy embed + Open-Meteo + Meteoconsult link) | ✅ working |
| Webcam | 🚧 stub — needs a manual check of whether vendee.fr/viewsurf.com offer an official embed code before wiring up, see `/webcam` page for notes |
| Photo gallery | 🚧 stub — Phase 3 in the build plan |
| Tips & tricks | 🚧 stub — Phase 4 |
| Restaurants + map | 🚧 stub — Phase 4 |
| User management (host/guest roles, Utilisateurs page) | ✅ working |
| Priority booking periods per family branch + approval workflow | ✅ working — a host sets each branch's 2-week priority window per year in Utilisateurs; a booking that lands in another branch's window goes to "pending" and emails that branch (any member can approve from the Réservations page), then emails the requester once approved. See `supabase/migrations/0008_priority_periods_and_approvals.sql`. |

## Notes

- Auth and route protection live in `src/middleware.ts` — any route other
  than `/login` requires a session.
- Supabase clients: `src/lib/supabase/client.ts` (browser) and
  `src/lib/supabase/server.ts` (server components/actions).
- The booking form is a client component using React's `useActionState`
  calling the `createBooking` server action in
  `src/app/bookings/actions.ts`.
