'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  CalendarClock,
  Check,
  MessageCircle,
  Phone,
  Search,
  Send,
  X,
} from 'lucide-react'
import { fetchContacts, instances, scheduleWhatsApp, type Contact, type ScheduleResult } from '@/lib/whatsapp'

const steps = ['Remitente', 'Destinatario', 'Mensaje', 'Programar']

function cleanPhone(raw: string) {
  const trimmed = raw.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/[^\d]/g, '')
}
function validPhone(raw: string) {
  return cleanPhone(raw).replace('+', '').length >= 8
}

// El horario siempre se interpreta en Santiago de Chile, sin importar el
// dispositivo. Convierte una fecha/hora local de Chile al instante UTC (ISO),
// respetando el horario de verano/invierno vía Intl (sin librerías).
const TZ = 'America/Santiago'
function zonedToISO(dateStr: string, timeStr: string, timeZone = TZ) {
  const [y, mo, d] = dateStr.split('-').map(Number)
  const [h, mi] = timeStr.split(':').map(Number)
  const utcGuess = Date.UTC(y, mo - 1, d, h, mi, 0)
  const dtf = new Intl.DateTimeFormat('en-US', {
    timeZone, hour12: false,
    year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
  const parts = Object.fromEntries(dtf.formatToParts(new Date(utcGuess)).map((p) => [p.type, p.value]))
  const asZoned = Date.UTC(+parts.year, +parts.month - 1, +parts.day, +parts.hour, +parts.minute, +parts.second)
  const offset = asZoned - utcGuess
  return new Date(utcGuess - offset).toISOString()
}
function todayInTZ(timeZone = TZ) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', { timeZone, year: 'numeric', month: '2-digit', day: '2-digit' })
      .formatToParts(new Date()).map((p) => [p.type, p.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}`
}

export function WhatsAppScheduler({ onClose }: { onClose: () => void }) {
  const [step, setStep] = useState(0)
  const [instanceId, setInstanceId] = useState<string | null>(null)
  const [contactQuery, setContactQuery] = useState('')
  const [recipient, setRecipient] = useState<{ name: string; phone: string } | null>(null)
  const [customMode, setCustomMode] = useState(false)
  const [customName, setCustomName] = useState('')
  const [customPhone, setCustomPhone] = useState('')
  const [message, setMessage] = useState('')
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ScheduleResult | null>(null)
  const [allContacts, setAllContacts] = useState<Contact[]>([])
  const [loadingContacts, setLoadingContacts] = useState(false)
  const [contactsError, setContactsError] = useState(false)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const [reloadKey, setReloadKey] = useState(0)
  const instance = instances.find((i) => i.id === instanceId) || null

  useEffect(() => {
    if (!instanceId) return
    let cancelled = false
    setLoadingContacts(true)
    setContactsError(false)
    const inst = instances.find((i) => i.id === instanceId)
    fetchContacts(inst?.instance || '').then((list) => {
      if (cancelled) return
      const key = (s: string) => s.replace(/^[^\p{L}\p{N}]+/u, '').toLocaleLowerCase('es')
      const sorted = [...list].sort((a, b) => {
        const an = a.name ? 0 : 1
        const bn = b.name ? 0 : 1
        if (an !== bn) return an - bn
        if (a.name && b.name) return key(a.name).localeCompare(key(b.name), 'es')
        return a.phone.localeCompare(b.phone)
      })
      setAllContacts(sorted)
      setContactsError(list.length === 0)
      setLoadingContacts(false)
    })
    return () => {
      cancelled = true
    }
  }, [instanceId, reloadKey])

  const MAX_RENDER = 60
  const contacts = useMemo(() => {
    const q = contactQuery.toLowerCase().trim()
    const filtered = q
      ? allContacts.filter((c) => [c.name, c.phone].join(' ').toLowerCase().includes(q))
      : allContacts
    return filtered.slice(0, MAX_RENDER)
  }, [contactQuery, allContacts])
  const totalMatches = useMemo(() => {
    const q = contactQuery.toLowerCase().trim()
    return q ? allContacts.filter((c) => [c.name, c.phone].join(' ').toLowerCase().includes(q)).length : allContacts.length
  }, [contactQuery, allContacts])

  const today = todayInTZ()

  const canNext =
    step === 0 ? !!instanceId
    : step === 1 ? (customMode ? validPhone(customPhone) : !!recipient)
    : step === 2 ? message.trim().length > 0
    : !!date && !!time

  const goNext = () => {
    if (step === 1 && customMode) setRecipient({ name: customName.trim() || cleanPhone(customPhone), phone: cleanPhone(customPhone) })
    if (step < 3) setStep((s) => s + 1)
  }
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const submit = async () => {
    if (!instance || !recipient) return
    setSending(true)
    const sendAt = zonedToISO(date, time)
    const res = await scheduleWhatsApp({
      instanceId: instance.id,
      instanceLabel: instance.label,
      instance: instance.instance,
      to: recipient.phone,
      name: recipient.name,
      message: message.trim(),
      sendAt,
    })
    setResult(res)
    setSending(false)
  }

  const green = 'bg-[#3f9d54] text-white hover:bg-[#37894a]'

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label="Agendar WhatsApp" className="flex max-h-[92vh] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-card shadow-2xl duration-200 animate-in fade-in zoom-in-95" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-start justify-between border-b border-border p-5">
          <div className="flex items-center gap-3">
            <div className="grid size-11 place-items-center rounded-xl bg-[#e5f2e6] text-[#3f9d54] dark:bg-[#3f9d54]/15 dark:text-[#7fc98f]"><MessageCircle className="size-5" /></div>
            <div>
              <h2 className="font-bold tracking-tight">Agendar WhatsApp</h2>
              <p className="text-xs text-muted-foreground">{result ? 'Listo' : `Paso ${step + 1} de ${steps.length} · ${steps[step]}`}</p>
            </div>
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted" aria-label="Cerrar"><X className="size-4" /></button>
        </div>

        {!result && (
          <div className="flex items-center gap-1.5 px-5 pt-4">
            {steps.map((label, i) => (
              <div key={label} className="flex flex-1 items-center gap-1.5">
                <div className={`h-1.5 flex-1 rounded-full transition-colors ${i <= step ? 'bg-[#3f9d54]' : 'bg-muted'}`} />
              </div>
            ))}
          </div>
        )}

        <div className="min-h-[280px] overflow-y-auto p-5">
          {result ? (
            <div className="grid place-items-center py-10 text-center">
              <div className={`mb-4 grid size-14 place-items-center rounded-full ${result.ok ? 'bg-[#e5f2e6] text-[#3f9d54]' : 'bg-[#fce9e4] text-[#d66f56]'}`}>
                {result.ok ? <Check className="size-7" /> : <X className="size-7" />}
              </div>
              {result.ok ? (
                <>
                  <p className="text-lg font-bold">Mensaje agendado</p>
                  <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                    Se enviará a {recipient?.name || recipient?.phone} desde {instance?.label}
                    {date && time ? ` el ${date} a las ${time}` : ''}.
                  </p>
                  {result.simulated && <p className="mt-3 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">Modo demo: n8n aún no está conectado, así que esto fue una simulación.</p>}
                </>
              ) : (
                <>
                  <p className="text-lg font-bold">No se pudo completar</p>
                  <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">{result.error || 'Ocurrió un error.'}</p>
                  <button onClick={() => setResult(null)} className="mt-4 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Reintentar</button>
                </>
              )}
            </div>
          ) : step === 0 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Elige desde qué número enviar.</p>
              {instances.map((inst) => {
                const active = instanceId === inst.id
                return (
                  <button key={inst.id} onClick={() => setInstanceId(inst.id)} className={`flex w-full items-center gap-3 rounded-xl border p-4 text-left transition-all ${active ? 'border-[#3f9d54] bg-[#e5f2e6]/50 dark:bg-[#3f9d54]/10' : 'border-border hover:bg-muted'}`}>
                    <div className="grid size-10 place-items-center rounded-lg bg-[#e5f2e6] text-[#3f9d54] dark:bg-[#3f9d54]/15 dark:text-[#7fc98f]"><Phone className="size-[18px]" /></div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{inst.label}</p>
                      <p className="text-xs text-muted-foreground">{inst.number}</p>
                    </div>
                    {active && <Check className="size-5 shrink-0 text-[#3f9d54]" />}
                  </button>
                )
              })}
            </div>
          ) : step === 1 ? (
            <div className="space-y-3">
              <div className="flex rounded-lg border border-border bg-muted/40 p-1">
                <button onClick={() => setCustomMode(false)} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${!customMode ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Mis contactos</button>
                <button onClick={() => setCustomMode(true)} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${customMode ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}>Número nuevo</button>
              </div>
              {customMode ? (
                <div className="space-y-3 pt-1">
                  <label className="space-y-1.5 text-xs font-semibold"><span>Nombre <span className="font-normal text-muted-foreground">(opcional)</span></span><input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nombre del contacto" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                  <label className="space-y-1.5 text-xs font-semibold"><span>Número (con código de país)</span><input value={customPhone} onChange={(e) => setCustomPhone(e.target.value)} inputMode="tel" placeholder="+56 9 1234 5678" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" />{customPhone && !validPhone(customPhone) && <span className="block text-[11px] font-normal text-[#d66f56]">Ingresa un número válido con código de país.</span>}</label>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} placeholder="Buscar por nombre o número..." disabled={loadingContacts} className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20 disabled:opacity-60" />
                  </div>
                  {loadingContacts ? (
                    <div className="space-y-1">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 p-2.5">
                          <div className="size-9 shrink-0 animate-pulse rounded-full bg-muted" />
                          <div className="flex-1 space-y-1.5"><div className="h-3 w-1/3 animate-pulse rounded bg-muted" /><div className="h-2.5 w-1/4 animate-pulse rounded bg-muted" /></div>
                        </div>
                      ))}
                    </div>
                  ) : contactsError ? (
                    <div className="py-8 text-center">
                      <p className="text-sm font-medium">No pudimos cargar tus contactos</p>
                      <p className="mt-1 text-xs text-muted-foreground">Revisa tu conexión o usa “Número nuevo”.</p>
                      <button onClick={() => setReloadKey((k) => k + 1)} className="mt-3 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-muted">Reintentar</button>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-52 space-y-1 overflow-y-auto">
                        {contacts.map((c) => {
                          const active = recipient?.phone === c.phone && !customMode
                          const initials = c.name ? c.name.replace(/[^\p{L}\p{N} ]/gu, '').trim().split(/\s+/).map((p) => p[0]).slice(0, 2).join('').toUpperCase() : '#'
                          return (
                            <button key={c.id} onClick={() => setRecipient({ name: c.name || c.phone, phone: c.phone })} className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${active ? 'bg-[#e5f2e6]/60 dark:bg-[#3f9d54]/10' : 'hover:bg-muted'}`}>
                              <div className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{initials || '#'}</div>
                              <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.name || c.phone}</p><p className="truncate text-xs text-muted-foreground">{c.phone}</p></div>
                              {active && <Check className="size-4 shrink-0 text-[#3f9d54]" />}
                            </button>
                          )
                        })}
                        {contacts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados. Prueba con “Número nuevo”.</p>}
                      </div>
                      {totalMatches > contacts.length && <p className="pt-1 text-center text-[11px] text-muted-foreground">Mostrando {contacts.length} de {totalMatches}. Escribe para afinar la búsqueda.</p>}
                    </>
                  )}
                </>
              )}
            </div>
          ) : step === 2 ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">Para <span className="font-semibold text-foreground">{recipient?.name || recipient?.phone}</span> desde <span className="font-semibold text-foreground">{instance?.label}</span>.</p>
              <label className="space-y-1.5 text-xs font-semibold">
                <span>Mensaje</span>
                <textarea value={message} onChange={(e) => setMessage(e.target.value)} rows={6} placeholder="Escribe tu mensaje..." className="w-full resize-none rounded-lg border border-input bg-background p-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" />
              </label>
              <p className="text-right text-xs text-muted-foreground tabular-nums">{message.length} caracteres</p>
            </div>
          ) : (
            <div className="space-y-4">
              <p className="flex items-center gap-1.5 text-sm text-muted-foreground"><CalendarClock className="size-4 text-[#3f9d54]" />Elige cuándo se enviará el mensaje.</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="space-y-1.5 text-xs font-semibold"><span>Día</span><input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                <label className="space-y-1.5 text-xs font-semibold"><span>Hora</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
              </div>
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen</p>
                <div className="space-y-1.5 text-muted-foreground">
                  <p><span className="font-medium text-foreground">Desde:</span> {instance?.label}</p>
                  <p><span className="font-medium text-foreground">Para:</span> {recipient?.name} · {recipient?.phone}</p>
                  <p className="line-clamp-2"><span className="font-medium text-foreground">Mensaje:</span> {message}</p>
                  <p><span className="font-medium text-foreground">Cuándo:</span> {date && time ? `${date} a las ${time}` : 'Elige día y hora'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        {!result && (
          <div className="flex items-center justify-between gap-3 border-t border-border p-5">
            <button onClick={goBack} disabled={step === 0} className="flex items-center gap-1.5 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground transition-colors enabled:hover:bg-muted disabled:opacity-40"><ArrowLeft className="size-4" />Atrás</button>
            {step < 3 ? (
              <button onClick={goNext} disabled={!canNext} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40 ${green}`}>Continuar <ArrowRight className="size-4" /></button>
            ) : (
              <button onClick={submit} disabled={!canNext || sending} className={`flex items-center gap-1.5 rounded-lg px-4 py-2 text-sm font-semibold transition-all disabled:opacity-40 ${green}`}>
                {sending ? <span className="size-4 animate-spin rounded-full border-2 border-white border-t-transparent" /> : <Send className="size-4" />}
                Programar envío
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
