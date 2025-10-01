import { BaseAlgorithm } from './baseAlgorithm';

/**
 * Column generation algorithm for large-scale problems
 */
export class ColumnGenerationAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'ColumnGeneration',
      'Generazione Colonne (ILP Avanzato)'
    );
  }

  optimize(stockRolls, cutRequests, settings = {}) {
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
        totalWaste += materialResult.statistics.totalWaste;
        totalEfficiency += materialResult.statistics.efficiency * materialResult.patterns.length;
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

  optimizeMaterial(availableRolls, materialRequests, settings) {
    const maxIterations = settings.maxIterations || 20;
    const maxPatterns = settings.maxPatterns || 100;
    const tolerance = settings.tolerance || 0.001;

    const patterns = [];
    let remainingRequests = [...materialRequests];
    let iteration = 0;

    // Column generation iterations
    while (iteration < maxIterations && remainingRequests.length > 0 && patterns.length < maxPatterns) {
      const bestPattern = this.generateBestPattern(availableRolls, remainingRequests);
      
      if (!bestPattern || bestPattern.cuts.length === 0) {
        break;
      }

      patterns.push(bestPattern);

      // Remove fulfilled requests
      const fulfilledRequestIds = bestPattern.cuts.map(cut => cut.request.id);
      remainingRequests = remainingRequests.filter(req => !fulfilledRequestIds.includes(req.id));

      iteration++;
    }

    const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const efficiency = patterns.length > 0 ? 
      patterns.reduce((sum, pattern) => sum + pattern.efficiency, 0) / patterns.length : 0;

    const totalRequests = materialRequests.length;
    const fulfilledRequests = totalRequests - remainingRequests.length;

    return {
      material: availableRolls[0].material,
      patterns,
      statistics: {
        efficiency: efficiency.toFixed(2),
        totalWaste: totalWaste.toFixed(2),
        fulfilledRequests
      }
    };
  }

  generateBestPattern(availableRolls, remainingRequests) {
    let bestPattern = null;
    let bestScore = -Infinity;

    // Try each available roll
    for (const roll of availableRolls) {
      const pattern = this.generatePatternForRoll(roll, remainingRequests);
      
      if (pattern && pattern.cuts.length > 0) {
        // Calculate score based on efficiency and number of cuts
        const score = pattern.efficiency + (pattern.cuts.length * 10);
        
        if (score > bestScore) {
          bestScore = score;
          bestPattern = pattern;
        }
      }
    }

    return bestPattern;
  }

  generatePatternForRoll(roll, remainingRequests) {
    const pattern = this.createPattern(roll, []);
    let remainingWidth = roll.width;

    // Sort requests by priority and width for better fit
    const sortedRequests = this.sortRequestsByPriority(remainingRequests);

    // Use best-fit algorithm
    while (remainingWidth > 0 && sortedRequests.length > 0) {
      let bestFitIndex = -1;
      let bestFitValue = Infinity;

      for (let i = 0; i < sortedRequests.length; i++) {
        const request = sortedRequests[i];
        
        if (request.width <= remainingWidth && 
            remainingWidth - request.width < bestFitValue) {
          bestFitValue = remainingWidth - request.width;
          bestFitIndex = i;
        }
      }

      if (bestFitIndex !== -1) {
        const request = sortedRequests[bestFitIndex];
        
        pattern.cuts.push({
          request: request,
          width: request.width,
          length: request.length
        });
        
        remainingWidth -= request.width;
        sortedRequests.splice(bestFitIndex, 1);
      } else {
        break;
      }
    }

    if (pattern.cuts.length > 0) {
      pattern.waste = remainingWidth;
      pattern.efficiency = ((roll.width - remainingWidth) / roll.width) * 100;
      return pattern;
    }

    return null;
  }
}

