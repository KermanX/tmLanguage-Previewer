import { effectScope, extensionContext, ref, shallowRef, useDisposable, useDocumentText, useIsDarkTheme, watchEffect } from 'reactive-vscode'
import type { TextEditor, WebviewPanel } from 'vscode'
import { Uri, ViewColumn, window } from 'vscode'
import { loadIndexHtml, logger } from './utils'
import { getTokenizer } from './getTokenizer'

const editorToPanel = new WeakMap<TextEditor, WebviewPanel>()

export function usePreviewer(editor: TextEditor) {
  if (editorToPanel.has(editor)) {
    editorToPanel.get(editor)!.reveal(ViewColumn.Beside)
    return
  }

  const panel = useDisposable(window.createWebviewPanel(
    'tmlanguage-previewer',
    'TmLanguage Previewer',
    ViewColumn.Beside,
    {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(extensionContext.value!.extensionUri, 'dist/webview')],
      retainContextWhenHidden: true,
    },
  ))
  editorToPanel.set(editor, panel)

  panel.iconPath = Uri.joinPath(extensionContext.value!.extensionUri, 'icon.png')

  loadIndexHtml(panel.webview)

  const scope = effectScope()

  function onReady() {
    logger.info('Webview ready')

    const exampleCode = ref(`import {a as b} from 'c'`)

    const isDark = useIsDarkTheme()
    watchEffect(() => {
      panel.webview.postMessage({
        type: 'update-theme',
        isDark: isDark.value,
      })

      panel.webview.postMessage({
        type: 'update-example',
        example: exampleCode,
      })
    })

    const text = useDocumentText(editor.document)
    const tokenizer = shallowRef<Awaited<ReturnType<typeof getTokenizer>> | null>(null)
    watchEffect((onCleanup) => {
      const timer = setTimeout(() => {
        tokenizer.value = null
      }, 1000)
      let cancelled = false
      onCleanup(() => {
        cancelled = true
        clearTimeout(timer)
      })
      getTokenizer(text.value!, isDark.value).then((t) => {
        if (cancelled)
          return
        clearTimeout(timer)
        tokenizer.value = t
      })
    })

    watchEffect(() => {
      tokenizer.value && panel.webview.postMessage({
        type: 'update-tokens',
        tokens: tokenizer.value(exampleCode.value),
        code: exampleCode.value,
      })
    })

    panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'ui-update-example')
        exampleCode.value = message.code
    })
  }

  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === 'ui-ready')
      scope.run(onReady)
  })

  panel.onDidDispose(() => {
    editorToPanel.delete(editor)
    scope.stop()
  })
}
