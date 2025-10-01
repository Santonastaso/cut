import { BaseAlgorithm } from './baseAlgorithm';

/**
 * PERFECT Waste minimization algorithm using advanced bin packing
 * Implements First Fit Decreasing (FFD) and Best Fit Decreasing (BFD) algorithms
 */
export class WasteMinimizationAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'WasteMinimization',
      'Minimizzazione Sfrido (ILP)'
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
    
    // Use the best algorithm based on problem size
    const algorithm = settings.algorithm || 'hybrid';
    
    let patterns;
    switch (algorithm) {
      case 'ffd':
        patterns = this.firstFitDecreasing(availableRolls, expandedRequests);
        break;
      case 'bfd':
        patterns = this.bestFitDecreasing(availableRolls, expandedRequests);
        break;
      case 'hybrid':
      default:
        // Use hybrid approach: try both and pick the best
        const ffdResult = this.firstFitDecreasing(availableRolls, expandedRequests);
        const bfdResult = this.bestFitDecreasing(availableRolls, expandedRequests);
        
        const ffdWaste = ffdResult.reduce((sum, p) => sum + p.waste, 0);
        const bfdWaste = bfdResult.reduce((sum, p) => sum + p.waste, 0);
        
        patterns = ffdWaste <= bfdWaste ? ffdResult : bfdResult;
        break;
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
        fulfilledRequests: materialRequests.reduce((sum, req) => sum + req.quantity, 0) - this.countUnfulfilledRequests(patterns, expandedRequests)
      }
    };
  }

  firstFitDecreasing(availableRolls, requests) {
    // Sort requests by width descending (First Fit Decreasing)
    const sortedRequests = [...requests].sort((a, b) => b.width - a.width);
    
    // Sort rolls by width descending
    const sortedRolls = [...availableRolls].sort((a, b) => b.width - a.width);
    
    const patterns = [];
    const remainingRequests = [...sortedRequests];

    for (const roll of sortedRolls) {
      if (remainingRequests.length === 0) break;

      const pattern = this.createPattern(roll, []);
      let remainingWidth = roll.width;

      // First Fit: place first request that fits
      for (let i = 0; i < remainingRequests.length; i++) {
        const request = remainingRequests[i];
        
        if (request.width <= remainingWidth) {
          pattern.cuts.push({
            request: request,
            width: request.width,
            length: request.length
          });
          
          remainingWidth -= request.width;
          remainingRequests.splice(i, 1);
          i--; // Adjust index after removal
        }
      }

      if (pattern.cuts.length > 0) {
        pattern.waste = remainingWidth;
        pattern.usedArea = pattern.cuts.reduce((sum, cut) => sum + (cut.width * cut.length), 0);
        pattern.efficiency = (pattern.usedArea / (roll.width * roll.length)) * 100;
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  bestFitDecreasing(availableRolls, requests) {
    // Sort requests by width descending
    const sortedRequests = [...requests].sort((a, b) => b.width - a.width);
    
    // Sort rolls by width descending
    const sortedRolls = [...availableRolls].sort((a, b) => b.width - a.width);
    
    const patterns = [];
    const remainingRequests = [...sortedRequests];

    for (const roll of sortedRolls) {
      if (remainingRequests.length === 0) break;

      const pattern = this.createPattern(roll, []);
      let remainingWidth = roll.width;

      // Best Fit: find the request that leaves the least waste
      while (remainingWidth > 0 && remainingRequests.length > 0) {
        let bestFitIndex = -1;
        let bestFitWaste = Infinity;

        for (let i = 0; i < remainingRequests.length; i++) {
          const request = remainingRequests[i];
          
          if (request.width <= remainingWidth) {
            const waste = remainingWidth - request.width;
            if (waste < bestFitWaste) {
              bestFitWaste = waste;
              bestFitIndex = i;
            }
          }
        }

        if (bestFitIndex !== -1) {
          const request = remainingRequests[bestFitIndex];
          
          pattern.cuts.push({
            request: request,
            width: request.width,
            length: request.length
          });
          
          remainingWidth -= request.width;
          remainingRequests.splice(bestFitIndex, 1);
        } else {
          break; // No more fitting requests
        }
      }

      if (pattern.cuts.length > 0) {
        pattern.waste = remainingWidth;
        pattern.usedArea = pattern.cuts.reduce((sum, cut) => sum + (cut.width * cut.length), 0);
        pattern.efficiency = (pattern.usedArea / (roll.width * roll.length)) * 100;
        patterns.push(pattern);
      }
    }

    return patterns;
  }

  countUnfulfilledRequests(patterns, originalRequests) {
    const fulfilledRequestIds = new Set();
    
    patterns.forEach(pattern => {
      pattern.cuts.forEach(cut => {
        fulfilledRequestIds.add(cut.request.id);
      });
    });

    return originalRequests.filter(req => !fulfilledRequestIds.has(req.id)).length;
  }
}

