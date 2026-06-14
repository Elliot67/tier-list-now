declare module 'sortablejs' {
  export interface SortableEvent {
    item: HTMLElement
    from: HTMLElement
    to: HTMLElement
    oldIndex?: number
    newIndex?: number
  }

  export interface SortableGroup {
    name: string
    pull?: boolean | 'clone'
    put?: boolean
  }

  export interface SortableOptions {
    group?: string | SortableGroup
    animation?: number
    draggable?: string
    filter?: string
    forceFallback?: boolean
    fallbackClass?: string
    ghostClass?: string
    chosenClass?: string
    dragClass?: string
    onStart?: (evt: SortableEvent) => void
    onEnd?: (evt: SortableEvent) => void
  }

  export default class Sortable {
    constructor(el: HTMLElement, options?: SortableOptions)
    static create(el: HTMLElement, options?: SortableOptions): Sortable
    destroy(): void
  }
}
