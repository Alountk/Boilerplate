/**
 * Hook genérico para manejar estado de formularios con validación.
 * Reemplaza el patrón duplicado en login/register/create (errors, touched, submitAttempted).
 */

import { useState, useCallback } from "react";

export type FieldErrors<T> = Partial<Record<keyof T, string>>;
export type FieldTouched<T> = Partial<Record<keyof T, boolean>>;

export interface FormStateOptions<T> {
  initialValues: T;
  validate: (values: T) => FieldErrors<T>;
}

export interface UseFormStateReturn<T> {
  values: T;
  errors: FieldErrors<T>;
  touched: FieldTouched<T>;
  submitAttempted: boolean;
  setSubmitAttempted: (v: boolean) => void;
  setValues: React.Dispatch<React.SetStateAction<T>>;
  setErrors: React.Dispatch<React.SetStateAction<FieldErrors<T>>>;
  showFieldError: (key: keyof T) => string | undefined;
  runValidation: (values?: T) => FieldErrors<T>;
  handleChange: (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  handleBlur: (
    e: React.FocusEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => void;
  reset: () => void;
}

export function useFormState<T extends Record<string, unknown>>({
  initialValues,
  validate,
}: FormStateOptions<T>): UseFormStateReturn<T> {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<FieldErrors<T>>({});
  const [touched, setTouched] = useState<FieldTouched<T>>({});
  const [submitAttempted, setSubmitAttempted] = useState(false);

  const runValidation = useCallback(
    (v: T = values) => validate(v),
    // validate debería ser estable (useCallback en el caller o función estática)
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [values]
  );

  const showFieldError = useCallback(
    (key: keyof T): string | undefined => {
      if (errors[key] && (touched[key] || submitAttempted))
        return errors[key];
      return undefined;
    },
    [errors, touched, submitAttempted]
  );

  const handleChange = useCallback(
    (
      e: React.ChangeEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const { name, value } = e.target;
      const key = name as keyof T;
      setValues((prev) => {
        const next = { ...prev, [name]: value } as T;
        const fieldErrors = validate(next);
        setErrors((prevErr) => {
          const updated = { ...prevErr };
          if (fieldErrors[key]) updated[key] = fieldErrors[key];
          else delete updated[key];
          return updated;
        });
        return next;
      });
      setTouched((prev) => ({ ...prev, [key]: true }));
    },
    [validate]
  );

  const handleBlur = useCallback(
    (
      e: React.FocusEvent<
        HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
      >
    ) => {
      const key = e.target.name as keyof T;
      setTouched((prev) => ({ ...prev, [key]: true }));
      setValues((prev) => {
        const fieldErrors = validate(prev);
        setErrors((prevErr) => ({ ...prevErr, [key]: fieldErrors[key] }));
        return prev;
      });
    },
    [validate]
  );

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
    setTouched({});
    setSubmitAttempted(false);
  }, [initialValues]);

  return {
    values,
    errors,
    touched,
    submitAttempted,
    setSubmitAttempted,
    setValues,
    setErrors,
    showFieldError,
    runValidation,
    handleChange,
    handleBlur,
    reset,
  };
}
