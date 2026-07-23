import { useCallback, useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { db } from '@/database/localDb'
import { consultationService } from '@/services/consultationService'
import { templateService, settingsService } from '@/services/catalogService'
import type { Consultation } from '@/types/domain'
import type { ConsultationForm } from '@/schemas'

export type DraftState = 'idle' | 'saving' | 'saved'

/** Autoguardado de borrador en IndexedDB. Devuelve estado y borrador inicial. */
export function useConsultationDraft(draftId: string) {
  const [state, setState] = useState<DraftState>('idle')
  const [initial, setInitial] = useState<Partial<ConsultationForm> | null>(null)
  const [ready, setReady] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout>>()

  useEffect(() => {
    let active = true
    db.drafts.get(draftId).then((d) => {
      if (active) {
        setInitial((d?.data as Partial<ConsultationForm>) ?? null)
        setReady(true)
      }
    })
    return () => {
      active = false
    }
  }, [draftId])

  const save = useCallback(
    (data: Partial<ConsultationForm>) => {
      setState('saving')
      clearTimeout(timer.current)
      timer.current = setTimeout(async () => {
        await db.drafts.put({ id: draftId, kind: 'consultation', data, updatedAt: Date.now() })
        setState('saved')
      }, 600)
    },
    [draftId],
  )

  const clear = useCallback(() => db.drafts.delete(draftId), [draftId])

  return { state, initial, ready, save, clear }
}

export function useTemplates() {
  return useQuery({ queryKey: ['templates'], queryFn: () => templateService.list(), staleTime: 300_000 })
}

export function useSettings() {
  return useQuery({ queryKey: ['settings'], queryFn: () => settingsService.get(), staleTime: 300_000 })
}

export function useConsultation(id: string | undefined) {
  return useQuery({
    queryKey: ['consultation', id],
    queryFn: () => consultationService.get(id!),
    enabled: Boolean(id),
  })
}

export function useRecentConsultations(limit = 15) {
  return useQuery({
    queryKey: ['consultations', 'recent', limit],
    queryFn: () => consultationService.listRecent(limit),
  })
}

/** Crea una consulta con soporte offline (cola de sincronización). */
export function useCreateConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: (payload: Partial<Consultation>) => consultationService.create(payload),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['consultations'] })
      qc.invalidateQueries({ queryKey: ['patient', data.patient_id, 'history'] })
    },
  })
}

export function useUpdateConsultation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: ({
      payload,
      expectedUpdatedAt,
    }: {
      payload: Partial<Consultation> & { consultation_id: string }
      expectedUpdatedAt?: string
    }) => consultationService.update(payload, expectedUpdatedAt),
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ['consultation', data.consultation_id] })
      qc.invalidateQueries({ queryKey: ['consultations'] })
    },
  })
}
