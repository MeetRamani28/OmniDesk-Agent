import React from 'react';
import type { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

/**
 * React Query Client Configuration
 * Manages caching, background fetching, and stale-while-revalidate logic for standard REST API endpoints.
 */
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // Prevents unnecessary re-fetching on tab switching
      retry: 2, // Auto-retry failed requests twice before throwing error to ErrorBoundary
      staleTime: 1000 * 60 * 5, // Cache data securely for 5 minutes by default
    },
  },
});

interface QueryProviderProps {
  children: ReactNode;
}

export const QueryProvider: React.FC<QueryProviderProps> = ({ children }) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};
