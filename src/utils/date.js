import firestore from '@react-native-firebase/firestore';
import { getLocales, getTimeZone } from 'react-native-localize';

const DATE_KEY_PATTERN = /^\d{4}-\d{2}-\d{2}$/;
export const DISPLAY_LOCALE = 'en-US';

const isDateKey = (value) => typeof value === 'string' && DATE_KEY_PATTERN.test(value);

const dateKeyToDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(year, month - 1, day);
};

const dateKeyToUtcDate = (dateKey) => {
  const [year, month, day] = dateKey.split('-').map(Number);
  return new Date(Date.UTC(year, month - 1, day));
};

export const getDeviceTimeZone = () => {
  try {
    return getTimeZone() || Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  } catch {
    return 'UTC';
  }
};

export const getDeviceLocale = () => {
  try {
    return (
      getLocales()[0]?.languageTag || Intl.DateTimeFormat().resolvedOptions().locale || 'en-US'
    );
  } catch {
    return 'en-US';
  }
};

export const timestampToDate = (timestamp) => {
  if (timestamp == null) return null;
  if (isDateKey(timestamp)) return dateKeyToDate(timestamp);
  if (timestamp instanceof Date) return Number.isNaN(timestamp.getTime()) ? null : timestamp;

  if (typeof timestamp.toDate === 'function') {
    const date = timestamp.toDate();
    return date instanceof Date && !Number.isNaN(date.getTime()) ? date : null;
  }

  return null;
};

const getFormattingDate = (dateLike, timeZone = getDeviceTimeZone()) =>
  isDateKey(dateLike)
    ? { date: dateKeyToUtcDate(dateLike), timeZone: 'UTC' }
    : { date: timestampToDate(dateLike), timeZone };

const formatDateObject = ({
  dateLike,
  includeWeekday = false,
  timeZone = getDeviceTimeZone(),
  locale = DISPLAY_LOCALE,
}) => {
  const formattingDate = getFormattingDate(dateLike, timeZone);
  if (!formattingDate.date) return 'N/A';

  const yearFormatter = new Intl.DateTimeFormat(locale, {
    timeZone: formattingDate.timeZone,
    year: 'numeric',
  });
  const includeYear =
    yearFormatter.format(formattingDate.date) !== yearFormatter.format(new Date());

  return formattingDate.date.toLocaleDateString(locale, {
    ...(includeWeekday && { weekday: 'long' }),
    month: 'long',
    day: 'numeric',
    ...(includeYear && { year: 'numeric' }),
    timeZone: formattingDate.timeZone,
  });
};

export const formatDate = (date, timeZone = getDeviceTimeZone(), locale = DISPLAY_LOCALE) =>
  formatDateObject({ dateLike: date, timeZone, locale });

export const formatDateWithWeekday = (
  date,
  timeZone = getDeviceTimeZone(),
  locale = DISPLAY_LOCALE
) => formatDateObject({ dateLike: date, includeWeekday: true, timeZone, locale });

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

export const generateFirestoreTimestamp = () => firestore.Timestamp.now();

export const generateFirestoreTimestampFromDate = (date) => firestore.Timestamp.fromDate(date);
