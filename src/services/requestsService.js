import { supabase } from '../lib/supabase';

export class RequestsService {
  static async getAll() {
    const { data, error } = await supabase
      .from('cut_requests')
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
      .from('cut_requests')
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
      .from('cut_requests')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .eq('material_code', materialCode)
      .eq('status', 'pending')
      .order('priority DESC, created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getByPriority(priority) {
    const { data, error } = await supabase
      .from('cut_requests')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .eq('priority', priority)
      .eq('status', 'pending')
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async getPending() {
    const { data, error } = await supabase
      .from('cut_requests')
      .select(`
        *,
        materials!inner(code, name, specific_weight)
      `)
      .eq('status', 'pending')
      .order('priority DESC, created_at', { ascending: false });
    
    if (error) throw error;
    return data;
  }

  static async create(request) {
    const { data, error } = await supabase
      .from('cut_requests')
      .insert([{
        order_number: request.orderNumber,
        material_code: request.material,
        width: request.width,
        length: request.length,
        quantity: request.quantity,
        priority: request.priority
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
      .from('cut_requests')
      .update({
        order_number: updates.orderNumber,
        material_code: updates.material,
        width: updates.width,
        length: updates.length,
        quantity: updates.quantity,
        priority: updates.priority,
        status: updates.status
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
      .from('cut_requests')
      .delete()
      .eq('id', id);
    
    if (error) throw error;
  }

  static async checkOrderNumberExists(orderNumber, excludeId = null) {
    let query = supabase
      .from('cut_requests')
      .select('id')
      .eq('order_number', orderNumber);
    
    if (excludeId) {
      query = query.neq('id', excludeId);
    }
    
    const { data, error } = await query;
    
    if (error) throw error;
    return data.length > 0;
  }

  static async updateStatus(id, status) {
    const { data, error } = await supabase
      .from('cut_requests')
      .update({ status })
      .eq('id', id)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  }

  static async getTotalRequests() {
    const { data, error } = await supabase
      .from('cut_requests')
      .select('quantity')
      .eq('status', 'pending');
    
    if (error) throw error;
    return data.reduce((total, request) => total + request.quantity, 0);
  }
}

