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
3. **Verify your own domain in Resend and set `RESEND_FROM_EMAIL`** in
   `.env.local` to an address on it — this step is not optional in
   practice. Until it's done, emails send from Resend's shared
   `onboarding@resend.dev` address, which **only delivers to the email
   address you personally signed up to Resend with**; every other
   recipient is silently rejected. Since approval emails are addressed to
   *other* family members by design, skipping this step means those emails
   will never arrive — it'll look like the feature is broken when it's
   really just unconfigured. (You'll see this logged as a warning in the
   server console/Vercel function logs either way.)
4. If `RESEND_API_KEY` isn't set at all, the app still works — it just
   skips sending the email (logged to the server console) instead of
   failing the booking or approval.

## 2.6 Raise the auth-email limit (custom SMTP)

By default, Supabase sends invite, password-reset, and confirmation emails
through its **own built-in mailer, capped at 2 emails per hour total across
all of those types** — fine for a first local test, but you'll hit it
almost immediately once real invites and resets start going out, and
Supabase just silently drops anything past the limit (no error the app can
show you).

Fix it by pointing Supabase at your own Resend account instead (the one you
already set up in step 2.5):

1. In the Supabase dashboard, open **Authentication → Emails → SMTP
   Settings** (also reachable from **Project Settings → Authentication**)
   and enable **Custom SMTP**.
2. Fill in:
   - **Host:** `smtp.resend.com`
   - **Port:** `465`
   - **Username:** `resend` (the literal word, not your email)
   - **Password:** your `RESEND_API_KEY`
   - **Sender email:** the same address you set as `RESEND_FROM_EMAIL` (must
     be on a domain verified in Resend — the shared `onboarding@resend.dev`
     address won't work here since Supabase needs to send *from* it)
   - **Sender name:** whatever you'd like family members to see, e.g. "The
     Holiday House"
3. Save. Supabase applies a default limit of 30 emails/hour on custom SMTP
   (adjustable in **Authentication → Rate Limits**) — plenty for a family.

If you skip this step, invites and password resets will work the first
couple of times, then start silently failing once the built-in mailer's
2/hour cap is hit — which is exactly what an empty inbox with no error
usually means.

## 2.7 Point invite/reset emails at the password-setup page (required)

Out of the box, Supabase's invite and password-reset emails link to its own
hosted confirmation endpoint, which then redirects back to your app — a
redirect that only works if it exactly matches an entry in Supabase's
Redirect URLs allow list, and is a common source of the link "working" but
landing back on the plain login screen instead of a password form.

This project avoids that by verifying the link itself, server-side, at
`/auth/confirm`. Two ready-made, Airbnb-style HTML templates that link
there correctly are included at `supabase/email-templates/invite.html` and
`supabase/email-templates/reset-password.html` — open each, copy the whole
file, and paste it into the matching template's HTML box in the Supabase
dashboard under **Authentication → Email Templates** (it replaces
everything in that box, subject line is a separate field above it —
suggested subjects: "Vous êtes invité·e à rejoindre L'Île d'Yeu" and
"Réinitialisez votre mot de passe – L'Île d'Yeu").

If you'd rather adapt your own template instead, the one required part is
the link/button `href`:

```
{{ .SiteURL }}/auth/confirm?token_hash={{ .TokenHash }}&amp;type=invite&amp;next=/auth/update-password
```

(swap `type=invite` for `type=recovery` on the Reset password template).
With this in place, there's no Redirect URLs entry to add — `{{ .SiteURL }}`
(the Site URL you set in step 5) is all it needs.

## 3. Invite the family (no public sign-up, on purpose)

This app has no self-serve registration — it's meant to stay closed to your
family. Once you're logged in as a host, use the **Utilisateurs** page in the
nav to invite people directly (sends them an email invite, and lets you set
their name, family branch, and role — `host` or `guest` — right away).

The invite email (and the "mot de passe oublié" email from the login page)
links to `/auth/update-password`, where the person picks their own
password. This depends on two things set up earlier: the custom SMTP setup
from step 2.6 (without it you'll get 2 working invites total before emails
start silently failing) and the email templates from step 2.7 (without
that, the link lands back on the plain login screen instead of a password
form).

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
3. In the Vercel project's **Settings → Environment Variables**, add every
   variable from your local `.env.local`:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `NEXT_PUBLIC_SITE_URL` — set this to your real Vercel URL (e.g.
     `https://holiday-house.vercel.app`, no trailing slash). It's used to
     build the link inside invite and password-reset emails.
   - `SUPABASE_SERVICE_ROLE_KEY` (mark it sensitive — Vercel will still make
     it available server-side, just hides the value in the dashboard)
   - `RESEND_API_KEY` (skip this one only if you don't want approval emails)
   - `RESEND_FROM_EMAIL` (optional — omit to use Resend's shared sender)
4. Deploy. Vercel's free tier is plenty for a family site.
5. Back in Supabase, open **Authentication → URL Configuration** and set
   the **Site URL** to your new Vercel URL (e.g.
   `https://holiday-house.vercel.app`). The invite/reset email templates
   from step 2.7 use this (`{{ .SiteURL }}`) to build their link back to
   your app.
   - If you deploy to a different Vercel URL later (or add a custom
     domain), update this and the `NEXT_PUBLIC_SITE_URL` env var to match.

## What's implemented vs. stubbed

| Feature | Status |
|---|---|
| Login (invite-only, Supabase Auth) | ✅ working — invite and "forgot password" emails link to `/auth/update-password` to set a password |
| Booking: one shared calendar + guest count, then pick any combination of whole houses / independent bedrooms as large photo buttons | ✅ working — see `supabase/schema.sql` for the overlap-prevention constraint. If your Supabase project already had the old (house-less) schema, run `supabase/migrations/0002_add_houses.sql` instead of the full `schema.sql`. |
| Weather (Windy embed + Open-Meteo + Meteoconsult link) | ✅ working |
| Webcam | ✅ working — ViewSurf embed of the Port de l'Île d'Yeu camera |
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
