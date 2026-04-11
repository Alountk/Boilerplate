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
    "w-full px-4 py-3 rounded-xl border bg-transparent dark:text-white outline-none transition-all",
    invalid
      ? "border-red-500 dark:border-red-500/80 focus:ring-2 focus:ring-red-500/40 focus:border-red-500"
      : "border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-blue-500 focus:border-transparent",
  ].join(" ");
};
