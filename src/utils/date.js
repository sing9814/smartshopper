import firestore from '@react-native-firebase/firestore';
import { I18nManager } from 'react-native';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

const isDateKey = (value) => typeof value === 'string' && DATE_KEY_PATTERN.test(value);

const dateKeyToDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-');
  return new Date(year, month - 1, day);
};

export const formatDate = (date) => {
  const dateObj = timestampToDate(date);
  if (!dateObj) return 'N/A';

  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const getDeviceTimeZone = () => {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getDeviceLocale = () => {
  const nativeLocale = I18nManager.getConstants?.().localeIdentifier;
  if (nativeLocale) return nativeLocale.replace('_', '-');

  try {
    return Intl.DateTimeFormat().resolvedOptions().locale || 'en-US';
  } catch {
    return 'en-US';
  }
};

export const getFirstDayOfWeek = (locale = getDeviceLocale()) => {
  try {
    if (typeof Intl.Locale === 'function') {
      const localeInfo = new Intl.Locale(locale);
      const weekInfo =
        typeof localeInfo.getWeekInfo === 'function'
          ? localeInfo.getWeekInfo()
          : localeInfo.weekInfo;

      if (weekInfo?.firstDay) return weekInfo.firstDay % 7;
    }
  } catch {
    // Fall through to a simple default for older JavaScript engines
  }

  return /(?:^|[-_])US(?:[-_]|$)/i.test(locale) ? 0 : 1;
};

export const timestampToDate = (timestamp) => {
  if (!timestamp) return null;
  if (isDateKey(timestamp)) return dateKeyToDate(timestamp);
  if (typeof timestamp.toDate === 'function') return timestamp.toDate();
  if (timestamp.seconds != null || timestamp._seconds != null) {
    return new Date((timestamp.seconds ?? timestamp._seconds) * 1000);
  }
  if (timestamp instanceof Date) return Number.isNaN(timestamp.getTime()) ? null : timestamp;

  const date = new Date(timestamp);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const getDateKeyInTimeZone = (dateLike, timeZone = getDeviceTimeZone()) => {
  if (isDateKey(dateLike)) return dateLike;

  const date = timestampToDate(dateLike);
  if (!date) return null;

  try {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(date);

    const year = parts.find((part) => part.type === 'year')?.value;
    const month = parts.find((part) => part.type === 'month')?.value;
    const day = parts.find((part) => part.type === 'day')?.value;

    if (year && month && day) return `${year}-${month}-${day}`;
  } catch {
    return null;
  }

  return null;
};

const formatShortDateObject = (date, timeZone = getDeviceTimeZone()) => {
  const options = {
    month: 'short',
    day: 'numeric',
    timeZone,
  };
  const currentYear = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
  }).format(new Date());
  const dateYear = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
  }).format(date);

  if (dateYear !== currentYear) {
    options.year = 'numeric';
  }

  return date.toLocaleDateString('en-US', options);
};

export const formatDateShort = (dateLike, timeZone = getDeviceTimeZone()) => {
  const date = timestampToDate(dateLike);
  if (!date) return 'N/A';

  return formatShortDateObject(date, timeZone);
};

export const formatTimeStamp = (timestamp) => {
  const date = timestampToDate(timestamp);
  if (!date) return 'N/A';

  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };

  const formattedDate = date.toLocaleDateString('en-US', dateOptions);
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

  return `${formattedDate} @ ${formattedTime}`;
};

export const formatTimeStampNoTime = (timestamp) => {
  try {
    const date = timestampToDate(timestamp);
    if (!date) return 'N/A';
    return formatShortDateObject(date);
  } catch {
    return 'N/A';
  }
};

export const generateFirestoreTimestamp = () => {
  return firestore.Timestamp.now();
};

export const generateFirestoreTimestampFromDate = (date) => {
  return firestore.Timestamp.fromDate(date);
};
