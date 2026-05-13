"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";

export default function ConfirmRegistrationPageClient() {
  const router = useRouter();
  const params = useSearchParams();
  const { confirmRegistrationCode, sendRegistrationCode } = useAuth();

  const email = useMemo(() => params.get("email")?.trim() ?? "", [params]);
  const sentParam = useMemo(() => params.get("sent"), [params]);
  const [code, setCode] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState("");
  const [info, setInfo] = useState(sentParam === "false"
    ? "No pudimos enviar el codigo automaticamente. Puedes reenviarlo aqui."
    : "Te enviamos un codigo de 6 digitos a tu email.");
  const [verified, setVerified] = useState(false);

  const isCodeValid = /^\d{6}$/.test(code.trim());

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();

    if (!email) {
      setError("No encontramos el email de registro. Vuelve a registrarte.");
      return;
    }

    if (!isCodeValid) {
      setError("Introduce un codigo de 6 digitos.");
      return;
    }

    setSubmitting(true);
    setError("");

    try {
      const ok = await confirmRegistrationCode(email, code.trim());
      if (!ok) {
        setError("Codigo invalido o expirado. Solicita uno nuevo.");
        return;
      }

      setVerified(true);
      setInfo("Email confirmado correctamente.");
    } catch (submitError) {
      console.error(submitError);
      setError("No pudimos validar el codigo. Intentalo de nuevo.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    if (!email) {
      setError("No encontramos el email para reenviar el codigo.");
      return;
    }

    setResending(true);
    setError("");

    try {
      await sendRegistrationCode(email);
      setInfo("Nuevo codigo enviado. Revisa tu bandeja de entrada.");
    } catch (resendError) {
      console.error(resendError);
      setError("No pudimos reenviar el codigo. Intentalo de nuevo.");
    } finally {
      setResending(false);
    }
  };

  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
      <section className="w-full max-w-md bg-surface-container-low rounded-2xl border border-outline-variant/40 p-6 sm:p-8 shadow-xl shadow-black/10">
        <header className="mb-6">
          <div className="w-11 h-11 rounded-xl bg-primary-container/40 text-primary flex items-center justify-center mb-4">
            <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Confirma tu email</h1>
          <p className="text-sm text-on-surface-variant mt-2">
            Introduce el codigo enviado a <span className="font-semibold text-on-surface">{email || "tu email"}</span>.
          </p>
        </header>

        {info && (
          <div className="mb-4 rounded-md bg-surface-container border border-outline-variant/40 px-3 py-2 text-sm text-on-surface-variant">
            {info}
          </div>
        )}

        {error && (
          <div className="mb-4 rounded-md bg-error-container/30 border border-error/30 px-3 py-2 text-sm text-error" role="alert">
            {error}
          </div>
        )}

        {!verified ? (
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <label htmlFor="verification-code" className="text-xs font-bold tracking-wide uppercase text-on-surface-variant block">
              Codigo de verificacion
            </label>
            <div className="relative group">
              <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-outline transition-colors group-focus-within:text-primary" aria-hidden="true" />
              <input
                id="verification-code"
                name="verification-code"
                value={code}
                onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                inputMode="numeric"
                autoComplete="one-time-code"
                className="w-full bg-surface-container-highest border-none rounded-md py-3.5 pl-12 pr-4 text-on-surface placeholder:text-outline/60 focus:ring-1 focus:ring-primary text-base tracking-[0.25em] outline-none"
                placeholder="123456"
                aria-invalid={!!error}
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="indigo-gradient w-full py-3.5 rounded-md text-on-primary-container font-bold text-sm tracking-wide disabled:opacity-60"
            >
              {submitting ? "Validando..." : "Confirmar email"}
            </button>

            <button
              type="button"
              onClick={handleResend}
              disabled={resending}
              className="w-full py-3 rounded-md border border-outline-variant text-sm font-semibold text-on-surface hover:bg-surface-container disabled:opacity-60"
            >
              {resending ? "Reenviando..." : "Reenviar codigo"}
            </button>
          </form>
        ) : (
          <div className="space-y-3">
            <button
              type="button"
              onClick={() => router.push("/")}
              className="indigo-gradient w-full py-3.5 rounded-md text-on-primary-container font-bold text-sm tracking-wide"
            >
              Ir al marketplace
            </button>
            <Link
              href="/messages"
              className="block w-full py-3 rounded-md border border-outline-variant text-center text-sm font-semibold text-on-surface hover:bg-surface-container"
            >
              Abrir mensajes
            </Link>
          </div>
        )}

        <footer className="mt-6 text-center text-sm text-on-surface-variant">
          Si el email no llega, revisa spam o vuelve a reenviar el codigo.
        </footer>
      </section>
    </div>
  );
}
