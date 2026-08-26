"use client";

import { FormEvent, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { EnvelopeIcon, ShieldCheckIcon } from "@heroicons/react/24/outline";
import { useAuth } from "../../../context/AuthContext";
import BlueprintGrid from "../../../components/theme/BlueprintGrid";
import TitleBlock from "../../../components/theme/TitleBlock";

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
    <BlueprintGrid showCrosshairs className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
      <div data-testid="auth-shell" className="w-full max-w-md">
        <div className="mb-4">
          <TitleBlock code="VMKT-BP-CONF" rev="C" date="VERIFY" />
        </div>
        <section className="border border-outline bg-surface-1/40 p-6 sm:p-8">
          <header className="mb-6">
            <div className="w-11 h-11 border border-secondary/60 text-secondary flex items-center justify-center mb-4">
              <ShieldCheckIcon className="h-6 w-6" aria-hidden="true" />
            </div>
            <h1 className="font-[family-name:var(--font-space-grotesk)] text-2xl font-bold tracking-tight">Confirma tu email</h1>
            <p className="mt-2 text-sm text-on-surface-muted">
              Introduce el codigo enviado a <span className="font-semibold text-on-surface">{email || "tu email"}</span>.
            </p>
          </header>

          {info && (
            <div className="mb-4 border border-outline bg-surface-2/60 px-3 py-2 text-sm text-on-surface-muted">
              {info}
            </div>
          )}

          {error && (
            <div className="mb-4 border border-error/30 bg-error/10 px-3 py-2 text-sm text-error" role="alert">
              {error}
            </div>
          )}

          {!verified ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <label htmlFor="verification-code" className="font-mono text-[10px] uppercase tracking-widest text-on-surface-muted block">
                Codigo de verificacion
              </label>
              <div className="relative">
                <EnvelopeIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-on-surface-muted" aria-hidden="true" />
                <input
                  id="verification-code"
                  name="verification-code"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  className="w-full border border-outline bg-surface-2/60 py-3.5 pl-12 pr-4 font-mono text-base tracking-[0.25em] text-on-surface placeholder:text-on-surface-muted/60 outline-none transition-colors focus:border-secondary"
                  placeholder="123456"
                  aria-invalid={!!error}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-12 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20 disabled:opacity-60"
              >
                {submitting ? "VALIDANDO..." : "CONFIRMAR EMAIL"}
              </button>

              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="w-full min-h-12 border border-outline px-4 font-mono text-xs uppercase tracking-widest text-on-surface-muted transition-colors active:border-secondary active:text-secondary disabled:opacity-60"
              >
                {resending ? "REENVIANDO..." : "REENVIAR CODIGO"}
              </button>
            </form>
          ) : (
            <div className="space-y-3">
              <button
                type="button"
                onClick={() => router.push("/")}
                className="w-full min-h-12 border border-secondary bg-secondary/10 px-4 font-mono text-xs uppercase tracking-widest text-secondary transition-colors active:bg-secondary/20"
              >
                IR AL MARKETPLACE
              </button>
              <Link
                href="/messages"
                className="block w-full min-h-12 border border-outline px-4 py-3 text-center font-mono text-xs uppercase tracking-widest text-on-surface-muted transition-colors active:border-secondary active:text-secondary"
              >
                ABRIR MENSAJES
              </Link>
            </div>
          )}

          <footer className="mt-6 text-center text-sm text-on-surface-muted">
            Si el email no llega, revisa spam o vuelve a reenviar el codigo.
          </footer>
        </section>
      </div>
    </BlueprintGrid>
  );
}
