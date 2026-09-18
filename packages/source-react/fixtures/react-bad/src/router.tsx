export const routes = [
  { path: '', element: Home },
  {
    path: 'admin',
    children: [{ path: 'users', element: Users }],
  },
  { path: 'reports', lazy: () => import('./reports') },
]
