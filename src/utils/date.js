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
  const date = new Date(timestamp.seconds * 1000);

  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const timeOptions = { hour: 'numeric', minute: 'numeric', hour12: true };

  const formattedDate = date.toLocaleDateString('en-US', dateOptions);
  const formattedTime = date.toLocaleTimeString('en-US', timeOptions);

  return `${formattedDate} @ ${formattedTime}`;

  // const milliseconds = timestamp.seconds * 1000 + Math.floor(timestamp.nanoseconds / 1000000);
  // const date = new Date(milliseconds);
  // const options = { year: 'numeric', month: 'long', day: 'numeric' };
  // return date.toLocaleDateString('en-US', options);
};

export const formatTimeStampNoTime = (timestamp) => {
  const date = new Date(timestamp.seconds * 1000);
  const dateOptions = { year: 'numeric', month: 'short', day: 'numeric' };
  const formattedDate = date.toLocaleDateString('en-US', dateOptions);

  return `${formattedDate}`;
};

export const generateFirestoreTimestamp = () => {
  const date = new Date();
  const seconds = Math.floor(date.getTime() / 1000);
  const nanoseconds = date.getMilliseconds() * 1e6;

  return {
    seconds: seconds,
    nanoseconds: nanoseconds,
  };
};
