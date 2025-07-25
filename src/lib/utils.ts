import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { format, formatDistanceToNow } from "date-fns"
import { ptBR } from "date-fns/locale"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Format currency to BRL
export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value)
}

// Format date to Brazilian standard
export function formatDate(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy', { locale: ptBR })
}

// Format date and time to Brazilian standard
export function formatDateTime(date: string | Date): string {
  return format(new Date(date), 'dd/MM/yyyy HH:mm', { locale: ptBR })
}

// Format date relative to now (ex: "há 2 horas")
export function formatRelativeDate(date: string | Date): string {
  return formatDistanceToNow(new Date(date), { 
    addSuffix: true, 
    locale: ptBR 
  })
}

// Format date for display (ex: "15 de junho de 2024")
export function formatDateLong(date: string | Date): string {
  return format(new Date(date), 'dd \'de\' MMMM \'de\' yyyy', { locale: ptBR })
}

// Format percentage
export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

// Generate WhatsApp redirect link
export function generateWhatsAppLink(phone: string, message?: string): string {
  const formattedPhone = phone.replace(/\D/g, '')
  const encodedMessage = message ? encodeURIComponent(message) : ''
  return `https://wa.me/${formattedPhone}${encodedMessage ? `?text=${encodedMessage}` : ''}`
}

// Generate tracking URL
export function generateTrackingUrl(baseUrl: string, campaignId: string): string {
  return `${baseUrl}/ir?id=${campaignId}`
}

// Generate a unique ID
export function generateId(): string {
  return Math.random().toString(36).substring(2, 11)
}

// Parse a URL's query parameters
export function parseQueryParams(url: string): Record<string, string> {
  const params: Record<string, string> = {}
  const queryString = url.split('?')[1]
  
  if (!queryString) return params
  
  const queryParams = new URLSearchParams(queryString)
  queryParams.forEach((value, key) => {
    params[key] = value
  })
  
  return params
}

// Build a UTM URL
export function buildUtmUrl(
  baseUrl: string, 
  campaign: { name: string, id: string }
): string {
  const params = new URLSearchParams();
  params.append('utm_source', 'campanha_web');
  params.append('utm_medium', 'digital');
  params.append('utm_campaign', (campaign.name || '').replace(/\s+/g, '-').toLowerCase());
  params.append('utm_content', 'link');
  params.append('utm_term', 'padrao');
  return `${baseUrl}/ir?id=${campaign.id}&${params.toString()}`;
}

// Phone number mask formatter - updated for Brazilian phones with country code
export function formatPhoneNumber(value: string): string {
  if (!value) return value
  
  // Remove all non-digits
  const phone = value.replace(/\D/g, '')
  
  // Check if it's a Brazilian number with country code (55)
  if (phone.startsWith('55') && phone.length >= 12) {
    const ddd = phone.slice(2, 4)
    const number = phone.slice(4)
    
    if (number.length <= 5) {
      return `+55 (${ddd}) ${number}`
    } else {
      return `+55 (${ddd}) ${number.slice(0, 5)}-${number.slice(5, 9)}`
    }
  }
  
  // Fallback to original formatting for other cases
  if (phone.length <= 2) {
    return phone
  } else if (phone.length <= 6) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2)}`
  } else if (phone.length <= 10) {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 6)}-${phone.slice(6)}`
  } else {
    return `(${phone.slice(0, 2)}) ${phone.slice(2, 7)}-${phone.slice(7, 11)}`
  }
}
