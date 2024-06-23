import { ref, shallowRef } from 'vue'

export const grammarFiles = shallowRef<Record<string, string> | null>(null)
export const examplePath = ref<string | null>(null)

declare const acquireVsCodeApi: () => any
export const vscode = acquireVsCodeApi()

export function openGrammarFile() {
  vscode.postMessage({ type: 'ui:open-grammar-file' })
}

export function openExampleFile() {
  vscode.postMessage({ type: 'ui:open-example-file' })
}

export function chooseExampleFile() {
  vscode.postMessage({ type: 'ui:choose-example-file' })
}
