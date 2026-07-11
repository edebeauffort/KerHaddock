import type { Metadata } from "next";
import { Nunito } from "next/font/google";
import "./globals.css";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "./login/actions";
import SiteHeader from "./SiteHeader";

const nunito = Nunito({
  variable: "--font-nunito",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "L'Île d'Yeu",
  description:
    "Tout ce qu'il faut savoir pour nos vacances, en un seul endroit.",
};

const NAV_LINKS = [
  { href: "/bookings", label: "Réservations" },
  { href: "/gallery", label: "Galerie" },
  { href: "/tips", label: "Astuces" },
  { href: "/restaurants", label: "Restaurants" },
  { href: "/weather", label: "Météo" },
  { href: "/webcam", label: "Webcam" },
];

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  let isHost = false;
  let initials: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, first_name, last_name")
      .eq("id", user.id)
      .single();
    isHost = profile?.role === "host";
    const firstInitial = profile?.first_name?.trim()?.[0] ?? "";
    const lastInitial = profile?.last_name?.trim()?.[0] ?? "";
    initials = (firstInitial + lastInitial).toUpperCase() || null;
  }

  const accountLinks = isHost
    ? [
        { href: "/account", label: "Compte" },
        { href: "/admin/users", label: "Utilisateurs" },
      ]
    : [{ href: "/account", label: "Compte" }];

  return (
    <html lang="fr" className={`${nunito.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900">
        {user && (
          <SiteHeader
            navLinks={NAV_LINKS}
            accountLinks={accountLinks}
            initials={initials}
            signOutAction={signOut}
          />
        )}
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
