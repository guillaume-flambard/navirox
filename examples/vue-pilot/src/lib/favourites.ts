/**
 * Hand-written replacement for `pilots/vue-web/src/lib/favourites.ts`.
 *
 * The web version read and wrote `window.localStorage`. The native API surface
 * exposes no generic key/value store, so the browser capability is adapted to the
 * secure store from @memolabs-apps/native, which is the closest thing the surface
 * actually has.
 *
 * The `Favourites` interface is kept exactly (`ids` a `Ref<number[]>`, `has` and
 * `toggle` synchronous), because that is the surface the migrated store calls
 * inline while it builds its computeds. The secure store is asynchronous, so the
 * read happens once behind a shared promise and fills `ids` when it lands, and
 * the write is fire-and-forget with its rejection swallowed: a keystore failure
 * is not something this screen can act on, and the in-memory value is already
 * correct.
 */

import { useSecureStore } from '@memolabs-apps/native';
import { ref, type Ref } from 'vue';

const STORAGE_KEY = 'navirox.pilot.favourites';

const ids = ref<number[]>([]);
let loading: Promise<void> | undefined;

export interface Favourites {
  ids: Ref<number[]>;
  has: (id: number) => boolean;
  toggle: (id: number) => void;
}

function parse(raw: string | null): number[] {
  if (raw === null) return [];

  try {
    const value: unknown = JSON.parse(raw);

    return Array.isArray(value)
      ? value.filter((entry): entry is number => typeof entry === 'number')
      : [];
  } catch {
    return [];
  }
}

export function useFavourites(): Favourites {
  const secureStore = useSecureStore();

  loading ??= secureStore
    .getItem(STORAGE_KEY)
    .then(raw => {
      ids.value = parse(raw);
    })
    .catch(() => {
      ids.value = [];
    });

  function has(id: number): boolean {
    return ids.value.includes(id);
  }

  function toggle(id: number): void {
    ids.value = has(id)
      ? ids.value.filter(entry => entry !== id)
      : [...ids.value, id];

    void secureStore
      .setItem(STORAGE_KEY, JSON.stringify(ids.value))
      .catch(() => undefined);
  }

  return { ids, has, toggle };
}
