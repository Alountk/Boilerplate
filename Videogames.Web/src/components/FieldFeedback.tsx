import { ExclamationCircleIcon } from "@heroicons/react/24/outline";

interface FieldFeedbackProps {
  id?: string;
  message?: string;
}

/**
 * Componente compartido para mostrar mensajes de error de validación en formularios.
 * Reemplaza las definiciones locales duplicadas en login, register y create.
 */
export function FieldFeedback({ id, message }: FieldFeedbackProps) {
  if (!message) return null;
  return (
    <p
      id={id}
      role="alert"
      className="mt-1 flex items-center gap-1.5 text-xs text-error font-medium px-1"
    >
      <ExclamationCircleIcon className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
      <span>{message}</span>
    </p>
  );
}
