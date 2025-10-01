import { calculateEfficiency, calculateWaste } from '../utils/calculations';

/**
 * Base class for cutting optimization algorithms
 */
export class BaseAlgorithm {
  constructor(name, description) {
    this.name = name;
    this.description = description;
  }

  /**
   * Main optimization method - to be implemented by subclasses
   * @param {Array} stockRolls - Available stock rolls
   * @param {Array} cutRequests - Cut requests to fulfill
   * @param {Object} settings - Algorithm-specific settings
   * @returns {Object} Optimization result
   */
  optimize(stockRolls, cutRequests, settings = {}) {
    throw new Error('optimize method must be implemented by subclass');
  }

  /**
   * Create a cutting pattern for a roll
   * @param {Object} roll - Stock roll
   * @param {Array} cuts - Array of cuts to make
   * @returns {Object} Cutting pattern
   */
  createPattern(roll, cuts) {
    const usedWidth = cuts.reduce((sum, cut) => sum + cut.width, 0);
    const waste = calculateWaste(roll.width, usedWidth);
    const efficiency = calculateEfficiency(waste, roll.width);

    return {
      roll,
      cuts,
      efficiency,
      waste,
      usedWidth
    };
  }

  /**
   * Expand requests with quantities into individual requests
   * @param {Array} requests - Requests with quantities
   * @returns {Array} Expanded individual requests
   */
  expandRequests(requests) {
    const expanded = [];
    requests.forEach(request => {
      for (let i = 0; i < request.quantity; i++) {
        expanded.push({
          ...request,
          id: `${request.id}-${i}`,
          quantity: 1
        });
      }
    });
    return expanded;
  }

  /**
   * Group requests by material
   * @param {Array} requests - Cut requests
   * @returns {Object} Requests grouped by material code
   */
  groupRequestsByMaterial(requests) {
    const grouped = {};
    requests.forEach(request => {
      if (!grouped[request.material]) {
        grouped[request.material] = [];
      }
      grouped[request.material].push(request);
    });
    return grouped;
  }

  /**
   * Sort requests by priority and width
   * @param {Array} requests - Cut requests
   * @returns {Array} Sorted requests
   */
  sortRequestsByPriority(requests) {
    return [...requests].sort((a, b) => {
      const priorityOrder = { high: 3, normal: 2, low: 1 };
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      return b.width - a.width; // Larger width first
    });
  }

  /**
   * Sort rolls by width (descending)
   * @param {Array} rolls - Stock rolls
   * @returns {Array} Sorted rolls
   */
  sortRollsByWidth(rolls) {
    return [...rolls].sort((a, b) => b.width - a.width);
  }
}

