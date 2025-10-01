import { create } from 'zustand'

export const useMaterialsStore = create((set, get) => ({
  materials: [],

  addMaterial: async (material) => {
    try {
      const { MaterialsService } = await import('../services/materialsService');
      const newMaterial = await MaterialsService.create(material);
      set((state) => ({
        materials: [...state.materials, {
          id: newMaterial.id,
          code: newMaterial.code,
          name: newMaterial.name,
          specificWeight: newMaterial.specific_weight
        }]
      }));
      return newMaterial;
    } catch (error) {
      throw error;
    }
  },

  updateMaterial: async (id, updates) => {
    try {
      const { MaterialsService } = await import('../services/materialsService');
      const updatedMaterial = await MaterialsService.update(id, {
        code: updates.code,
        name: updates.name,
        specificWeight: updates.specificWeight
      });
      set((state) => ({
        materials: state.materials.map(material =>
          material.id === id ? {
            id: updatedMaterial.id,
            code: updatedMaterial.code,
            name: updatedMaterial.name,
            specificWeight: updatedMaterial.specific_weight
          } : material
        )
      }));
      return updatedMaterial;
    } catch (error) {
      throw error;
    }
  },

  deleteMaterial: async (id) => {
    try {
      const { MaterialsService } = await import('../services/materialsService');
      await MaterialsService.delete(id);
      set((state) => ({
        materials: state.materials.filter(material => material.id !== id)
      }));
    } catch (error) {
      throw error;
    }
  },

  getMaterialByCode: (code) => {
    const state = get()
    return state.materials.find(material => material.code === code)
  },

  getMaterialsForSelect: () => {
    const state = get()
    return state.materials.map(material => ({
      value: material.code,
      label: `${material.name} (${material.code})`
    }))
  },

  setMaterials: (materials) => set({ materials })
}))

