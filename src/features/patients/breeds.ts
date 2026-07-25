/**
 * Catálogos de razas y colores para el formulario de paciente.
 * Se usan como sugerencias (datalist): el usuario puede elegir una o escribir
 * "a mano" cualquier valor. Para mestizos se pueden combinar dos razas.
 */
import type { Species } from '@/types/domain'

export const DOG_BREEDS: string[] = [
  'Mestizo / Criollo',
  'Labrador Retriever',
  'Golden Retriever',
  'Pastor Alemán',
  'Pastor Belga (Malinois)',
  'Pastor Australiano',
  'Border Collie',
  'Collie',
  'Bulldog Francés',
  'Bulldog Inglés',
  'Boxer',
  'Rottweiler',
  'Doberman',
  'Gran Danés',
  'San Bernardo',
  'Mastín',
  'Cane Corso',
  'Dogo Argentino',
  'Bull Terrier',
  'Pit Bull Terrier',
  'American Staffordshire Terrier',
  'Staffordshire Bull Terrier',
  'Poodle / Caniche',
  'Caniche Toy',
  'Bichón Frisé',
  'Bichón Maltés',
  'Shih Tzu',
  'Lhasa Apso',
  'Pekinés',
  'Pomerania (Spitz alemán)',
  'Chihuahua',
  'Pug / Carlino',
  'Boston Terrier',
  'Yorkshire Terrier',
  'Schnauzer Miniatura',
  'Schnauzer Estándar',
  'Schnauzer Gigante',
  'Beagle',
  'Basset Hound',
  'Dálmata',
  'Dachshund / Salchicha',
  'Cocker Spaniel',
  'Springer Spaniel',
  'Setter Irlandés',
  'Pointer',
  'Braco',
  'Weimaraner',
  'Husky Siberiano',
  'Alaskan Malamute',
  'Samoyedo',
  'Akita',
  'Shiba Inu',
  'Chow Chow',
  'Shar Pei',
  'Basenji',
  'Galgo',
  'Whippet',
  'Jack Russell Terrier',
  'Fox Terrier',
  'West Highland White Terrier',
  'Scottish Terrier',
  'Welsh Corgi',
  'Terranova',
  'Gran Pirineo',
  'Bernés de la Montaña',
  'Rhodesian Ridgeback',
  'Xoloitzcuintle',
  'Otro',
]

export const CAT_BREEDS: string[] = [
  'Mestizo / Criollo',
  'Doméstico de Pelo Corto',
  'Doméstico de Pelo Largo',
  'Americano de Pelo Corto',
  'Europeo Común',
  'Persa',
  'Himalayo',
  'Exótico de Pelo Corto',
  'Siamés',
  'Balinés',
  'Oriental',
  'Ragdoll',
  'Maine Coon',
  'Bosque de Noruega',
  'Bengalí',
  'Sphynx',
  'British Shorthair',
  'Scottish Fold',
  'Angora Turco',
  'Abisinio',
  'Somalí',
  'Azul Ruso',
  'Chartreux',
  'Bombay',
  'Burmés',
  'Birmano (Sagrado de Birmania)',
  'Tonkinés',
  'Devon Rex',
  'Cornish Rex',
  'Selkirk Rex',
  'Ocicat',
  'Manx',
  'Savannah',
  'Munchkin',
  'Snowshoe',
  'Otro',
]

export const COLORS: string[] = [
  'Negro',
  'Blanco',
  'Gris',
  'Café',
  'Chocolate',
  'Dorado',
  'Amarillo',
  'Crema',
  'Beige',
  'Canela',
  'Naranja / Rojizo',
  'Atigrado',
  'Bicolor',
  'Tricolor',
  'Blanco y negro',
  'Café y blanco',
  'Negro y fuego',
  'Carey',
  'Calicó',
  'Manchado',
  'Arlequín',
  'Merle',
  'Plateado',
  'Azul (grisáceo)',
]

/** Lista de razas sugeridas según la especie. */
export function breedsForSpecies(species?: Species): string[] {
  if (species === 'felino') return CAT_BREEDS
  if (species === 'canino') return DOG_BREEDS
  return []
}

const SEP = ' × '

/** Separa un string de raza en principal y secundaria (mestizos). */
export function splitBreed(value?: string | null): [string, string] {
  const s = String(value ?? '').trim()
  if (!s) return ['', '']
  const parts = s.split(/\s*[×x\/]\s*/i).filter(Boolean)
  return [parts[0] ?? '', parts[1] ?? '']
}

/** Combina raza principal y secundaria en un solo string. */
export function joinBreed(primary: string, secondary: string): string {
  const p = primary.trim()
  const s = secondary.trim()
  if (p && s) return `${p}${SEP}${s}`
  return p || s
}
