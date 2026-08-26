import type { Metadata } from "next";
import { Space_Grotesk, JetBrains_Mono } from "next/font/google";
import Script from "next/script";
import Providers from "../components/Providers";
import "./globals.css";

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-space-grotesk",
});

const jetBrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-jetbrains-mono",
});

const appleClientId = process.env.NEXT_PUBLIC_APPLE_CLIENT_ID ?? "";
const appleRedirectUri = process.env.NEXT_PUBLIC_APPLE_REDIRECT_URI ?? "";
const shouldLoadAppleScript = Boolean(appleClientId && appleRedirectUri);

export const metadata: Metadata = {
  title: "vMarket — The Curator's Marketplace",
  description:
    "Buy, sell, and trade videogames, accessories, and collectibles.",
};

/**
 * Anti-FOUC pre-paint script. Runs synchronously in the document head, before
 * React hydration or first paint, and sets `<html data-theme="…">` from
 * `localStorage["vmarket-theme"]`. Invalid stored values fall back to the
 * default `blueprint`. The known id set MUST stay in sync with
 * `src/components/theme/registry.ts` (`THEME_IDS`).
 */
const prePaintScript = `(function () {
  var DEFAULT = 'blueprint';
  var KNOWN = ['blueprint', 'neon-arcade', 'indigo-v2'];
  var KEY = 'vmarket-theme';
  var theme = DEFAULT;
  try {
    var stored = window.localStorage.getItem(KEY);
    if (stored && KNOWN.indexOf(stored) !== -1) {
      theme = stored;
    } else if (stored) {
      window.localStorage.removeItem(KEY);
    }
  } catch (e) {
    theme = DEFAULT;
  }
  document.documentElement.setAttribute('data-theme', theme);
})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
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
      <body
        className={`${spaceGrotesk.variable} ${jetBrainsMono.variable} bg-surface text-on-surface font-[family-name:var(--font-space-grotesk)] min-h-screen`}
      >
        <script dangerouslySetInnerHTML={{ __html: prePaintScript }} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
