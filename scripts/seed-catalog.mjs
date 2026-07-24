/**
 * Sembrado único del catálogo: plantillas de consulta y medicamentos de uso
 * común para la doctora. Idempotente: omite los que ya existan por nombre.
 *
 * Uso:  node scripts/seed-catalog.mjs
 */
import { initializeApp } from 'firebase/app'
import {
  getFirestore,
  collection,
  getDocs,
  doc,
  setDoc,
} from 'firebase/firestore'

const firebaseConfig = {
  apiKey: 'AIzaSyBFuISkFlkLuS6CcL9QEt42zAbrnR2iyZ0',
  authDomain: 'vetnote-6e6fd.firebaseapp.com',
  projectId: 'vetnote-6e6fd',
  storageBucket: 'vetnote-6e6fd.firebasestorage.app',
  messagingSenderId: '175834472191',
  appId: '1:175834472191:web:c914a32b3b4cce79e1f6ca',
}

const app = initializeApp(firebaseConfig)
const db = getFirestore(app)
const now = () => new Date().toISOString()
const uuid = () => crypto.randomUUID()
const norm = (v) => String(v ?? '').trim().toLowerCase()

const TEMPLATES = [
  {
    name: 'Consulta general / chequeo',
    category: 'Medicina general',
    reason: 'Chequeo general / control de salud.',
    remote_anamnesis: 'Vacunación y desparasitación: ___. Sin antecedentes relevantes.',
    current_anamnesis: 'Apetito, actitud, orina y heces sin cambios reportados.',
    head_neck: 'Mucosas rosadas, ojos y oídos sin secreción, linfonodos normales.',
    thorax_forelimbs: 'Auscultación cardiopulmonar normal, sin alteraciones.',
    abdomen_hindlimbs_anus_tail: 'Palpación abdominal no dolorosa, sin masas.',
    presumptive_diagnosis: 'Paciente clínicamente sano.',
    recommendations: 'Mantener plan de vacunación y desparasitación. Dieta balanceada.',
  },
  {
    name: 'Vacunación',
    category: 'Preventiva',
    reason: 'Aplicación de vacuna.',
    remote_anamnesis: 'Última vacuna: ___. Desparasitación vigente.',
    current_anamnesis: 'Paciente sin signos de enfermedad al momento de la aplicación.',
    thorax_forelimbs: 'Constantes dentro de parámetros normales; apto para vacunar.',
    presumptive_diagnosis: 'Paciente sano, apto para vacunación.',
    treatment: 'Se aplica vacuna correspondiente. Registrar lote y refuerzo en el carnet.',
    recommendations:
      'Vigilar reacciones en las próximas 24-48 h. Evitar baño y ejercicio intenso 24 h. Próximo refuerzo según calendario.',
  },
  {
    name: 'Desparasitación',
    category: 'Preventiva',
    reason: 'Desparasitación interna / externa.',
    remote_anamnesis: 'Última desparasitación: ___.',
    current_anamnesis: 'Sin signos digestivos; peso actual registrado.',
    presumptive_diagnosis: 'Control antiparasitario.',
    treatment: 'Antiparasitario según peso. Registrar producto y próxima dosis en el carnet.',
    recommendations: 'Repetir según protocolo. Mantener ambiente limpio.',
  },
  {
    name: 'Dermatología: prurito / otitis',
    category: 'Dermatología',
    reason: 'Prurito, descamación y/o secreción ótica.',
    remote_anamnesis: 'Cuadros dérmicos previos, alergias o dieta: ___.',
    current_anamnesis: 'Rascado, alopecia, eritema; tiempo de evolución ___.',
    head_neck: 'Pabellones auriculares: eritema/secreción ___. Otoscopía: ___.',
    thorax_forelimbs: 'Piel con ___ (descamación / costras / eritema).',
    additional_exam: 'Se sugiere citología / raspado cutáneo según hallazgos.',
    presumptive_diagnosis: 'Dermatitis / otitis (pendiente etiología).',
    recommendations:
      'Limpieza ótica indicada, evitar rascado, control en ___ días. Dieta hipoalergénica si se sospecha alergia alimentaria.',
  },
  {
    name: 'Gastroenteritis (vómito / diarrea)',
    category: 'Gastroenterología',
    reason: 'Vómito y/o diarrea.',
    remote_anamnesis: 'Cambios de dieta, acceso a basura o cuerpos extraños: ___.',
    current_anamnesis: 'Frecuencia de vómito/diarrea, presencia de sangre, apetito e hidratación.',
    abdomen_hindlimbs_anus_tail: 'Palpación abdominal: ___. Dolor: ___.',
    presumptive_diagnosis: 'Gastroenteritis aguda.',
    recommendations:
      'Dieta blanda fraccionada, hidratación, vigilar signos de alarma. Control si no mejora en 24-48 h.',
  },
  {
    name: 'Control post-operatorio',
    category: 'Cirugía',
    reason: 'Revisión post-quirúrgica.',
    remote_anamnesis: 'Procedimiento realizado: ___. Fecha: ___.',
    current_anamnesis: 'Apetito, actitud, dolor y aspecto de la herida.',
    additional_exam: 'Herida quirúrgica: ___ (sin secreción / con inflamación).',
    presumptive_diagnosis: 'Evolución post-operatoria ___.',
    recommendations:
      'Mantener collar isabelino, curación indicada, reposo. Retiro de puntos en ___ días.',
  },
]

const MEDICATIONS = [
  { generic_name: 'Carprofeno', commercial_name: 'Rimadyl', presentation: 'Tableta / inyectable', concentration: '25/50/100 mg', route: 'VO / SC', default_instructions: 'AINE. No combinar con otros AINE ni corticoides.' },
  { generic_name: 'Amoxicilina + ác. clavulánico', commercial_name: 'Synulox', presentation: 'Tableta / suspensión', concentration: '250/500 mg', route: 'VO', default_instructions: 'Antibiótico. Administrar con alimento; completar el tratamiento.' },
  { generic_name: 'Cefalexina', commercial_name: 'Rilexine', presentation: 'Tableta', concentration: '300/600 mg', route: 'VO', default_instructions: 'Antibiótico. Útil en piel y tejidos blandos.' },
  { generic_name: 'Enrofloxacina', commercial_name: 'Baytril', presentation: 'Tableta / inyectable', concentration: '50 mg', route: 'VO / SC', default_instructions: 'Antibiótico. Evitar en pacientes en crecimiento.' },
  { generic_name: 'Metronidazol', commercial_name: 'Flagyl', presentation: 'Tableta', concentration: '250/500 mg', route: 'VO', default_instructions: 'Antibiótico/antiprotozoario. Útil en diarreas.' },
  { generic_name: 'Maropitant', commercial_name: 'Cerenia', presentation: 'Tableta / inyectable', concentration: '16 mg / 10 mg/ml', route: 'VO / SC', default_instructions: 'Antiemético. Una vez al día.' },
  { generic_name: 'Omeprazol', commercial_name: 'Omeprazol', presentation: 'Cápsula', concentration: '10/20 mg', route: 'VO', default_instructions: 'Protector gástrico. En ayuno.' },
  { generic_name: 'Prednisolona', commercial_name: 'Prednisolona', presentation: 'Tableta', concentration: '5/20 mg', route: 'VO', default_instructions: 'Corticoide. Reducir dosis de forma gradual.' },
  { generic_name: 'Dexametasona', commercial_name: 'Dexametasona', presentation: 'Inyectable', concentration: '2 mg/ml', route: 'IM / IV / SC', default_instructions: 'Corticoide/antiinflamatorio.' },
  { generic_name: 'Ivermectina', commercial_name: 'Ivomec', presentation: 'Inyectable / solución', concentration: '1%', route: 'SC / VO', default_instructions: 'Antiparasitario. PRECAUCIÓN en razas colie (MDR1).' },
  { generic_name: 'Praziquantel + Pirantel', commercial_name: 'Drontal', presentation: 'Tableta', concentration: 'según peso', route: 'VO', default_instructions: 'Desparasitante interno de amplio espectro.' },
  { generic_name: 'Metamizol (dipirona)', commercial_name: 'Dipirona', presentation: 'Inyectable', concentration: '500 mg/ml', route: 'IV lento / IM', default_instructions: 'Analgésico/antipirético.' },
  { generic_name: 'Gabapentina', commercial_name: 'Gabapentina', presentation: 'Cápsula', concentration: '100/300 mg', route: 'VO', default_instructions: 'Analgésico neuropático / ansiolítico leve.' },
  { generic_name: 'Tramadol', commercial_name: 'Tramadol', presentation: 'Tableta / gotas', concentration: '50 mg', route: 'VO', default_instructions: 'Analgésico opioide para dolor moderado.' },
  { generic_name: 'Clorfenamina', commercial_name: 'Clorfenamina', presentation: 'Tableta / inyectable', concentration: '4 mg / 10 mg/ml', route: 'VO / IM', default_instructions: 'Antihistamínico.' },
]

async function existingNames(col, field) {
  const snap = await getDocs(collection(db, col))
  const set = new Set()
  snap.forEach((d) => {
    const data = d.data()
    if (data && data.status !== 'deleted') set.add(norm(data[field]))
  })
  return set
}

async function main() {
  const [tplNames, medNames] = await Promise.all([
    existingNames('templates', 'name'),
    existingNames('medications', 'generic_name'),
  ])

  let tplAdded = 0
  for (const tpl of TEMPLATES) {
    if (tplNames.has(norm(tpl.name))) continue
    const id = uuid()
    await setDoc(doc(db, 'templates', id), {
      ...tpl,
      template_id: id,
      created_at: now(),
      updated_at: now(),
      status: 'active',
    })
    tplAdded++
    console.log('  + plantilla:', tpl.name)
  }

  let medAdded = 0
  for (const med of MEDICATIONS) {
    if (medNames.has(norm(med.generic_name))) {
      console.log('  = existe medicamento:', med.generic_name)
      continue
    }
    const id = uuid()
    await setDoc(doc(db, 'medications', id), {
      ...med,
      medication_id: id,
      created_at: now(),
      updated_at: now(),
      status: 'active',
    })
    medAdded++
    console.log('  + medicamento:', med.generic_name)
  }

  console.log(`\nListo. Plantillas nuevas: ${tplAdded}. Medicamentos nuevos: ${medAdded}.`)
  process.exit(0)
}

main().catch((e) => {
  console.error('Error al sembrar:', e)
  process.exit(1)
})
