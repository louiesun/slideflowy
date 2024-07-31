export function convertColorToHex(color: string, defaultColor = '000000') {
  if (color.startsWith('#') && (color.length === 4 || color.length === 7)) {
    const hexColor =
      color.length === 4
        ? `#${color[1]}${color[1]}${color[2]}${color[2]}${color[3]}${color[3]}`
        : color
    return hexColor.toUpperCase()
  }

  if (color.startsWith('rgb(') && color.endsWith(')')) {
    const rgbValues = color
      .slice(4, -1)
      .split(',')
      .map(value => parseInt(value.trim(), 10))

    if (
      rgbValues.length === 3 &&
      rgbValues.every(value => !isNaN(value) && value >= 0 && value <= 255)
    ) {
      const hexColor = `#${rgbValues
        .map(value => ('0' + value.toString(16)).slice(-2))
        .join('')}`
      return hexColor.toUpperCase()
    }
  }

  return defaultColor
}
