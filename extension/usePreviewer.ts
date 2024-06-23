import { Buffer } from 'node:buffer'
import { effectScope, extensionContext, shallowRef, useDisposable, useDocumentText, useIsDarkTheme, watchEffect } from 'reactive-vscode'
import type { TextDocument, TextEditor, WebviewPanel } from 'vscode'
import { Uri, ViewColumn, window, workspace } from 'vscode'
import { loadIndexHtml, logger } from './utils'
import { getTokenizer } from './getTokenizer'
import { getExampleFile } from './getExampleFile'

const editorToPanel = new WeakMap<TextEditor, WebviewPanel>()

export function usePreviewer(editor: TextEditor) {
  if (editorToPanel.has(editor)) {
    editorToPanel.get(editor)!.reveal(ViewColumn.Beside)
    return
  }

  const panel = useDisposable(window.createWebviewPanel(
    'tmlanguage-previewer',
    'TmLanguage Previewer',
    {
      viewColumn: ViewColumn.Beside,
      preserveFocus: true,
    },
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

  async function onReady() {
    logger.info('Webview ready')

    const exampleUri = shallowRef(await getExampleFile(editor.document.uri))
    const exampleDoc = shallowRef<TextDocument>()
    watchEffect(() => {
      const uri = exampleUri.value
      if (uri)
        workspace.openTextDocument(uri).then(d => exampleDoc.value = d)
    })
    const exampleCode = useDocumentText(exampleDoc)
    const isDark = useIsDarkTheme()

    watchEffect(() => {
      panel.webview.postMessage({
        type: 'ext:update-theme',
        isDark: isDark.value,
      })
    })

    const grammarText = useDocumentText(editor.document)
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
      getTokenizer(grammarText.value!, isDark.value).then((t) => {
        if (cancelled)
          return
        clearTimeout(timer)
        tokenizer.value = t
      })
    })

    watchEffect(() => {
      if (tokenizer.value && exampleCode.value && exampleUri.value) {
        panel.webview.postMessage({
          type: 'ext:update-tokens',
          tokens: tokenizer.value[1](exampleCode.value),
          code: exampleCode.value,
          grammarFiles: {
            [tokenizer.value[0]]: workspace.asRelativePath(editor.document.uri),
          },
          examplePath: workspace.asRelativePath(exampleUri.value),
        })
      }
    })

    let writeExampleTimer: NodeJS.Timeout | null = null
    panel.webview.onDidReceiveMessage((message) => {
      if (message.type === 'ui:update-example') {
        exampleCode.value = message.code
        const uri = exampleUri.value
        if (uri) {
          if (writeExampleTimer)
            clearTimeout(writeExampleTimer)
          writeExampleTimer = setTimeout(async () => {
            await workspace.fs.writeFile(uri, Buffer.from(message.code))
          }, 500)
        }
      }
      else if (message.type === 'ui:open-grammar-file') {
        window.showTextDocument(editor.document)
      }
      else if (message.type === 'ui:open-example-file') {
        if (exampleDoc.value)
          window.showTextDocument(exampleDoc.value)
      }
      else if (message.type === 'ui:choose-example-file') {
        window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          defaultUri: exampleUri.value,
        }).then((uris) => {
          const uri = uris?.[0]
          if (uri) {
            exampleUri.value = uri
          }
        })
      }
    })
  }

  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === 'ui:ready')
      scope.run(onReady)
  })

  panel.onDidDispose(() => {
    editorToPanel.delete(editor)
    scope.stop()
  })
}
