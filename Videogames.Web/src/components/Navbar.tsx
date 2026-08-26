"use client";

import Link from "next/link";
import { MagnifyingGlassIcon, ShoppingCartIcon, UserCircleIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../context/AuthContext";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION?.trim();

  return (
    <header className="w-full top-0 sticky z-50 glass-surface glass-border border-x-0 border-t-0">
      <div className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-6 min-w-0">
            <Link
              href="/"
              className="text-xl sm:text-2xl font-bold text-on-surface tracking-tighter whitespace-nowrap shrink-0"
            >
              vMarket
            </Link>
            <nav aria-label="Main navigation" className="hidden md:flex items-center gap-6">
              <Link
                href="/"
                className="text-primary font-bold border-b-2 border-primary-container pb-1 hover:text-on-surface transition-colors duration-200"
              >
                Explore
              </Link>
              <button type="button" className="text-on-surface-variant hover:text-on-surface transition-colors cursor-not-allowed opacity-60" aria-disabled="true" title="Coming soon">
                Consoles
              </button>
              <button type="button" className="text-on-surface-variant hover:text-on-surface transition-colors cursor-not-allowed opacity-60" aria-disabled="true" title="Coming soon">
                Deals
              </button>
            </nav>
          </div>

          <div className="flex-1 max-w-md mx-8 hidden lg:block">
            <div className="relative flex items-center">
              <MagnifyingGlassIcon className="absolute left-3 h-5 w-5 text-on-surface-variant" />
              <input
                className="w-full bg-surface-container-highest border-none rounded-xl py-2 pl-10 pr-4 text-sm focus:ring-1 focus:ring-primary placeholder:text-on-surface-variant/60 outline-none"
                placeholder="Search games, consoles, accessories..."
                type="text"
                aria-label="Search"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-4 shrink-0">
            {appVersion && (
              <span
                className="hidden xl:inline-flex items-center rounded-full border border-outline-variant/40 bg-surface-container px-2 py-0.5 text-[10px] font-bold text-on-surface-variant tracking-widest uppercase"
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
                    href="/dashboard"
                    className="text-on-surface-variant hover:text-on-surface transition-colors hidden md:block"
                  >
                    Dashboard
                  </Link>
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
              className="inline-flex bg-primary-container text-on-primary-container px-4 sm:px-6 py-2 rounded-xl font-bold text-sm scale-95 hover:scale-100 duration-200 transition-all"
            >
              Sell Now
            </Link>

            <div className="flex items-center gap-3 text-on-surface-variant">
              <ShoppingCartIcon className="h-6 w-6 hover:text-on-surface cursor-pointer" aria-label="Shopping cart" />
              <Link href={isAuthenticated ? "/profile" : "/login"} aria-label="Account">
                <UserCircleIcon className="h-7 w-7 hover:text-on-surface cursor-pointer" aria-hidden="true" />
              </Link>
            </div>
          </div>
        </div>

        <div className="md:hidden flex items-center justify-between gap-3 pt-3 text-sm">
          <Link href="/" className="text-primary font-semibold hover:text-on-surface transition-colors">
            Explore
          </Link>
          {loading ? (
            <div className="h-4 w-24 bg-surface-container animate-pulse rounded" />
          ) : isAuthenticated ? (
            <>
              <Link href="/dashboard" className="text-on-surface-variant hover:text-on-surface transition-colors">
                Dashboard
              </Link>
              <Link href="/messages" className="text-on-surface-variant hover:text-on-surface transition-colors">
                Messages
              </Link>
            </>
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

