/**
 * Standardized date formatting utility using Intl API
 * Provides consistent, locale-aware relative time formatting
 */

/**
 * Format ISO date string as relative time in French
 * Examples: "À l'instant", "Il y a 5 min", "Il y a 2h", "Hier", "Il y a 3 jours", "15 déc"
 *
 * @param {string} isoDate - ISO date string (e.g., "2024-10-27T10:30:00Z")
 * @param {string} locale - BCP 47 language tag (default: 'fr-FR')
 * @returns {string} Formatted relative time string
 */
export function formatDate(isoDate, locale = 'fr-FR') {
  if (!isoDate) return '';

  const date = new Date(isoDate);
  const now = new Date();

  // Validate date
  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', isoDate);
    return '';
  }

  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  // Use locale-specific messages
  const messages = {
    'fr-FR': {
      now: "À l'instant",
      minuteAgo: (n) => `Il y a ${n} min`,
      hourAgo: (n) => `Il y a ${n}h`,
      yesterday: 'Hier',
      daysAgo: (n) => `Il y a ${n} jours`,
    },
    'en-US': {
      now: 'Just now',
      minuteAgo: (n) => `${n} min ago`,
      hourAgo: (n) => `${n}h ago`,
      yesterday: 'Yesterday',
      daysAgo: (n) => `${n} days ago`,
    },
  };

  const msg = messages[locale] || messages['fr-FR'];

  // Relative time formatting
  if (diffMins < 1) return msg.now;
  if (diffMins < 60) return msg.minuteAgo(diffMins);
  if (diffHours < 24) return msg.hourAgo(diffHours);
  if (diffDays === 1) return msg.yesterday;
  if (diffDays < 7) return msg.daysAgo(diffDays);

  // Absolute date formatting for older dates
  try {
    if (locale === 'fr-FR') {
      return date.toLocaleDateString('fr-FR', {
        day: 'numeric',
        month: 'short',
      });
    } else {
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    }
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toISOString().split('T')[0];
  }
}

/**
 * Format ISO date as full readable string with time
 * Uses native Intl.DateTimeFormat for proper localization
 *
 * @param {string} isoDate - ISO date string
 * @param {string} locale - BCP 47 language tag
 * @param {Object} options - Intl.DateTimeFormat options
 * @returns {string} Formatted date string
 */
export function formatDateFull(isoDate, locale = 'fr-FR', options = {}) {
  if (!isoDate) return '';

  const date = new Date(isoDate);

  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', isoDate);
    return '';
  }

  const defaultOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    ...options,
  };

  try {
    return new Intl.DateTimeFormat(locale, defaultOptions).format(date);
  } catch (error) {
    console.warn('Error formatting date:', error);
    return date.toISOString();
  }
}

/**
 * Format ISO date as time only (HH:mm)
 *
 * @param {string} isoDate - ISO date string
 * @param {string} locale - BCP 47 language tag
 * @returns {string} Formatted time string
 */
export function formatTime(isoDate, locale = 'fr-FR') {
  if (!isoDate) return '';

  const date = new Date(isoDate);

  if (isNaN(date.getTime())) {
    console.warn('Invalid date:', isoDate);
    return '';
  }

  try {
    return new Intl.DateTimeFormat(locale, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(date);
  } catch (error) {
    console.warn('Error formatting time:', error);
    return '';
  }
}
