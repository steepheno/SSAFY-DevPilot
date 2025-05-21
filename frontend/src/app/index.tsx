import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import Router from '@/app/App';
import './styles/index.css';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

async function enableMocking() {
  if (import.meta.env.MODE !== 'dev') {
    return;
  }

  const { worker } = await import('../mocks/browser');
  return worker.start();
}

const queryClient = new QueryClient();

// enableMocking().then(() => {
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={Router} />
    </QueryClientProvider>
  </StrictMode>,
);
// });
