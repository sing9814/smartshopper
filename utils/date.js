export const formatDate = (date) => {
  const [year, month, day] = date.split('-');
  const dateObj = new Date(year, month - 1, day); // Month is 0-indexed
  return dateObj.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

export const formatDateShort = (date) => {
  const [year, month, day] = date.split('-');
  const dateObj = new Date(year, month - 1, day); // Month is 0-indexed
  const options = {
    month: 'short',
    day: 'numeric',
  };
  const currentYear = new Date().getFullYear();

  if (dateObj.getFullYear() !== currentYear) {
    options.year = 'numeric';
  }

  return dateObj.toLocaleDateString('en-US', options);
};

export const formatTimeStamp = (timestamp) => {
  const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
  const date = new Date(milliseconds);
  const options = { year: 'numeric', month: 'long', day: 'numeric' };
  return date.toLocaleDateString('en-US', options);
};
