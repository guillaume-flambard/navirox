import { ref, type Ref } from 'vue'

const STORAGE_KEY = 'navirox.pilot.favourites'

function read(): number[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    return raw ? (JSON.parse(raw) as number[]) : []
  } catch {
    return []
  }
}

const ids = ref<number[]>(read())

export interface Favourites {
  ids: Ref<number[]>
  has: (id: number) => boolean
  toggle: (id: number) => void
}

export function useFavourites(): Favourites {
  function persist() {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(ids.value))
    } catch {
      // storage unavailable (private mode); keep the in-memory value
    }
  }

  function has(id: number): boolean {
    return ids.value.includes(id)
  }

  function toggle(id: number): void {
    ids.value = has(id) ? ids.value.filter((value) => value !== id) : [...ids.value, id]
    persist()
  }

  return { ids, has, toggle }
}
