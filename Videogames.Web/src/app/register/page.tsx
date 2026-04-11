"use client";

import { useCallback, useMemo, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { UserPlusIcon, ExclamationCircleIcon } from "@heroicons/react/24/outline";
import { scrollToFirstError, getInputClassNames } from "../../utils/formUtils";

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
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-start gap-1.5 text-sm text-red-600 dark:text-red-400"
    >
      <ExclamationCircleIcon className="h-4 w-4 shrink-0 mt-0.5" aria-hidden />
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
    <div className="min-h-[calc(100vh-140px)] bg-linear-to-b from-gray-50 via-white to-blue-50/40 dark:from-gray-950 dark:via-gray-900 dark:to-gray-900 py-10 px-4 transition-colors duration-300">
      <div className="mx-auto w-full max-w-2xl">
        <div className="overflow-hidden rounded-2xl border border-gray-200/80 bg-white shadow-xl shadow-gray-200/50 dark:border-gray-700 dark:bg-gray-800 dark:shadow-none">
          <div className="border-b border-gray-100 bg-linear-to-r from-blue-600 to-indigo-600 px-8 py-8 text-white dark:border-gray-700">
            <div className="flex items-start gap-4">
              <div className="rounded-xl bg-white/15 p-3 backdrop-blur-sm">
                <UserPlusIcon className="h-8 w-8" aria-hidden />
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                  Join vMarket
                </h1>
                <p className="mt-1 text-sm text-blue-100">
                  Create your account and start buying and selling games.
                </p>
              </div>
            </div>
          </div>

          <div className="p-8 sm:p-10">
            {error && (
              <div
                className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-300"
                role="alert"
              >
                {error}
              </div>
            )}

            {submitAttempted && missingRequiredCount > 0 && (
              <div
                className="mb-6 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-900/60 dark:bg-amber-950/40 dark:text-amber-200"
                role="status"
              >
                <p className="font-semibold">Please complete the required fields</p>
                <p className="mt-1 text-amber-800/90 dark:text-amber-300/90">
                  {missingRequiredCount} field{missingRequiredCount !== 1 ? "s" : ""}{" "}
                  need your attention below.
                </p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-8" noValidate>
              <section aria-labelledby="account-heading">
                <h2
                  id="account-heading"
                  className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"
                >
                  Account
                </h2>
                <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                      First name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="firstName"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="given-name"
                      aria-invalid={!!showFieldError("firstName")}
                      aria-describedby={showFieldError("firstName") ? "err-firstName" : undefined}
                      className={getInputClassNames(!!showFieldError("firstName"))}
                      placeholder="John"
                    />
                    <FieldFeedback id="err-firstName" message={showFieldError("firstName")} />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                      Last name <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="lastName"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="family-name"
                      aria-invalid={!!showFieldError("lastName")}
                      aria-describedby={showFieldError("lastName") ? "err-lastName" : undefined}
                      className={getInputClassNames(!!showFieldError("lastName"))}
                      placeholder="Doe"
                    />
                    <FieldFeedback id="err-lastName" message={showFieldError("lastName")} />
                  </div>
                </div>

                <div className="mt-5 grid grid-cols-1 gap-5 md:grid-cols-2">
                  <div>
                    <label
                      htmlFor="email"
                      className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                      Email <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      value={formData.email}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="email"
                      aria-invalid={!!showFieldError("email")}
                      aria-describedby={showFieldError("email") ? "err-email" : undefined}
                      className={getInputClassNames(!!showFieldError("email"))}
                      placeholder="you@example.com"
                    />
                    <FieldFeedback id="err-email" message={showFieldError("email")} />
                  </div>
                  <div>
                    <label
                      htmlFor="password"
                      className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                      Password <span className="text-red-500">*</span>
                    </label>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      value={formData.password}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="new-password"
                      aria-invalid={!!showFieldError("password")}
                      aria-describedby={
                        showFieldError("password") ? "err-password" : "password-hint"
                      }
                      className={getInputClassNames(!!showFieldError("password"))}
                      placeholder="At least 8 characters"
                    />
                    <p
                      id="password-hint"
                      className="mt-1.5 text-xs text-gray-500 dark:text-gray-400"
                    >
                      Use 8–100 characters to match server rules.
                    </p>
                    <FieldFeedback id="err-password" message={showFieldError("password")} />
                  </div>
                </div>
              </section>

              <section aria-labelledby="contact-heading">
                <h2
                  id="contact-heading"
                  className="mb-4 text-xs font-bold uppercase tracking-widest text-gray-500 dark:text-gray-400"
                >
                  Contact details <span className="font-normal normal-case text-gray-400">(optional)</span>
                </h2>
                <div className="space-y-5">
                  <div>
                    <label
                      htmlFor="address"
                      className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                    >
                      Address
                    </label>
                    <input
                      id="address"
                      name="address"
                      value={formData.address}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      autoComplete="street-address"
                      aria-invalid={!!showFieldError("address")}
                      aria-describedby={showFieldError("address") ? "err-address" : undefined}
                      className={getInputClassNames(!!showFieldError("address"))}
                      placeholder="Street, number"
                    />
                    <FieldFeedback id="err-address" message={showFieldError("address")} />
                  </div>
                  <div className="grid grid-cols-1 gap-5 md:grid-cols-3">
                    <div>
                      <label
                        htmlFor="city"
                        className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                      >
                        City
                      </label>
                      <input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="address-level2"
                        aria-invalid={!!showFieldError("city")}
                        aria-describedby={showFieldError("city") ? "err-city" : undefined}
                        className={getInputClassNames(!!showFieldError("city"))}
                        placeholder="City"
                      />
                      <FieldFeedback id="err-city" message={showFieldError("city")} />
                    </div>
                    <div>
                      <label
                        htmlFor="country"
                        className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                      >
                        Country
                      </label>
                      <input
                        id="country"
                        name="country"
                        value={formData.country}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="country-name"
                        aria-invalid={!!showFieldError("country")}
                        aria-describedby={showFieldError("country") ? "err-country" : undefined}
                        className={getInputClassNames(!!showFieldError("country"))}
                        placeholder="Country"
                      />
                      <FieldFeedback id="err-country" message={showFieldError("country")} />
                    </div>
                    <div>
                      <label
                        htmlFor="phone"
                        className="mb-2 block text-sm font-semibold text-gray-800 dark:text-gray-200"
                      >
                        Phone
                      </label>
                      <input
                        id="phone"
                        name="phone"
                        type="tel"
                        inputMode="tel"
                        value={formData.phone}
                        onChange={handleChange}
                        onBlur={handleBlur}
                        autoComplete="tel"
                        aria-invalid={!!showFieldError("phone")}
                        aria-describedby={showFieldError("phone") ? "err-phone" : undefined}
                        className={getInputClassNames(!!showFieldError("phone"))}
                        placeholder="+34 …"
                      />
                      <FieldFeedback id="err-phone" message={showFieldError("phone")} />
                    </div>
                  </div>
                </div>
              </section>

              <button
                type="submit"
                className="w-full rounded-xl bg-blue-600 py-4 font-bold text-white shadow-lg shadow-blue-500/25 transition-all hover:bg-blue-700 active:scale-[0.98] focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 dark:focus:ring-offset-gray-800"
              >
                Create account
              </button>

              <p className="text-center text-xs text-gray-500 dark:text-gray-400">
                <span className="text-red-500">*</span> Required fields
              </p>

              <div className="border-t border-gray-100 pt-8 text-center dark:border-gray-700">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Already have an account?{" "}
                  <Link
                    href="/login"
                    className="font-bold text-blue-600 hover:underline dark:text-blue-400"
                  >
                    Sign in
                  </Link>
                </p>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
