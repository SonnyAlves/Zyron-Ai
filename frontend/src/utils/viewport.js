/**
 * Mobile Viewport Height Fix
 *
 * Fixes the 100vh issue on mobile browsers (especially iOS Safari)
 * where the address bar causes layout issues.
 *
 * Sets a CSS custom property --vh that equals 1% of the actual viewport height.
 * Usage in CSS: height: calc(var(--vh, 1vh) * 100)
 */

export function initViewportHeight() {
  // Function to set the viewport height custom property
  const setViewportHeight = () => {
    // Get the actual viewport height
    const vh = window.innerHeight * 0.01;
    // Set the custom property on the document root
    document.documentElement.style.setProperty('--vh', `${vh}px`);
  };

  // Set on initial load
  setViewportHeight();

  // Update on resize (handles orientation change and address bar show/hide)
  window.addEventListener('resize', setViewportHeight);

  // Also listen to orientationchange for better mobile support
  window.addEventListener('orientationchange', () => {
    // Small delay to ensure the browser has updated the viewport
    setTimeout(setViewportHeight, 100);
  });

  // For iOS, also listen to visualViewport changes if available
  if (window.visualViewport) {
    window.visualViewport.addEventListener('resize', setViewportHeight);
  }

  return () => {
    window.removeEventListener('resize', setViewportHeight);
    window.removeEventListener('orientationchange', setViewportHeight);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', setViewportHeight);
    }
  };
}

/**
 * Check if the device is a mobile device
 */
export function isMobileDevice() {
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(
    navigator.userAgent
  );
}

/**
 * Check if the device is iOS
 */
export function isIOS() {
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
}
