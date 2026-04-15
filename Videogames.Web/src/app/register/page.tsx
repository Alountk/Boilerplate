"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { scrollToFirstError } from "../../utils/formUtils";

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

const initialForm: RegisterForm = {
  firstName: "",
  lastName: "",
  email: "",
  password: "",
  address: "",
  city: "",
  country: "",
  phone: "",
};

type FieldKey = keyof RegisterForm;

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

function FieldFeedback({
  id,
  message,
}: {
  id: string;
  message?: string;
}) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="mt-1 text-xs text-error px-1 flex items-center gap-1">
      <span className="material-symbols-outlined text-[14px]">error</span>
      <span>{message}</span>
    </p>
  );
}


export default function RegisterPage() {
  const [formData, setFormData] = useState<RegisterForm>(initialForm);
  const [errors, setErrors] = useState<Partial<Record<FieldKey, string>>>({});
  const [touched, setTouched] = useState<Partial<Record<FieldKey, boolean>>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const { register } = useAuth();
  const router = useRouter();
  const [error, setError] = useState("");

  const showFieldError = useCallback(
    (key: FieldKey) => {
      if (errors[key] && (touched[key] || submitAttempted)) return errors[key];
      return undefined;
    },
    [errors, touched, submitAttempted]
  );

  const runValidation = useCallback((values: RegisterForm) => {
    return validateRegisterForm(values);
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    const key = name as FieldKey;
    setFormData((prev) => {
      const draft = { ...prev, [name]: value } as RegisterForm;
      const fieldErrors = runValidation(draft);
      setErrors((prevErr) => {
        const next = { ...prevErr };
        if (fieldErrors[key]) next[key] = fieldErrors[key];
        else delete next[key];
        return next;
      });
      return draft;
    });
    setError("");
    setTouched((prev) => ({ ...prev, [key]: true }));
  };

  const handleBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const name = e.target.name as FieldKey;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const fieldErrors = runValidation(formData);
    setErrors((prev) => ({ ...prev, [name]: fieldErrors[name] }));
  };

  const missingRequiredCount = useMemo(() => {
    const v = runValidation(formData);
    const keys: FieldKey[] = ["firstName", "lastName", "email", "password"];
    return keys.filter((k) => v[k]).length;
  }, [formData, runValidation]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitAttempted(true);
    const fieldErrors = runValidation(formData);
    setErrors(fieldErrors);
    const blocking = ["firstName", "lastName", "email", "password"] as const;
    if (blocking.some((k) => fieldErrors[k])) {
      setError("");
      scrollToFirstError();
      return;
    }
    if (Object.keys(fieldErrors).length > 0) {
      setError("");
      scrollToFirstError();
      return;
    }

    try {
      await register({
        ...formData,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        email: formData.email.trim(),
        password: formData.password,
        address: formData.address.trim(),
        city: formData.city.trim(),
        country: formData.country.trim(),
        phone: formData.phone.trim(),
      });
      router.push("/");
    } catch (err: unknown) {
      setError("Registration failed. Please try again.");
      console.error(err);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex flex-col md:flex-row">
      {/* Left panel — immersive visual */}
      <section className="hidden md:flex md:w-5/12 lg:w-1/2 bg-surface-container-lowest relative overflow-hidden flex-col justify-between p-12">
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
            <h3 className="text-3xl font-bold tracking-tight text-on-surface mb-2">
              Create your account
            </h3>
            <p className="text-on-surface-variant text-sm">
              Create your profile to buy, sell and chat with other gamers.
            </p>
          </header>

          {error && (
            <div className="mb-6 rounded-md bg-error-container/30 border border-error/30 px-4 py-3 text-sm text-error" role="alert">
              {error}
            </div>
          )}
          {submitAttempted && missingRequiredCount > 0 && (
            <div className="mb-6 rounded-md bg-surface-container-low border border-outline-variant/30 px-4 py-3 text-sm text-on-surface-variant" role="status">
              {missingRequiredCount} required field{missingRequiredCount !== 1 ? "s" : ""} need{missingRequiredCount === 1 ? "s" : ""} attention.
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5" noValidate>
            {/* — Account fields — */}
            <p className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant">
              Account
            </p>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="firstName">
                  First Name <span className="text-error">*</span>
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">person</span>
                  <input id="firstName" name="firstName" value={formData.firstName} onChange={handleChange} onBlur={handleBlur} autoComplete="given-name" aria-invalid={!!showFieldError("firstName")} aria-describedby={showFieldError("firstName") ? "err-firstName" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="John" />
                </div>
                <FieldFeedback id="err-firstName" message={showFieldError("firstName")} />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="lastName">
                  Last Name <span className="text-error">*</span>
                </label>
                <div className="relative group">
                  <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">badge</span>
                  <input id="lastName" name="lastName" value={formData.lastName} onChange={handleChange} onBlur={handleBlur} autoComplete="family-name" aria-invalid={!!showFieldError("lastName")} aria-describedby={showFieldError("lastName") ? "err-lastName" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="Doe" />
                </div>
                <FieldFeedback id="err-lastName" message={showFieldError("lastName")} />
              </div>
            </div>
            <div className="space-y-1">
              <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="email">
                Email Address <span className="text-error">*</span>
              </label>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">mail</span>
                <input id="email" name="email" type="email" inputMode="email" value={formData.email} onChange={handleChange} onBlur={handleBlur} autoComplete="email" aria-invalid={!!showFieldError("email")} aria-describedby={showFieldError("email") ? "err-email" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="curator@nocturnalarchive.com" />
              </div>
              <FieldFeedback id="err-email" message={showFieldError("email")} />
            </div>
            <div className="space-y-1">
              <div className="flex justify-between items-end">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant" htmlFor="password">
                  Password <span className="text-error">*</span>
                </label>
                <span className="text-[0.625rem] text-outline italic">Min. 8 characters</span>
              </div>
              <div className="relative group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">lock</span>
                <input id="password" name="password" type="password" value={formData.password} onChange={handleChange} onBlur={handleBlur} autoComplete="new-password" aria-invalid={!!showFieldError("password")} aria-describedby={showFieldError("password") ? "err-password" : "password-hint"} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="••••••••••••" />
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
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline text-lg transition-colors group-focus-within:text-primary">home</span>
                <input id="address" name="address" value={formData.address} onChange={handleChange} onBlur={handleBlur} autoComplete="street-address" aria-invalid={!!showFieldError("address")} aria-describedby={showFieldError("address") ? "err-address" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="Street, number" />
              </div>
              <FieldFeedback id="err-address" message={showFieldError("address")} />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="city">City</label>
                <input id="city" name="city" value={formData.city} onChange={handleChange} onBlur={handleBlur} autoComplete="address-level2" aria-invalid={!!showFieldError("city")} aria-describedby={showFieldError("city") ? "err-city" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="City" />
                <FieldFeedback id="err-city" message={showFieldError("city")} />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="country">Country</label>
                <input id="country" name="country" value={formData.country} onChange={handleChange} onBlur={handleBlur} autoComplete="country-name" aria-invalid={!!showFieldError("country")} aria-describedby={showFieldError("country") ? "err-country" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="Country" />
                <FieldFeedback id="err-country" message={showFieldError("country")} />
              </div>
              <div className="space-y-1">
                <label className="text-[0.6875rem] uppercase tracking-widest font-bold text-on-surface-variant block" htmlFor="phone">Phone</label>
                <input id="phone" name="phone" type="tel" inputMode="tel" value={formData.phone} onChange={handleChange} onBlur={handleBlur} autoComplete="tel" aria-invalid={!!showFieldError("phone")} aria-describedby={showFieldError("phone") ? "err-phone" : undefined} className="w-full bg-surface-container-highest border-none rounded-md py-3.5 px-4 text-on-surface placeholder:text-outline/50 focus:ring-1 focus:ring-primary text-sm outline-none" placeholder="+1 …" />
                <FieldFeedback id="err-phone" message={showFieldError("phone")} />
              </div>
            </div>

            {/* CTA */}
            <button
              type="submit"
              className="indigo-gradient w-full py-4 rounded-md text-on-primary-container font-bold text-sm tracking-wide shadow-lg shadow-primary-container/20 hover:opacity-90 active:scale-[0.98] transition-all mt-2"
            >
              Create Account
            </button>

            {/* Social / alternative (FEATURE-PENDING) */}
            <div className="mt-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-px flex-1 bg-surface-container-highest" />
                <span className="text-[10px] uppercase tracking-widest font-bold text-outline">Alternative Entry</span>
                <div className="h-px flex-1 bg-surface-container-highest" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-md text-on-surface-variant text-xs font-bold opacity-40 cursor-not-allowed"
                >
                  Google
                </button>
                <button
                  type="button"
                  disabled
                  className="flex items-center justify-center gap-2 py-3 bg-surface-container-low rounded-md text-on-surface-variant text-xs font-bold opacity-30 cursor-not-allowed"
                  title="GitHub sign-in coming soon"
                >
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
