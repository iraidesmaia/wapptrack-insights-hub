
import { Sale } from "../types";
import { supabase } from "../integrations/supabase/client";

export const getSales = async (): Promise<Sale[]> => {
  try {
    const { data: sales, error } = await supabase
      .from('sales')
      .select('*')
      .order('date', { ascending: false });

    if (error) throw error;

    return (sales || []).map(sale => ({
      id: sale.id,
      value: sale.value,
      date: sale.date,
      lead_id: sale.lead_id,
      lead_name: sale.lead_name,
      campaign: sale.campaign,
      product: sale.product,
      notes: sale.notes
    }));
  } catch (error) {
    console.error("Error fetching sales:", error);
    return [];
  }
};

export const addSale = async (sale: Omit<Sale, 'id'>): Promise<Sale> => {
  try {
    const { data, error } = await supabase
      .from('sales')
      .insert({
        value: sale.value,
        date: sale.date,
        lead_id: sale.lead_id,
        lead_name: sale.lead_name,
        campaign: sale.campaign,
        product: sale.product,
        notes: sale.notes
      })
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
      notes: data.notes
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
      notes: data.notes
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
