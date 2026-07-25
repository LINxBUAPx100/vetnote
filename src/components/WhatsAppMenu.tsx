import { useState } from 'react'
import { MessageCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/lib/cn'
import { useSettings } from '@/features/consultations/hooks'
import { phoneWithCountry, genderWord } from '@/utils/format'

interface Ctx {
  pet: string
  owner: string
  clinic: string
  /** Sexo de la mascota para elegir títulos en masculino/femenino. */
  sex?: string
}

/** Atajo: elige forma masculina/femenina según el sexo de la mascota. */
const g = (c: Ctx, masc: string, fem: string) => genderWord(c.sex, masc, fem)

interface MsgTemplate {
  label: string
  build: (c: Ctx) => string
}

/** Mensajes útiles para una veterinaria. Usan el nombre de mascota/tutor/clínica. */
const TEMPLATES: MsgTemplate[] = [
  {
    label: '🏥 Recibimos a la mascota',
    build: (c) =>
      `Hola ${c.owner}, le confirmamos que ${c.pet} ingresó a ${c.clinic} y ya está siendo ${g(c, 'atendido', 'atendida')}. Le mantendremos al tanto.`,
  },
  {
    label: '✅ Listo para dar de alta',
    build: (c) =>
      `Hola ${c.owner}, ${c.pet} ya está ${g(c, 'listo', 'lista')} para irse a casa. Puede pasar por ${g(c, 'él', 'ella')} cuando guste. ¡Le esperamos!`,
  },
  {
    label: '📅 Recordatorio de cita',
    build: (c) =>
      `Hola ${c.owner}, le recordamos la próxima cita de ${c.pet} en ${c.clinic}. ¿Nos confirma su asistencia?`,
  },
  {
    label: '💉 Recordatorio de vacuna',
    build: (c) =>
      `Hola ${c.owner}, ${c.pet} tiene pendiente su vacuna. ¿Le agendamos una cita en ${c.clinic}?`,
  },
  {
    label: '🪱 Recordatorio de desparasitación',
    build: (c) =>
      `Hola ${c.owner}, a ${c.pet} le toca su desparasitación. ¿Le agendamos una cita en ${c.clinic}?`,
  },
  {
    label: '🔬 Resultados listos',
    build: (c) =>
      `Hola ${c.owner}, ya tenemos los resultados de ${c.pet}. Con gusto se los explicamos, contáctenos cuando pueda.`,
  },
  {
    label: '❤️ Seguimiento post-consulta',
    build: (c) =>
      `Hola ${c.owner}, ¿cómo sigue ${c.pet} después de la consulta? Quedamos atentos a cualquier duda.`,
  },
  {
    label: '💬 Mensaje en blanco',
    build: () => '',
  },
]

/**
 * Botón de WhatsApp con una lista desplegable de mensajes de atención.
 * Al elegir uno abre WhatsApp con el texto precargado.
 */
export function WhatsAppMenu({
  phone,
  petName,
  petSex,
  ownerName,
  className,
}: {
  phone: string
  petName?: string
  petSex?: string
  ownerName?: string
  className?: string
}) {
  const [open, setOpen] = useState(false)
  const settings = useSettings()

  const ctx: Ctx = {
    pet: petName?.trim() || 'su mascota',
    owner: (ownerName?.trim().split(/\s+/)[0]) || 'estimado/a tutor/a',
    clinic: settings.data?.clinic_name?.trim() || 'la clínica',
    sex: petSex,
  }

  const send = (tpl: MsgTemplate) => {
    const text = tpl.build(ctx)
    const code = settings.data?.country_code?.replace(/\D/g, '') || '52'
    const waPhone = phoneWithCountry(phone, code)
    const url = `https://wa.me/${waPhone}${text ? `?text=${encodeURIComponent(text)}` : ''}`
    window.open(url, '_blank', 'noopener,noreferrer')
    setOpen(false)
  }

  return (
    <div className={cn('relative', className)}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="btn-ghost w-full px-3"
        aria-haspopup="menu"
        aria-expanded={open}
      >
        <MessageCircle className="h-4 w-4" strokeWidth={1.9} /> WhatsApp
        <ChevronDown
          className={cn('h-3.5 w-3.5 transition-transform duration-200', open && 'rotate-180')}
        />
      </button>

      {open && (
        <>
          {/* Fondo para cerrar al tocar fuera */}
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} aria-hidden />
          <div
            role="menu"
            className="absolute z-50 mt-1.5 max-h-80 w-72 max-w-[85vw] animate-slide-up overflow-auto rounded-xl border border-line bg-surface p-1 shadow-pop"
          >
            {TEMPLATES.map((tpl) => (
              <button
                key={tpl.label}
                type="button"
                role="menuitem"
                onClick={() => send(tpl)}
                className="flex w-full items-start gap-2 rounded-lg px-3 py-2 text-left text-sm text-content transition-colors duration-150 hover:bg-sunken hover:text-content-strong"
              >
                {tpl.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  )
}
