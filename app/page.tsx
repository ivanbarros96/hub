'use client'

import { useEffect, useMemo, useState } from 'react'
import {
  ArrowUpRight,
  BarChart3,
  Calculator,
  Clock3,
  FolderKanban,
  Home,
  Layers3,
  LayoutDashboard,
  Menu,
  Moon,
  MoreHorizontal,
  Search,
  Sparkles,
  Sun,
  X,
} from 'lucide-react'

type Project = {
  id: string
  name: string
  description: string
  category: string
  accent: string
  icon: typeof Calculator
  nodes: number
  updated: string
  path: string
  tags: string[]
}

const projects: Project[] = [
  {
    id: 'panales',
    name: 'Calculadora de Pañales',
    description: 'Compara el costo por pañal y descubre la alternativa más conveniente.',
    category: 'Finanzas personales',
    accent: 'coral',
    icon: Calculator,
    nodes: 4,
    updated: 'Hoy, 10:42',
    path: 'panales',
    tags: ['Finanzas personales', 'Calculadora', 'Ahorro'],
  },
  {
    id: 'meli',
    name: 'Ganancia MELI',
    description: 'Calcula la ganancia neta de tus ventas en Mercado Libre en CLP.',
    category: 'Ventas y negocios',
    accent: 'orange',
    icon: BarChart3,
    nodes: 8,
    updated: 'Ayer, 18:20',
    path: 'Ganancia-MELI',
    tags: ['Ventas y negocios', 'Mercado Libre', 'Rentabilidad'],
  },
  {
    id: 'meli-bolt',
    name: 'MELI Dashboard',
    description: 'Panel para visualizar y gestionar información de Mercado Libre.',
    category: 'Ventas y negocios',
    accent: 'orange',
    icon: LayoutDashboard,
    nodes: 0,
    updated: '',
    path: 'https://meli.bolt.host',
    tags: ['Ventas y negocios', 'Mercado Libre', 'Panel de ventas'],
  },
  {
    id: 'vivienda',
    name: 'Subsidio de Vivienda',
    description: 'Evalúa tu subsidio y capacidad de crédito para encontrar tu vivienda.',
    category: 'Vivienda',
    accent: 'blue',
    icon: Home,
    nodes: 5,
    updated: '12 Jun, 09:15',
    path: 'vivienda',
    tags: ['Vivienda', 'Subsidios', 'Planificación'],
  },
]

const categories = ['Finanzas personales', 'Ventas y negocios', 'Vivienda']
const filters = ['Todos', ...categories]

const accentTile: Record<string, string> = {
  coral: 'bg-[#fce9e4] text-[#d66f56] dark:bg-[#d66f56]/15 dark:text-[#eaa593]',
  orange: 'bg-[#fff0e4] text-[#db7b38] dark:bg-[#db7b38]/15 dark:text-[#e6a877]',
  blue: 'bg-[#e5edf8] text-[#5279a7] dark:bg-[#5279a7]/20 dark:text-[#9cbbe0]',
}
const accentGlow: Record<string, string> = {
  coral: 'from-[#d66f56]/25',
  orange: 'from-[#db7b38]/25',
  blue: 'from-[#5279a7]/25',
}

function useTheme() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])
  const toggle = () => {
    const next = !document.documentElement.classList.contains('dark')
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('theme', next ? 'dark' : 'light')
    } catch {}
    setDark(next)
  }
  return { dark, toggle }
}

export default function Page() {
  const [query, setQuery] = useState('')
  const [activeFilter, setActiveFilter] = useState('Todos')
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { dark, toggle } = useTheme()

  const filteredProjects = useMemo(() => {
    const normalized = query.toLowerCase()
    return projects.filter((project) => {
      const matchesQuery = [project.name, project.description, project.category, ...project.tags]
        .join(' ')
        .toLowerCase()
        .includes(normalized)
      const matchesFilter = activeFilter === 'Todos' || project.category === activeFilter
      return matchesQuery && matchesFilter
    })
  }, [activeFilter, query])

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <div className="flex min-h-dvh">
        {sidebarOpen && (
          <div className="fixed inset-0 z-30 bg-foreground/40 backdrop-blur-sm lg:hidden" onClick={() => setSidebarOpen(false)} aria-hidden />
        )}
        <aside className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 z-40 flex w-72 shrink-0 flex-col border-r border-border bg-sidebar transition-transform duration-300 ease-out lg:relative lg:translate-x-0`}>
          <div className="flex h-20 items-center gap-3 border-b border-border px-6">
            <div className="grid size-10 place-items-center rounded-2xl bg-gradient-to-br from-primary to-primary/70 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25">A</div>
            <div>
              <p className="text-[15px] font-bold tracking-tight">Abivan</p>
              <p className="text-xs text-muted-foreground">Tu espacio de proyectos</p>
            </div>
            <button className="ml-auto rounded-lg p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground lg:hidden" onClick={() => setSidebarOpen(false)} aria-label="Cerrar menú"><X className="size-4" /></button>
          </div>
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-7">
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Mis proyectos</p>
            <nav className="space-y-1">
              <button onClick={() => setActiveFilter('Todos')} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${activeFilter === 'Todos' ? 'bg-primary text-primary-foreground shadow-sm shadow-primary/20' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}><LayoutDashboard className="size-[17px]" />Resumen</button>
            </nav>
            <div className="my-7 border-t border-border" />
            <p className="px-3 pb-3 text-[10px] font-semibold uppercase tracking-[0.16em] text-muted-foreground">Tipos de caso de uso</p>
            <div className="space-y-1">
              {categories.map((category) => {
                const active = activeFilter === category
                return (
                  <button key={category} onClick={() => setActiveFilter(category)} className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition-all ${active ? 'bg-muted text-foreground' : 'text-muted-foreground hover:bg-muted hover:text-foreground'}`}>
                    <FolderKanban className={`size-[17px] ${active ? 'text-primary' : ''}`} />{category}
                  </button>
                )
              })}
            </div>

            <div className="mt-auto rounded-2xl border border-border bg-card p-4 shadow-sm">
              <div className="mb-3 flex items-center justify-between"><span className="text-xs font-semibold">Tu espacio</span><span className="size-2 animate-pulse rounded-full bg-[#70b77a]" /></div>
              <div className="mb-2 flex justify-between text-xs text-muted-foreground"><span>Proyectos organizados</span><span className="font-semibold text-foreground">{projects.length} / 20</span></div>
              <div className="h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full rounded-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-500" style={{ width: `${(projects.length / 20) * 100}%` }} /></div>
            </div>
          </div>
        </aside>

        <section className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-20 flex h-20 items-center gap-3 border-b border-border bg-background/80 px-5 backdrop-blur-xl md:px-10">
            <button className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted lg:hidden" onClick={() => setSidebarOpen(true)} aria-label="Abrir menú"><Menu className="size-5" /></button>
            <div className="relative hidden w-full max-w-md md:block">
              <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input aria-label="Buscar proyectos" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar una herramienta..." className="h-11 w-full rounded-xl border border-input bg-card pl-10 pr-4 text-sm shadow-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-ring focus:ring-2 focus:ring-ring/20" />
            </div>
            <button onClick={toggle} className="ml-auto grid size-11 place-items-center rounded-xl border border-border bg-card text-muted-foreground shadow-sm transition-colors hover:text-foreground" aria-label={dark ? 'Activar modo claro' : 'Activar modo oscuro'}>
              {dark ? <Sun className="size-[18px]" /> : <Moon className="size-[18px]" />}
            </button>
          </header>

          <div className="mx-auto w-full max-w-[1380px] px-5 py-8 md:px-10 md:py-11">
            <div className="mb-10 flex flex-col justify-between gap-5 md:flex-row md:items-end">
              <div>
                <p className="mb-2.5 inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary"><Sparkles className="size-3.5" />Bienvenido a Abivan</p>
                <h1 className="max-w-2xl text-balance text-3xl font-extrabold tracking-[-0.03em] md:text-[40px] md:leading-[1.1]">Tus proyectos, <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">más fáciles de usar</span></h1>
                <p className="mt-3 max-w-xl text-[15px] leading-6 text-muted-foreground">Elige una herramienta para comenzar.</p>
              </div>
            </div>

            <div className="mb-10 grid gap-4 sm:grid-cols-3">
              <Metric label="Proyectos totales" value={String(projects.length)} detail="Todos disponibles" icon={FolderKanban} accent="primary" />
              <Metric label="Casos de uso" value={String(categories.length)} detail="Cómo te ayudan" icon={Layers3} accent="green" />
              <Metric label="Herramientas listas" value="3" detail="Para usar ahora" icon={Calculator} accent="orange" />
            </div>

            <div className="mb-6 flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-lg font-bold tracking-tight">Elige una herramienta</h2>
                <p className="mt-1 text-sm text-muted-foreground">Encuentra rápidamente lo que necesitas.</p>
              </div>
              <div className="flex max-w-full overflow-x-auto rounded-xl border border-border bg-card p-1 shadow-sm">
                {filters.map((filter) => (
                  <button key={filter} onClick={() => setActiveFilter(filter)} className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-xs font-semibold transition-all ${activeFilter === filter ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}>{filter}</button>
                ))}
              </div>
            </div>

            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filteredProjects.map((project) => (
                <ProjectCard key={project.id} project={project} onOpen={() => setSelectedProject(project)} />
              ))}
              {filteredProjects.length === 0 && (
                <div className="col-span-full rounded-2xl border border-dashed border-border py-16 text-center">
                  <div className="mx-auto mb-4 grid size-12 place-items-center rounded-2xl bg-muted"><Search className="size-5 text-muted-foreground" /></div>
                  <p className="font-semibold">No encontramos resultados</p>
                  <p className="mt-1 text-sm text-muted-foreground">Prueba con otra palabra o elige “Todos”.</p>
                </div>
              )}
            </div>

            <div className="mt-12 border-t border-border pt-5 text-xs text-muted-foreground"><span>Todos tus proyectos, en un solo lugar.</span></div>
          </div>
        </section>
      </div>
      {selectedProject && <ProjectModal project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </main>
  )
}

function Metric({ label, value, detail, icon: Icon, accent }: { label: string; value: string; detail: string; icon: typeof FolderKanban; accent: string }) {
  return (
    <div className="group relative overflow-hidden rounded-2xl border border-border bg-card p-5 shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-center gap-4">
        <div className={`grid size-11 place-items-center rounded-xl ${accent === 'green' ? 'bg-[#e5f2e6] text-[#57945e] dark:bg-[#57945e]/15 dark:text-[#8dc294]' : accent === 'orange' ? 'bg-[#fff0e4] text-[#c4773e] dark:bg-[#c4773e]/15 dark:text-[#e0a877]' : 'bg-primary/10 text-primary'}`}><Icon className="size-[18px]" /></div>
        <div>
          <p className="text-xs text-muted-foreground">{label}</p>
          <div className="mt-1 flex items-baseline gap-2"><span className="text-2xl font-bold tracking-tight tabular-nums">{value}</span><span className="text-[11px] text-muted-foreground">{detail}</span></div>
        </div>
      </div>
    </div>
  )
}

function ProjectCard({ project, onOpen }: { project: Project; onOpen: () => void }) {
  const Icon = project.icon
  const isExternal = project.path.startsWith('http')
  const open = () => (isExternal ? window.open(project.path, '_blank', 'noopener,noreferrer') : onOpen())
  return (
    <article className="group relative flex min-h-[300px] cursor-pointer flex-col overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:border-primary/30 hover:shadow-xl hover:shadow-primary/5" onClick={open}>
      <div className={`pointer-events-none absolute -top-16 right-0 h-32 w-32 rounded-full bg-gradient-to-b ${accentGlow[project.accent]} to-transparent opacity-0 blur-2xl transition-opacity duration-300 group-hover:opacity-100`} />
      <div className="mb-6 flex items-start justify-between">
        <div className={`grid size-11 place-items-center overflow-hidden rounded-xl ${accentTile[project.accent]}`}>
          {project.id === 'meli' || project.id === 'meli-bolt' ? <img src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/imagen-gViNNlbewuXS1LEvV3Q7qM4UP0hVQZ.png" alt="Mercado Libre" className="size-full object-contain p-1" /> : <Icon className="size-5" />}
        </div>
        <div className="flex items-center gap-2">
          <span className="rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold text-muted-foreground">{project.category}</span>
          <button className="rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:bg-muted group-hover:opacity-100" onClick={(event) => event.stopPropagation()} aria-label={`Más opciones para ${project.name}`}><MoreHorizontal className="size-4" /></button>
        </div>
      </div>
      <h3 className="text-base font-bold tracking-tight">{project.name}</h3>
      <p className="mt-2 min-h-12 text-sm leading-6 text-muted-foreground">{project.description}</p>
      <div className="mt-auto flex flex-wrap items-center gap-2 pt-5">{project.tags.map((tag) => <span key={tag} className="rounded-md bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">{tag}</span>)}</div>
      <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-xs text-muted-foreground">
        {project.updated ? <span className="flex items-center gap-1.5"><Clock3 className="size-3.5" />{project.updated}</span> : <span />}
        <button onClick={(event) => { event.stopPropagation(); open() }} className="flex items-center gap-1.5 rounded-lg bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground shadow-sm transition-all hover:opacity-90"><ArrowUpRight className="size-3.5 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />Abrir</button>
      </div>
    </article>
  )
}

function ProjectModal({ project, onClose }: { project: Project; onClose: () => void }) {
  const Icon = project.icon
  const [values, setValues] = useState<Record<string, string>>({})
  const [mode, setMode] = useState<'ds1' | 'credito'>('ds1')
  const [tramo, setTramo] = useState(1)

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const value = (key: string) => Number(values[key] || 0)
  const setValue = (key: string, next: string) => setValues((current) => ({ ...current, [key]: next }))
  const money = (amount: number) => `$${Math.round(amount).toLocaleString('es-CL')}`
  const field = (key: string, label: string, placeholder: string) => <label className="space-y-1.5 text-xs font-semibold"><span>{label}</span><input type="number" min="0" value={values[key] || ''} onChange={(event) => setValue(key, event.target.value)} placeholder={placeholder} className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm font-normal outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/20" /></label>
  const reset = () => { setValues({}); setMode('ds1'); setTramo(1) }
  const panal = value('price') > 0 && value('count') > 0 ? value('price') / value('count') : 0
  const meliCobro = value('sale') > 0 && value('cost') >= 0 ? value('sale') * 0.846 - 3303 : 0
  const meliGanancia = meliCobro - value('cost')
  const ahorroUf = value('savings') / 41000
  const metaUf = tramo === 1 ? 30 : tramo === 2 ? 40 : 80
  const avance = Math.min((ahorroUf / metaUf) * 100, 100)
  const creditoStatus = ahorroUf >= 55 ? ['Excelente', '80–90%', 'bg-[#e5f2e6] text-[#57945e]'] : ahorroUf >= 45 ? ['Bueno', '65–75%', 'bg-[#e5f2e6] text-[#57945e]'] : ahorroUf >= 35 ? ['Aceptable', '55–60%', 'bg-[#fff0e4] text-[#b97843]'] : ahorroUf >= 30 ? ['Débil / Mínimo', '40–50%', 'bg-[#fff0e4] text-[#b97843]'] : ['Insuficiente', '0–39%', 'bg-[#fce9e4] text-[#d66f56]']
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4 backdrop-blur-sm" onClick={onClose}>
      <div role="dialog" aria-modal="true" aria-label={project.name} className="max-h-[92vh] w-full max-w-xl overflow-y-auto rounded-2xl border border-border bg-card p-6 shadow-2xl duration-200 animate-in fade-in zoom-in-95" onClick={(event) => event.stopPropagation()}>
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3"><div className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary"><Icon className="size-5" /></div><div><h2 className="font-bold tracking-tight">{project.name}</h2><p className="text-xs text-muted-foreground">Herramienta lista para usar</p></div></div>
          <button onClick={onClose} className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-muted" aria-label="Cerrar"><X className="size-4" /></button>
        </div>
        {project.id === 'meli-bolt' && <><p className="mt-5 text-sm text-muted-foreground">Una aplicación web lista para consultar tu operación de Mercado Libre.</p><a href={project.path} target="_blank" rel="noreferrer" className="mt-6 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-3.5 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90">Abrir aplicación <ArrowUpRight className="size-3.5" /></a></>}
        {project.id === 'panales' && <><p className="mt-5 text-sm text-muted-foreground">Calcula el costo unitario y descubre si el paquete conviene.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{field('price', 'Valor Total del Paquete', '$ 0')}{field('count', 'Cantidad de Pañales', '0')}</div><ResultBox title="Costo unitario" value={panal ? money(panal) : '$0'} tone={panal <= 230 ? 'green' : panal <= 255 ? 'orange' : 'red'} message={panal ? panal <= 230 ? '✅ ¡Costo conveniente para comprar!' : panal <= 255 ? '🟡 Más o menos conveniente' : '❌ No es conveniente' : undefined} /><button onClick={reset} className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">Limpiar formulario</button></>}
        {project.id === 'meli' && <><p className="mt-5 text-sm text-muted-foreground">Estima tu cobro real después de comisión y costo del producto.</p><div className="mt-5 grid gap-3 sm:grid-cols-2">{field('sale', 'Valor de venta en MELI', '$ 0')}{field('cost', 'Costo de Premium Sale', '$ 0')}</div><div className="mt-5 grid gap-3 sm:grid-cols-2"><ResultBox title="Cobro MELI" value={money(meliCobro)} tone="orange" /><ResultBox title="Ganancia Neta" value={money(meliGanancia)} tone={meliGanancia >= 0 ? 'green' : 'red'} /></div><button onClick={reset} className="mt-4 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">Limpiar</button></>}
        {project.id === 'vivienda' && <><div className="mt-5 flex rounded-lg border border-border bg-muted/40 p-1"><button onClick={() => setMode('ds1')} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${mode === 'ds1' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>Subsidio DS1</button><button onClick={() => setMode('credito')} className={`flex-1 rounded-md px-3 py-2 text-xs font-semibold transition-all ${mode === 'credito' ? 'bg-primary text-primary-foreground shadow-sm' : 'text-muted-foreground'}`}>Crédito Hipotecario</button></div>{mode === 'ds1' ? <><div className="mt-5 flex gap-2">{[1, 2, 3].map((item) => <button key={item} onClick={() => setTramo(item)} className={`flex-1 rounded-full border px-3 py-2 text-xs font-semibold transition-all ${tramo === item ? 'border-primary bg-primary text-primary-foreground shadow-sm' : 'border-border text-muted-foreground hover:bg-muted'}`}>Tramo {item} · {[30, 40, 80][item - 1]} UF</button>)}</div>{field('savings', 'Monto ahorrado en CLP', '$ 0')}<div className="mt-5 flex items-end justify-between"><div><p className="text-3xl font-bold tabular-nums">{ahorroUf.toFixed(2)} UF</p><p className="mt-1 text-xs text-muted-foreground">Meta: {metaUf}.00 UF</p></div><span className="text-sm font-bold text-primary tabular-nums">{avance.toFixed(2)}%</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all duration-500 ${avance >= 100 ? 'bg-[#57945e]' : avance >= 30 ? 'bg-[#d68b45]' : 'bg-[#d66f56]'}`} style={{ width: `${avance}%` }} /></div><p className="mt-4 rounded-lg bg-muted p-3 text-sm">{avance >= 100 ? '¡Ahorro cumplido!' : avance >= 70 ? `Muy cerca de la meta, te faltan ${(metaUf - ahorroUf).toFixed(2)} UF` : avance >= 30 ? `Vas por buen camino, te faltan ${(metaUf - ahorroUf).toFixed(2)} UF` : `Aún te falta para Tramo ${tramo}, te faltan ${(metaUf - ahorroUf).toFixed(2)} UF`}</p></> : <><p className="mt-5 text-sm text-muted-foreground">Meta visual: 55 UF</p>{field('savings', 'Monto ahorrado en CLP', '$ 0')}<div className="mt-5 flex items-end justify-between"><p className="text-3xl font-bold tabular-nums">{ahorroUf.toFixed(2)} UF <span className="text-sm font-normal text-muted-foreground">ahorradas</span></p><span className={`rounded-full px-2.5 py-1 text-xs font-bold ${creditoStatus[2]}`}>{creditoStatus[0]}</span></div><div className="mt-3 h-3 overflow-hidden rounded-full bg-muted"><div className={`h-full rounded-full transition-all duration-500 ${ahorroUf >= 55 ? 'bg-[#57945e]' : ahorroUf >= 35 ? 'bg-[#d68b45]' : 'bg-[#d66f56]'}`} style={{ width: `${Math.min((ahorroUf / 55) * 100, 100)}%` }} /></div><div className="mt-2 flex justify-between text-[10px] text-muted-foreground"><span>30 UF · Débil</span><span>35 UF · Aceptable</span><span>55 UF · Excelente</span></div><div className="mt-5 rounded-lg bg-muted p-4"><p className="text-sm font-semibold">Probabilidad de aprobación: {creditoStatus[1]}</p><p className="mt-1 text-xs text-muted-foreground">Nivel {creditoStatus[0]} basado en tu ahorro.</p></div></>}<button onClick={reset} className="mt-5 w-full rounded-lg border border-border px-3 py-2 text-sm font-medium transition-colors hover:bg-muted">Limpiar</button></>}
      </div>
    </div>
  )
}

function ResultBox({ title, value, tone, message }: { title: string; value: string; tone: 'green' | 'orange' | 'red'; message?: string }) {
  const colors = {
    green: 'border-[#57945e]/30 bg-[#e5f2e6]/60 text-[#57945e] dark:bg-[#57945e]/10 dark:text-[#8dc294]',
    orange: 'border-[#d68b45]/30 bg-[#fff0e4]/60 text-[#b97843] dark:bg-[#d68b45]/10 dark:text-[#e0a877]',
    red: 'border-[#d66f56]/30 bg-[#fce9e4]/60 text-[#d66f56] dark:bg-[#d66f56]/10 dark:text-[#eaa593]',
  }
  return <div className={`mt-5 rounded-xl border p-4 ${colors[tone]}`}><p className="text-xs font-semibold opacity-80">{title}</p><p className="mt-1 text-2xl font-bold tabular-nums">{value}</p>{message && <p className="mt-2 text-sm font-medium">{message}</p>}</div>
}
