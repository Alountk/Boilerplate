"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EyeIcon,
  EyeSlashIcon,
  EnvelopeIcon,
  HomeIcon,
  IdentificationIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { scrollToFirstError } from "../../utils/formUtils";
import { useFormState } from "../../hooks/useFormState";
import { FieldFeedback } from "../../components/FieldFeedback";
import BlueprintGrid from "../../components/theme/BlueprintGrid";
import TitleBlock from "../../components/theme/TitleBlock";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
  confirmPassword: string;
  address: string;
  city: string;
  country: string;
  phone: string;
};

type FieldKey = keyof RegisterForm;

const initialValues: RegisterForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  confirmPassword: "",
  address: "",
  city: "",
  country: "",
  phone: "",
};

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function validateRegisterForm(values: RegisterForm): Partial<Record<FieldKey, string>> {
  const next: Partial<Record<FieldKey, string>> = {};

  const first = values.firstName.trim();
  if (!first) next.firstName = "First name is required.";
  else if (first.length > 100) next.firstName = "Must be at most 100 characters.";

  const last = values.lastName.trim();
  if (!last) next.lastName = "Last name is required.";
  else if (last.length > 100) next.lastName = "Must be at most 100 characters.";

  const email = values.email.trim();
  if (!email) next.email = "Email is required.";
  else if (!emailRegex.test(email)) next.email = "Enter a valid email address.";

  const pwd = values.password;
  if (!pwd) next.password = "Password is required.";
  else if (pwd.length < 8) next.password = "Use at least 8 characters.";
  else if (pwd.length > 100) next.password = "Must be at most 100 characters.";

  const confirmPwd = values.confirmPassword;
  if (!confirmPwd) next.confirmPassword = "Please confirm your password.";
  else if (pwd !== confirmPwd) next.confirmPassword = "Passwords do not match.";

  if (values.address.trim().length > 200) next.address = "Must be at most 200 characters.";
  if (values.city.trim().length > 100) next.city = "Must be at most 100 characters.";
  if (values.country.trim().length > 100) next.country = "Must be at most 100 characters.";
  if (values.phone.trim().length > 20) next.phone = "Must be at most 20 characters.";

  return next;
}

const inputCls =
  "w-full border border-outline bg-surface-2/60 px-4 py-3 font-mono text-sm text-on-surface placeholder:text-on-surface-muted/50 outline-none transition-colors focus:border-secondary";

export default function RegisterPage() {
  const { register, sendRegistrationCode } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const validate = useCallback((form: RegisterForm) => validateRegisterForm(form), []);

  const {
    values,
    showFieldError,
    handleChange: formHandleChange,
    handleBlur,
    submitAttempted,
    setSubmitAttempted,
    setErrors,
    runValidation,
  } = useFormState<RegisterForm>({ initialValues, validate });

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      formHandleChange(e);
      setServerError("");
    },
    [formHandleChange]
  );

  const missingRequiredCount = useMemo(() => {
    const v = runValidation(values);
    const keys: FieldKey[] = ["firstName", "lastName", "email", "password", "confirmPassword"];
    return keys.filter((k) => v[k]).length;
  }, [runValidation, values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const fieldErrors = runValidation();
    setErrors(fieldErrors);
    const blocking: FieldKey[] = ["firstName", "lastName", "email", "password", "confirmPassword"];
    if (blocking.some((k) => fieldErrors[k]) || Object.keys(fieldErrors).length > 0) {
      scrollToFirstError();
      return;
    }

    try {
      const normalizedEmail = values.email.trim();

      await register({
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: normalizedEmail,
        password: values.password,
        address: values.address.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
        phone: values.phone.trim(),
      });

      let sent = true;
      try {
        await sendRegistrationCode(normalizedEmail);
      } catch (sendError) {
        sent = false;
        console.warn("Failed to send registration verification code", sendError);
      }

      router.push(`/register/confirm?email=${encodeURIComponent(normalizedEmail)}&sent=${sent}`);
    } catch (err: unknown) {
      setServerError("Registration failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <BlueprintGrid className="min-h-screen bg-surface text-on-surface">
      <div className="mx-auto w-full max-w-lg px-6 pt-6">
        <TitleBlock code="VMKT-BP-REG" rev="C" date="REGISTER" />
      </div>

      <section className="flex justify-center px-6 py-10">
        <div data-testid="auth-shell" className="w-full max-w-lg">
          <header className="mb-8">
            <p className="font-mono text-[10px] uppercase tracking-[0.3em] text-secondary">GAMER_COMMUNITY</p>
            <h2 className="mt-2 font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight text-on-surface">
              Create your account
            </h2>
            <p className="mt-1 text-sm text-on-surface-muted">
              Create your profile to buy, sell and chat with other gamers.
            </p>
          </header>

          {serverError && (
            <div className="mb-6 border border-error/30 bg-error/10 px-4 py-3 text-sm text-error" role="alert">
              {serverError}
            </div>
          )}
          {submitAttempted && missingRequiredCount > 0 && (
            <div className="mb-6 border border-outline bg-surface-1/40 px-4 py-3 text-sm text-on-surface-muted" role="status">
              {missingRequiredCount} required field{missingRequiredCount !== 1 ? "s" : ""} need{missingRequiredCount === 1 ? "s" : ""} attention.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            <p className="font-mono text-[10px] uppercase tracking-widest text-secondary">Account</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="firstName">
                  First Name <span className="text-error" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <UserIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                  <input id="firstName" name="firstName" value={values.firstName} onChange={handleChange} onBlur={handleBlur} autoComplete="given-name" aria-required="true" aria-invalid={!!showFieldError("firstName")} aria-describedby={showFieldError("firstName") ? "err-firstName" : undefined} className={inputCls} placeholder="John" />
                </div>
                <FieldFeedback id="err-firstName" message={showFieldError("firstName")} />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="lastName">
                  Last Name <span className="text-error" aria-hidden="true">*</span>
                </label>
                <div className="relative">
                  <IdentificationIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                  <input id="lastName" name="lastName" value={values.lastName} onChange={handleChange} onBlur={handleBlur} autoComplete="family-name" aria-required="true" aria-invalid={!!showFieldError("lastName")} aria-describedby={showFieldError("lastName") ? "err-lastName" : undefined} className={inputCls} placeholder="Doe" />
                </div>
                <FieldFeedback id="err-lastName" message={showFieldError("lastName")} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="email">
                Email Address <span className="text-error" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                <input id="email" name="email" type="email" inputMode="email" value={values.email} onChange={handleChange} onBlur={handleBlur} autoComplete="email" aria-required="true" aria-invalid={!!showFieldError("email")} aria-describedby={showFieldError("email") ? "err-email" : undefined} className={inputCls} placeholder="curator@nocturnalarchive.com" />
              </div>
              <FieldFeedback id="err-email" message={showFieldError("email")} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted" htmlFor="password">
                  Password <span className="text-error" aria-hidden="true">*</span>
                </label>
                <span className="text-on-surface-muted italic text-[10px]" id="password-hint">Min. 8 characters</span>
              </div>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                <input id="password" name="password" type={showPassword ? "text" : "password"} value={values.password} onChange={handleChange} onBlur={handleBlur} autoComplete="new-password" aria-required="true" aria-invalid={!!showFieldError("password")} aria-describedby={showFieldError("password") ? "err-password" : "password-hint"} className={inputCls} placeholder="••••••••••••" />
                <button
                  type="button"
                  onClick={() => setShowPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-muted transition-colors hover:text-on-surface"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              <FieldFeedback id="err-password" message={showFieldError("password")} />
            </div>

            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="confirmPassword">
                Confirm Password <span className="text-error" aria-hidden="true">*</span>
              </label>
              <div className="relative">
                <LockClosedIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                <input
                  id="confirmPassword"
                  name="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  value={values.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  autoComplete="new-password"
                  aria-required="true"
                  aria-invalid={!!showFieldError("confirmPassword")}
                  aria-describedby={showFieldError("confirmPassword") ? "err-confirmPassword" : undefined}
                  className={inputCls}
                  placeholder="••••••••••••"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword((prev) => !prev)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1 text-on-surface-muted transition-colors hover:text-on-surface"
                  aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
                >
                  {showConfirmPassword ? <EyeSlashIcon className="h-5 w-5" aria-hidden="true" /> : <EyeIcon className="h-5 w-5" aria-hidden="true" />}
                </button>
              </div>
              <FieldFeedback id="err-confirmPassword" message={showFieldError("confirmPassword")} />
            </div>

            <p className="font-mono text-[10px] uppercase tracking-widest text-secondary pt-2">
              Contact Details <span className="normal-case text-on-surface-muted">(optional)</span>
            </p>
            <div className="space-y-1">
              <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="address">Address</label>
              <div className="relative">
                <HomeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                <input id="address" name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} autoComplete="street-address" aria-invalid={!!showFieldError("address")} aria-describedby={showFieldError("address") ? "err-address" : undefined} className={inputCls} placeholder="Street, number" />
              </div>
              <FieldFeedback id="err-address" message={showFieldError("address")} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="city">City</label>
                <input id="city" name="city" value={values.city} onChange={handleChange} onBlur={handleBlur} autoComplete="address-level2" aria-invalid={!!showFieldError("city")} aria-describedby={showFieldError("city") ? "err-city" : undefined} className={inputCls} placeholder="City" />
                <FieldFeedback id="err-city" message={showFieldError("city")} />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="country">Country</label>
                <input id="country" name="country" value={values.country} onChange={handleChange} onBlur={handleBlur} autoComplete="country-name" aria-invalid={!!showFieldError("country")} aria-describedby={showFieldError("country") ? "err-country" : undefined} className={inputCls} placeholder="Country" />
                <FieldFeedback id="err-country" message={showFieldError("country")} />
              </div>
              <div className="space-y-1">
                <label className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} autoComplete="tel" aria-invalid={!!showFieldError("phone")} aria-describedby={showFieldError("phone") ? "err-phone" : undefined} className={inputCls} placeholder="+1 …" />
                <FieldFeedback id="err-phone" message={showFieldError("phone")} />
              </div>
            </div>

            <button type="submit" className="mt-2 w-full min-h-12 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20">
              CREATE ACCOUNT
            </button>

            {/* Social / alternative (FEATURE-PENDING — disabled) */}
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6" aria-hidden="true">
                <div className="h-px flex-1 bg-outline" />
                <span className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted">Alternative Entry</span>
                <div className="h-px flex-1 bg-outline" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" disabled className="flex min-h-12 items-center justify-center gap-2 border border-outline bg-surface-2/60 px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted opacity-60 cursor-not-allowed">
                  Google
                </button>
                <button type="button" disabled className="flex min-h-12 items-center justify-center gap-2 border border-outline bg-surface-2/60 px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted opacity-60 cursor-not-allowed">
                  GitHub
                </button>
              </div>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-on-surface-muted">
              Already a member?{" "}
              <Link href="/login" className="font-bold text-secondary ml-1 hover:underline">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>
    </BlueprintGrid>
  );
}
