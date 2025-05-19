import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { RouterProvider } from 'react-router-dom';
import Router from '@/app/App';
import './styles/index.css';

async function enableMocking() {
  if (import.meta.env.MODE !== 'dev') {
    return;
  }

  const { worker } = await import('../mocks/browser');
  return worker.start();
}

// enableMocking().then(() => {
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <RouterProvider router={Router} />
  </StrictMode>,
);
// });
