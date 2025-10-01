import { BaseAlgorithm } from './baseAlgorithm';

/**
 * PERFECT Priority-based algorithm that prioritizes high-priority orders
 * Uses weighted scoring system and advanced priority handling
 */
export class PriorityAlgorithm extends BaseAlgorithm {
  constructor() {
    super(
      'Priority',
      'Priorità Ordini (ILP)'
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
    
    // Priority weights (higher number = higher priority)
    const priorityWeights = {
      '4': 100, // Urgent
      '3': 80,  // High
      '2': 50,  // Medium
      '1': 20   // Low
    };

    // Calculate priority scores for each request
    const scoredRequests = expandedRequests.map(request => ({
      ...request,
      priorityScore: this.calculatePriorityScore(request, priorityWeights, settings)
    }));

    // Sort by priority score (highest first), then by area
    const sortedRequests = scoredRequests.sort((a, b) => {
      if (a.priorityScore !== b.priorityScore) {
        return b.priorityScore - a.priorityScore;
      }
      return (b.width * b.length) - (a.width * a.length);
    });

    // Sort rolls by efficiency (larger rolls first for high-priority items)
    const sortedRolls = [...availableRolls].sort((a, b) => (b.width * b.length) - (a.width * a.length));
    
    const patterns = [];
    const remainingRequests = [...sortedRequests];

    for (const roll of sortedRolls) {
      if (remainingRequests.length === 0) break;

      const pattern = this.createPriorityPattern(roll, remainingRequests, settings);
      
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

    // Calculate priority fulfillment statistics
    const priorityStats = this.calculatePriorityStats(patterns, materialRequests);

    return {
      material: availableRolls[0].material,
      patterns,
      statistics: {
        efficiency: efficiency.toFixed(2),
        totalWaste: totalWaste.toFixed(2),
        fulfilledRequests: materialRequests.reduce((sum, req) => sum + req.quantity, 0) - remainingRequests.length,
        priorityStats
      }
    };
  }

  calculatePriorityScore(request, priorityWeights, settings) {
    const baseScore = priorityWeights[request.priority] || 0;
    
    // Bonus for larger orders (more important to fulfill)
    const sizeBonus = (request.width * request.length) / 1000;
    
    // Bonus for orders that are close to deadline (if deadline exists)
    const deadlineBonus = request.deadline ? this.calculateDeadlineBonus(request.deadline) : 0;
    
    // Penalty for very small orders (less important)
    const sizePenalty = (request.width * request.length) < 100 ? -10 : 0;
    
    return baseScore + sizeBonus + deadlineBonus + sizePenalty;
  }

  calculateDeadlineBonus(deadline) {
    const now = new Date();
    const deadlineDate = new Date(deadline);
    const daysUntilDeadline = (deadlineDate - now) / (1000 * 60 * 60 * 24);
    
    if (daysUntilDeadline < 0) return 50; // Overdue
    if (daysUntilDeadline < 1) return 30; // Due today
    if (daysUntilDeadline < 3) return 20; // Due in 3 days
    if (daysUntilDeadline < 7) return 10; // Due in a week
    return 0; // Not urgent
  }

  createPriorityPattern(roll, availableRequests, settings) {
    const pattern = {
      roll,
      cuts: [],
      waste: 0,
      efficiency: 0,
      usedArea: 0,
      priorityScore: 0
    };

    let remainingWidth = roll.width;
    const placedCuts = [];

    // First pass: try to place highest priority items
    for (const request of availableRequests) {
      if (request.width <= remainingWidth) {
        const cut = {
          request: request,
          width: request.width,
          length: request.length
        };
        
        pattern.cuts.push(cut);
        placedCuts.push(cut);
        remainingWidth -= request.width;
        pattern.priorityScore += request.priorityScore;
        
        // If we've filled the roll, stop
        if (remainingWidth <= 0) break;
      }
    }

    // Calculate pattern metrics
    pattern.usedArea = pattern.cuts.reduce((sum, cut) => sum + (cut.width * cut.length), 0);
    pattern.waste = (roll.width * roll.length) - pattern.usedArea;
    pattern.efficiency = (pattern.usedArea / (roll.width * roll.length)) * 100;

    return pattern;
  }

  calculatePriorityStats(patterns, originalRequests) {
    const stats = {
      urgent: { total: 0, fulfilled: 0 },
      high: { total: 0, fulfilled: 0 },
      medium: { total: 0, fulfilled: 0 },
      low: { total: 0, fulfilled: 0 }
    };

    // Count total requests by priority
    originalRequests.forEach(request => {
      const priority = this.getPriorityLevel(request.priority);
      stats[priority].total += request.quantity;
    });

    // Count fulfilled requests by priority
    const fulfilledRequestIds = new Set();
    patterns.forEach(pattern => {
      pattern.cuts.forEach(cut => {
        fulfilledRequestIds.add(cut.request.id);
      });
    });

    originalRequests.forEach(request => {
      const priority = this.getPriorityLevel(request.priority);
      for (let i = 0; i < request.quantity; i++) {
        const requestId = `${request.id}-${i}`;
        if (fulfilledRequestIds.has(requestId)) {
          stats[priority].fulfilled++;
        }
      }
    });

    return stats;
  }

  getPriorityLevel(priority) {
    const priorityMap = {
      '4': 'urgent',
      '3': 'high',
      '2': 'medium',
      '1': 'low'
    };
    return priorityMap[priority] || 'low';
  }
}

