// Proxy servidor → n8n para agendar mensajes de WhatsApp.
// n8n (webhook abivan-agendar) espera hasta la fecha/hora y envía por Evolution,
// manteniendo la apikey fuera del navegador. La URL de n8n no es secreta; se
// puede sobreescribir con la variable de entorno.

const N8N_SCHEDULE_URL = 'https://n8n.srv1489770.hstgr.cloud/webhook/abivan-agendar'

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload.message !== 'string' || typeof payload.to !== 'string') {
    return Response.json({ ok: false, error: 'Datos incompletos.' }, { status: 400 })
  }

  try {
    const res = await fetch(N8N_SCHEDULE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(25000),
    })
    if (!res.ok) {
      return Response.json({ ok: false, error: `n8n respondió ${res.status}` }, { status: 502 })
    }
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false, error: 'No se pudo contactar a n8n.' }, { status: 502 })
  }
}
