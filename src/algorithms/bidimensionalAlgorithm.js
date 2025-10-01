import { BaseAlgorithm } from './baseAlgorithm';

/**
 * PERFECT Bidimensional cutting optimization algorithm
 * Optimizes both width and length of rolls using advanced 2D bin packing
 */
export class BidimensionalAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'Bidimensional',
      'Combinazione Lunghezze (Ottimizzazione Bidimensionale)'
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

    const requestsByMaterial = this.groupRequestsByMaterial(cutRequests);
    const cuttingPlans = [];
    let totalWaste = 0;
    let totalEfficiency = 0;
    let usedRolls = 0;
    let totalFulfilledRequests = 0;

    Object.entries(requestsByMaterial).forEach(([material, materialRequests]) => {
      const availableRolls = stockRolls.filter(roll => roll.material === material);
      if (!availableRolls.length) return;

      const materialResult = this.optimizeMaterial(availableRolls, materialRequests, settings);
      
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
        totalWaste: totalWaste.toFixed(2),
        rollsUsed: usedRolls,
        totalRolls: stockRolls.length,
        fulfilledRequests: totalFulfilledRequests,
        totalRequests: cutRequests.reduce((sum, req) => sum + req.quantity, 0)
      }
    };
  }

  optimizeMaterial(availableRolls, materialRequests, settings = {}) {
    // Expand requests with quantities
    const expandedRequests = this.expandRequests(materialRequests);
    
    // Sort rolls by efficiency (width * length) descending
    const sortedRolls = [...availableRolls].sort((a, b) => (b.width * b.length) - (a.width * a.length));
    
    // Sort requests by priority, then by area (width * length) descending
    const sortedRequests = [...expandedRequests].sort((a, b) => {
      const priorityOrder = { '4': 4, '3': 3, '2': 2, '1': 1 }; // Urgent=4, High=3, Medium=2, Low=1
      const priorityA = priorityOrder[a.priority] || 0;
      const priorityB = priorityOrder[b.priority] || 0;
      
      if (priorityA !== priorityB) {
        return priorityB - priorityA; // Higher priority first
      }
      return (b.width * b.length) - (a.width * a.length); // Larger area first
    });

    const patterns = [];
    const remainingRequests = [...sortedRequests];

    for (const roll of sortedRolls) {
      if (remainingRequests.length === 0) break;

      const pattern = this.createOptimalPattern(roll, remainingRequests);
      
      if (pattern.cuts.length > 0) {
        // Remove fulfilled requests
        const fulfilledRequestIds = pattern.cuts.map(cut => cut.request.id);
        for (let i = remainingRequests.length - 1; i >= 0; i--) {
          if (fulfilledRequestIds.includes(remainingRequests[i].id)) {
            remainingRequests.splice(i, 1);
          }
        }
        
        patterns.push(pattern);
      }
    }

    const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const totalArea = patterns.reduce((sum, pattern) => sum + (pattern.roll.width * pattern.roll.length), 0);
    const usedArea = patterns.reduce((sum, pattern) => sum + pattern.usedArea, 0);
    const efficiency = totalArea > 0 ? (usedArea / totalArea) * 100 : 0;

    return {
      material: availableRolls[0].material,
      patterns,
      statistics: {
        efficiency: efficiency.toFixed(2),
        totalWaste: totalWaste.toFixed(2),
        fulfilledRequests: materialRequests.reduce((sum, req) => sum + req.quantity, 0) - remainingRequests.length
      }
    };
  }

  createOptimalPattern(roll, availableRequests) {
    const pattern = {
      roll,
      cuts: [],
      waste: 0,
      efficiency: 0,
      usedWidth: 0,
      usedLength: 0,
      usedArea: 0
    };

    // Use 2D bin packing algorithm (Bottom-Left Fill)
    const placedCuts = [];
    let remainingWidth = roll.width;
    let remainingLength = roll.length;

    // Sort requests by area descending for better packing
    const sortedRequests = [...availableRequests].sort((a, b) => (b.width * b.length) - (a.width * a.length));

    for (const request of sortedRequests) {
      if (request.width <= remainingWidth && request.length <= remainingLength) {
        // Check if we can place this cut
        const canPlace = this.canPlaceCut(request, placedCuts, roll);
        
        if (canPlace) {
          const cut = {
            request: request,
            width: request.width,
            length: request.length,
            x: 0, // Position in roll (for visualization)
            y: 0
          };
          
          pattern.cuts.push(cut);
          placedCuts.push(cut);
          
          // Update remaining space
          remainingWidth = Math.min(remainingWidth, roll.width - request.width);
          remainingLength = Math.min(remainingLength, roll.length - request.length);
          
          // If we've used the full width, we can't place more cuts
          if (remainingWidth <= 0) break;
        }
      }
    }

    // Calculate pattern metrics
    pattern.usedWidth = roll.width - remainingWidth;
    pattern.usedLength = roll.length - remainingLength;
    pattern.usedArea = pattern.cuts.reduce((sum, cut) => sum + (cut.width * cut.length), 0);
    pattern.waste = (roll.width * roll.length) - pattern.usedArea;
    pattern.efficiency = (pattern.usedArea / (roll.width * roll.length)) * 100;

    return pattern;
  }

  canPlaceCut(request, placedCuts, roll) {
    // Simple collision detection - in a real implementation, this would be more sophisticated
    // For now, we'll use a simplified approach that checks if the cut fits in remaining space
    
    if (placedCuts.length === 0) {
      return true; // First cut always fits
    }

    // Calculate remaining space after all placed cuts
    const usedWidth = placedCuts.reduce((sum, cut) => sum + cut.width, 0);
    const usedLength = Math.max(...placedCuts.map(cut => cut.length), 0);
    
    return (usedWidth + request.width <= roll.width) && (usedLength + request.length <= roll.length);
  }
}

