import { create } from 'zustand'

export const useOptimizationStore = create((set, get) => ({
  optimizationResult: null,
  algorithmResults: {},
  currentAlgorithm: 'waste-optimization',
  algorithmSettings: {},
  isLoading: false,
  loadingMessage: '',

  setOptimizationResult: async (result) => {
    try {
      const { OptimizationService } = await import('../services/optimizationService');
      const savedResult = await OptimizationService.saveResult({
        algorithmType: result.algorithmType || 'waste-optimization',
        settings: result.settings || {},
        statistics: result.statistics,
        cuttingPlans: result.cuttingPlans
      });
      set({ optimizationResult: result });
      return savedResult;
    } catch (error) {
      console.error('Error saving optimization result:', error);
      set({ optimizationResult: result }); // Still set locally even if save fails
      throw error;
    }
  },

  setAlgorithmResult: (algorithmType, result) => set((state) => ({
    algorithmResults: {
      ...state.algorithmResults,
      [algorithmType]: {
        efficiency: result.statistics.efficiency,
        waste: parseFloat(result.statistics.totalWaste),
        rollsUsed: result.statistics.rollsUsed,
        fulfilledRequests: result.statistics.fulfilledRequests
      }
    }
  })),

  setCurrentAlgorithm: (algorithm) => set({ currentAlgorithm: algorithm }),

  updateAlgorithmSettings: (algorithmType, settings) => set((state) => ({
    algorithmSettings: {
      ...state.algorithmSettings,
      [algorithmType]: {
        ...state.algorithmSettings[algorithmType],
        ...settings
      }
    }
  })),

  setLoading: (isLoading, message = '') => set({ isLoading, loadingMessage: message }),

  clearResults: () => set({ 
    optimizationResult: null, 
    algorithmResults: {},
    isLoading: false,
    loadingMessage: ''
  }),

  getAlgorithmComparison: () => {
    const state = get()
    const results = state.algorithmResults
    
    if (Object.keys(results).length < 2) return null

    const bestEfficiency = Math.max(...Object.values(results).map(r => parseFloat(r.efficiency)))
    const bestWaste = Math.min(...Object.values(results).map(r => r.waste))
    const bestRollsUsed = Math.min(...Object.values(results).map(r => r.rollsUsed))
    const bestFulfilled = Math.max(...Object.values(results).map(r => r.fulfilledRequests))

    return {
      bestEfficiency,
      bestWaste,
      bestRollsUsed,
      bestFulfilled,
      bestEfficiencyAlgorithm: Object.keys(results).find(k => parseFloat(results[k].efficiency) === bestEfficiency),
      bestWasteAlgorithm: Object.keys(results).find(k => results[k].waste === bestWaste),
      bestRollsAlgorithm: Object.keys(results).find(k => results[k].rollsUsed === bestRollsUsed),
      bestPriorityAlgorithm: Object.keys(results).find(k => results[k].fulfilledRequests === bestFulfilled)
    }
  }
}))

