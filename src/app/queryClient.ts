import { QueryClient } from '@tanstack/react-query'
import { ApiClientError } from '@/types/api'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60_000,
      gcTime: 5 * 60_000,
      retry: (failureCount, error) => {
        // No reintentar errores de negocio; sí errores de red (máx. 2).
        if (error instanceof ApiClientError) {
          return error.code === 'NETWORK_ERROR' && failureCount < 2
        }
        return failureCount < 2
      },
      refetchOnWindowFocus: false,
    },
  },
})
