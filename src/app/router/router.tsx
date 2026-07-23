import { createHashRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { RouteError } from '@/components/feedback/RouteError'
import { DashboardPage } from '@/features/dashboard/DashboardPage'
import { PatientsListPage } from '@/features/patients/PatientsListPage'
import { PatientFormPage } from '@/features/patients/PatientFormPage'
import { PatientDetailPage } from '@/features/patients/PatientDetailPage'
import { OwnerEditPage } from '@/features/owners/OwnerEditPage'
import { OwnersListPage } from '@/features/owners/OwnersListPage'
import { OwnerDetailPage } from '@/features/owners/OwnerDetailPage'
import { MedicationEditPage } from '@/features/medications/MedicationEditPage'
import { MorePage } from '@/features/dashboard/MorePage'
import { ConsultationWizardPage } from '@/features/consultations/ConsultationWizardPage'
import { ConsultationsListPage } from '@/features/consultations/ConsultationsListPage'
import { ConsultationDetailPage } from '@/features/consultations/ConsultationDetailPage'
import { ConsultationEditPage } from '@/features/consultations/ConsultationEditPage'
import { TemplatesPage } from '@/features/templates/TemplatesPage'
import { TemplateEditPage } from '@/features/templates/TemplateEditPage'
import { MedicationsPage } from '@/features/medications/MedicationsPage'
import { SettingsPage } from '@/features/settings/SettingsPage'

/**
 * HashRouter: máxima compatibilidad con GitHub Pages sin reglas de reescritura
 * en el servidor (ver docs/01-arquitectura.md).
 */
export const router = createHashRouter([
  {
    path: '/',
    element: <AppShell />,
    errorElement: <RouteError />,
    children: [
      { index: true, element: <DashboardPage /> },
      { path: 'patients', element: <PatientsListPage /> },
      { path: 'patients/new', element: <PatientFormPage /> },
      { path: 'patients/:patientId', element: <PatientDetailPage /> },
      { path: 'patients/:patientId/edit', element: <PatientFormPage /> },
      { path: 'owners', element: <OwnersListPage /> },
      { path: 'owners/:ownerId', element: <OwnerDetailPage /> },
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
      { path: 'medications/new', element: <MedicationEditPage /> },
      { path: 'medications/:medicationId/edit', element: <MedicationEditPage /> },
      { path: 'more', element: <MorePage /> },
      { path: 'sync', element: <Navigate to="/settings" replace /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: '*', element: <Navigate to="/" replace /> },
    ],
  },
])
