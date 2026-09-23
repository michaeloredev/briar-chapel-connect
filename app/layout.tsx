import type { Metadata } from "next";
import { Suspense } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import BreadcrumbsBar from "@/components/common/BreadcrumbsBar";
import BreadcrumbTitleProvider from "@/components/common/BreadcrumbTitleProvider";
import RoleProvider from "@/components/auth/RoleProvider";
import ThemeProvider from "@/components/theme/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Briar Chapel Connect - Your Neighborhood Hub",
  description:
    "Find local services, buy and sell items, discover community events in Briar Chapel",
};

// Applies the stored theme before the browser paints, so a dark-mode visitor
// never sees a white flash. Kept inline and dependency-free for that reason —
// anything imported would run after hydration, far too late.
const NO_FLASH_THEME_SCRIPT = `(function(){try{var s=localStorage.getItem('theme');var d=s?s==='dark':window.matchMedia('(prefers-color-scheme: dark)').matches;var c=document.documentElement.classList;c.toggle('dark',d);c.toggle('light',!d);}catch(e){}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider
      publishableKey={process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY}
      signInUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_IN_URL}
      signUpUrl={process.env.NEXT_PUBLIC_CLERK_SIGN_UP_URL}
      afterSignInUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL}
      afterSignUpUrl={process.env.NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL}
    >
      <html lang="en" suppressHydrationWarning>
        <head>
          <script dangerouslySetInnerHTML={{ __html: NO_FLASH_THEME_SCRIPT }} />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
        >
          <ThemeProvider>
            <RoleProvider>
              <BreadcrumbTitleProvider>
                <Header />
                <div className="bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
                  <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <Suspense fallback={null}>
                      <BreadcrumbsBar />
                    </Suspense>
                  </div>
                </div>
                {children}
              </BreadcrumbTitleProvider>
            </RoleProvider>
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
