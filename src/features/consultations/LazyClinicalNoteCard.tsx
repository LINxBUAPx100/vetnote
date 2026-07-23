import { Suspense, type ComponentProps } from 'react'
import { Spinner } from '@/components/feedback/States'
import { lazyWithRetry } from '@/lib/lazyWithRetry'
import type { ClinicalNoteCard as ClinicalNoteCardType } from './ClinicalNoteCard'

// Carga diferida: html-to-image (pesado) solo se descarga al generar imagen.
// lazyWithRetry recarga la página si el chunk quedó obsoleto tras un despliegue.
const ClinicalNoteCard = lazyWithRetry(
  () => import('./ClinicalNoteCard').then((m) => ({ default: m.ClinicalNoteCard })),
  'clinical-note-card',
)

export function LazyClinicalNoteCard(props: ComponentProps<typeof ClinicalNoteCardType>) {
  return (
    <Suspense fallback={<Spinner className="mx-auto my-6" />}>
      <ClinicalNoteCard {...props} />
    </Suspense>
  )
}
