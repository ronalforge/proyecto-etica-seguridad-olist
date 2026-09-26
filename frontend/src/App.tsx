import { useEffect, useState } from 'react'
import { AlertCircle, ArrowRight, CalendarDays, Clock3, LogOut, MapPinned, PackageCheck, ShieldCheck, Star } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'

type Summary = { n: number; late: number | null; late_pct: number | null; avg_delay: number | null; ontime_review: number | null; late_review: number | null }
type Region = { state: string; n: number; late_pct: number }
type Month = { month: string; n: number; late_pct: number }
type Holiday = { day_type: string; n: number; late_pct: number }
type DashboardData = { state: string; summary: Summary; states: Region[]; months: Month[]; holiday: Holiday[]; user: { username: string; role: string }; csrf: string }

const number = new Intl.NumberFormat('es-PE')
const decimal = new Intl.NumberFormat('es-PE', { maximumFractionDigits: 1 })
const score = new Intl.NumberFormat('es-PE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
const pct = (value: number | null) => value == null ? '—' : `${decimal.format(value)} %`

function App() {
  const selectedState = new URLSearchParams(window.location.search).get('state') || ''
  const [filterState, setFilterState] = useState(selectedState)
  const [data, setData] = useState<DashboardData | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const controller = new AbortController()
    fetch(`/api/dashboard${selectedState ? `?state=${encodeURIComponent(selectedState)}` : ''}`, { signal: controller.signal })
      .then(async response => {
        if (response.redirected || response.url.includes('/login')) {
          window.location.assign('/login')
          return null
        }
        if (!response.ok) throw new Error('No se pudieron cargar los indicadores.')
        return response.json() as Promise<DashboardData>
      })
      .then(result => { if (result) setData(result) })
      .catch(cause => { if (cause.name !== 'AbortError') setError('No se pudieron cargar los indicadores. Recarga la página.') })
    return () => controller.abort()
  }, [selectedState])

  if (error) return <main className="mx-auto flex min-h-screen max-w-lg items-center px-5"><Card className="w-full"><CardHeader><CardTitle className="flex items-center gap-2"><AlertCircle className="size-5" />Error al cargar</CardTitle><CardDescription>{error}</CardDescription></CardHeader><CardContent><Button onClick={() => window.location.reload()}>Reintentar</Button></CardContent></Card></main>
  if (!data) return <main className="mx-auto max-w-7xl px-5 py-12" aria-live="polite"><div className="mb-7 h-10 w-72 animate-pulse rounded-xl bg-muted" /><div className="grid gap-4 md:grid-cols-4">{[0,1,2,3].map(i => <div key={i} className="h-48 animate-pulse rounded-xl bg-muted" />)}</div><p className="mt-5 text-sm text-muted-foreground">Cargando indicadores…</p></main>

  const summary = data.summary
  const onTime = summary.n - (summary.late || 0)

  return <div className="min-h-screen bg-background text-foreground">
    <a href="#contenido" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:rounded-md focus:bg-card focus:px-4 focus:py-2">Ir al contenido</a>
    <header className="border-b border-border bg-card"><div className="mx-auto flex h-17 max-w-7xl items-center justify-between gap-4 px-5 sm:px-8">
      <a href="/" className="flex items-center gap-2.5 text-lg font-semibold tracking-tight"><span className="flex size-8 items-center justify-center rounded-lg border border-border bg-secondary text-foreground"><PackageCheck className="size-4" /></span>Olist <span className="font-normal text-muted-foreground">Lab</span></a>
      <div className="flex items-center gap-2 sm:gap-4"><Badge variant="secondary" className="hidden sm:inline-flex">{data.user.username} · {data.user.role}</Badge>{data.user.role === 'admin' && <Button variant="ghost" size="sm" asChild><a href="/audit"><ShieldCheck className="size-4" />Auditoría</a></Button>}<form action="/logout" method="post"><input type="hidden" name="csrf" value={data.csrf} /><Button variant="outline" size="sm" type="submit"><LogOut className="size-4" /><span className="hidden sm:inline">Salir</span></Button></form></div>
    </div></header>

    <main id="contenido" className="mx-auto max-w-7xl space-y-6 px-5 py-8 sm:px-8 sm:py-10">
      <div className="flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><p className="text-xs font-semibold uppercase tracking-[.11em] text-primary">Ética y seguridad de datos · DS3031</p><h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">Resumen de entregas</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">Pedidos históricos de Olist entre 2016 y 2018. Explora retrasos y satisfacción del cliente con datos agregados.</p></div><form className="flex flex-col gap-2" method="get"><label htmlFor="state" className="text-sm font-medium">Estado del cliente</label><div className="flex gap-2"><select id="state" name="state" value={filterState} onChange={event => setFilterState(event.target.value)} className="h-9 min-w-44 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"><option value="">Todos los estados</option>{data.states.map(item => <option key={item.state} value={item.state}>{item.state}</option>)}</select><Button type="submit">Aplicar <ArrowRight className="size-4" /></Button></div></form></div>

      <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-[1.15fr_1fr_1fr_1fr]" aria-label="Indicadores principales">
        <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2 font-medium text-foreground"><span className="size-2 rounded-full bg-foreground" />Entregas tardías</CardDescription><CardTitle className="text-5xl font-semibold tracking-tight tabular-nums">{pct(summary.late_pct)}</CardTitle></CardHeader><CardContent><p className="text-sm leading-5 text-muted-foreground">{number.format(summary.late || 0)} de {number.format(summary.n)} pedidos llegaron después de la fecha estimada.</p><progress className="status-progress mt-5 h-2 w-full" max="100" value={summary.late_pct || 0} aria-label={`${pct(summary.late_pct)} de entregas tardías`} /><div className="mt-2 flex justify-between text-xs text-muted-foreground"><span>A tiempo <strong className="text-emerald-400">{number.format(onTime)}</strong></span><span>Tardías <strong className="text-foreground">{number.format(summary.late || 0)}</strong></span></div></CardContent></Card>
        <Metric icon={<PackageCheck className="size-4" />} label="Pedidos analizados" value={number.format(summary.n)} note="Con fechas de entrega completas" />
        <Metric icon={<Clock3 className="size-4" />} label="Retraso promedio" value={summary.avg_delay == null ? '—' : `${decimal.format(summary.avg_delay)} días`} note="Solo entregas tardías" />
        <Metric icon={<Star className="size-4 text-emerald-400" />} label="Calificación media" value={summary.ontime_review == null ? '—' : `${score.format(summary.ontime_review)} / 5`} note={`Puntuales · tardías: ${summary.late_review == null ? '—' : score.format(summary.late_review)}`} />
      </section>

      <section className="grid gap-4 md:grid-cols-2" aria-label="Análisis de entregas">
        <Card><CardHeader className="flex flex-row items-start justify-between gap-3"><div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Comparación regional</p><CardTitle className="flex items-center gap-2 text-xl"><MapPinned className="size-5 text-muted-foreground" />Retrasos por estado</CardTitle></div><Badge variant="outline" className="whitespace-nowrap">≥30 pedidos</Badge></CardHeader><CardContent><p className="mb-4 text-xs text-muted-foreground">Todos los estados, incluso al aplicar un filtro.</p><div className="space-y-3">{data.states.slice(0,12).map(item => <div key={item.state} className="grid grid-cols-[2rem_1fr_3.5rem] items-center gap-3 text-sm sm:grid-cols-[2rem_1fr_3.5rem_6rem]"><span className="font-semibold">{item.state}</span><progress className="region-progress h-2 w-full" max="100" value={item.late_pct} aria-label={`${item.state}: ${pct(item.late_pct)} de entregas tardías`} /><strong className="text-right tabular-nums">{pct(item.late_pct)}</strong><span className="hidden text-right text-xs text-muted-foreground sm:block">{number.format(item.n)} pedidos</span></div>)}</div></CardContent></Card>
        <Card><CardHeader><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Evolución</p><CardTitle className="flex items-center gap-2 text-xl"><CalendarDays className="size-5 text-muted-foreground" />Por mes de compra</CardTitle></CardHeader><CardContent><div className="max-h-92 overflow-auto" tabIndex={0} aria-label="Tabla de entregas por mes"><Table><TableHeader><TableRow><TableHead>Mes</TableHead><TableHead>Pedidos</TableHead><TableHead className="text-right">Tardíos</TableHead></TableRow></TableHeader><TableBody>{data.months.map(item => <TableRow key={item.month}><TableCell className="font-medium">{item.month}</TableCell><TableCell>{number.format(item.n)}</TableCell><TableCell className="text-right"><Badge variant="secondary" className="tabular-nums">{pct(item.late_pct)}</Badge></TableCell></TableRow>)}</TableBody></Table></div></CardContent></Card>
      </section>

      <Card><CardContent className="flex flex-col gap-6 pt-6 md:flex-row md:items-center md:justify-between"><div><p className="mb-1 text-xs font-semibold uppercase tracking-wider text-primary">Segunda fuente · feriados nacionales 2018</p><h2 className="text-xl font-semibold tracking-tight">Compras en feriados</h2><p className="mt-1 max-w-xl text-sm text-muted-foreground">Comparación exploratoria por fecha de compra. No demuestra que el feriado cause retrasos.</p></div><div className="flex gap-8">{data.holiday.map(item => <div key={item.day_type} className="min-w-28"><p className="text-xs text-muted-foreground">{item.day_type}</p><strong className="text-2xl font-semibold tabular-nums">{item.n < 30 ? '—' : pct(item.late_pct)}</strong><p className="text-xs text-muted-foreground">{item.n < 30 ? `Muestra pequeña: ${number.format(item.n)} pedidos` : `${number.format(item.n)} pedidos`}</p></div>)}</div></CardContent></Card>
      <Separator /><p className="pb-5 text-xs leading-5 text-muted-foreground">Fuentes: Brazilian E-Commerce Public Dataset by Olist y Portaria n.º 468/2017 de Brasil. No se muestran identificadores ni ubicaciones precisas de clientes.</p>
    </main>
  </div>
}

function Metric({ icon, label, value, note }: { icon: React.ReactNode; label: string; value: string; note: string }) {
  return <Card><CardHeader className="pb-2"><CardDescription className="flex items-center gap-2 text-sm">{icon}{label}</CardDescription></CardHeader><CardContent><div className="text-3xl font-semibold tracking-tight tabular-nums">{value}</div><p className="mt-3 text-xs leading-5 text-muted-foreground">{note}</p></CardContent></Card>
}

export default App
