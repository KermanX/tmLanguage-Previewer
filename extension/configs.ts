import type { ConfigType } from 'reactive-vscode'
import { computed, defineConfigs } from 'reactive-vscode'
import { ViewColumn } from 'vscode'

const { autoStart, previewColumn: previewColumnRaw } = defineConfigs('tmlanguage-previewer', {
  autoStart: Boolean,
  previewColumn: Object as ConfigType<'active' | 'beside' | 'one' | 'two' | 'three'>,
})

export {
  autoStart,
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
