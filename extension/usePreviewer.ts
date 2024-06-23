import { Buffer } from 'node:buffer'
import type { EffectScope } from 'reactive-vscode'
import { effectScope, extensionContext, reactive, ref, shallowReactive, shallowRef, useDisposable, useDocumentText, useIsDarkTheme, watchEffect } from 'reactive-vscode'
import type { TextDocument, TextEditor, WebviewPanel } from 'vscode'
import { Uri, ViewColumn, window, workspace } from 'vscode'
import type { GrammarFile, TokensData } from '../types'
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

  function postMessage(message: any) {
    // console.log('ext:postMessage', message)
    panel.webview.postMessage(message)
  }

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
    const exampleLang = ref<string | null>(null)
    const isDark = useIsDarkTheme()

    const grammarFiles: Record<string, GrammarFile> = reactive({
      [editor.document.uri.toString()]: {
        name: null,
        scope: null,
        path: workspace.asRelativePath(editor.document.uri),
        enabled: true,
      },
    })
    const grammarDocs: Record<string, TextDocument> = shallowReactive({
      [editor.document.uri.toString()]: editor.document,
    })
    const forceUpdateGrammars = ref(0)

    watchEffect(() => {
      postMessage({
        type: 'ext:update-theme',
        isDark: isDark.value,
      })
    })

    const tokenizer = shallowRef<((code: string, lang: string) => TokensData) | null>(null)
    watchEffect((onCleanup) => {
      // eslint-disable-next-line no-unused-expressions
      forceUpdateGrammars.value
      const timer = setTimeout(() => {
        tokenizer.value = null
      }, 1000)
      let cancelled = false
      onCleanup(() => {
        cancelled = true
        clearTimeout(timer)
      })
      try {
        const grammars: any[] = []
        for (const uri in grammarFiles) {
          const doc = grammarDocs[uri]
          if (!doc)
            continue
          const g = JSON.parse(doc.getText())
          if (g.name)
            grammarFiles[uri].name = g.name
          if (g.scopeName)
            grammarFiles[uri].scope = g.scopeName
          if (grammarFiles[uri].enabled)
            grammars.push(g)
        }
        getTokenizer(grammars, isDark.value).then((t) => {
          if (cancelled)
            return
          clearTimeout(timer)
          tokenizer.value = t
        })
      }
      catch (e) {
        clearTimeout(timer)
        tokenizer.value = () => String(e)
      }
    })

    useDisposable(workspace.onDidOpenTextDocument((doc) => {
      if (grammarFiles[doc.uri.toString()])
        forceUpdateGrammars.value++
    }))

    watchEffect(() => {
      if (tokenizer.value && exampleCode.value && exampleUri.value) {
        postMessage({
          type: 'ext:update-tokens',
          tokens: tokenizer.value(exampleCode.value, exampleLang.value || grammarFiles[editor.document.uri.toString()].name || 'plaintext'),
          code: exampleCode.value,
          grammarFiles: { ...grammarFiles },
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
      else if (message.type === 'ui:add-grammar') {
        window.showOpenDialog({
          canSelectFiles: true,
          canSelectFolders: false,
          canSelectMany: false,
          defaultUri: exampleUri.value,
          filters: {
            'TmLanguage JSON': ['json'],
          },
        }).then(async (uris) => {
          if (uris) {
            for (const uri of uris) {
              const doc = await workspace.openTextDocument(uri)
              grammarFiles[uri.toString()] = {
                name: null,
                scope: null,
                path: workspace.asRelativePath(uri),
                enabled: true,
              }
              grammarDocs[uri.toString()] = doc
            }
          }
        })
      }
      else if (message.type === 'ui:remove-grammar') {
        const uri = message.uri
        delete grammarFiles[uri]
        delete grammarDocs[uri]
      }
      else if (message.type === 'ui:toggle-grammar') {
        const uri = message.uri
        if (grammarFiles[uri])
          grammarFiles[uri].enabled = message.enabled
      }
    })
  }

  let scope: EffectScope | null = null
  panel.webview.onDidReceiveMessage((message) => {
    if (message.type === 'ui:ready') {
      scope?.stop()
      scope = effectScope()
      scope.run(onReady)
    }
  })

  panel.onDidDispose(() => {
    editorToPanel.delete(editor)
    scope?.stop()
  })
}
