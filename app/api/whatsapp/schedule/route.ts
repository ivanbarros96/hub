// Proxy servidor → n8n para agendar/enviar mensajes de WhatsApp.
// Mantiene la URL del webhook fuera del cliente (variable de entorno en Vercel).
// UI-first: si N8N_WHATSAPP_WEBHOOK no está configurada, simula éxito para poder
// probar el flujo completo sin n8n. Al definir la variable, envía de verdad.

export async function POST(request: Request) {
  const payload = await request.json().catch(() => null)
  if (!payload || typeof payload.message !== 'string' || typeof payload.to !== 'string') {
    return Response.json({ ok: false, error: 'Datos incompletos.' }, { status: 400 })
  }

  const webhook = process.env.N8N_WHATSAPP_WEBHOOK
  if (!webhook) {
    return Response.json({ ok: true, simulated: true })
  }

  try {
    const res = await fetch(webhook, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
    if (!res.ok) {
      return Response.json({ ok: false, error: `n8n respondió ${res.status}` }, { status: 502 })
    }
    return Response.json({ ok: true })
  } catch {
    return Response.json({ ok: false, error: 'No se pudo contactar a n8n.' }, { status: 502 })
  }
}
