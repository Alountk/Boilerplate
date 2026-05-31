import type { NextConfig } from "next";

const parseOrigin = (value?: string): string | null => {
  if (!value) return null;
  try {
    return new URL(value).origin;
  } catch {
    return null;
  }
};

const parseHostname = (value?: string): string | null => {
  if (!value) return null;
  try {
    return new URL(value).hostname;
  } catch {
    return null;
  }
};

const toProtocolOrigin = (value: string | null, protocol: "ws:" | "wss:"): string | null => {
  if (!value) return null;
  try {
    const url = new URL(value);
    url.protocol = protocol;
    return url.origin;
  } catch {
    return null;
  }
};

const minioOrigin = "https://s3.androemda-surf.uk";
const rawgApiOrigin = "https://api.rawg.io";
const rawgMediaOrigin = "https://media.rawg.io";
const apiOrigin = parseOrigin(process.env.NEXT_PUBLIC_API_URL);
const minioHostname = parseHostname(minioOrigin);
const apiHostname = parseHostname(process.env.NEXT_PUBLIC_API_URL);
const apiWsOrigin = toProtocolOrigin(apiOrigin, "ws:");
const apiWssOrigin = toProtocolOrigin(apiOrigin, "wss:");
const googleFontsStylesOrigin = "https://fonts.googleapis.com";
const googleFontsAssetsOrigin = "https://fonts.gstatic.com";
const googleAccountsOrigin = "https://accounts.google.com";
const appleAuthScriptOrigin = "https://appleid.cdn-apple.com";
const appleIdentityOrigin = "https://appleid.apple.com";
const enforceStrictCsp = process.env.CSP_STRICT_ENFORCE === "true";

const connectSrc = [
  "'self'",
  apiOrigin,
  apiWsOrigin,
  apiWssOrigin,
  minioOrigin,
  rawgApiOrigin,
  googleAccountsOrigin,
  appleIdentityOrigin,
]
  .filter(Boolean)
  .join(" ");
const imgSrc = ["'self'", "data:", "blob:", apiOrigin, minioOrigin, rawgMediaOrigin].filter(Boolean).join(" ");
const fontSrc = ["'self'", "data:", googleFontsAssetsOrigin].join(" ");
const styleSrc = ["'self'", "'unsafe-inline'", googleFontsStylesOrigin].join(" ");
const strictStyleSrc = ["'self'", googleFontsStylesOrigin].join(" ");
const scriptSrc = ["'self'", "'unsafe-inline'", appleAuthScriptOrigin, googleAccountsOrigin].join(" ");
const strictScriptSrc = ["'self'", appleAuthScriptOrigin, googleAccountsOrigin].join(" ");
const frameSrc = ["'self'", googleAccountsOrigin, appleIdentityOrigin].join(" ");

const buildCsp = (options: { strictInline: boolean }) => {
  const selectedStyleSrc = options.strictInline ? strictStyleSrc : styleSrc;
  const selectedScriptSrc = options.strictInline ? strictScriptSrc : scriptSrc;

  return [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    `img-src ${imgSrc}`,
    `connect-src ${connectSrc}`,
    `font-src ${fontSrc}`,
    `style-src ${selectedStyleSrc}`,
    `script-src ${selectedScriptSrc}`,
    `frame-src ${frameSrc}`,
    "frame-ancestors 'self'",
  ].join("; ");
};

const nextConfig: NextConfig = {
  output: "standalone",
  images: {
    remotePatterns: [
      ...(minioHostname
        ? [
            {
              protocol: "https" as const,
              hostname: minioHostname,
            },
          ]
        : []),
      ...(apiHostname
        ? [
            {
              protocol: "https" as const,
              hostname: apiHostname,
            },
          ]
        : []),
    ],
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          {
            key: "Content-Security-Policy",
            value: buildCsp({ strictInline: enforceStrictCsp }),
          },
          {
            key: "Content-Security-Policy-Report-Only",
            value: buildCsp({ strictInline: true }),
          },
        ],
      },
    ];
  },
};

export default nextConfig;