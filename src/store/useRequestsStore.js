import { create } from 'zustand'

export const useRequestsStore = create((set, get) => ({
  cutRequests: [],

  addCutRequest: async (request) => {
    try {
      const { RequestsService } = await import('../services/requestsService');
      const newRequest = await RequestsService.create(request);
      set((state) => ({
        cutRequests: [...state.cutRequests, {
          id: newRequest.id,
          orderNumber: newRequest.order_number,
          material: newRequest.material_code,
          width: newRequest.width,
          length: newRequest.length,
          priority: newRequest.priority,
          quantity: newRequest.quantity
        }]
      }));
      return newRequest;
    } catch (error) {
      throw error;
    }
  },

  updateCutRequest: async (id, updates) => {
    try {
      const { RequestsService } = await import('../services/requestsService');
      const updatedRequest = await RequestsService.update(id, {
        orderNumber: updates.orderNumber,
        material: updates.material,
        width: updates.width,
        length: updates.length,
        priority: updates.priority,
        quantity: updates.quantity
      });
      set((state) => ({
        cutRequests: state.cutRequests.map(request =>
          request.id === id ? {
            id: updatedRequest.id,
            orderNumber: updatedRequest.order_number,
            material: updatedRequest.material_code,
            width: updatedRequest.width,
            length: updatedRequest.length,
            priority: updatedRequest.priority,
            quantity: updatedRequest.quantity
          } : request
        )
      }));
      return updatedRequest;
    } catch (error) {
      throw error;
    }
  },

  deleteCutRequest: async (id) => {
    try {
      const { RequestsService } = await import('../services/requestsService');
      await RequestsService.delete(id);
      set((state) => ({
        cutRequests: state.cutRequests.filter(request => request.id !== id)
      }));
    } catch (error) {
      throw error;
    }
  },

  getRequestsByMaterial: (materialCode) => {
    const state = get()
    return state.cutRequests.filter(request => request.material === materialCode)
  },

  getRequestsByPriority: (priority) => {
    const state = get()
    return state.cutRequests.filter(request => request.priority === priority)
  },

  getTotalRequests: () => {
    const state = get()
    return state.cutRequests.reduce((total, request) => total + request.quantity, 0)
  },

  setCutRequests: (cutRequests) => set({ cutRequests })
}))

