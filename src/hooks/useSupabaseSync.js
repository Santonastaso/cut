import { useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { MaterialsService, StockService, RequestsService } from '../services';
import { useMaterialsStore, useStockStore, useRequestsStore } from '../store';

// Custom hook to sync Supabase data with Zustand stores
export function useSupabaseSync() {
  const queryClient = useQueryClient();
  
  // Materials sync
  const { data: materials, isLoading: materialsLoading, error: materialsError } = useQuery({
    queryKey: ['materials'],
    queryFn: MaterialsService.getAll,
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: 1,
    retryDelay: 1000,
  });

  const { setMaterials } = useMaterialsStore();
  
  useEffect(() => {
    if (materials) {
      // Transform Supabase data to match store format
      const transformedMaterials = materials.map(material => ({
        id: material.id,
        code: material.code,
        name: material.name,
        specificWeight: material.specific_weight
      }));
      setMaterials(transformedMaterials);
    }
  }, [materials, setMaterials]);

  // Stock rolls sync
  const { data: stockRolls, isLoading: stockLoading, error: stockError } = useQuery({
    queryKey: ['stockRolls'],
    queryFn: StockService.getAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  const { setStockRolls } = useStockStore();
  
  useEffect(() => {
    if (stockRolls) {
      // Transform Supabase data to match store format
      const transformedRolls = stockRolls.map(roll => ({
        id: roll.id,
        code: roll.code,
        material: roll.material_code,
        width: roll.width,
        length: roll.length,
        weight: roll.weight,
        specificWeight: roll.materials?.specific_weight || 0,
        batch: roll.batch
      }));
      setStockRolls(transformedRolls);
    }
  }, [stockRolls, setStockRolls]);

  // Requests sync
  const { data: cutRequests, isLoading: requestsLoading, error: requestsError } = useQuery({
    queryKey: ['cutRequests'],
    queryFn: RequestsService.getAll,
    staleTime: 5 * 60 * 1000,
    retry: 1,
    retryDelay: 1000,
  });

  const { setCutRequests } = useRequestsStore();
  
  useEffect(() => {
    if (cutRequests) {
      // Transform Supabase data to match store format
      const transformedRequests = cutRequests.map(request => ({
        id: request.id,
        orderNumber: request.order_number,
        material: request.material_code,
        width: request.width,
        length: request.length,
        priority: request.priority,
        quantity: request.quantity
      }));
      setCutRequests(transformedRequests);
    }
  }, [cutRequests, setCutRequests]);

  // Log errors for debugging
  useEffect(() => {
    if (materialsError) {
      console.error('Materials sync error:', materialsError);
    }
    if (stockError) {
      console.error('Stock sync error:', stockError);
    }
    if (requestsError) {
      console.error('Requests sync error:', requestsError);
    }
  }, [materialsError, stockError, requestsError]);

  return {
    isLoading: materialsLoading || stockLoading || requestsLoading,
    error: materialsError || stockError || requestsError
  };
}

// Custom hook for materials mutations
export function useMaterialsMutations() {
  const queryClient = useQueryClient();
  
  const createMaterial = useMutation({
    mutationFn: MaterialsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const updateMaterial = useMutation({
    mutationFn: ({ id, updates }) => MaterialsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  const deleteMaterial = useMutation({
    mutationFn: MaterialsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['materials'] });
    },
  });

  return {
    createMaterial,
    updateMaterial,
    deleteMaterial
  };
}

// Custom hook for stock mutations
export function useStockMutations() {
  const queryClient = useQueryClient();
  
  const createStockRoll = useMutation({
    mutationFn: StockService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockRolls'] });
    },
  });

  const updateStockRoll = useMutation({
    mutationFn: ({ id, updates }) => StockService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockRolls'] });
    },
  });

  const deleteStockRoll = useMutation({
    mutationFn: StockService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['stockRolls'] });
    },
  });

  return {
    createStockRoll,
    updateStockRoll,
    deleteStockRoll
  };
}

// Custom hook for requests mutations
export function useRequestsMutations() {
  const queryClient = useQueryClient();
  
  const createRequest = useMutation({
    mutationFn: RequestsService.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cutRequests'] });
    },
  });

  const updateRequest = useMutation({
    mutationFn: ({ id, updates }) => RequestsService.update(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cutRequests'] });
    },
  });

  const deleteRequest = useMutation({
    mutationFn: RequestsService.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cutRequests'] });
    },
  });

  return {
    createRequest,
    updateRequest,
    deleteRequest
  };
}
