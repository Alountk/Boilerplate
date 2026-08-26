import { Suspense } from "react";
import ConfirmRegistrationPageClient from "./ConfirmRegistrationPageClient";

function LoadingFallback() {
  return (
    <div className="min-h-screen bg-surface text-on-surface flex items-center justify-center p-6">
      <div className="w-full max-w-md border border-outline bg-surface-1/40 p-8 text-center text-sm text-on-surface-muted">
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
