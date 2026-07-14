export const DEFAULT_FOLDER_COLOR = 'Black';

export const colorWithOpacity = (hex, opacity) => {
  const value = hex?.replace('#', '');
  if (!value || value.length !== 6) return hex;

  const colorNumber = Number.parseInt(value, 16);

  if (Number.isNaN(colorNumber)) return hex;

  const red = (colorNumber >> 16) & 255;
  const green = (colorNumber >> 8) & 255;
  const blue = colorNumber & 255;

  return `rgba(${red}, ${green}, ${blue}, ${opacity})`;
};

export const getCollectionFolderColor = (folderColor, colors) =>
  colors.itemColorOptions.find((option) => option.name === folderColor?.name)?.hex ||
  folderColor?.hex ||
  colors.primary;

export const getCollectionFolderBackground = (folderColor, colors, opacity = 0.2) => {
  const resolvedColor = getCollectionFolderColor(folderColor, colors);

  if (folderColor?.name === 'White') return colors.lightGrey;
  if (colors.mode === 'dark' && folderColor?.name === 'Black') {
    return colorWithOpacity(colors.gray, 0.5);
  }

  return colorWithOpacity(resolvedColor, opacity);
};
