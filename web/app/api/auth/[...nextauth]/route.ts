// web/app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import { connectMongo } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";

// Configure NextAuth options
export const authOptions: NextAuthOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        try {
          // Connect to MongoDB
          await connectMongo();

          // Find user by email
          const user = await User.findOne({
            email: credentials.email.toLowerCase().trim(),
          });

          if (!user) {
            return null; // User not found
          }

          // Compare password with bcrypt
          const isValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isValid) {
            return null; // Invalid password
          }

          // Return user data (this will be stored in the JWT)
          return {
            id: user._id.toString(), // Convert MongoDB ObjectId to string
            email: user.email,
            name: user.name || null,
          };
        } catch (error) {
          // Log error but don't expose details
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt", // Use JWT session strategy (no database adapter needed)
  },
  callbacks: {
    // Add user.id to the session object
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login", // Custom login page
  },
  // Note: You need to set these environment variables:
  // NEXTAUTH_SECRET: A random string (use: openssl rand -base64 32)
  // NEXTAUTH_URL: Your app URL (e.g., http://localhost:3000 for dev)
};

// Export the NextAuth handler
const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
