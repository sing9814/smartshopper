export const getCurrentItemColor = (itemColor, colors) => {
  if (!itemColor) return null;

  return colors.itemColorOptions.find((option) => option.name === itemColor.name) || itemColor;
};

export const getItemColorBorder = (itemColor, colors) => {
  if (!itemColor) return colors.lightGrey;

  return itemColor.name === 'White' || itemColor.name === 'Black'
    ? colors.lightGrey
    : itemColor.hex;
};
