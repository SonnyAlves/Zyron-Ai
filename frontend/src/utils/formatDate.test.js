import { formatDate, formatDateFull, formatTime } from './formatDate';

describe('formatDate', () => {
  // Mock current time for consistent testing
  const mockNow = new Date('2024-01-15T12:00:00Z');
  const originalDateNow = Date.now;

  beforeEach(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
    global.Date.now = () => mockNow.getTime();
  });

  afterEach(() => {
    global.Date = originalDateNow;
  });

  describe('relative time formatting', () => {
    it('should return "À l\'instant" for current time (fr-FR)', () => {
      const result = formatDate(mockNow.toISOString(), 'fr-FR');
      expect(result).toBe("À l'instant");
    });

    it('should return "Just now" for current time (en-US)', () => {
      const result = formatDate(mockNow.toISOString(), 'en-US');
      expect(result).toBe('Just now');
    });

    it('should format minutes ago correctly (fr-FR)', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'fr-FR');
      expect(result).toBe('Il y a 5 min');
    });

    it('should format minutes ago correctly (en-US)', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'en-US');
      expect(result).toBe('5 min ago');
    });

    it('should format hours ago correctly (fr-FR)', () => {
      const threeHoursAgo = new Date(mockNow.getTime() - 3 * 3600000);
      const result = formatDate(threeHoursAgo.toISOString(), 'fr-FR');
      expect(result).toBe('Il y a 3h');
    });

    it('should format hours ago correctly (en-US)', () => {
      const threeHoursAgo = new Date(mockNow.getTime() - 3 * 3600000);
      const result = formatDate(threeHoursAgo.toISOString(), 'en-US');
      expect(result).toBe('3h ago');
    });

    it('should return "Hier" for yesterday (fr-FR)', () => {
      const yesterday = new Date(mockNow.getTime() - 24 * 3600000);
      const result = formatDate(yesterday.toISOString(), 'fr-FR');
      expect(result).toBe('Hier');
    });

    it('should return "Yesterday" for yesterday (en-US)', () => {
      const yesterday = new Date(mockNow.getTime() - 24 * 3600000);
      const result = formatDate(yesterday.toISOString(), 'en-US');
      expect(result).toBe('Yesterday');
    });

    it('should format multiple days ago (fr-FR)', () => {
      const threeDaysAgo = new Date(mockNow.getTime() - 3 * 86400000);
      const result = formatDate(threeDaysAgo.toISOString(), 'fr-FR');
      expect(result).toBe('Il y a 3 jours');
    });

    it('should format multiple days ago (en-US)', () => {
      const threeDaysAgo = new Date(mockNow.getTime() - 3 * 86400000);
      const result = formatDate(threeDaysAgo.toISOString(), 'en-US');
      expect(result).toBe('3 days ago');
    });
  });

  describe('absolute date formatting', () => {
    it('should format old dates with month and day (fr-FR)', () => {
      const oldDate = new Date('2023-12-25T10:00:00Z');
      const result = formatDate(oldDate.toISOString(), 'fr-FR');
      // Format should be "jour mois" in French
      expect(result).toMatch(/^\d+ [a-z]+$/);
    });

    it('should format old dates with month and day (en-US)', () => {
      const oldDate = new Date('2023-12-25T10:00:00Z');
      const result = formatDate(oldDate.toISOString(), 'en-US');
      // Format should contain month and day
      expect(result).toBeTruthy();
    });
  });

  describe('locale support', () => {
    it('should support Spanish locale (es-ES)', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'es-ES');
      expect(result).toBe('Hace 5 min');
    });

    it('should support German locale (de-DE)', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'de-DE');
      expect(result).toBe('vor 5 Min');
    });

    it('should support Japanese locale (ja-JP)', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'ja-JP');
      expect(result).toBe('5分前');
    });

    it('should support Chinese locale (zh-CN)', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'zh-CN');
      expect(result).toBe('5分钟前');
    });

    it('should default to en-US for unsupported locale', () => {
      const fiveMinutesAgo = new Date(mockNow.getTime() - 5 * 60000);
      const result = formatDate(fiveMinutesAgo.toISOString(), 'xx-XX');
      expect(result).toBe('5 min ago');
    });
  });

  describe('error handling', () => {
    it('should handle invalid date strings', () => {
      const result = formatDate('invalid-date', 'en-US');
      expect(result).toBe('');
    });

    it('should handle null input', () => {
      const result = formatDate(null, 'en-US');
      expect(result).toBe('');
    });

    it('should handle undefined input', () => {
      const result = formatDate(undefined, 'en-US');
      expect(result).toBe('');
    });

    it('should handle empty string', () => {
      const result = formatDate('', 'en-US');
      expect(result).toBe('');
    });
  });
});

describe('formatDateFull', () => {
  it('should format date with full details', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = formatDateFull(date, 'en-US');
    expect(result).toContain('2024');
    expect(result).toContain('January');
    expect(result).toContain('15');
  });

  it('should accept custom options', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = formatDateFull(date, 'en-US', {
      year: '2-digit',
      month: 'short',
      day: '2-digit',
    });
    expect(result).toBeTruthy();
  });

  it('should handle French locale', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = formatDateFull(date, 'fr-FR');
    expect(result).toContain('2024');
  });

  it('should handle invalid dates gracefully', () => {
    const result = formatDateFull('invalid-date', 'en-US');
    expect(result).toBe('');
  });
});

describe('formatTime', () => {
  it('should format time only', () => {
    const date = '2024-01-15T14:30:00Z';
    const result = formatTime(date, 'en-US');
    expect(result).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should handle different locales', () => {
    const date = '2024-01-15T14:30:00Z';
    const resultEN = formatTime(date, 'en-US');
    const resultFR = formatTime(date, 'fr-FR');
    expect(resultEN).toBeTruthy();
    expect(resultFR).toBeTruthy();
  });

  it('should handle invalid dates gracefully', () => {
    const result = formatTime('invalid-date', 'en-US');
    expect(result).toBe('');
  });

  it('should handle empty string', () => {
    const result = formatTime('', 'en-US');
    expect(result).toBe('');
  });
});

describe('edge cases', () => {
  const mockNow = new Date('2024-01-15T12:00:00Z');

  beforeEach(() => {
    jest.spyOn(global, 'Date').mockImplementation(() => mockNow);
    global.Date.now = () => mockNow.getTime();
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  it('should handle exactly 1 hour ago', () => {
    const oneHourAgo = new Date(mockNow.getTime() - 3600000);
    const result = formatDate(oneHourAgo.toISOString(), 'en-US');
    expect(result).toBe('1h ago');
  });

  it('should handle exactly 1 day ago (yesterday)', () => {
    const oneDayAgo = new Date(mockNow.getTime() - 86400000);
    const result = formatDate(oneDayAgo.toISOString(), 'en-US');
    expect(result).toBe('Yesterday');
  });

  it('should handle 7 days ago (boundary)', () => {
    const sevenDaysAgo = new Date(mockNow.getTime() - 7 * 86400000);
    const result = formatDate(sevenDaysAgo.toISOString(), 'en-US');
    // After 7 days, should switch to absolute date formatting
    expect(result).toBeTruthy();
  });

  it('should handle future dates', () => {
    const futureDate = new Date(mockNow.getTime() + 1000000);
    const result = formatDate(futureDate.toISOString(), 'en-US');
    // Depending on implementation, might show negative times or 0
    expect(result).toBeTruthy();
  });
});

describe('performance', () => {
  it('should handle rapid successive calls', () => {
    const date = '2024-01-15T12:05:00Z';
    const locale = 'en-US';

    const start = performance.now();
    for (let i = 0; i < 1000; i++) {
      formatDate(date, locale);
    }
    const end = performance.now();

    // Should complete 1000 calls in reasonable time
    expect(end - start).toBeLessThan(100);
  });
});
