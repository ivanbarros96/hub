// Devuelve los contactos de WhatsApp (guardados) de una instancia de Evolution.
// Pasa por n8n (webhook abivan-contactos) para que la apikey de Evolution nunca
// llegue al navegador. La URL de n8n no es secreta; se puede sobreescribir con env.

const N8N_CONTACTS_URL = 'https://n8n.srv1489770.hstgr.cloud/webhook/abivan-contactos'

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
    return Response.json({ ok: false, error: 'No se pudo obtener los contactos.' }, { status: 502 })
  }
}
