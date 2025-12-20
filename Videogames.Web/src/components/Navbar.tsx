"use client";

import Link from "next/link";
import { useAuth } from "../context/AuthContext";
import ThemeToggle from "./ThemeToggle";
import { ShoppingCartIcon, BellIcon } from "@heroicons/react/24/outline";

export default function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 transition-colors duration-300">
      {/* Top Bar */}
      <div className="border-b border-gray-100 dark:border-gray-800">
        <div className="container mx-auto px-4 h-10 flex items-center justify-between text-xs text-gray-600 dark:text-gray-400">
          <div className="flex items-center gap-4">
            {isAuthenticated ? (
              <>
                <span>
                  Hi <span className="font-bold">{user?.firstName}</span>!
                </span>
                <button onClick={logout} className="hover:underline">
                  Sign out
                </button>
              </>
            ) : (
              <>
                <span>
                  Hi!{" "}
                  <Link
                    href="/login"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    Sign in
                  </Link>{" "}
                  or{" "}
                  <Link
                    href="/register"
                    className="text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    register
                  </Link>
                </span>
              </>
            )}
            <Link href="#" className="hover:underline hidden sm:block">
              Daily Deals
            </Link>
            <Link href="#" className="hover:underline hidden sm:block">
              Help & Contact
            </Link>
          </div>
          <div className="flex items-center gap-4">
            <Link href="#" className="hover:underline hidden md:block">
              Ship to
            </Link>
            <Link href="/create" className="hover:underline">
              Sell
            </Link>
            <Link href="#" className="hover:underline hidden md:block">
              Watchlist
            </Link>
            <div className="flex items-center gap-3 ml-2">
              <BellIcon className="h-5 w-5 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" />
              <ShoppingCartIcon className="h-5 w-5 cursor-pointer hover:text-gray-800 dark:hover:text-gray-200" />
              <ThemeToggle />
            </div>
          </div>
        </div>
      </div>

      {/* Main Header */}
      <div className="container mx-auto px-4 py-4 flex flex-col md:flex-row items-center gap-4 md:gap-8">
        <Link
          href="/"
          className="text-3xl font-bold bg-linear-to-r from-blue-600 via-red-500 to-yellow-500 bg-clip-text text-transparent italic shrink-0"
        >
          vMarket
        </Link>

        <div className="flex-1 w-full flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search for anything"
              className="w-full h-10 px-4 py-2 border border-blue-600/30 dark:border-gray-700 rounded-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select className="h-10 px-4 border border-gray-300 dark:border-gray-700 rounded-sm bg-gray-50 dark:bg-gray-800 text-sm text-gray-700 dark:text-gray-300 focus:outline-none hidden lg:block">
            <option>All Categories</option>
            <option>Videogames</option>
            <option>Consoles</option>
            <option>Accessories</option>
          </select>
          <button className="h-10 px-8 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-sm transition-colors whitespace-nowrap">
            Search
          </button>
        </div>

        <Link
          href="#"
          className="text-sm text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 transition-colors shrink-0 hidden md:block"
        >
          Advanced
        </Link>
      </div>
    </header>
  );
}
