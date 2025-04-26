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
