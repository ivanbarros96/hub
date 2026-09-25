// Capa de datos del agendador de WhatsApp.
// UI-first: instancias y contactos de ejemplo. Cuando n8n esté listo, la lista
// de contactos puede pasar a venir de un webhook (Evolution API o Google) sin
// tocar la UI: basta con reemplazar getContacts() por un fetch a ese endpoint.

export type WaInstance = {
  id: string
  label: string
  number: string
}

export type Contact = {
  id: string
  name: string
  phone: string
}

export type SchedulePayload = {
  instanceId: string
  instanceLabel: string
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

// Las dos instancias de Evolution API (etiquetas de ejemplo, ajústalas luego).
export const instances: WaInstance[] = [
  { id: 'inst-1', label: 'Instancia 1', number: '+56 9 1111 1111' },
  { id: 'inst-2', label: 'Instancia 2', number: '+56 9 2222 2222' },
]

const mockContacts: Contact[] = [
  { id: 'c1', name: 'María González', phone: '+56 9 8123 4567' },
  { id: 'c2', name: 'Juan Pérez', phone: '+56 9 8234 5678' },
  { id: 'c3', name: 'Camila Rojas', phone: '+56 9 8345 6789' },
  { id: 'c4', name: 'Diego Muñoz', phone: '+56 9 8456 7890' },
  { id: 'c5', name: 'Valentina Silva', phone: '+56 9 8567 8901' },
  { id: 'c6', name: 'Sebastián Torres', phone: '+56 9 8678 9012' },
]

export function getContacts(): Contact[] {
  return mockContacts
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
