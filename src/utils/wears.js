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

export const DEFAULT_WEAR_GOAL = 10;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

const hexToRgb = (hex) => {
  const normalizedHex = hex.replace('#', '');
  const value = parseInt(normalizedHex, 16);

  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const rgbToHex = ({ r, g, b }) =>
  `#${[r, g, b].map((channel) => channel.toString(16).padStart(2, '0')).join('')}`;

const mixHexColors = (startColor, endColor, amount) => {
  const start = hexToRgb(startColor);
  const end = hexToRgb(endColor);

  return rgbToHex({
    r: Math.round(start.r + (end.r - start.r) * amount),
    g: Math.round(start.g + (end.g - start.g) * amount),
    b: Math.round(start.b + (end.b - start.b) * amount),
  });
};

const darkenHexColor = (color, amount = 0.55) => {
  const rgb = hexToRgb(color);

  return rgbToHex({
    r: Math.round(rgb.r * (1 - amount)),
    g: Math.round(rgb.g * (1 - amount)),
    b: Math.round(rgb.b * (1 - amount)),
  });
};

const interpolateProgressColor = (percentage, stops, colorKey) => {
  const cappedPercentage = clamp(percentage, stops[0].percent, stops[stops.length - 1].percent);
  const endIndex = stops.findIndex((stop) => cappedPercentage <= stop.percent);

  if (endIndex <= 0) return stops[0][colorKey];

  const start = stops[endIndex - 1];
  const end = stops[endIndex];
  const range = end.percent - start.percent;
  const amount = range > 0 ? (cappedPercentage - start.percent) / range : 0;

  return mixHexColors(start[colorKey], end[colorKey], amount);
};

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

export const getWearGoalProgress = (wearCount = 0, wearGoal = DEFAULT_WEAR_GOAL) => {
  const normalizedWearCount = Math.max(wearCount || 0, 0);
  const normalizedWearGoal = Math.max(wearGoal || DEFAULT_WEAR_GOAL, 1);
  const percentage = Math.round((normalizedWearCount / normalizedWearGoal) * 100);
  const cappedPercentage = Math.min(percentage, 100);

  let code = 'unworn';

  if (percentage >= 100) {
    code = 'complete';
  } else if (percentage >= 75) {
    code = 'near_goal';
  } else if (percentage >= 50) {
    code = 'halfway';
  } else if (percentage >= 25) {
    code = 'started';
  } else if (percentage > 0) {
    code = 'early';
  }

  return {
    code,
    percentage,
    cappedPercentage,
    displayPercentage: percentage,
    visualPercentage: cappedPercentage,
    label: `${percentage}%`,
    detailLabel: percentage >= 100 ? `${percentage}% of goal` : `${percentage}% to goal`,
  };
};

export const getWearGoalProgressColors = (percentage = 0, colors = {}) => {
  const normalizedPercentage = Math.max(percentage || 0, 0);
  const zeroProgressColors =
    colors.mode === 'dark'
      ? {
          bg: '#263238',
          text: '#CFD8DC',
        }
      : {
          bg: '#ECEFF1',
          text: '#607D8B',
        };

  if (normalizedPercentage <= 0) {
    return zeroProgressColors;
  }

  const stops = colors.wearGoalProgressRange;

  if (!stops?.length) {
    return zeroProgressColors;
  }

  const bg = interpolateProgressColor(normalizedPercentage, stops, 'bg');
  const fill = interpolateProgressColor(normalizedPercentage, stops, 'text');

  return {
    bg,
    fill,
    text: darkenHexColor(fill, 0.18),
  };
};
