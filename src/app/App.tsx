import { RouterProvider } from 'react-router-dom'
import { AppProviders } from './providers'
import { router } from './router/router'
import { Prefetch } from './Prefetch'
import { Toaster } from '@/components/feedback/Toaster'
import { UpdatePrompt } from '@/components/feedback/UpdatePrompt'

export function App() {
  return (
    <AppProviders>
      <Prefetch />
      <RouterProvider router={router} />
      <Toaster />
      <UpdatePrompt />
    </AppProviders>
  )
}
