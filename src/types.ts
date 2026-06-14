export interface Tier {
  id: string
  name: string
}

export interface Item {
  id: string
  text: string
  hue: number
  tierId: string | null
}

export interface TierListState {
  title: string
  tiers: Tier[]
  items: Item[]
}
