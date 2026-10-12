import { defineStore } from 'pinia'
import { helper } from './helper'

export const useRelativeStore = defineStore('relative', () => ({ helper }))
