import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

async function getUser(email: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { email },
      include: {
        partner: true, // Legacy support
        memberships: {
           include: {
               project: { select: { id: true, title: true, acronym: true } }
           }
        }
      }
    });
    return user;
  } catch (error) {
    console.error("Failed to fetch user:", error);
    throw new Error("Failed to fetch user.");
  }
}

export const { auth, signIn, signOut, handlers } = NextAuth({
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async session({ session, token }: any) {
      if (token?.sub && session.user) {
        session.user.id = token.sub;
        // Pass memberships to session for client-side use (dashboard, sidebar)
        session.user.memberships = token.memberships; 
      }
      return session;
    },
    async jwt({ token, user }: any) {
      if (user) {
        token.sub = user.id;
        // Store lightweight membership info
        token.memberships = user.memberships?.map((m: any) => ({
            projectId: m.projectId,
            role: m.role,
            projectAcronym: m.project.acronym
        })) || [];
      }
      return token;
    },
  },
  providers: [
    Credentials({
        name: "Credentials",
        credentials: {
          email: { label: "Email", type: "email" },
          password: { label: "Password", type: "password" }
        },
        authorize: async (credentials) => {
            const parsedCredentials = z
              .object({ email: z.string().email(), password: z.string().min(6) })
              .safeParse(credentials);
    
            if (parsedCredentials.success) {
              const { email, password } = parsedCredentials.data;
              const user = await getUser(email);
              if (!user) return null;
              
              const passwordsMatch = await bcrypt.compare(password, user.password);
              if (passwordsMatch) return user;
            }
            
            console.log("Invalid credentials");
            return null;
        },
      }),
  ],
});
