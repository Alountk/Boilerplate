import { Suspense } from "react";
import ConfirmRegistrationPageClient from "./ConfirmRegistrationPageClient";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-surface-container-low rounded-2xl border border-outline-variant/40 p-8 text-center text-sm text-on-surface-variant">
        Cargando confirmacion...
      </div>
    </div>
  );
}

export default function ConfirmRegistrationPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <ConfirmRegistrationPageClient />
    </Suspense>
  );
}
