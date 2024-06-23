import type { ThemedToken } from 'shiki'

export type TokensData = ThemedToken[][] | string

export interface GrammarFile {
  name: string | null
  scope: string | null
  path: string
  enabled: boolean
}
