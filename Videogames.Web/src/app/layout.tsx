import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Providers from "../components/Providers";
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
        {/* Apple Sign In JS SDK */}
        {/* eslint-disable-next-line @next/next/no-sync-scripts */}
        <script
          type="text/javascript"
          src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
        />
        <meta name="appleid-signin-client-id" content={process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? ""} />
        <meta name="appleid-signin-scope" content="name email" />
        <meta name="appleid-signin-redirect-uri" content={process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? "https://localhost"} />
        <meta name="appleid-signin-use-popup" content="true" />
      </head>
      <body className={`${manrope.variable} font-[family-name:var(--font-manrope)] bg-surface text-on-surface min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
