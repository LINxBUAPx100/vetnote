import { lazy, Suspense } from 'react'
import { Spinner } from '@/components/feedback/States'
import type { ComponentProps } from 'react'

// Carga diferida: html-to-image (pesado) solo se descarga al generar imagen.
const ClinicalNoteCard = lazy(() =>
  import('./ClinicalNoteCard').then((m) => ({ default: m.ClinicalNoteCard })),
)

export function LazyClinicalNoteCard(props: ComponentProps<typeof ClinicalNoteCard>) {
  return (
    <Suspense fallback={<Spinner className="mx-auto my-6" />}>
      <ClinicalNoteCard {...props} />
    </Suspense>
  )
}
