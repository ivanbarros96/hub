// Capa de datos del agendador de WhatsApp.
// UI-first: instancias y contactos de ejemplo. Cuando n8n esté listo, la lista
// de contactos puede pasar a venir de un webhook (Evolution API o Google) sin
// tocar la UI: basta con reemplazar getContacts() por un fetch a ese endpoint.

export type WaInstance = {
  id: string
  label: string
  number: string
  // Nombre exacto de la instancia en Evolution API (lo usa n8n para el envío).
  instance: string
}

export type Contact = {
  id: string
  name: string
  phone: string
}

export type SchedulePayload = {
  instanceId: string
  instanceLabel: string
  // Nombre de la instancia en Evolution API (lo usa n8n en la URL de envío).
  instance: string
  to: string
  name: string
  message: string
  // ISO 8601 con hora deseada de envío, o null para "enviar ahora".
  sendAt: string | null
}

export type ScheduleResult = {
  ok: boolean
  simulated?: boolean
  error?: string
}

// Instancias de Evolution API (remitentes). `instance` debe coincidir EXACTO con
// el nombre en Evolution.
export const instances: WaInstance[] = [
  { id: 'ivan-cl', label: 'Ivan CL', number: '+56 9 5692 0968', instance: 'Ivan - CL' },
  { id: 'ivan-co', label: 'Ivan CO', number: '+57 324 984 2630', instance: 'Ivan - CO' },
  { id: 'abi', label: 'Abi', number: '+56 9 5655 6487', instance: 'Abi' },
]

// Trae los contactos reales unidos de todas las instancias (vía /api → n8n →
// Evolution). Se cachean en el navegador ~15 días para no consultar cada vez.
const CACHE_KEY = 'abivan_wa_contacts_v1'
const CACHE_TTL = 15 * 24 * 60 * 60 * 1000

export async function fetchContacts(force = false): Promise<Contact[]> {
  if (!force) {
    try {
      const raw = localStorage.getItem(CACHE_KEY)
      if (raw) {
        const cached = JSON.parse(raw) as { ts: number; contacts: Contact[] }
        if (Array.isArray(cached.contacts) && Date.now() - cached.ts < CACHE_TTL) {
          return cached.contacts
        }
      }
    } catch {}
  }
  try {
    const res = await fetch('/api/whatsapp/contacts')
    const data = (await res.json().catch(() => ({}))) as { contacts?: Contact[] }
    if (!res.ok || !Array.isArray(data.contacts)) return []
    if (data.contacts.length > 0) {
      try {
        localStorage.setItem(CACHE_KEY, JSON.stringify({ ts: Date.now(), contacts: data.contacts }))
      } catch {}
    }
    return data.contacts
  } catch {
    return []
  }
}

export async function scheduleWhatsApp(payload: SchedulePayload): Promise<ScheduleResult> {
  try {
    const res = await fetch('/api/whatsapp/schedule', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    const data = (await res.json().catch(() => ({}))) as ScheduleResult
    if (!res.ok) return { ok: false, error: data.error || `HTTP ${res.status}` }
    return data
  } catch {
    return { ok: false, error: 'No se pudo conectar con el servidor.' }
  }
}
