import type { StyleValue } from 'vue'
import { defineComponent, h, type PropType } from 'vue'
import { useRuntimeComponent } from './runtime.js'

/**
 * The props Navirox promises on `FlatList`.
 *
 * Spelled the way the renderer spells them, so moving a template between the two
 * is a rename at most. Deliberately a subset of what the engine accepts: what is
 * declared here is what Navirox promises, and anything else a caller passes still
 * reaches the engine untouched.
 */
export interface FlatListProps<ItemT> {
  /** The items to render. */
  readonly data: readonly ItemT[]
  /** Stable key for an item. Falls back to the index, as the engine does. */
  readonly keyExtractor?: (item: ItemT, index: number) => string
  /** Render in a grid of this many columns instead of a single row. */
  readonly numColumns?: number
  /** Style for each row when `numColumns` is more than one. */
  readonly columnWrapperStyle?: StyleValue
}

/**
 * A virtualized list, as Navirox names it.
 *
 * A list virtualizes, so it owns state, so the renderer implements it as a
 * component rather than a tag and an app has to import it. This is that import:
 * our name, our props, resolved from the runtime at render time.
 *
 * Slots are passed straight through, so `item`, `separator`, `header`, `footer`
 * and `empty` mean what the engine documents, and events do too, because a
 * listener that is not declared as a prop travels in attrs like any other.
 */
export const FlatList = defineComponent({
  name: 'NaviroxFlatList',
  // Everything not named above belongs to the engine, and forwarding attrs is how
  // it gets there.
  inheritAttrs: false,
  props: {
    data: { type: Array as PropType<readonly unknown[]>, required: true },
    // `never`, not `unknown`, and it is the one deliberate subtlety in this file.
    // `defineComponent` cannot be generic, so `ItemT` cannot reach this signature;
    // `unknown` would then reject every extractor a consumer writes over their own
    // item type, because a function that accepts `unknown` has to be told what to
    // do with it. A parameter of `never` accepts all of them, which is what the
    // generic interface above promises.
    keyExtractor: {
      type: Function as PropType<(item: never, index: number) => string>,
      default: undefined,
    },
    numColumns: { type: Number, default: undefined },
    columnWrapperStyle: {
      type: [String, Object, Array] as PropType<StyleValue>,
      default: undefined,
    },
  },
  setup(props, { attrs, slots }) {
    const engine = useRuntimeComponent('flat-list')

    return () => h(engine, { ...props, ...attrs }, slots)
  },
})
