"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { scrollToFirstError } from "../../utils/formUtils";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const validate = () => {
    const next: { email?: string; password?: string } = {};
    if (!email.trim()) next.email = "Email is required";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = "Invalid email format";
    if (!password) next.password = "Password is required";
    return next;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const errors = validate();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) {
      scrollToFirstError();
      return;
    }
    try {
      await login({ email, password });
      router.push("/");
    } catch (err) {
      setError("Invalid email or password");
      console.error(err);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 transition-all duration-200 text-sm outline-none ${
      hasError ? "focus:ring-error ring-1 ring-error" : "focus:ring-primary"
    }`;

  return (
    <div className="fixed inset-0 bg-surface text-on-surface flex flex-col overflow-auto">
      {/* Background orbs */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-[10%] -left-[5%] w-[60%] h-[60%] rounded-full bg-primary-container/10 blur-[120px]" />
        <div className="absolute -bottom-[10%] -right-[5%] w-[50%] h-[50%] rounded-full bg-surface-container-highest/20 blur-[100px]" />
      </div>

      {/* Main content */}
      <main className="relative z-10 grow flex items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Brand */}
          <div className="text-center mb-10">
            <h1 className="text-3xl font-black italic tracking-tighter text-on-surface mb-2">
              vMarket
            </h1>
            <p className="text-on-surface-variant font-medium tracking-tight">
              Access your gamer account
            </p>
          </div>

          {/* Card */}
          <div className="bg-surface-container-low p-8 rounded-xl shadow-2xl">
            <div className="mb-8">
              <h2 className="text-xl font-bold text-on-surface tracking-tight mb-1">
                Welcome Back
              </h2>
              <p className="text-on-surface-variant text-sm">
                Sign in to manage your listings and messages.
              </p>
            </div>

            {error && (
              <div className="mb-6 rounded-md bg-error-container/30 border border-error/30 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block px-1">
                  Email Address
                </label>
                <div className="relative group">
                  <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (submitAttempted) setFieldErrors(validate());
                    }}
                    className={inputCls(!!fieldErrors.email)}
                    aria-invalid={!!fieldErrors.email}
                    placeholder="player@vmarket.com"
                  />
                </div>
                {fieldErrors.email && (
                  <p className="text-xs text-error px-1">{fieldErrors.email}</p>
                )}
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant">
                    Password
                  </label>
                  {/* FEATURE-PENDING: forgot password */}
                </div>
                <div className="relative group">
                  <LockClosedIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (submitAttempted) setFieldErrors(validate());
                    }}
                    className={inputCls(!!fieldErrors.password)}
                    aria-invalid={!!fieldErrors.password}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-outline hover:text-on-surface"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                {fieldErrors.password && (
                  <p className="text-xs text-error px-1">{fieldErrors.password}</p>
                )}
              </div>

              {/* CTA */}
              <button
                type="submit"
                className="indigo-gradient w-full py-4 rounded-md text-on-primary-container font-bold text-sm tracking-wide shadow-lg shadow-primary-container/20 hover:scale-[1.01] active:scale-95 transition-all duration-200"
              >
                Sign In to vMarket
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center my-8 gap-4">
              <div className="grow h-px bg-outline-variant/20" />
              <span className="text-[0.6875rem] uppercase tracking-widest font-bold text-outline">
                Or continue with
              </span>
              <div className="grow h-px bg-outline-variant/20" />
            </div>

            {/* Social (FEATURE-PENDING) */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 py-3 bg-surface-container-highest rounded-md text-on-surface-variant text-sm font-bold opacity-40 cursor-not-allowed"
              >
                Google
              </button>
              <button
                type="button"
                disabled
                className="flex items-center justify-center gap-2 py-3 bg-surface-container-highest rounded-md text-on-surface-variant text-sm font-bold opacity-40 cursor-not-allowed"
              >
                Apple
              </button>
            </div>

            {/* Footer link */}
            <p className="mt-8 text-center text-sm text-on-surface-variant">
              New to the marketplace?{" "}
              <Link
                href="/register"
                className="text-primary font-bold hover:text-primary-fixed transition-colors"
              >
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="relative z-10 text-center py-6">
        <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-outline">
          © {new Date().getFullYear()} vMarket. Built for gamers.
        </p>
      </footer>

      <div className="hidden lg:block fixed left-12 top-1/2 -translate-y-1/2 space-y-8 opacity-20 select-none z-0">
        <span className="text-[0.6875rem] uppercase tracking-[0.5em] font-bold block rotate-180" style={{ writingMode: "vertical-rl" }}>
          PLAYER_ACCESS
        </span>
        <div className="w-px h-32 bg-outline-variant mx-auto" />
        <span className="text-[0.6875rem] uppercase tracking-[0.5em] font-bold block rotate-180" style={{ writingMode: "vertical-rl" }}>
          GAMER_PROFILE
        </span>
      </div>

      <div className="hidden xl:block fixed right-0 top-0 bottom-0 w-1/3 z-0 pointer-events-none opacity-40">
        <div className="h-full w-full bg-surface-container-low flex items-center justify-center p-20">
          <div className="w-full h-full rounded-xl overflow-hidden grayscale">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              alt="Gaming desk artwork"
              className="w-full h-full object-cover mix-blend-overlay opacity-30"
              src="/assets/backgrounds/login-gaming-desk.jpg"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
