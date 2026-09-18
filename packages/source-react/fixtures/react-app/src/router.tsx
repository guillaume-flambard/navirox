import { createBrowserRouter } from 'react-router-dom'

export const router = createBrowserRouter([
  { path: '/', element: <App /> },
  { path: 'about', element: <About /> },
  { path: 'blog/:slug', element: <Blog /> },
])
