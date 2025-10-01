import { BaseAlgorithm } from './baseAlgorithm';

/**
 * Multi-objective algorithm that balances different optimization goals
 */
export class MultiObjectiveAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'MultiObjective',
      'Multi-obiettivo (ILP)'
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
    const sortedRolls = this.sortRollsByWidth(availableRolls);
    const patterns = [];

    // Create weighted requests based on priority and width
    const weightedRequests = materialRequests.map(req => {
      const priorityWeight = req.priority === 'high' ? 3 :
                          req.priority === 'normal' ? 2 : 1;
      return {
        ...req,
        score: (req.width / 1000) * priorityWeight
      };
    }).sort((a, b) => b.score - a.score);

    for (const roll of sortedRolls) {
      if (weightedRequests.length === 0) break;

      const pattern = this.createPattern(roll, []);
      let remainingWidth = roll.width;
      const usedIndices = [];

      // Try to maximize score while minimizing waste
      for (let i = 0; i < weightedRequests.length; i++) {
        const request = weightedRequests[i];
        
        if (request.width <= remainingWidth) {
          pattern.cuts.push({
            request: request,
            width: request.width,
            length: request.length
          });
          
          remainingWidth -= request.width;
          usedIndices.push(i);
        }
      }

      // Remove used requests
      for (let i = usedIndices.length - 1; i >= 0; i--) {
        weightedRequests.splice(usedIndices[i], 1);
      }

      if (pattern.cuts.length > 0) {
        pattern.waste = remainingWidth;
        pattern.efficiency = ((roll.width - remainingWidth) / roll.width) * 100;
        patterns.push(pattern);
      }
    }

    const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const efficiency = patterns.length > 0 ? 
      patterns.reduce((sum, pattern) => sum + pattern.efficiency, 0) / patterns.length : 0;

    const totalRequests = materialRequests.length;
    const fulfilledRequests = totalRequests - weightedRequests.length;

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
}

