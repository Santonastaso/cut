import { supabase } from '../lib/supabase';

export class OptimizationService {
  static async saveResult(optimizationResult) {
    const { data, error } = await supabase
      .from('optimization_results')
      .insert([{
        algorithm_type: optimizationResult.algorithmType,
        algorithm_settings: optimizationResult.settings,
        efficiency: optimizationResult.statistics.efficiency,
        total_waste: optimizationResult.statistics.totalWaste,
        rolls_used: optimizationResult.statistics.rollsUsed,
        total_rolls: optimizationResult.statistics.totalRolls,
        fulfilled_requests: optimizationResult.statistics.fulfilledRequests,
        total_requests: optimizationResult.statistics.totalRequests,
        cutting_plans: optimizationResult.cuttingPlans
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async savePatterns(optimizationResultId, patterns) {
    const patternInserts = patterns.map(pattern => ({
      optimization_result_id: optimizationResultId,
      roll_id: pattern.roll.id,
      material_code: pattern.material,
      efficiency: pattern.efficiency,
      waste: pattern.waste,
      used_width: pattern.usedWidth,
      cuts: pattern.cuts
    }));

    const { data, error } = await supabase
      .from('cutting_patterns')
      .insert(patternInserts)
      .select();
    
    if (error) throw error;
    return data;
  }

  static async saveAllocations(optimizationResultId, allocations) {
    const allocationInserts = allocations.map(allocation => ({
      optimization_result_id: optimizationResultId,
      cutting_pattern_id: allocation.cuttingPatternId,
      request_id: allocation.requestId,
      allocated_width: allocation.allocatedWidth,
      allocated_length: allocation.allocatedLength
    }));

    const { data, error } = await supabase
      .from('request_allocations')
      .insert(allocationInserts)
      .select();
    
    if (error) throw error;
    return data;
  }

  static async getResults(limit = 50) {
    const { data, error } = await supabase
      .from('optimization_results')
      .select(`
        *,
        cutting_patterns(
          *,
          stock_rolls(*)
        ),
        request_allocations(
          *,
          cut_requests(*)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getResultById(id) {
    const { data, error } = await supabase
      .from('optimization_results')
      .select(`
        *,
        cutting_patterns(
          *,
          stock_rolls(*)
        ),
        request_allocations(
          *,
          cut_requests(*)
        )
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getResultsByAlgorithm(algorithmType, limit = 20) {
    const { data, error } = await supabase
      .from('optimization_results')
      .select(`
        *,
        cutting_patterns(
          *,
          stock_rolls(*)
        ),
        request_allocations(
          *,
          cut_requests(*)
        )
      `)
      .eq('algorithm_type', algorithmType)
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async deleteResult(id) {
    const { error } = await supabase
      .from('optimization_results')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async getOptimizationHistory(limit = 100) {
    const { data, error } = await supabase
      .from('optimization_summary')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);
    
    if (error) throw error;
    return data;
  }

  static async getAlgorithmComparison() {
    const { data, error } = await supabase
      .from('optimization_results')
      .select('algorithm_type, efficiency, total_waste, rolls_used, fulfilled_requests')
      .order('created_at', { ascending: false })
      .limit(100);
    
    if (error) throw error;
    
    // Group by algorithm type and get best results
    const grouped = data.reduce((acc, result) => {
      if (!acc[result.algorithm_type]) {
        acc[result.algorithm_type] = [];
      }
      acc[result.algorithm_type].push(result);
      return acc;
    }, {});

    const comparison = {};
    Object.entries(grouped).forEach(([algorithm, results]) => {
      comparison[algorithm] = {
        efficiency: Math.max(...results.map(r => parseFloat(r.efficiency))),
        waste: Math.min(...results.map(r => parseFloat(r.total_waste))),
        rollsUsed: Math.min(...results.map(r => r.rolls_used)),
        fulfilledRequests: Math.max(...results.map(r => r.fulfilled_requests))
      };
    });

    return comparison;
  }
}
