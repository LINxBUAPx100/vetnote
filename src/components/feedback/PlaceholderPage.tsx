import { Construction } from 'lucide-react'

/** Página temporal para rutas cuya funcionalidad llega en fases posteriores. */
export function PlaceholderPage({ title, phase }: { title: string; phase: string }) {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-background text-primary">
        <Construction className="h-7 w-7" />
      </div>
      <h1 className="text-lg font-semibold">{title}</h1>
      <p className="max-w-xs text-sm text-content-muted">
        Esta sección se implementa en <span className="font-medium text-content">{phase}</span> del
        roadmap.
      </p>
    </div>
  )
}
