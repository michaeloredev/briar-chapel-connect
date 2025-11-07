import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
// @ts-expect-error Global CSS import is allowed in Next.js app directory
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { Breadcrumbs } from "@/components/common/Breadcrumbs";
import { defaultLabelOverrides } from "@/components/common/Breadcrumbs";

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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased`}
        >
          <Header />
          <div className="bg-linear-to-b from-slate-50 to-slate-100 dark:from-slate-900 dark:to-slate-800">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <Breadcrumbs labelOverrides={defaultLabelOverrides} />
            </div>
          </div>
          {children}
        </body>
      </html>
    </ClerkProvider>
  );
}
