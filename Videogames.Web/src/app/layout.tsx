import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "vMarket - The Ultimate Videogame Marketplace",
  description:
    "Buy, sell, and trade videogames, accessories, and merchandising.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${montserrat.className} bg-white dark:bg-gray-900 transition-colors duration-300`}
      >
        <AuthProvider>
          <Navbar />
          <main className="min-h-[calc(100vh-140px)]">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
