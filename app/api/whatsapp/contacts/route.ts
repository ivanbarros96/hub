// Devuelve los contactos guardados de UNA instancia, leídos desde el Data Table
// de n8n (webhook abivan-contactos-db), que se refresca por cron cada 15 días.
// Rápido: ya no consulta Evolution en vivo.

const N8N_CONTACTS_URL = 'https://n8n.srv1489770.hstgr.cloud/webhook/abivan-contactos-db'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const instance = searchParams.get('instance') || ''
  if (!instance) {
    return Response.json({ ok: false, error: 'Falta la instancia.' }, { status: 400 })
  }

  try {
    const url = `${N8N_CONTACTS_URL}?instance=${encodeURIComponent(instance)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) {
      return Response.json({ ok: false, error: `n8n respondió ${res.status}` }, { status: 502 })
    }
    const data = await res.json().catch(() => null)
    const contacts = Array.isArray(data?.contacts) ? data.contacts : []
    return Response.json({ ok: true, contacts })
  } catch {
    return Response.json({ ok: false, error: 'No se pudieron obtener los contactos.' }, { status: 502 })
  }
}
