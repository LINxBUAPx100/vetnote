import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientsListPage } from '@/features/patients/PatientsListPage'
import { PatientFormPage } from '@/features/patients/PatientFormPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { OwnerEditPage } from '@/features/owners/OwnerEditPage'
import { ConsultationWizardPage } from '@/features/consultations/ConsultationWizardPage'
import { ConsultationsListPage } from '@/features/consultations/ConsultationsListPage'
import { ConsultationDetailPage } from '@/features/consultations/ConsultationDetailPage'
import { ConsultationEditPage } from '@/features/consultations/ConsultationEditPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'
import { TemplateEditPage } from '@/features/templates/TemplateEditPage'
import { MedicationsPage } from '@/features/medications/MedicationsPage'
import { SyncPage } from '@/features/sync/SyncPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

/**
 * HashRouter: máxima compatibilidad con GitHub Pages sin reglas de reescritura
 * en el servidor (ver docs/01-arquitectura.md).
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'patients', element: <PatientsListPage /> },
      { path: 'patients/new', element: <PatientFormPage /> },
      { path: 'patients/:patientId', element: <PatientDetailPage /> },
      { path: 'patients/:patientId/edit', element: <PatientFormPage /> },
      { path: 'owners/:ownerId/edit', element: <OwnerEditPage /> },
      { path: 'patients/:patientId/consultations/new', element: <ConsultationWizardPage /> },
      { path: 'consultations', element: <ConsultationsListPage /> },
      { path: 'consultations/new', element: <ConsultationWizardPage /> },
      { path: 'consultations/:consultationId', element: <ConsultationDetailPage /> },
      { path: 'consultations/:consultationId/edit', element: <ConsultationEditPage /> },
      { path: 'templates', element: <TemplatesPage /> },
      { path: 'templates/new', element: <TemplateEditPage /> },
      { path: 'templates/:templateId/edit', element: <TemplateEditPage /> },
      { path: 'medications', element: <MedicationsPage /> },
      { path: 'sync', element: <SyncPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
