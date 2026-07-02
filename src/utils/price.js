import { getCurrencies } from 'react-native-localize';

export const getLocalCurrency = () => {
  const currencies = getCurrencies();

  return currencies[0] || 'USD';
};

export const formatCentsAsCurrency = (cents) => {
  if (cents == null) return '';

  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: getLocalCurrency(),
  }).format(cents / 100);
};

export const formatCentsAsCostPerWear = (cents) => {
  if (cents == null) return 'N/A';
  return formatCentsAsCurrency(cents);
};

export const getLocalCurrencySymbol = () =>
  new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: getLocalCurrency(),
    currencyDisplay: 'narrowSymbol',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
    .formatToParts(0)
    .find((part) => part.type === 'currency')?.value || '$';

export const convertCentsToDollars = (cents) => {
  if (cents == null) return '';
  return (cents / 100).toFixed(2);
};

export const convertDollarsToCents = (priceString) => {
  if (!priceString) return 0;

  const parsed = parseFloat(priceString);
  if (isNaN(parsed)) return 0;

  return Math.round(parsed * 100);
};
