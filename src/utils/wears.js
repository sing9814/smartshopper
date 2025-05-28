const getWearLevelObject = (wearCount) => {
  if (wearCount === 0) return { emoji: '🌱', label: 'New Arrival' };
  if (wearCount <= 5) return { emoji: '👟', label: 'Lightly Worn' };
  if (wearCount <= 15) return { emoji: '🔁', label: 'In Rotation' };
  if (wearCount <= 30) return { emoji: '🧥', label: 'Well Worn' };
  if (wearCount <= 50) return { emoji: '♻️', label: 'Long-Term Use' };
  if (wearCount <= 75) return { emoji: '⭐', label: 'Wardrobe MVP' };
  return { emoji: '🏆', label: 'Legacy Item' };
};

export const getWearLevel = (wearCount) => {
  const { emoji, label } = getWearLevelObject(wearCount);
  return `${emoji} ${label}`;
};

export const getWearEmoji = (wearCount) => {
  return getWearLevelObject(wearCount).emoji;
};
