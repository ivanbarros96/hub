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
  UserPlus,
  X,
  Zap,
} from 'lucide-react'
import { getContacts, instances, scheduleWhatsApp, type Contact, type ScheduleResult } from '@/lib/whatsapp'

const steps = ['Remitente', 'Destinatario', 'Mensaje', 'Programar']

function cleanPhone(raw: string) {
  const trimmed = raw.trim()
  const plus = trimmed.startsWith('+') ? '+' : ''
  return plus + trimmed.replace(/[^\d]/g, '')
}
function validPhone(raw: string) {
  return cleanPhone(raw).replace('+', '').length >= 8
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
  const [sendNow, setSendNow] = useState(false)
  const [date, setDate] = useState('')
  const [time, setTime] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<ScheduleResult | null>(null)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const instance = instances.find((i) => i.id === instanceId) || null
  const contacts = useMemo(() => {
    const q = contactQuery.toLowerCase()
    return getContacts().filter((c) => [c.name, c.phone].join(' ').toLowerCase().includes(q))
  }, [contactQuery])

  const today = new Date().toISOString().slice(0, 10)

  const canNext =
    step === 0 ? !!instanceId
    : step === 1 ? (customMode ? customName.trim().length > 0 && validPhone(customPhone) : !!recipient)
    : step === 2 ? message.trim().length > 0
    : sendNow || (!!date && !!time)

  const goNext = () => {
    if (step === 1 && customMode) setRecipient({ name: customName.trim(), phone: cleanPhone(customPhone) })
    if (step < 3) setStep((s) => s + 1)
  }
  const goBack = () => setStep((s) => Math.max(0, s - 1))

  const submit = async () => {
    if (!instance || !recipient) return
    setSending(true)
    const sendAt = sendNow ? null : new Date(`${date}T${time}`).toISOString()
    const res = await scheduleWhatsApp({
      instanceId: instance.id,
      instanceLabel: instance.label,
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
                  <p className="text-lg font-bold">{sendNow ? 'Mensaje enviado' : 'Mensaje agendado'}</p>
                  <p className="mt-1.5 max-w-xs text-sm text-muted-foreground">
                    {sendNow ? 'Se envió' : 'Se enviará'} a {recipient?.name || recipient?.phone} desde {instance?.label}
                    {!sendNow && date && time ? ` el ${date} a las ${time}` : ''}.
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
                  <label className="space-y-1.5 text-xs font-semibold"><span>Nombre</span><input value={customName} onChange={(e) => setCustomName(e.target.value)} placeholder="Nombre del contacto" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                  <label className="space-y-1.5 text-xs font-semibold"><span>Número (con código de país)</span><input value={customPhone} onChange={(e) => setCustomPhone(e.target.value)} inputMode="tel" placeholder="+56 9 1234 5678" className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" />{customPhone && !validPhone(customPhone) && <span className="block text-[11px] font-normal text-[#d66f56]">Ingresa un número válido con código de país.</span>}</label>
                </div>
              ) : (
                <>
                  <div className="relative">
                    <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                    <input value={contactQuery} onChange={(e) => setContactQuery(e.target.value)} placeholder="Buscar contacto..." className="h-10 w-full rounded-lg border border-input bg-background pl-9 pr-3 text-sm outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" />
                  </div>
                  <div className="max-h-52 space-y-1 overflow-y-auto">
                    {contacts.map((c) => {
                      const active = recipient?.phone === c.phone && !customMode
                      return (
                        <button key={c.id} onClick={() => setRecipient({ name: c.name, phone: c.phone })} className={`flex w-full items-center gap-3 rounded-lg p-2.5 text-left transition-colors ${active ? 'bg-[#e5f2e6]/60 dark:bg-[#3f9d54]/10' : 'hover:bg-muted'}`}>
                          <div className="grid size-9 place-items-center rounded-full bg-muted text-xs font-semibold text-muted-foreground">{c.name.split(' ').map((p) => p[0]).slice(0, 2).join('')}</div>
                          <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{c.name}</p><p className="truncate text-xs text-muted-foreground">{c.phone}</p></div>
                          {active && <Check className="size-4 shrink-0 text-[#3f9d54]" />}
                        </button>
                      )
                    })}
                    {contacts.length === 0 && <p className="py-6 text-center text-sm text-muted-foreground">Sin resultados. Prueba con “Número nuevo”.</p>}
                  </div>
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
              <div className="flex rounded-lg border border-border bg-muted/40 p-1">
                <button onClick={() => setSendNow(true)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all ${sendNow ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><Zap className="size-3.5" />Enviar ahora</button>
                <button onClick={() => setSendNow(false)} className={`flex flex-1 items-center justify-center gap-1.5 rounded-md px-3 py-2 text-xs font-semibold transition-all ${!sendNow ? 'bg-card shadow-sm' : 'text-muted-foreground'}`}><CalendarClock className="size-3.5" />Programar</button>
              </div>
              {!sendNow && (
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="space-y-1.5 text-xs font-semibold"><span>Día</span><input type="date" min={today} value={date} onChange={(e) => setDate(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                  <label className="space-y-1.5 text-xs font-semibold"><span>Hora</span><input type="time" value={time} onChange={(e) => setTime(e.target.value)} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
                </div>
              )}
              <div className="rounded-xl border border-border bg-muted/40 p-4 text-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Resumen</p>
                <div className="space-y-1.5 text-muted-foreground">
                  <p><span className="font-medium text-foreground">Desde:</span> {instance?.label} ({instance?.number})</p>
                  <p><span className="font-medium text-foreground">Para:</span> {recipient?.name} · {recipient?.phone}</p>
                  <p className="line-clamp-2"><span className="font-medium text-foreground">Mensaje:</span> {message}</p>
                  <p><span className="font-medium text-foreground">Cuándo:</span> {sendNow ? 'Ahora' : date && time ? `${date} a las ${time}` : 'Elige día y hora'}</p>
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
                {sendNow ? 'Enviar' : 'Programar envío'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
