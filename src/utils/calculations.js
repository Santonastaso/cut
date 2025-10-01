/**
 * Calculate the alpha coefficient for weight calculations
 * @param {number} specificWeight - Specific weight in g/m²
 * @param {number} width - Width in mm
 * @returns {number} Alpha coefficient
 */
export function calculateAlpha(specificWeight, width) {
  return (specificWeight * width) / 1000000;
}

/**
 * Calculate the weight of a material roll
 * @param {number} specificWeight - Specific weight in g/m²
 * @param {number} width - Width in mm
 * @param {number} length - Length in meters
 * @returns {number} Weight in kg
 */
export function calculateWeight(specificWeight, width, length) {
  const alpha = calculateAlpha(specificWeight, width);
  return alpha * length;
}

/**
 * Calculate efficiency percentage
 * @param {number} usedWidth - Used width in mm
 * @param {number} totalWidth - Total width in mm
 * @returns {number} Efficiency percentage
 */
export function calculateEfficiency(usedWidth, totalWidth) {
  if (totalWidth === 0) return 0;
  return ((totalWidth - usedWidth) / totalWidth) * 100;
}

/**
 * Calculate waste in mm
 * @param {number} totalWidth - Total width in mm
 * @param {number} usedWidth - Used width in mm
 * @returns {number} Waste in mm
 */
export function calculateWaste(totalWidth, usedWidth) {
  return Math.max(0, totalWidth - usedWidth);
}

/**
 * Generate a unique color for a string (for visualization)
 * @param {string} str - Input string
 * @returns {string} Hex color code
 */
export function stringToColor(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash);
  }
  let color = '#';
  for (let i = 0; i < 3; i++) {
    let value = (hash >> (i * 8)) & 0xFF;
    // Ensure colors are not too dark
    value = Math.max(value, 120);
    color += ('00' + value.toString(16)).substr(-2);
  }
  return color;
}

/**
 * Format number with specified decimal places
 * @param {number} num - Number to format
 * @param {number} decimals - Number of decimal places
 * @returns {string} Formatted number
 */
export function formatNumber(num, decimals = 2) {
  return parseFloat(num).toFixed(decimals);
}


