import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import PostgresAdapter from "@auth/pg-adapter";
import { dbPool } from "@/lib/db";

const googleClientId = process.env.GOOGLE_CLIENT_ID?.trim();
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET?.trim();
const isGoogleConfigured = Boolean(googleClientId && googleClientSecret);
const authSecret =
  process.env.NEXTAUTH_SECRET?.trim() ||
  (process.env.NODE_ENV === "production" ? undefined : "resume-analyzer-local-development-secret");

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: dbPool ? PostgresAdapter(dbPool) : undefined,
  providers: isGoogleConfigured
    ? [
        Google({
          clientId: googleClientId || "",
          clientSecret: googleClientSecret || ""
        })
      ]
    : [],
  session: {
    strategy: dbPool ? "database" : "jwt"
  },
  pages: {
    signIn: "/signin"
  },
  secret: authSecret,
  callbacks: {
    session({ session, token, user }) {
      if (session.user) {
        session.user.id = user?.id || token?.sub || "";
      }

      return session;
    }
  },
  trustHost: true
});
