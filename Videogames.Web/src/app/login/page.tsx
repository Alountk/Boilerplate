"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { scrollToFirstError } from "../../utils/formUtils";
import { useGoogleLogin } from "@react-oauth/google";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, loginWithGoogle, loginWithApple } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");
  const [fieldErrors, setFieldErrors] = useState<{ email?: string; password?: string }>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"google" | "apple" | null>(null);

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

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setOauthLoading("google");
      try {
        // Exchange access_token for user info and get an ID token via backend
        // useGoogleLogin with flow='implicit' returns access_token; use it directly
        await loginWithGoogle(tokenResponse.access_token);
        router.push("/");
      } catch {
        setError("Google sign-in failed. Please try again.");
      } finally {
        setOauthLoading(null);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed.");
    },
    flow: "implicit",
  });

  const handleAppleLogin = () => {
    // Apple Sign In uses a script injected globally; we trigger the popup here
    if (typeof window !== "undefined" && (window as unknown as Record<string, unknown>).AppleID) {
      setOauthLoading("apple");
      (
        (window as unknown as Record<string, { auth: { signIn: () => Promise<{ authorization: { id_token: string } }> } }>).AppleID
      ).auth
        .signIn()
        .then(async (data) => {
          try {
            await loginWithApple(data.authorization.id_token);
            router.push("/");
          } catch {
            setError("Apple sign-in failed. Please try again.");
          } finally {
            setOauthLoading(null);
          }
        })
        .catch(() => {
          setError("Apple sign-in was cancelled or failed.");
          setOauthLoading(null);
        });
    } else {
      setError("Apple Sign In is not available in this browser.");
    }
  };

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
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">
                    mail
                  </span>
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
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">
                    lock
                  </span>
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
                    <span className="material-symbols-outlined text-lg">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
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

            {/* Social */}
            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => googleLogin()}
                disabled={oauthLoading !== null}
                className="flex items-center justify-center gap-2 py-3 bg-surface-container-highest rounded-md text-on-surface-variant text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {oauthLoading === "google" ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Google
              </button>
              <button
                type="button"
                onClick={handleAppleLogin}
                disabled={oauthLoading !== null}
                className="flex items-center justify-center gap-2 py-3 bg-surface-container-highest rounded-md text-on-surface-variant text-sm font-bold hover:bg-surface-container-high transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {oauthLoading === "apple" ? (
                  <span className="material-symbols-outlined text-sm animate-spin">progress_activity</span>
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/>
                  </svg>
                )}
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
              src="https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=1200&q=80"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
