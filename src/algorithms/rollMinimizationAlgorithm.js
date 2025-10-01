import { BaseAlgorithm } from './baseAlgorithm';

/**
 * Roll minimization algorithm that uses minimum number of rolls
 */
export class RollMinimizationAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'RollMinimization',
      'Minimizzazione Bobine (ILP)'
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

    // Group similar widths to maximize roll utilization
    const widthGroups = {};
    
    materialRequests.forEach(req => {
      const widthKey = Math.floor(req.width / 10) * 10; // Group by 10mm increments
      if (!widthGroups[widthKey]) widthGroups[widthKey] = [];
      widthGroups[widthKey].push(req);
    });

    for (const roll of sortedRolls) {
      if (Object.values(widthGroups).every(group => group.length === 0)) break;

      const pattern = this.createPattern(roll, []);
      let remainingWidth = roll.width;

      // Process each width group to maximize roll utilization
      for (const widthKey in widthGroups) {
        const group = widthGroups[widthKey];
        
        while (group.length > 0 && remainingWidth >= group[0].width) {
          const request = group.shift();
          
          pattern.cuts.push({
            request: request,
            width: request.width,
            length: request.length
          });
          
          remainingWidth -= request.width;
        }
      }

      if (pattern.cuts.length > 0) {
        pattern.waste = remainingWidth;
        pattern.efficiency = ((roll.width - remainingWidth) / roll.width) * 100;
        
        // Check waste limit if specified
        const wastePercentage = (pattern.waste / roll.width) * 100;
        if (wastePercentage <= (settings.wasteLimit || 30) * 100) {
          patterns.push(pattern);
        }
      }
    }

    const totalWaste = patterns.reduce((sum, pattern) => sum + pattern.waste, 0);
    const efficiency = patterns.length > 0 ? 
      patterns.reduce((sum, pattern) => sum + pattern.efficiency, 0) / patterns.length : 0;

    const totalRequests = materialRequests.length;
    const fulfilledRequests = totalRequests - Object.values(widthGroups).reduce((sum, group) => sum + group.length, 0);

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

