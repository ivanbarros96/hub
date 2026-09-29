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

// Trae los contactos guardados de UNA instancia (vía /api → n8n → Data Table).
// Cachea por instancia en el navegador ~1 día (la tabla central ya guarda la
// versión de 15 días); "force" salta la caché para refrescar a mano.
const CACHE_PREFIX = 'abivan_wa_contacts_v2:'
const CACHE_TTL = 24 * 60 * 60 * 1000

export async function fetchContacts(instance: string, force = false): Promise<Contact[]> {
  const cacheKey = CACHE_PREFIX + instance
  if (!force) {
    try {
      const raw = localStorage.getItem(cacheKey)
      if (raw) {
        const cached = JSON.parse(raw) as { ts: number; contacts: Contact[] }
        if (Array.isArray(cached.contacts) && Date.now() - cached.ts < CACHE_TTL) {
          return cached.contacts
        }
      }
    } catch {}
  }
  try {
    const res = await fetch(`/api/whatsapp/contacts?instance=${encodeURIComponent(instance)}`)
    const data = (await res.json().catch(() => ({}))) as { contacts?: Contact[] }
    if (!res.ok || !Array.isArray(data.contacts)) return []
    if (data.contacts.length > 0) {
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ ts: Date.now(), contacts: data.contacts }))
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
