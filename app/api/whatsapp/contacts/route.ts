// Devuelve los contactos de WhatsApp (guardados) unidos de las 3 instancias,
// deduplicados por número. Pasa por n8n (webhook abivan-contactos, que ya tiene
// la apikey de Evolution) para no exponer secretos al navegador.
// Nota: si en el futuro se centraliza en un Data Table de n8n, basta con cambiar
// N8N_CONTACTS_URL por el webhook que lee esa tabla.

const N8N_CONTACTS_URL = 'https://n8n.srv1489770.hstgr.cloud/webhook/abivan-contactos'
const INSTANCES = ['Ivan - CL', 'Ivan - CO', 'Abi']

type Contact = { id: string; name: string; phone: string }

async function fetchInstance(instance: string): Promise<Contact[]> {
  try {
    const url = `${N8N_CONTACTS_URL}?instance=${encodeURIComponent(instance)}`
    const res = await fetch(url, { signal: AbortSignal.timeout(25000) })
    if (!res.ok) return []
    const data = await res.json().catch(() => null)
    return Array.isArray(data?.contacts) ? data.contacts : []
  } catch {
    return []
  }
}

export async function GET() {
  const lists = await Promise.all(INSTANCES.map(fetchInstance))

  const map = new Map<string, Contact>()
  for (const list of lists) {
    for (const c of list) {
      const phone = String(c?.phone || '').replace(/\D/g, '')
      if (!phone) continue
      const name = typeof c?.name === 'string' ? c.name.trim() : ''
      const existing = map.get(phone)
      if (!existing) map.set(phone, { id: phone, name, phone })
      else if (!existing.name && name) existing.name = name
    }
  }

  const key = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').toLocaleLowerCase('es')
  const contacts = [...map.values()].sort((a, b) => {
    const an = a.name ? 0 : 1
    const bn = b.name ? 0 : 1
    if (an !== bn) return an - bn
    if (a.name && b.name) return key(a.name).localeCompare(key(b.name), 'es')
    return a.phone.localeCompare(b.phone)
  })

  if (contacts.length === 0) {
    return Response.json({ ok: false, error: 'No se pudieron obtener los contactos.' }, { status: 502 })
  }
  return Response.json({ ok: true, contacts })
}
