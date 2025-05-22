import { setupServer } from 'msw/node';
import { handlers } from './handlers.tsx';

export const server = setupServer(...handlers);
