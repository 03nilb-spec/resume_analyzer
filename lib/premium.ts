import type { Session } from "next-auth";

export function isPremiumSession(session: Session | null) {
  const email = session?.user?.email?.toLowerCase();
  const allowlist = process.env.PREMIUM_USER_EMAILS?.split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);

  return Boolean(email && allowlist?.includes(email));
}

