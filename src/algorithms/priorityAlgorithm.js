import { BaseAlgorithm } from './baseAlgorithm.js';

/**
 * Priority Orders Algorithm
 * Prioritizes high priority requests even at cost of more waste
 * Based on client's HTML MVP implementation
 */
export class PriorityAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'PriorityAlgorithm',
      'Priorità Ordini'
    );
  }

  optimize(stockRolls, cutRequests, settings = {}) {
    // Input validation
    if (!stockRolls || !cutRequests || stockRolls.length === 0 || cutRequests.length === 0) {
      return {
        cuttingPlans: [],
        statistics: {
          efficiency: '0.00',
          totalWaste: '0.00',
          rollsUsed: 0,
          totalRolls: stockRolls?.length || 0,
          fulfilledRequests: 0,
          totalRequests: cutRequests?.reduce((sum, req) => sum + req.quantity, 0) || 0
        }
      };
    }

    // Default settings
    const defaultSettings = {
      priorityWeights: {
        high: 10,
        normal: 5,
        low: 1
      },
      strictMode: true
    };

    const algorithmSettings = { ...defaultSettings, ...settings };

    // Group requests by material type
    const requestsByMaterial = this.groupRequestsByMaterial(cutRequests);
    const cuttingPlans = [];
    let totalWaste = 0;
    let totalEfficiency = 0;
    let usedRolls = 0;
    let totalFulfilledRequests = 0;
    
    // Calculate total requests before processing (quantities will be modified)
    const totalRequests = cutRequests.reduce((sum, req) => sum + req.quantity, 0);

    // Process each material type separately
    Object.entries(requestsByMaterial).forEach(([material, materialRequests]) => {
      const availableRolls = stockRolls.filter(roll => roll.material === material);
      if (!availableRolls.length) return;

      const materialResult = this.optimizeMaterial(availableRolls, materialRequests, algorithmSettings);
      
      if (materialResult.patterns.length > 0) {
        cuttingPlans.push(materialResult);
        totalWaste += parseFloat(materialResult.statistics.totalWaste);
        totalEfficiency += parseFloat(materialResult.statistics.efficiency) * materialResult.patterns.length;
        usedRolls += materialResult.patterns.length;
        totalFulfilledRequests += materialResult.statistics.fulfilledRequests;
      }
    });

    const planEfficiency = usedRolls > 0 ? totalEfficiency / usedRolls : 0;

    return {
      cuttingPlans,
      statistics: {
        efficiency: planEfficiency.toFixed(2),
        totalWaste: (totalWaste / 1000000).toFixed(2), // Convert mm² to m²
        rollsUsed: usedRolls,
        totalRolls: stockRolls.length,
        fulfilledRequests: totalFulfilledRequests,
        totalRequests: totalRequests
      }
    };
  }

  optimizeMaterial(availableRolls, materialRequests, settings) {
    // Sort requests by priority and width
    const sortedRequests = [...materialRequests].sort((a, b) => {
      const priorityA = settings.priorityWeights[a.priority] || 1;
      const priorityB = settings.priorityWeights[b.priority] || 1;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      return b.width - a.width; // Larger width first
    });
    
    // Sort rolls by width (descending) to use larger rolls first
    const sortedRolls = [...availableRolls].sort((a, b) => b.width - a.width);
    
    const patterns = [];
    let totalFulfilledRequests = 0;

    // Process each roll
    for (const roll of sortedRolls) {
      // Check if there are any remaining requests
      const hasRemainingRequests = sortedRequests.some(req => req.quantity > 0);
      if (!hasRemainingRequests) break;

      // Create pattern for this roll
      const pattern = this.createCuttingPattern(roll, sortedRequests, settings);
      
      if (pattern.cuts.length > 0) {
        patterns.push(pattern);
        totalFulfilledRequests += pattern.cuts.length;
      }
    }

    const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const totalArea = patterns.reduce((sum, pattern) => sum + (pattern.roll.width * pattern.roll.length * 1000), 0); // Convert m to mm
    const usedArea = patterns.reduce((sum, pattern) => sum + pattern.usedArea, 0);
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    return {
      material: availableRolls[0].material,
      patterns,
      statistics: {
        efficiency: efficiency.toFixed(2),
        totalWaste: (totalWaste / 1000000).toFixed(2), // Convert mm² to m²
        fulfilledRequests: totalFulfilledRequests
      }
    };
  }

  /**
   * Create cutting pattern prioritizing high priority requests
   * Based on client's HTML MVP implementation
   */
  createCuttingPattern(roll, availableRequests, settings) {
    const pattern = {
      roll: roll,
      cuts: [],
      waste: 0,
      usedArea: 0,
      efficiency: 0,
      remainingPieces: []
    };

    // Sort all requests by priority and width
    const sortedRequests = [...availableRequests].sort((a, b) => {
      const priorityA = settings.priorityWeights[a.priority] || 1;
      const priorityB = settings.priorityWeights[b.priority] || 1;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      return b.width - a.width; // Larger width first
    });

    let remainingWidth = roll.width;
    let maxLength = 0;
    
    // Process requests in priority order
    let requestIndex = 0;
    while (requestIndex < sortedRequests.length && remainingWidth > 0) {
      const request = sortedRequests[requestIndex];
      
      if (request.quantity <= 0 || remainingWidth < request.width) {
        requestIndex++;
        continue;
      }
      
      // Add this request to the pattern
      pattern.cuts.push({
        request: request,
        width: request.width,
        length: request.length,
        position: {
          x: roll.width - remainingWidth,
          y: 0
        }
      });
      
      remainingWidth -= request.width;
      maxLength = Math.max(maxLength, request.length);
      
      // Reduce quantity
      request.quantity--;
      
      // If quantity becomes 0, remove from available requests
      if (request.quantity === 0) {
        sortedRequests.splice(requestIndex, 1);
        // Don't increment requestIndex since we removed an element
      } else {
        // Don't increment requestIndex - continue with same request if it has more quantity
        // This ensures we process all quantities of the same request
      }
      
      // In strict mode, only process high priority requests first
      if (settings.strictMode && request.priority !== 'high' && sortedRequests.some(req => req.priority === 'high' && req.quantity > 0)) {
        break;
      }
    }

    if (pattern.cuts.length === 0) {
      return pattern; // No cuts possible
    }

    // Calculate waste based on actual cuts made
    const usedWidth = roll.width - remainingWidth;
    
    // Define minimum useful piece size
    const minUsefulWidth = 50; // mm
    const minUsefulLength = 500; // mm (0.5m)
    
    let actualWaste = 0;
    
    // Check width waste
    if (remainingWidth > 0) {
      if (remainingWidth < minUsefulWidth) {
        actualWaste += remainingWidth * maxLength * 1000; // Convert m to mm
        pattern.remainingPieces.push({
          type: 'width_waste',
          width: remainingWidth,
          length: maxLength,
          description: `Sfrido larghezza: ${remainingWidth}mm × ${maxLength}m (troppo piccolo)`
        });
      } else {
        pattern.remainingPieces.push({
          type: 'remaining_stock',
          width: remainingWidth,
          length: maxLength,
          description: `Rettangolo G: larga ${remainingWidth}mm, lunga ${maxLength}m (ritorna a magazzino)`
        });
      }
    }

    // Check length waste
    const remainingLength = roll.length - maxLength;
    if (remainingLength > 0) {
      if (remainingLength * 1000 < minUsefulLength) { // Convert m to mm
        actualWaste += remainingLength * roll.width * 1000; // Convert m to mm
        pattern.remainingPieces.push({
          type: 'length_waste', 
          width: roll.width,
          length: remainingLength,
          description: `Sfrido lunghezza: ${roll.width}mm × ${remainingLength}m (troppo piccolo)`
        });
      } else {
        pattern.remainingPieces.push({
          type: 'remaining_stock',
          width: roll.width,
          length: remainingLength,
          description: `Rettangolo Z: larga ${roll.width}mm, lunga ${remainingLength}m (ritorna a magazzino)`
        });
      }
    }

    pattern.waste = actualWaste;

    // Calculate used area and efficiency
    pattern.usedArea = pattern.cuts.reduce((sum, cut) => sum + (cut.width * cut.length * 1000), 0);
    const totalArea = roll.width * roll.length * 1000; // Convert m to mm
    pattern.efficiency = totalArea > 0 ? (pattern.usedArea / totalArea) * 100 : 0;

    return pattern;
  }
}
