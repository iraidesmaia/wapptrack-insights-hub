import { supabase } from '@/integrations/supabase/client';

export interface SecurityEventData {
  event_type: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  user_id?: string;
  event_details?: any;
}

export const logSecurityEventToDatabase = async (eventData: SecurityEventData) => {
  try {
    const { error } = await supabase.rpc('log_security_event', {
      event_type_param: eventData.event_type,
      severity_param: eventData.severity,
      user_id_param: eventData.user_id || null,
      ip_address_param: null, // Would be filled by server-side
      user_agent_param: typeof navigator !== 'undefined' ? navigator.userAgent : null,
      event_details_param: eventData.event_details ? JSON.stringify(eventData.event_details) : null
    });

    if (error) {
      console.error('Error logging security event to database:', error);
    }
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
};

export const getSecurityAuditLogs = async (limit: number = 100) => {
  try {
    const { data, error } = await supabase
      .from('security_audit_logs')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) {
      console.error('Error fetching security audit logs:', error);
      return [];
    }

    return data || [];
  } catch (error) {
    console.error('Failed to fetch security audit logs:', error);
    return [];
  }
};

export const cleanupOldSecurityLogs = async () => {
  try {
    const { error } = await supabase.rpc('cleanup_old_audit_logs');
    
    if (error) {
      console.error('Error cleaning up old security logs:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Failed to cleanup old security logs:', error);
    return false;
  }
};