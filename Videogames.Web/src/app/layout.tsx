import { ThemeModeScript } from "flowbite-react";
import type { Metadata } from "next";
import { Montserrat } from "next/font/google";
import Navbar from "../components/Navbar";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";
import Contact from "@/components/Contact";

const montserrat = Montserrat({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Videogames DB",
  description: "A database of videogames",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <ThemeModeScript />
      </head>
      <body className={montserrat.className}>
        <AuthProvider>
          <Contact />
          {/* <Navbar /> */}
          <main className="container mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}
