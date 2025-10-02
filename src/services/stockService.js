import { supabase } from '../lib/supabase';

export class StockService {
  static async getAll() {
    const { data, error } = await supabase
      .from('stock_rolls')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('stock_rolls')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getByMaterial(materialCode) {
    const { data, error } = await supabase
      .from('stock_rolls')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .eq('material_code', materialCode)
      .eq('is_available', true)
      .order('width', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getAvailable() {
    const { data, error } = await supabase
      .from('stock_rolls')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .eq('is_available', true)
      .order('material_code, width', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(stockRoll) {
    const { data, error } = await supabase
      .from('stock_rolls')
      .insert([{
        code: stockRoll.code,
        material_code: stockRoll.material,
        width: stockRoll.width,
        length: stockRoll.length,
        weight: stockRoll.weight,
        batch: stockRoll.batch
      }])
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('stock_rolls')
      .update({
        code: updates.code,
        material_code: updates.material,
        width: updates.width,
        length: updates.length,
        weight: updates.weight,
        batch: updates.batch,
        is_available: updates.is_available
      })
      .eq('id', id)
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('stock_rolls')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async checkCodeExists(code, excludeId = null) {
    let query = supabase
      .from('stock_rolls')
      .select('id')
      .eq('code', code);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.length > 0;
  }

  static async markAsUsed(rollIds) {
    const { error } = await supabase
      .from('stock_rolls')
      .update({ is_available: false })
      .in('id', rollIds);
    
    if (error) throw error;
  }
}

