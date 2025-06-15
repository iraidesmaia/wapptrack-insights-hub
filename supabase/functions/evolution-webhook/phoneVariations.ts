
// Create phone search variations.
// Can be expanded in the future for more complicated rules.
export function createPhoneSearchVariations(phone: string): string[] {
  const variations = new Set<string>();
  variations.add(phone);

  // Known patterns (example for DDD85 used in current code)
  if (phone === "85998372658") {
    variations.add("8598372658");
    variations.add("5585998372658");
    variations.add("558598372658");
  }

  // Add logic for Brazilian numbers with/without country code, 9 double, etc.
  if (phone.startsWith("55") && phone.length === 13) {
    const withoutCountryCode = phone.slice(2);
    if (withoutCountryCode.length === 11 && withoutCountryCode[2] === "9" && withoutCountryCode[3] === "9") {
      variations.add("55" + withoutCountryCode.slice(0, 2) + withoutCountryCode.slice(3));
    }
  }
  return Array.from(variations);
}
</lov_write>

---

<lov-write file_path="supabase/functions/evolution-webhook/utmPending.ts">
// Handles extraction and cleanup of UTM data from pending_leads
export async function extractPendingUTMs(supabase: any, phone: string) {
  let utms: any = {};
  try {
    const { data: pendingLead } = await supabase
      .from('pending_leads')
      .select('*')
      .eq('phone', phone)
      .eq('status', 'pending')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    if (pendingLead) {
      utms = {
        utm_source: pendingLead.utm_source,
        utm_medium: pendingLead.utm_medium,
        utm_campaign: pendingLead.utm_campaign,
        utm_content: pendingLead.utm_content,
        utm_term: pendingLead.utm_term
      };
      // Clean up the pending lead after extraction
      await supabase.from('pending_leads').delete().eq('id', pendingLead.id);
    }
  } catch (err) {
    // Swallow errors for best effort extraction, log only
    console.error("UTM extraction error:", err);
  }
  return utms;
}
</lov_write>

---

<lov-write file_path="supabase/functions/evolution-webhook/handlers.ts">
import { detectKeywords, getMessageContent, getContactName } from "./helpers.ts";
import { createPhoneSearchVariations } from "./phoneVariations.ts";
import { extractPendingUTMs } from "./utmPending.ts";

// Default/fallback keywords
const DEFAULT_CONVERSION_KEYWORDS = [
  'obrigado pela compra','obrigada pela compra','venda confirmada','pedido aprovado','parabéns pela aquisição',
  'compra realizada','vendido','venda fechada','negócio fechado','parabéns pela compra','obrigado por comprar','obrigada por comprar',
  'sua compra foi','compra efetuada','pedido confirmado'
];
const DEFAULT_CANCELLATION_KEYWORDS = [
  'compra cancelada','pedido cancelado','cancelamento','desistiu da compra',
  'não quer mais','mudou de ideia','cancelar pedido','estorno','devolver','não conseguiu pagar'
];

// Handler for messages from the commercial (fromMe: true)
export async function processComercialMessage({
  supabase, message, realPhoneNumber, matchedLeads, messageContent
}: any) {
  for (const lead of matchedLeads) {
    // Update phone if needed
    if (lead.phone !== realPhoneNumber) {
      await supabase.from('leads').update({ phone: realPhoneNumber }).eq('id', lead.id);
      lead.phone = realPhoneNumber;
    }
    let conversionKeywords = (lead.campaigns && lead.campaigns.conversion_keywords) || DEFAULT_CONVERSION_KEYWORDS;
    let cancellationKeywords = (lead.campaigns && lead.campaigns.cancellation_keywords) || DEFAULT_CANCELLATION_KEYWORDS;

    const hasConversionKeywords = detectKeywords(messageContent, conversionKeywords);
    const hasCancellationKeywords = detectKeywords(messageContent, cancellationKeywords);

    if (hasConversionKeywords) {
      await supabase.from('leads').update({ 
        status: 'converted', last_contact_date: new Date().toISOString()
      }).eq('id', lead.id);
    } else if (hasCancellationKeywords) {
      await supabase.from('leads').update({ 
        status: 'lost', last_contact_date: new Date().toISOString()
      }).eq('id', lead.id);
    }
    // else: ignore - no keywords
  }
}

// Handler for messages from client (fromMe: false)
export async function processClientMessage({
  supabase, message, realPhoneNumber, matchedLeads, messageContent
}: any) {
  for (const lead of matchedLeads) {
    // Update phone if needed
    if (lead.phone !== realPhoneNumber) {
      await supabase.from('leads').update({ phone: realPhoneNumber }).eq('id', lead.id);
      lead.phone = realPhoneNumber;
    }

    // Only update if it has no message yet
    if (lead.last_message && lead.last_message.trim() !== '') continue;

    await supabase.from('leads').update({
      status: 'lead',
      last_message: messageContent,
      last_contact_date: new Date().toISOString()
    }).eq('id', lead.id);
  }
}

// Handler for unknown phone (no matched lead), only for client origin
export async function handleDirectLead({
  supabase, message, realPhoneNumber
}: any) {
  const contactName = getContactName(message);
  const messageContent = getMessageContent(message);
  const utmsFromPending = await extractPendingUTMs(supabase, realPhoneNumber);

  const leadData = {
    name: contactName,
    phone: realPhoneNumber,
    campaign: "Fluxo Direto WhatsApp",
    status: "lead",
    last_message: messageContent,
    last_contact_date: new Date().toISOString(),
    ...utmsFromPending
  };
  await supabase.from('leads').insert(leadData).select().single();
}
