export type RegionStatus = 'unvisited' | 'visited' | 'lived' | 'home'

export const STATUS_CYCLE: RegionStatus[] = ['unvisited', 'visited', 'lived']

export const DEFAULT_COLORS: Record<Exclude<RegionStatus, 'unvisited'>, string> = {
  visited: '#15a0b2',
  lived: '#D85A30',
  home: '#9B59B6',
}

export const UNVISITED_COLORS = {
  light: '#c8d8e0',
  dark: '#2a3a42',
}

export function nextStatus(current: RegionStatus): RegionStatus {
  if (current === 'home') return 'unvisited'
  const idx = STATUS_CYCLE.indexOf(current)
  return STATUS_CYCLE[(idx + 1) % STATUS_CYCLE.length]
}

// Region ID helpers
export function countryId(numericId: string | number): string {
  return `c_${numericId}`
}

export function usStateId(numericId: string | number): string {
  return `us_${numericId}`
}

export function caProvinceId(hcA2: string): string {
  return `ca_${hcA2}`
}
