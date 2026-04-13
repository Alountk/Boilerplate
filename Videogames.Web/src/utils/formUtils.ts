/**
 * Scrolls to the first element in the document that has aria-invalid="true".
 * Useful for guiding users to validation errors after a form submission attempt.
 */
export const scrollToFirstError = () => {
  // Give React a small moment to render the error states if needed
  setTimeout(() => {
    const firstError = document.querySelector('[aria-invalid="true"]');
    if (firstError) {
      firstError.scrollIntoView({ behavior: 'smooth', block: 'center' });
      // If it's an input or focusable element, focus it
      if (firstError instanceof HTMLElement) {
        firstError.focus({ preventScroll: true });
      }
    }
  }, 50);
};

/**
 * Common class names for form inputs based on their validation state.
 */
export const getInputClassNames = (invalid: boolean) => {
  return [
    "w-full px-4 py-3 rounded-xl border bg-surface-container-highest text-on-surface placeholder:text-outline/60 outline-none transition-all",
    invalid
      ? "border-error/80 focus:ring-2 focus:ring-error/40 focus:border-error"
      : "border-outline-variant/40 focus:ring-2 focus:ring-primary/40 focus:border-primary",
  ].join(" ");
};
