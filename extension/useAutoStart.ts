import { useActiveTextEditor, watchEffect } from 'reactive-vscode'
import { autoStart } from './configs'
import { usePreviewer } from './usePreviewer'

export function useAutoStart() {
  const activeTextEditor = useActiveTextEditor()
  watchEffect(() => {
    if (!autoStart.value || !activeTextEditor.value)
      return
    const doc = activeTextEditor.value.document
    if (doc.languageId === 'json' && doc.uri.fsPath.toLowerCase().endsWith('.tmlanguage.json'))
      usePreviewer(activeTextEditor.value)
  })
}
