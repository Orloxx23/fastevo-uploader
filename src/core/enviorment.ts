/**
 * Check if code is running in a browser environment.
 * @returns {boolean} True if in browser, false otherwise.
 */
export function isBrowserEnvironment(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof document !== "undefined" &&
    typeof window.File !== "undefined" &&
    typeof window.Blob !== "undefined" &&
    typeof window.FormData !== "undefined" &&
    typeof window.XMLHttpRequest !== "undefined"
  );
}

/**
 * Throws an error if not in a browser environment.
 * @throws {Error} If not in a browser environment.
 */
export function requireBrowserEnvironment(): void {
  if (!isBrowserEnvironment()) {
    throw new Error(
      "ElegantUploader requires a browser environment with support for " +
        "File, Blob, FormData, and XMLHttpRequest. This library cannot be used in a Node.js environment."
    );
  }
}
