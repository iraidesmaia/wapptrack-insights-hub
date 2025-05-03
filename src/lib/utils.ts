
import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

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
  return new Intl.DateTimeFormat('pt-BR').format(new Date(date))
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
  source?: string, 
  medium?: string, 
  campaign?: string, 
  content?: string, 
  term?: string
): string {
  const params = new URLSearchParams()
  
  if (source) params.append('utm_source', source)
  if (medium) params.append('utm_medium', medium)
  if (campaign) params.append('utm_campaign', campaign)
  if (content) params.append('utm_content', content)
  if (term) params.append('utm_term', term)
  
  const queryString = params.toString()
  return queryString ? `${baseUrl}?${queryString}` : baseUrl
}

// Phone number mask formatter
export function formatPhoneNumber(value: string): string {
  if (!value) return value
  
  // Remove all non-digits
  const phone = value.replace(/\D/g, '')
  
  // Apply mask based on length
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
