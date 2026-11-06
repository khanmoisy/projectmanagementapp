import { renderToPipeableStream } from 'react-dom/server';
import { RouterProvider } from '@tanstack/react-router';
import { createRouter } from './router';

export default function render(request: Request): Promise<Response> {
  const router = createRouter();

  return new Promise((resolve) => {
    const { pipe } = renderToPipeableStream(
      <RouterProvider router={router} />,
      {
        onAllReady() {
          const html = `<!DOCTYPE html><html><head><title>Management App</title></head><body><div id="root"></div></body></html>`;
          resolve(new Response(html, { headers: { 'Content-Type': 'text/html' } }));
        },
        onShellError() {
          resolve(new Response('Server Error', { status: 500 }));
        },
      }
    );
  });
}