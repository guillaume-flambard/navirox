import { extendPages } from '@nuxt/kit'
import { routes } from './routes'

export default defineNuxtModule({
  setup() {
    extendPages((pages) => {
      pages.push(...routes)
    })
  },
})
