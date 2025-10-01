import { create } from 'zustand'
import { calculateWeight } from '../utils/calculations'

export const useStockStore = create((set, get) => ({
  stockRolls: [],

  addStockRoll: async (stockRoll) => {
    try {
      const { StockService } = await import('../services/stockService');
      const newStockRoll = await StockService.create(stockRoll);
      set((state) => ({
        stockRolls: [...state.stockRolls, {
          id: newStockRoll.id,
          code: newStockRoll.code,
          material: newStockRoll.material_code,
          width: newStockRoll.width,
          length: newStockRoll.length,
          weight: newStockRoll.weight,
          specificWeight: newStockRoll.materials?.specific_weight || 0,
          batch: newStockRoll.batch
        }]
      }));
      return newStockRoll;
    } catch (error) {
      throw error;
    }
  },

  updateStockRoll: async (id, updates) => {
    try {
      const { StockService } = await import('../services/stockService');
      const updatedRoll = await StockService.update(id, {
        code: updates.code,
        material: updates.material,
        width: updates.width,
        length: updates.length,
        weight: updates.weight,
        batch: updates.batch
      });
      set((state) => ({
        stockRolls: state.stockRolls.map(roll =>
          roll.id === id ? {
            id: updatedRoll.id,
            code: updatedRoll.code,
            material: updatedRoll.material_code,
            width: updatedRoll.width,
            length: updatedRoll.length,
            weight: updatedRoll.weight,
            specificWeight: updatedRoll.materials?.specific_weight || 0,
            batch: updatedRoll.batch
          } : roll
        )
      }));
      return updatedRoll;
    } catch (error) {
      throw error;
    }
  },

  deleteStockRoll: async (id) => {
    try {
      const { StockService } = await import('../services/stockService');
      await StockService.delete(id);
      set((state) => ({
        stockRolls: state.stockRolls.filter(roll => roll.id !== id)
      }));
    } catch (error) {
      throw error;
    }
  },

  getStockRollsByMaterial: (materialCode) => {
    const state = get()
    return state.stockRolls.filter(roll => roll.material === materialCode)
  },

  getAvailableStockRolls: () => {
    const state = get()
    return state.stockRolls.filter(roll => roll.length > 0)
  },

  setStockRolls: (stockRolls) => set({ stockRolls })
}))

