import Credentials from "@auth/core/providers/credentials";
import type { ExpressAuthConfig } from "@auth/express";

import { authenticateAccount } from "./store.js";

export const authConfig: ExpressAuthConfig = {
  secret: process.env.AUTH_SECRET ?? "development-only-change-me",
  trustHost: true,
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (
          typeof credentials.email !== "string" ||
          typeof credentials.password !== "string"
        ) {
          return null;
        }

        const user = authenticateAccount(
          credentials.email,
          credentials.password,
        );
        return user
          ? { id: user.id, email: user.email, name: user.name }
          : null;
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user?.id) token.id = user.id;
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) session.user.id = String(token.id);
      return session;
    },
  },
};
