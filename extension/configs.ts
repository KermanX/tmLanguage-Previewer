import type { ConfigType } from 'reactive-vscode'
import { computed, defineConfigs } from 'reactive-vscode'
import { ViewColumn } from 'vscode'

const { autoStart, grammarExts, exampleSuffixes, previewColumn: previewColumnRaw } = defineConfigs('tmlanguage-previewer', {
  autoStart: Boolean,
  grammarExts: Object as ConfigType<Record<string, string>>,
  exampleSuffixes: Object as ConfigType<string[]>,
  previewColumn: Object as ConfigType<'active' | 'beside' | 'one' | 'two' | 'three'>,
})

export {
  autoStart,
  grammarExts,
  exampleSuffixes,
}

export const previewColumn = computed(() => {
  switch (previewColumnRaw.value) {
    case 'active': return ViewColumn.Active
    case 'beside': return ViewColumn.Beside
    case 'one': return ViewColumn.One
    case 'two': return ViewColumn.Two
    case 'three': return ViewColumn.Three
  }
})
