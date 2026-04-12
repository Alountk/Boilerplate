"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { ShoppingCartIcon, BellIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const { user, logout, isAuthenticated, loading } = useAuth();
  const appVersion = process.env.NEXT_PUBLIC_APP_VERSION?.trim();

  return (
    <header className="w-full bg-white/90 dark:bg-slate-900/90 border-b border-slate-200 dark:border-slate-800 backdrop-blur-md transition-colors duration-300 sticky top-0 z-40">
      {/* Top Bar */}
      <div className="border-b border-slate-100 dark:border-slate-800">
        <div className="container mx-auto px-4 h-10 flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
          <div className="flex items-center gap-4 min-w-0">
            {loading ? (
              <div className="h-4 w-24 bg-slate-100 dark:bg-slate-800 animate-pulse rounded" />
            ) : isAuthenticated ? (
              <>
                <span className="truncate">Hi {user?.firstName}!</span>
                <button onClick={logout} className="hover:underline underline-offset-2">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <span>
                  Hi!{" "}
                  <Link
                    href="/login"
                    className="text-blue-700 dark:text-blue-300 hover:underline underline-offset-2"
                  >
                    Sign in
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/register"
                    className="text-blue-700 dark:text-blue-300 hover:underline underline-offset-2"
                  >
                    register
                  </Link>
                </span>
              </>
            )}
            <Link href="#" className="hover:underline underline-offset-2 hidden sm:block">
              Daily Deals
            </Link>
            <Link href="#" className="hover:underline underline-offset-2 hidden sm:block">
              Help & Contact
            </Link>
          </div>
          <div className="flex items-center gap-4">
            {appVersion && (
              <span
                className="hidden lg:inline-flex items-center rounded-full border border-slate-300 dark:border-slate-700 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:text-slate-300"
                aria-label={`Application version ${appVersion}`}
                title={`Version ${appVersion}`}
              >
                v{appVersion}
              </span>
            )}
            <Link href="#" className="hover:underline underline-offset-2 hidden md:block">
              Ship to
            </Link>
            <Link href="/create" className="hover:underline underline-offset-2 font-medium">
              Sell
            </Link>
            <Link href="/messages" className="hover:underline underline-offset-2 flex items-center gap-1">
              Messages
            </Link>
            <Link href="#" className="hover:underline underline-offset-2 hidden md:block">
              Watchlist
            </Link>
            <div className="flex items-center gap-2 ml-2">
              <button
                type="button"
                aria-label="Notifications"
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <BellIcon className="h-5 w-5" />
              </button>
              <button
                type="button"
                aria-label="Cart"
                className="p-1.5 rounded-md text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <ShoppingCartIcon className="h-5 w-5" />
              </button>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-6">
        <Link
          href="/"
          className="text-2xl md:text-3xl font-semibold tracking-tight text-slate-900 dark:text-slate-100 shrink-0"
        >
          vMarket
        </Link>

        <div className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search for anything"
              aria-label="Search for anything"
              className="w-full h-10 px-4 py-2 border border-slate-300 dark:border-slate-700 rounded-lg bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            aria-label="Filter by category"
            className="h-10 px-4 border border-slate-300 dark:border-slate-700 rounded-lg bg-slate-50 dark:bg-slate-900 text-sm text-slate-700 dark:text-slate-300 focus:outline-none focus:ring-2 focus:ring-blue-500 hidden lg:block"
          >
            <option>All Categories</option>
            <option>Videogames</option>
            <option>Consoles</option>
            <option>Accessories</option>
          </select>
          <button className="h-10 px-6 bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-500 text-white font-semibold rounded-lg transition-colors whitespace-nowrap">
            Search
          </button>
        </div>

        <Link
          href="#"
          className="text-sm text-slate-500 hover:text-slate-900 dark:hover:text-slate-100 transition-colors shrink-0 hidden md:block"
        >
          Advanced
        </Link>
      </div>
    </header>
  );
}
