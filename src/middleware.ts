import NextAuth from "next-auth";
import { auth } from "@/auth";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export default auth((req: any) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith("/dashboard");
  const isOnLogin = req.nextUrl.pathname.startsWith("/login");
  
  if (isOnDashboard) {
    if (isLoggedIn) return NextResponse.next();
    return NextResponse.redirect(new URL("/login", req.nextUrl)); // Redirect unauthenticated users to login page
  } else if (isLoggedIn && isOnLogin) {
    return NextResponse.redirect(new URL("/dashboard", req.nextUrl)); // Redirect authenticated users to dashboard
  }
  
  return NextResponse.next();
});

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};
