import { defineStore } from 'pinia'

export const useRemoteStore = defineStore('remote', async () => {
  const response = await fetch('/api/remote')
  localStorage.setItem('remote', response)
  setTimeout(() => undefined, 10)
  return { response }
})
