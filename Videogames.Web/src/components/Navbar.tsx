"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION?.trim();

  return (
    <header className="w-full top-0 sticky z-50 bg-surface-container-low/95 backdrop-blur-md border-b border-outline-variant/25">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between gap-4 py-3">
          <div className="flex items-center gap-4 sm:gap-6 min-w-0">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-on-surface tracking-tighter whitespace-nowrap shrink-0"
            >
              vMarket
            </Link>
            <nav className="hidden lg:flex items-center gap-6">
              <Link
                href="/"
                className="text-primary font-bold border-b-2 border-primary-container pb-1 hover:text-on-surface transition-colors duration-200"
              >
                Browse
              </Link>
              {/* FEATURE-PENDING: Collectibles category page */}
              {false && <span className="text-on-surface-variant">Collectibles</span>}
              {/* FEATURE-PENDING: Antiques category page */}
              {false && <span className="text-on-surface-variant">Antiques</span>}
            </nav>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {appVersion && (
              <span
                className="hidden lg:inline-flex items-center rounded-full border border-outline-variant/40 bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant tracking-widest uppercase"
                aria-label={`Application version ${appVersion}`}
              >
                v{appVersion}
              </span>
            )}

            <div className="hidden md:flex items-center gap-3 text-sm">
              {loading ? (
                <div className="h-4 w-20 bg-surface-container animate-pulse rounded" />
              ) : isAuthenticated ? (
                <>
                  <span className="text-on-surface-variant hidden sm:block">
                    Hi {user?.firstName}!
                  </span>
                  <button
                    onClick={logout}
                    className="text-on-surface-variant hover:text-on-surface transition-colors"
                  >
                    Sign out
                  </button>
                  <Link
                    href="/messages"
                    className="text-on-surface-variant hover:text-on-surface transition-colors hidden md:block"
                  >
                    Messages
                  </Link>
                </>
              ) : (
                <span className="text-on-surface-variant">
                  <Link
                    href="/login"
                    className="text-on-surface hover:text-primary transition-colors"
                  >
                    Sign in
                  </Link>
                  {" "}&nbsp;or{" "}&nbsp;
                  <Link
                    href="/register"
                    className="text-on-surface hover:text-primary transition-colors"
                  >
                    register
                  </Link>
                </span>
              )}
            </div>

            <Link
              href="/create"
              className="inline-flex bg-primary-container text-on-primary-container px-4 sm:px-5 py-2 rounded-xl font-bold text-sm scale-95 hover:scale-100 duration-200 transition-all"
            >
              Sell
            </Link>

            <div className="flex items-center gap-3 text-on-surface-variant">
              {/* FEATURE-PENDING: Shopping cart */}
              {false && (
                <span className="material-symbols-outlined hover:text-on-surface cursor-pointer">shopping_cart</span>
              )}
              <Link href={isAuthenticated ? "/profile" : "/login"} aria-label="Account">
                <span className="material-symbols-outlined hover:text-on-surface cursor-pointer text-[26px]">account_circle</span>
              </Link>
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-between gap-3 pb-3 text-sm">
          <Link href="/" className="text-primary font-semibold hover:text-on-surface transition-colors">
            Browse
          </Link>
          {loading ? (
            <div className="h-4 w-24 bg-surface-container animate-pulse rounded" />
          ) : isAuthenticated ? (
            <Link href="/messages" className="text-on-surface-variant hover:text-on-surface transition-colors">
              Messages
            </Link>
          ) : (
            <Link href="/login" className="text-on-surface-variant hover:text-on-surface transition-colors">
              Sign in
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}

