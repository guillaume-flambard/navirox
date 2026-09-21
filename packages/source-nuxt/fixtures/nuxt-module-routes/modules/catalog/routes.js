import path from 'path'

export const routes = [
  {
    path: '/catalog/:catalogId',
    file: path.resolve(__dirname, 'pages/catalog.vue'),
    children: [
      {
        path: 'items/:itemId',
        file: path.resolve(__dirname, 'pages/item.vue'),
      },
    ],
  },
]
