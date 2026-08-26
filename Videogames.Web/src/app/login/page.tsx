"use client";

import { useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { EnvelopeIcon, EyeIcon, EyeSlashIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { scrollToFirstError } from "../../utils/formUtils";
import { useFormState } from "../../hooks/useFormState";
import { FieldFeedback } from "../../components/FieldFeedback";
import BlueprintGrid from "../../components/theme/BlueprintGrid";
import TitleBlock from "../../components/theme/TitleBlock";

type LoginForm = { email: string; password: string };
const initialValues: LoginForm = { email: "", password: "" };

function validateLoginForm(values: LoginForm): Partial<Record<keyof LoginForm, string>> {
  const next: Partial<Record<keyof LoginForm, string>> = {};
  if (!values.email.trim()) next.email = "Email is required";
  else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) next.email = "Invalid email format";
  if (!values.password) next.password = "Password is required";
  return next;
}

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const { login } = useAuth();
  const router = useRouter();

  const { values, showFieldError, handleChange, setSubmitAttempted, runValidation, setErrors } =
    useFormState({ initialValues, validate: validateLoginForm });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const fieldErrors = runValidation();
    setErrors(fieldErrors);
    if (Object.keys(fieldErrors).length > 0) {
      scrollToFirstError();
      return;
    }
    try {
      await login({ email: values.email, password: values.password });
      router.push("/");
    } catch (err) {
      setError("Invalid email or password");
      console.error(err);
    }
  };

  const inputCls = (hasError: boolean) =>
    `w-full border bg-surface-2/60 py-3.5 pl-12 pr-4 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors ${
      hasError ? "border-error focus:ring-1 focus:ring-error" : "border-outline focus:border-secondary"
    }`;

  return (
    <BlueprintGrid showCrosshairs className="min-h-screen bg-surface text-on-surface">
      {/* Title block */}
      <div className="mx-auto w-full max-w-md px-6 pt-6">
        <TitleBlock code="VMKT-BP-AUTH" rev="C" date="LOGIN" />
      </div>

      <main className="grow flex items-center justify-center px-6 py-10">
        <div data-testid="auth-shell" className="w-full max-w-md">
          {/* Brand */}
          <div className="mb-8 text-center">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary">PLAYER_ACCESS</p>
            <h1 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-3xl font-bold tracking-tighter text-on-surface">
              vMarket
            </h1>
            <p className="mt-1 font-mono text-xs uppercase tracking-widest text-on-surface-muted">
              Access your gamer account
            </p>
          </div>

          {/* Card */}
          <div className="border border-outline bg-surface-1/40 p-6 md:p-8">
            <div className="mb-6">
              <h2 className="mb-1 font-[family-name:var(--font-space-grotesk)] text-xl font-bold tracking-tight text-on-surface">
                Welcome Back
              </h2>
              <p className="text-sm text-on-surface-muted">
                Sign in to manage your listings and messages.
              </p>
            </div>

            {error && (
              <div role="alert" className="mb-6 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-6">
              {/* Email */}
              <div className="space-y-2">
                <label htmlFor="email" className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block px-1">
                  Email Address
                </label>
                <div className="relative">
                  <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={values.email}
                    onChange={handleChange}
                    className={inputCls(!!showFieldError("email"))}
                    aria-invalid={!!showFieldError("email")}
                    aria-describedby={showFieldError("email") ? "email-error" : undefined}
                    placeholder="player@vmarket.com"
                    autoComplete="email"
                  />
                </div>
                <FieldFeedback id="email-error" message={showFieldError("email")} />
              </div>

              {/* Password */}
              <div className="space-y-2">
                <div className="flex justify-between items-center px-1">
                  <label htmlFor="password" className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <LockClosedIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? "text" : "password"}
                    value={values.password}
                    onChange={handleChange}
                    className={inputCls(!!showFieldError("password"))}
                    aria-invalid={!!showFieldError("password")}
                    aria-describedby={showFieldError("password") ? "password-error" : undefined}
                    placeholder="••••••••"
                    autoComplete="current-password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-on-surface-muted transition-colors hover:text-on-surface"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeSlashIcon className="h-5 w-5" /> : <EyeIcon className="h-5 w-5" />}
                  </button>
                </div>
                <FieldFeedback id="password-error" message={showFieldError("password")} />
              </div>

              {/* CTA */}
              <button
                type="submit"
                className="w-full min-h-12 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
              >
                SIGN IN TO VMARKET
              </button>
            </form>

            {/* Divider */}
            <div className="my-8 flex items-center gap-4" aria-hidden="true">
              <div className="grow h-px bg-outline" />
              <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
                Or continue with
              </span>
              <div className="grow h-px bg-outline" />
            </div>

            {/* Social (FEATURE-PENDING — restyled, stays disabled) */}
            <div className="grid grid-cols-2 gap-4">
              <button type="button" disabled className="flex min-h-12 items-center justify-center gap-2 border border-outline bg-surface-2/60 px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted opacity-60 cursor-not-allowed">
                Google
              </button>
              <button type="button" disabled className="flex min-h-12 items-center justify-center gap-2 border border-outline bg-surface-2/60 px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted opacity-60 cursor-not-allowed">
                Apple
              </button>
            </div>

            {/* Footer link */}
            <p className="mt-8 text-center text-sm text-on-surface-muted">
              New to the marketplace?{" "}
              <Link href="/register" className="font-bold text-secondary hover:underline">
                Create an account
              </Link>
            </p>
          </div>
        </div>
      </main>

      <footer className="py-6 text-center">
        <p className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">
          © {new Date().getFullYear()} vMarket.
        </p>
      </footer>
    </BlueprintGrid>
  );
}
