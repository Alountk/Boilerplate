import type { Metadata } from "next";
import { Manrope } from "next/font/google";
import Script from "next/script";
import Providers from "../components/Providers";
import "./globals.css";

const manrope = Manrope({ subsets: ["latin"], variable: "--font-manrope" });
const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "";
const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? "";
const shouldLoadAppleScript = Boolean(appleClientId && appleRedirectUri);

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
        {/* Material Symbols icon font — not available via next/font/google */}
        {/* eslint-disable-next-line @next/next/no-page-custom-font */}
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap"
        />
        {/* Apple Sign In JS SDK */}
        {shouldLoadAppleScript ? (
          <Script
            src="https://appleid.cdn-apple.com/appleauth/static/jsapi/appleid/1/en_US/appleid.auth.js"
            strategy="beforeInteractive"
          />
        ) : null}
        <meta name="appleid-signin-client-id" content={appleClientId} />
        <meta name="appleid-signin-scope" content="name email" />
        <meta name="appleid-signin-redirect-uri" content={appleRedirectUri} />
        <meta name="appleid-signin-use-popup" content="true" />
      </head>
      <body className={`${manrope.variable} font-[family-name:var(--font-manrope)] bg-surface text-on-surface min-h-screen`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
