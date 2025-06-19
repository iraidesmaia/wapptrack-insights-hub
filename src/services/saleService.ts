
import { Sale } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getSales = async (clientId?: string): Promise<Sale[]> => {
  try {
    console.log('🔄 saleService.getSales() - Iniciando busca...', { clientId });
    
    // Build query with optional client_id filter
    let query = supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });
    
    // Add client_id filter if provided
    if (clientId) {
      query = query.eq('client_id', clientId);
    }

    const { data: sales, error } = await query;

    if (error) throw error;
    
    console.log('📋 saleService.getSales() - Dados brutos do Supabase:', sales);

    const mappedSales = (sales || []).map(sale => ({
      id: sale.id,
      value: sale.value,
      date: sale.date,
      lead_id: sale.lead_id,
      lead_name: sale.lead_name,
      campaign: sale.campaign,
      product: sale.product,
      notes: sale.notes,
      client_id: sale.client_id || undefined
    }));
    
    console.log('✅ saleService.getSales() - Vendas mapeadas com filtro por projeto:', {
      clientId,
      totalSales: mappedSales.length,
      salesWithProject: mappedSales.filter(s => s.client_id).length
    });
    
    return mappedSales;
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const addSale = async (sale: Omit<Sale, 'id'>, clientId?: string): Promise<Sale> => {
  try {
    console.log('🔄 addSale - Iniciando criação de venda:', sale.lead_name, { clientId });
    
    // Preparar dados da venda com client_id
    const saleData = {
      value: sale.value,
      date: sale.date,
      lead_id: sale.lead_id,
      lead_name: sale.lead_name,
      campaign: sale.campaign,
      product: sale.product,
      notes: sale.notes,
      // 🎯 ADICIONAR client_id para associar ao projeto
      client_id: clientId || sale.client_id || null
    };

    console.log('💾 Dados que serão inseridos na venda (com projeto):', {
      lead_name: saleData.lead_name,
      value: saleData.value,
      client_id: saleData.client_id
    });

    const { data, error } = await supabase
      .from('sales')
      .insert(saleData)
      .select()
      .single();

    if (error) throw error;

    console.log('✅ Venda criada com sucesso com projeto associado:', {
      id: data.id,
      lead_name: data.lead_name,
      client_id: data.client_id
    });

    return {
      id: data.id,
      value: data.value,
      date: data.date,
      lead_id: data.lead_id,
      lead_name: data.lead_name,
      campaign: data.campaign,
      product: data.product,
      notes: data.notes,
      client_id: data.client_id || undefined
    };
  } catch (error) {
    console.error("Error adding sale:", error);
    throw error;
  }
};

export const updateSale = async (id: string, sale: Partial<Sale>): Promise<Sale> => {
  try {
    const updateData: any = {};
    if (sale.value !== undefined) updateData.value = sale.value;
    if (sale.date) updateData.date = sale.date;
    if (sale.lead_id) updateData.lead_id = sale.lead_id;
    if (sale.lead_name) updateData.lead_name = sale.lead_name;
    if (sale.campaign) updateData.campaign = sale.campaign;
    if (sale.product !== undefined) updateData.product = sale.product;
    if (sale.notes !== undefined) updateData.notes = sale.notes;

    const { data, error } = await supabase
      .from('sales')
      .update(updateData)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    return {
      id: data.id,
      value: data.value,
      date: data.date,
      lead_id: data.lead_id,
      lead_name: data.lead_name,
      campaign: data.campaign,
      product: data.product,
      notes: data.notes,
      client_id: data.client_id || undefined
    };
  } catch (error) {
    console.error("Error updating sale:", error);
    throw error;
  }
};

export const deleteSale = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('sales')
      .delete()
      .eq('id', id);

    if (error) throw error;
  } catch (error) {
    console.error("Error deleting sale:", error);
    throw error;
  }
};
