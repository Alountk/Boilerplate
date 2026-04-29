"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  EnvelopeIcon,
  HomeIcon,
  IdentificationIcon,
  LockClosedIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { scrollToFirstError } from "../../utils/formUtils";
import { useFormState } from "../../hooks/useFormState";
import { FieldFeedback } from "../../components/FieldFeedback";

type RegisterForm = {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
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

  if (values.address.trim().length > 200) next.address = "Must be at most 200 characters.";
  if (values.city.trim().length > 100) next.city = "Must be at most 100 characters.";
  if (values.country.trim().length > 100) next.country = "Must be at most 100 characters.";
  if (values.phone.trim().length > 20) next.phone = "Must be at most 20 characters.";

  return next;
}

export default function RegisterPage() {
  const { register } = useAuth();
  const router = useRouter();
  const [serverError, setServerError] = useState("");

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

  // Wrapper: clear server error on any field change
  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      formHandleChange(e);
      setServerError("");
    },
    [formHandleChange]
  );

  const missingRequiredCount = useMemo(() => {
    const v = runValidation(values);
    const keys: FieldKey[] = ["firstName", "lastName", "email", "password"];
    return keys.filter((k) => v[k]).length;
  }, [runValidation, values]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const fieldErrors = runValidation();
    setErrors(fieldErrors);
    const blocking: FieldKey[] = ["firstName", "lastName", "email", "password"];
    if (blocking.some((k) => fieldErrors[k]) || Object.keys(fieldErrors).length > 0) {
      scrollToFirstError();
      return;
    }

    try {
      await register({
        ...values,
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
        address: values.address.trim(),
        city: values.city.trim(),
        country: values.country.trim(),
        phone: values.phone.trim(),
      });
      router.push("/");
    } catch (err: unknown) {
      setServerError("Registration failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col md:flex-row">
      {/* Left panel — immersive visual */}
      <section className="hidden md:flex md:w-5/12 lg:w-1/2 bg-surface-container-lowest relative overflow-hidden flex-col justify-between p-12" aria-hidden="true">
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-linear-to-br from-primary-container/20 via-surface-container-lowest to-surface-container" />
          <div className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-primary-container/15 blur-[120px]" />
          <div className="absolute bottom-1/4 right-1/4 w-48 h-48 rounded-full bg-primary/10 blur-[80px]" />
        </div>
        <div className="relative z-10">
          <h1 className="text-2xl font-extrabold tracking-tighter text-on-surface italic">vMarket</h1>
        </div>
        <div className="relative z-10 max-w-md">
          <span className="text-xs font-bold tracking-[0.2em] uppercase text-primary mb-4 block">
            Gamer Community
          </span>
          <h2 className="text-4xl lg:text-5xl font-extrabold leading-tight tracking-tight text-on-surface mb-6">
            Build your{" "}
            <span className="text-primary-container">gamer profile</span> and start trading.
          </h2>
          <p className="text-on-surface-variant text-lg leading-relaxed font-light">
            Join players, collectors and sellers buying and listing videogames every day.
          </p>
        </div>
        <div className="relative z-10">
          <p className="text-sm text-outline font-medium tracking-wide">
            © {new Date().getFullYear()} vMarket.
          </p>
        </div>
      </section>

      {/* Right panel — form */}
      <section className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 lg:p-16 bg-surface overflow-y-auto">
        {/* Mobile brand */}
        <div className="md:hidden w-full mb-10 flex justify-center">
          <h1 className="text-xl font-black italic tracking-tighter text-on-surface">vMarket</h1>
        </div>

        <div className="w-full max-w-lg">
          <header className="mb-10">
            <h2 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
              Create your account
            </h2>
            <p className="text-on-surface-variant text-sm">
              Create your profile to buy, sell and chat with other gamers.
            </p>
          </header>

          {serverError && (
            <div className="mb-6 rounded-md bg-error-container/30 border border-error/30 px-4 py-3 text-sm text-error" role="alert">
              {serverError}
            </div>
          )}
          {submitAttempted && missingRequiredCount > 0 && (
            <div className="mb-6 rounded-md bg-surface-container-low border border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant" role="status">
              {missingRequiredCount} required field{missingRequiredCount !== 1 ? "s" : ""} need{missingRequiredCount === 1 ? "s" : ""} attention.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* — Account fields — */}
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant">Account</p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="firstName">
                  First Name <span className="text-error" aria-hidden="true">*</span>
                </label>
                <div className="relative group">
                  <UserIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" aria-hidden="true" />
                  <input id="firstName" name="firstName" value={values.firstName} onChange={handleChange} onBlur={handleBlur} autoComplete="given-name" aria-required="true" aria-invalid={!!showFieldError("firstName")} aria-describedby={showFieldError("firstName") ? "err-firstName" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="John" />
                </div>
                <FieldFeedback id="err-firstName" message={showFieldError("firstName")} />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="lastName">
                  Last Name <span className="text-error" aria-hidden="true">*</span>
                </label>
                <div className="relative group">
                  <IdentificationIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" aria-hidden="true" />
                  <input id="lastName" name="lastName" value={values.lastName} onChange={handleChange} onBlur={handleBlur} autoComplete="family-name" aria-required="true" aria-invalid={!!showFieldError("lastName")} aria-describedby={showFieldError("lastName") ? "err-lastName" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="Doe" />
                </div>
                <FieldFeedback id="err-lastName" message={showFieldError("lastName")} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="email">
                Email Address <span className="text-error" aria-hidden="true">*</span>
              </label>
              <div className="relative group">
                <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" aria-hidden="true" />
                <input id="email" name="email" type="email" inputMode="email" value={values.email} onChange={handleChange} onBlur={handleBlur} autoComplete="email" aria-required="true" aria-invalid={!!showFieldError("email")} aria-describedby={showFieldError("email") ? "err-email" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="curator@nocturnalarchive.com" />
              </div>
              <FieldFeedback id="err-email" message={showFieldError("email")} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="password">
                  Password <span className="text-error" aria-hidden="true">*</span>
                </label>
                <span className="text-[0.625rem] text-outline italic" id="password-hint">Min. 8 characters</span>
              </div>
              <div className="relative group">
                <LockClosedIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" aria-hidden="true" />
                <input id="password" name="password" type="password" value={values.password} onChange={handleChange} onBlur={handleBlur} autoComplete="new-password" aria-required="true" aria-invalid={!!showFieldError("password")} aria-describedby={showFieldError("password") ? "err-password" : "password-hint"} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="••••••••••••" />
              </div>
              <FieldFeedback id="err-password" message={showFieldError("password")} />
            </div>

            {/* — Contact details (optional) — */}
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant pt-2">
              Contact Details <span className="font-normal normal-case text-outline">(optional)</span>
            </p>
            <div className="space-y-1">
              <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="address">Address</label>
              <div className="relative group">
                <HomeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" aria-hidden="true" />
                <input id="address" name="address" value={values.address} onChange={handleChange} onBlur={handleBlur} autoComplete="street-address" aria-invalid={!!showFieldError("address")} aria-describedby={showFieldError("address") ? "err-address" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="Street, number" />
              </div>
              <FieldFeedback id="err-address" message={showFieldError("address")} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="city">City</label>
                <input id="city" name="city" value={values.city} onChange={handleChange} onBlur={handleBlur} autoComplete="address-level2" aria-invalid={!!showFieldError("city")} aria-describedby={showFieldError("city") ? "err-city" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="City" />
                <FieldFeedback id="err-city" message={showFieldError("city")} />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="country">Country</label>
                <input id="country" name="country" value={values.country} onChange={handleChange} onBlur={handleBlur} autoComplete="country-name" aria-invalid={!!showFieldError("country")} aria-describedby={showFieldError("country") ? "err-country" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="Country" />
                <FieldFeedback id="err-country" message={showFieldError("country")} />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={handleChange} onBlur={handleBlur} autoComplete="tel" aria-invalid={!!showFieldError("phone")} aria-describedby={showFieldError("phone") ? "err-phone" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="+1 …" />
                <FieldFeedback id="err-phone" message={showFieldError("phone")} />
              </div>
            </div>

            {/* CTA */}
            <button type="submit" className="indigo-gradient w-full py-4 rounded-md text-on-primary-container font-bold text-sm tracking-wide shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-[0.98] transition-all mt-2">
              Create Account
            </button>

            {/* Social / alternative (FEATURE-PENDING) */}
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6" aria-hidden="true">
                <div className="h-px flex-1 bg-surface-container-highest" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Alternative Entry</span>
                <div className="h-px flex-1 bg-surface-container-highest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button type="button" disabled className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-md text-on-surface-variant text-xs font-bold opacity-40 cursor-not-allowed">
                  Google
                </button>
                <button type="button" disabled className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-md text-on-surface-variant text-xs font-bold opacity-30 cursor-not-allowed">
                  GitHub
                </button>
              </div>
            </div>
          </form>

          <div className="mt-10 text-center">
            <p className="text-sm text-on-surface-variant">
              Already a member?{" "}
              <Link href="/login" className="text-primary font-bold ml-1 hover:text-primary-fixed transition-colors">
                Sign in here
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* Mobile footer */}
      <footer className="md:hidden w-full px-6 py-6 text-center bg-surface-container-lowest">
        <p className="text-xs text-outline font-medium">© {new Date().getFullYear()} vMarket.</p>
      </footer>
    </div>
  );
}
