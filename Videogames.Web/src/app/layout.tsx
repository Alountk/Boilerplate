import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";
import { ChatProvider } from "../context/ChatContext";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });

export const metadata: Metadata = {
  title: "vMarket — The Curator's Marketplace",
  description:
    "Buy, sell, and trade videogames, accessories, and collectibles.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <head>
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
      </head>
      <body className={`${manrope.variable} font-[family-name:var(--font-manrope)] bg-surface text-on-surface min-h-screen`}>
        <AuthProvider>
          <ChatProvider>
            <Navbar />
            <main className="min-h-[calc(100vh-68px)]">{children}</main>
          </ChatProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
