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

// Instancias de Evolution API. `instance` debe coincidir EXACTO con el nombre
// en Evolution. Agrega aquí la segunda instancia cuando la tengas.
export const instances: WaInstance[] = [
  { id: 'ivan-cl', label: 'Ivan', number: 'Instancia Ivan - CL', instance: 'Ivan - CL' },
]

// Trae los contactos reales de WhatsApp de una instancia (vía /api → n8n → Evolution).
export async function fetchContacts(instance: string): Promise<Contact[]> {
  try {
    const res = await fetch(`/api/whatsapp/contacts?instance=${encodeURIComponent(instance)}`)
    const data = (await res.json().catch(() => ({}))) as { contacts?: Contact[] }
    if (!res.ok || !Array.isArray(data.contacts)) return []
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
