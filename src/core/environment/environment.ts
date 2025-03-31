/**
 * Class responsible for verifying the execution environment.
 */
export class Environment {
  /**
   * Checks if the code is running in a browser environment.
   * @returns {boolean} True if it's a browser, false otherwise.
   */
  static isBrowser(): boolean {
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
   * Requires the environment to be a browser, throws an error if it is not.
   * @throws {Error} If not in a browser environment.
   */
  static requireBrowserEnvironment(): void {
    if (!Environment.isBrowser()) {
      throw new Error(
        "SubeloJS requires a browser environment with support for File, Blob, FormData, and XMLHttpRequest. It cannot be used in a Node.js environment.",
      );
    }
  }
}
