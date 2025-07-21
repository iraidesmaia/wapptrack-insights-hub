import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS',
};

// Rate limiting map
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT_WINDOW = 60000; // 1 minute
const RATE_LIMIT_MAX_REQUESTS = 100;

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = rateLimitMap.get(ip);
  
  if (!entry || now > entry.resetTime) {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
    return true;
  }
  
  if (entry.count >= RATE_LIMIT_MAX_REQUESTS) {
    return false;
  }
  
  entry.count++;
  return true;
}

function sanitizeInput(input: string): string {
  if (!input || typeof input !== 'string') return '';
  return input.substring(0, 500).trim();
}

function sanitizePhone(phone: string): string {
  if (!phone || typeof phone !== 'string') return '';
  // Remove all non-numeric characters and limit length
  return phone.replace(/[^\d]/g, '').substring(0, 20);
}

function generateSessionId(): string {
  return crypto.randomUUID();
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Rate limiting
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('x-real-ip') || 'unknown';
    if (!checkRateLimit(clientIP)) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded' }),
        { 
          status: 429, 
          headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        }
      );
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    if (req.method === 'GET') {
      // Health check endpoint
      return new Response(
        JSON.stringify({ status: 'ok', timestamp: new Date().toISOString() }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (req.method === 'POST') {
      const body = await req.json();
      console.log('UTM Capture received:', JSON.stringify(body, null, 2));

      // Generate session ID if not provided
      let sessionId = body.sessionId;
      if (!sessionId) {
        sessionId = generateSessionId();
      }

      // Sanitize inputs
      const utmData = {
        session_id: sanitizeInput(sessionId),
        phone: body.phone ? sanitizePhone(body.phone) : null,
        utm_source: sanitizeInput(body.utmSource || ''),
        utm_medium: sanitizeInput(body.utmMedium || ''),
        utm_campaign: sanitizeInput(body.utmCampaign || ''),
        utm_content: sanitizeInput(body.utmContent || ''),
        utm_term: sanitizeInput(body.utmTerm || ''),
        referrer: sanitizeInput(body.referrer || ''),
        user_agent: sanitizeInput(body.userAgent || ''),
        ip_address: sanitizeInput(clientIP),
        landing_page: sanitizeInput(body.landingPage || ''),
        status: 'pending'
      };

      // Insert or update UTM session
      const { data, error } = await supabase
        .from('utm_sessions')
        .upsert(utmData, { 
          onConflict: 'session_id',
          ignoreDuplicates: false 
        })
        .select();

      if (error) {
        console.error('Error saving UTM session:', error);
        return new Response(
          JSON.stringify({ error: 'Failed to save UTM data' }),
          { 
            status: 500, 
            headers: { ...corsHeaders, 'Content-Type': 'application/json' }
          }
        );
      }

      console.log('UTM session saved:', data);

      return new Response(
        JSON.stringify({ 
          success: true, 
          sessionId: utmData.session_id,
          message: 'UTM data captured successfully' 
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { 
        status: 405, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );

  } catch (error) {
    console.error('UTM Capture error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});