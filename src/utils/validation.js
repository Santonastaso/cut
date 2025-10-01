/**
 * Validate material data
 * @param {Object} material - Material object
 * @returns {Object} Validation result with isValid and errors
 */
export function validateMaterial(material) {
  const errors = [];

  if (!material.code || material.code.trim() === '') {
    errors.push('Codice materiale è obbligatorio');
  }

  if (!material.name || material.name.trim() === '') {
    errors.push('Nome materiale è obbligatorio');
  }

  if (!material.specificWeight || isNaN(material.specificWeight) || material.specificWeight <= 0) {
    errors.push('Peso specifico deve essere un numero positivo');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate stock roll data
 * @param {Object} stockRoll - Stock roll object
 * @returns {Object} Validation result with isValid and errors
 */
export function validateStockRoll(stockRoll) {
  const errors = [];

  if (!stockRoll.code || stockRoll.code.trim() === '') {
    errors.push('Codice bobina è obbligatorio');
  }

  if (!stockRoll.material || stockRoll.material.trim() === '') {
    errors.push('Materiale è obbligatorio');
  }

  if (!stockRoll.width || isNaN(stockRoll.width) || stockRoll.width <= 0) {
    errors.push('Larghezza deve essere un numero positivo');
  }

  if (!stockRoll.length || isNaN(stockRoll.length) || stockRoll.length <= 0) {
    errors.push('Lunghezza deve essere un numero positivo');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate cut request data
 * @param {Object} request - Cut request object
 * @returns {Object} Validation result with isValid and errors
 */
export function validateCutRequest(request) {
  const errors = [];

  if (!request.orderNumber || request.orderNumber.trim() === '') {
    errors.push('Numero ODP è obbligatorio');
  }

  if (!request.material || request.material.trim() === '') {
    errors.push('Materiale è obbligatorio');
  }

  if (!request.width || isNaN(request.width) || request.width <= 0) {
    errors.push('Larghezza deve essere un numero positivo');
  }

  if (!request.length || isNaN(request.length) || request.length <= 0) {
    errors.push('Lunghezza deve essere un numero positivo');
  }

  if (!request.quantity || isNaN(request.quantity) || request.quantity <= 0) {
    errors.push('Quantità deve essere un numero positivo');
  }

  if (!['high', 'normal', 'low'].includes(request.priority)) {
    errors.push('Priorità deve essere alta, normale o bassa');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if material code already exists
 * @param {string} code - Material code
 * @param {Array} materials - Existing materials array
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {boolean} True if code exists
 */
export function isMaterialCodeDuplicate(code, materials, excludeId = null) {
  return materials.some(material => 
    material.code === code && material.id !== excludeId
  );
}

/**
 * Check if stock roll code already exists
 * @param {string} code - Stock roll code
 * @param {Array} stockRolls - Existing stock rolls array
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {boolean} True if code exists
 */
export function isStockCodeDuplicate(code, stockRolls, excludeId = null) {
  return stockRolls.some(roll => 
    roll.code === code && roll.id !== excludeId
  );
}

/**
 * Check if order number already exists
 * @param {string} orderNumber - Order number
 * @param {Array} requests - Existing requests array
 * @param {number} excludeId - ID to exclude from check (for updates)
 * @returns {boolean} True if order number exists
 */
export function isOrderNumberDuplicate(orderNumber, requests, excludeId = null) {
  return requests.some(request => 
    request.orderNumber === orderNumber && request.id !== excludeId
  );
}

/**
 * Format priority text for display
 * @param {string} priority - Priority level
 * @returns {string} Formatted priority text
 */
export function formatPriority(priority) {
  const priorityMap = {
    high: 'Alta',
    normal: 'Normale',
    low: 'Bassa'
  };
  return priorityMap[priority] || priority;
}

/**
 * Get priority badge class for styling
 * @param {string} priority - Priority level
 * @returns {string} CSS class name
 */
export function getPriorityBadgeClass(priority) {
  const classMap = {
    high: 'bg-red-100 text-red-800',
    normal: 'bg-blue-100 text-blue-800',
    low: 'bg-yellow-100 text-yellow-800'
  };
  return classMap[priority] || 'bg-gray-100 text-gray-800';
}

