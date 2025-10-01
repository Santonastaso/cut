import { supabase } from '../lib/supabase';

export class MaterialsService {
  static async getAll() {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getById(id) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getByCode(code) {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('code', code)
      .single();
    
    if (error) throw error;
    return data;
  }

  static async create(material) {
    const { data, error } = await supabase
      .from('materials')
      .insert([{
        code: material.code,
        name: material.name,
        specific_weight: material.specificWeight
      }])
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async update(id, updates) {
    const { data, error } = await supabase
      .from('materials')
      .update({
        code: updates.code,
        name: updates.name,
        specific_weight: updates.specificWeight
      })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async delete(id) {
    const { error } = await supabase
      .from('materials')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async checkCodeExists(code, excludeId = null) {
    let query = supabase
      .from('materials')
      .select('id')
      .eq('code', code);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.length > 0;
  }
}
