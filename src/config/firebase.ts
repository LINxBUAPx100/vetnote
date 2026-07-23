import { initializeApp } from 'firebase/app'
import {
  initializeFirestore,
  persistentLocalCache,
  persistentMultipleTabManager,
} from 'firebase/firestore'

/**
 * Configuración de Firebase (proyecto "vetnote").
 *
 * Estos valores son PÚBLICOS por diseño: identifican el proyecto en el cliente,
 * no son credenciales secretas. La protección real vive en las Reglas de
 * Firestore (consola de Firebase).
 *
 * ⚠️ SEGURIDAD: por decisión del usuario, las reglas de Firestore están ABIERTAS
 * (cualquiera con esta config puede leer y escribir). Para cerrarlo en el futuro
 * basta con cambiar las reglas en la consola y añadir autenticación; el código de
 * datos ya quedó preparado para ello.
 */
const firebaseConfig = {
  apiKey: 'AIzaSyBFuISkFlkLuS6CcL9QEt42zAbrnR2iyZ0',
  authDomain: 'vetnote-6e6fd.firebaseapp.com',
  projectId: 'vetnote-6e6fd',
  storageBucket: 'vetnote-6e6fd.firebasestorage.app',
  messagingSenderId: '175834472191',
  appId: '1:175834472191:web:c914a32b3b4cce79e1f6ca',
}

const app = initializeApp(firebaseConfig)

/**
 * Firestore con caché persistente en IndexedDB: la app funciona offline y
 * sincroniza sola al recuperar conexión (sustituye a la cola de sync manual).
 */
export const firestore = initializeFirestore(app, {
  localCache: persistentLocalCache({ tabManager: persistentMultipleTabManager() }),
})
