import { hydrateRoot } from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { createRouter } from './router';
import './styles/app.css';

const router = createRouter();

export default function Client() {
  return hydrateRoot(document, (
    <RouterProvider router={router} />
  ));
}