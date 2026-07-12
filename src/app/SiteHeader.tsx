"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

type NavLink = { href: string; label: string; ready?: boolean };

function HamburgerIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      <line x1="4" y1="4" x2="20" y2="20" />
      <line x1="20" y1="4" x2="4" y2="20" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 12a5 5 0 1 0 0-10 5 5 0 0 0 0 10Zm0 2c-4.42 0-9 2.24-9 5v3h18v-3c0-2.76-4.58-5-9-5Z" />
    </svg>
  );
}

// Renders the site header: main nav links (collapse into a hamburger menu
// below md), and an account menu (Compte / Utilisateurs / Se déconnecter)
// under a small avatar/user icon, on both desktop and mobile.
//
// On the homepage specifically, the header floats transparently over the
// full-bleed hero photo instead of sitting in normal document flow with a
// solid background — everywhere else it's a normal opaque header.
export default function SiteHeader({
  navLinks,
  accountLinks,
  initials,
  signOutAction,
}: {
  navLinks: NavLink[];
  accountLinks: NavLink[];
  initials: string | null;
  signOutAction: () => void | Promise<void>;
}) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === "/";

  return (
    <header
      className={
        isHome
          ? "absolute inset-x-0 top-0 z-30 bg-transparent"
          : "relative border-b border-slate-200 bg-white"
      }
    >
      <div className="mx-auto flex max-w-4xl items-center justify-between gap-2 p-4">
        <Link
          href="/"
          className={`text-sm font-bold ${isHome ? "text-white drop-shadow" : "text-slate-900"}`}
          onClick={() => setMobileOpen(false)}
        >
          L&apos;Île d&apos;Yeu
        </Link>

        {/* Desktop nav */}
        <nav
          className={`hidden flex-1 flex-wrap justify-center gap-4 text-sm font-medium md:flex ${
            isHome ? "text-white drop-shadow" : "text-slate-900"
          }`}
        >
          {navLinks.map((link) =>
            link.ready === false ? (
              <span
                key={link.href}
                className="cursor-default rounded-full px-3 py-1.5 opacity-50"
              >
                {link.label}
              </span>
            ) : (
              <Link
                key={link.href}
                href={link.href}
                className="rounded-full px-3 py-1.5 transition hover:bg-brand-mint hover:text-slate-900"
              >
                {link.label}
              </Link>
            ),
          )}
        </nav>

        <div className="flex items-center gap-2">
          {/* Account menu (desktop + mobile) */}
          <div className="relative">
            <button
              type="button"
              onClick={() => setAccountOpen((o) => !o)}
              className={
                isHome
                  ? "flex h-9 w-9 items-center justify-center rounded-full border border-white/40 bg-white/20 text-sm font-semibold text-white backdrop-blur-sm hover:bg-white/30"
                  : "flex h-9 w-9 items-center justify-center rounded-full border border-brand-teal bg-brand-teal text-sm font-semibold text-white hover:bg-brand-teal-dark"
              }
              aria-label="Compte"
            >
              {initials ?? <UserIcon />}
            </button>

            {accountOpen && (
              <>
                <button
                  type="button"
                  aria-label="Fermer le menu"
                  onClick={() => setAccountOpen(false)}
                  className="fixed inset-0 z-10 cursor-default"
                />
                <div className="absolute right-0 z-20 mt-2 w-44 overflow-hidden rounded-lg border border-slate-200 bg-white py-1 text-sm text-slate-900 shadow-lg">
                  {accountLinks.map((link) => (
                    <Link
                      key={link.href}
                      href={link.href}
                      onClick={() => setAccountOpen(false)}
                      className="block px-4 py-2 hover:bg-slate-50"
                    >
                      {link.label}
                    </Link>
                  ))}
                  <form action={signOutAction}>
                    <button
                      type="submit"
                      className="block w-full px-4 py-2 text-left text-slate-500 hover:bg-slate-50 hover:text-slate-900"
                    >
                      Se déconnecter
                    </button>
                  </form>
                </div>
              </>
            )}
          </div>

          {/* Hamburger (mobile only) */}
          <button
            type="button"
            onClick={() => setMobileOpen((o) => !o)}
            className={
              isHome
                ? "flex h-9 w-9 items-center justify-center rounded-full text-white hover:bg-white/20 md:hidden"
                : "flex h-9 w-9 items-center justify-center rounded-full text-slate-700 hover:bg-slate-100 md:hidden"
            }
            aria-label="Menu"
          >
            {mobileOpen ? <CloseIcon /> : <HamburgerIcon />}
          </button>
        </div>
      </div>

      {/* Mobile nav panel */}
      {mobileOpen && (
        <nav className="border-t border-slate-200 bg-white px-4 pb-4 text-slate-900 md:hidden">
          <ul className="flex flex-col gap-1 pt-2 text-sm font-medium">
            {navLinks.map((link) => (
              <li key={link.href}>
                {link.ready === false ? (
                  <span className="block cursor-default rounded-full px-3 py-2 opacity-50">
                    {link.label}
                  </span>
                ) : (
                  <Link
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="block rounded-full px-3 py-2 transition hover:bg-brand-mint"
                  >
                    {link.label}
                  </Link>
                )}
              </li>
            ))}
          </ul>
        </nav>
      )}
    </header>
  );
}
