/**
 * Disable console logs in production
 * This overrides console.log, console.debug, console.info
 * but keeps console.error and console.warn
 */

if (import.meta.env.PROD) {
  // Save original functions for errors/warnings
  const originalError = console.error;
  const originalWarn = console.warn;

  // Override console methods in production
  console.log = () => {};
  console.debug = () => {};
  console.info = () => {};

  // Keep error and warn
  console.error = originalError;
  console.warn = originalWarn;
}
