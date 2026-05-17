export const WEAR_LEVELS = [
  {
    code: 'unworn',
    emoji: '📦',
    label: 'Unworn',
    min: 0,
    max: 0,
  },
  {
    code: 'new_arrival',
    emoji: '🌱',
    label: 'New Arrival',
    min: 1,
    max: 5,
  },
  {
    code: 'lightly_worn',
    emoji: '👟',
    label: 'Lightly Worn',
    min: 6,
    max: 15,
  },
  {
    code: 'in_rotation',
    emoji: '🔁',
    label: 'In Rotation',
    min: 16,
    max: 30,
  },
  {
    code: 'well_worn',
    emoji: '🧥',
    label: 'Well Worn',
    min: 31,
    max: 50,
  },
  {
    code: 'wardrobe_mvp',
    emoji: '⭐',
    label: 'Wardrobe MVP',
    min: 51,
    max: 75,
  },
  {
    code: 'legacy_item',
    emoji: '🏆',
    label: 'Legacy Item',
    min: 76,
    max: Infinity,
  },
];

export const getWearLevelData = (wearCount = 0) => {
  const normalizedWearCount = Math.max(wearCount || 0, 0);

  return WEAR_LEVELS.find(
    (level) => normalizedWearCount >= level.min && normalizedWearCount <= level.max
  );
};

export const getWearLevel = (wearCount) => {
  const { emoji, label } = getWearLevelData(wearCount);
  return `${emoji} ${label}`;
};
