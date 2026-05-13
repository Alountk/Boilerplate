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

const minioOrigin = "https://s3.androemda-surf.uk";
const rawgApiOrigin = "https://api.rawg.io";
const rawgMediaOrigin = "https://media.rawg.io";
const apiOrigin = parseOrigin(process.env.NEXT_PUBLIC_API_URL);
const minioHostname = parseHostname(minioOrigin);
const apiHostname = parseHostname(process.env.NEXT_PUBLIC_API_URL);

const connectSrc = ["'self'", apiOrigin, minioOrigin, rawgApiOrigin].filter(Boolean).join(" ");
const imgSrc = ["'self'", "data:", "blob:", apiOrigin, minioOrigin, rawgMediaOrigin].filter(Boolean).join(" ");

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
            value: [
              "default-src 'self'",
              "base-uri 'self'",
              "object-src 'none'",
              `img-src ${imgSrc}`,
              `connect-src ${connectSrc}`,
              "font-src 'self' data:",
              "style-src 'self' 'unsafe-inline'",
              "script-src 'self' 'unsafe-inline' 'unsafe-eval'",
              "frame-ancestors 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;