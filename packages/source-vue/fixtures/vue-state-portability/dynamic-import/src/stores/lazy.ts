import { defineStore } from 'pinia'

const loadRemote = () => import('./remote')

export const useLazyStore = defineStore('lazy', () => ({ loadRemote }))
