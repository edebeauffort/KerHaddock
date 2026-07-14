import type { NextConfig } from "next";

// Memory cover photos live in Supabase Storage — allow next/image to
// optimize images served from that project's storage host. Falls back to
// no remote patterns (broken images, not a crash) if the env var isn't set
// at build time yet.
function supabaseImageHost() {
  try {
    return new URL(process.env.NEXT_PUBLIC_SUPABASE_URL ?? "").hostname;
  } catch {
    return null;
  }
}

const supabaseHost = supabaseImageHost();

const nextConfig: NextConfig = {
  // Memory cover photos are uploaded through a Server Action — the default
  // 1MB body limit is too small for a real phone photo.
  experimental: {
    serverActions: {
      bodySizeLimit: "10mb",
    },
  },
  images: {
    remotePatterns: supabaseHost
      ? [
          {
            protocol: "https",
            hostname: supabaseHost,
            pathname: "/storage/v1/object/public/**",
          },
        ]
      : [],
  },
};

export default nextConfig;
