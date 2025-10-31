/**
 * =============================================================================
 * ZYRON AI - INTELLIGENT LOGGING SYSTEM
 * =============================================================================
 *
 * Logging utility that:
 * - Only logs in development mode
 * - Provides clean, organized logs
 * - Shows version/commit info on startup
 * - Reduces memory usage in production
 */

const IS_DEV = import.meta.env.DEV;
const IS_PROD = import.meta.env.PROD;

// Code name for this version
const CODE_NAME = 'Leverage';

// Version info (will be injected at build time)
const VERSION_INFO = {
  version: import.meta.env.VITE_APP_VERSION || '1.3.4',
  codeName: CODE_NAME,
  commit: import.meta.env.VITE_GIT_COMMIT_SHA || 'unknown',
  branch: import.meta.env.VITE_GIT_BRANCH || 'unknown',
  buildTime: import.meta.env.VITE_BUILD_TIME || 'unknown',
  apiUrl: import.meta.env.VITE_API_URL || 'not configured',
};

/**
 * Logger class with different log levels
 */
class Logger {
  private context: string;

  constructor(context: string = 'App') {
    this.context = context;
  }

  /**
   * Log info message (only in dev)
   */
  info(...args: any[]) {
    if (IS_DEV) {
      console.log(`[${this.context}]`, ...args);
    }
  }

  /**
   * Log warning message (always logged)
   */
  warn(...args: any[]) {
    console.warn(`[${this.context}] ⚠️`, ...args);
  }

  /**
   * Log error message (always logged)
   */
  error(...args: any[]) {
    console.error(`[${this.context}] ❌`, ...args);
  }

  /**
   * Log success message (only in dev)
   */
  success(...args: any[]) {
    if (IS_DEV) {
      console.log(`[${this.context}] ✅`, ...args);
    }
  }

  /**
   * Log debug message (only in dev)
   */
  debug(...args: any[]) {
    if (IS_DEV) {
      console.debug(`[${this.context}] 🔍`, ...args);
    }
  }

  /**
   * Log production message (always logged, but minimal)
   */
  prod(...args: any[]) {
    console.log(`[${this.context}]`, ...args);
  }
}

/**
 * Create a logger instance for a specific context
 */
export const createLogger = (context: string) => new Logger(context);

/**
 * Default logger
 */
export const logger = new Logger('Zyron');

/**
 * Display version info on app startup
 */
export const displayVersionInfo = async () => {
  const styles = [
    'color: #667eea',
    'font-size: 14px',
    'font-weight: bold',
    'padding: 8px',
    'border-radius: 4px',
    'background: linear-gradient(90deg, #667eea 0%, #764ba2 100%)',
    'color: white',
  ].join(';');

  const infoStyles = [
    'color: #666',
    'font-size: 12px',
    'padding: 4px',
  ].join(';');

  const errorStyles = [
    'color: #ef4444',
    'font-size: 12px',
    'padding: 4px',
    'font-weight: bold',
  ].join(';');

  const successStyles = [
    'color: #10b981',
    'font-size: 12px',
    'padding: 4px',
    'font-weight: bold',
  ].join(';');

  // Use console.warn to bypass disableLogs.ts in production
  console.warn(`%c🧠 Zyron AI - ${VERSION_INFO.codeName}`, styles);
  console.warn('%cFrontend Version:', infoStyles);
  console.warn(`  📦 Version: ${VERSION_INFO.version} (${VERSION_INFO.codeName})`);
  console.warn(`  🔀 Branch: ${VERSION_INFO.branch}`);
  console.warn(`  📝 Commit: ${VERSION_INFO.commit.substring(0, 8)}`);
  console.warn(`  🕐 Build: ${VERSION_INFO.buildTime}`);
  console.warn(`  🌐 API: ${VERSION_INFO.apiUrl}`);
  console.warn(`  🏗️ Mode: ${IS_DEV ? '🔧 Development' : '🚀 Production'}`);
  console.warn('');

  // Check backend version
  if (VERSION_INFO.apiUrl && VERSION_INFO.apiUrl !== 'not configured') {
    try {
      const response = await fetch(`${VERSION_INFO.apiUrl}/version`, {
        method: 'GET',
        headers: { 'Content-Type': 'application/json' },
      });
      
      if (response.ok) {
        const backendInfo = await response.json();
        console.warn(`%c🚀 Backend v${backendInfo.version} (${backendInfo.codename}) - ${backendInfo.status}`, successStyles);
        console.warn(`  💰 API: ${backendInfo.api}`);
      } else {
        console.warn('%c⚠️ Backend: Unable to fetch version', errorStyles);
      }
    } catch (error) {
      console.warn('%c❌ Backend: Not reachable', errorStyles);
    }
  } else {
    console.error('%c⚠️ WARNING: VITE_API_URL is not configured!', errorStyles);
    console.error('   Backend not deployed - messages will not be saved!');
  }
  
  console.warn('');
};

/**
 * Performance monitoring (only in dev)
 */
export const perfLogger = {
  start(label: string) {
    if (IS_DEV) {
      performance.mark(`${label}-start`);
    }
  },

  end(label: string) {
    if (IS_DEV) {
      performance.mark(`${label}-end`);
      performance.measure(label, `${label}-start`, `${label}-end`);
      const measure = performance.getEntriesByName(label)[0];
      console.log(`⏱️ ${label}: ${measure.duration.toFixed(2)}ms`);
    }
  },
};

/**
 * Export version info for display in UI
 */
export const getVersionInfo = () => VERSION_INFO;

/**
 * Check if we're in development mode
 */
export const isDev = () => IS_DEV;

/**
 * Check if we're in production mode
 */
export const isProd = () => IS_PROD;
