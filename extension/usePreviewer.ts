import { Buffer } from 'node:buffer'
import type { EffectScope } from 'reactive-vscode'
import { effectScope, extensionContext, reactive, ref, shallowReactive, shallowRef, useDisposable, useDocumentText, useIsDarkTheme, watchEffect } from 'reactive-vscode'
import type { TextDocument, TextEditor, WebviewPanel } from 'vscode'
import { Uri, ViewColumn, window, workspace } from 'vscode'
import type { GrammarFile, TokensData } from '../types'
import { loadIndexHtml, logger } from './utils'
import { getTokenizer } from './getTokenizer'
import { findExampleFile } from './getExampleFile'
import { grammarExts, previewColumn } from './configs'
import { parsers } from './parsers'

const grammarUriToPanel = new WeakMap<Uri, WebviewPanel>()

export function usePreviewer(editor: TextEditor) {
  const grammarUri = editor.document.uri
  if (grammarUriToPanel.has(grammarUri)) {
    grammarUriToPanel.get(grammarUri)!.reveal()
    return
  }

  const grammarExt = Object.keys(grammarExts.value)
    .find(ext => grammarUri.fsPath.toLowerCase().endsWith(ext.toLowerCase())) ?? ''
  const parser = parsers[grammarExts.value[grammarExt] as keyof typeof parsers]

  if (!grammarExt || !parser) {
    window.showErrorMessage(`Unsupported file type for ${grammarUri.fsPath}. Supported file types: ${Object.keys(grammarExts.value).join(', ')}`)
    return
  }

  const panel = useDisposable(window.createWebviewPanel(
    'tmlanguage-previewer',
    'TmLanguage Previewer',
    {
      viewColumn: previewColumn.value,
      preserveFocus: true,
    },
    {
      enableScripts: true,
      localResourceRoots: [Uri.joinPath(extensionContext.value!.extensionUri, 'dist/webview')],
      retainContextWhenHidden: true,
    },
  ))
  grammarUriToPanel.set(grammarUri, panel)

  panel.iconPath = Uri.joinPath(extensionContext.value!.extensionUri, 'icon.png')

  loadIndexHtml(panel.webview)

  function postMessage(message: any) {
    // console.log('ext:postMessage', message)
    panel.webview.postMessage(message)
  }

  async function onReady() {
    logger.info(`Webview for ${grammarUri.toString()} ready.`)
    const exampleUris = shallowRef(await findExampleFile(grammarUri, grammarExt))
    const exampleUri = shallowRef<Uri | undefined>(exampleUris.value[0])
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
      [grammarUri.toString()]: {
        name: null,
        scope: null,
        path: workspace.asRelativePath(grammarUri),
        enabled: true,
      },
    })
    const grammarDocs: Record<string, TextDocument> = shallowReactive({
      [grammarUri.toString()]: editor.document,
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
      let cancelled = false
      onCleanup(() => {
        cancelled = true
      });
      (async () => {
        try {
          const grammars: any[] = []
          for (const uri in grammarFiles) {
            const doc = grammarDocs[uri]
            if (!doc)
              continue
            const g = await parser(doc.getText())
            if (cancelled)
              return
            if (g.name)
              grammarFiles[uri].name = g.name
            if (g.scopeName)
              grammarFiles[uri].scope = g.scopeName
            if (grammarFiles[uri].enabled)
              grammars.push(g)
          }
          const t = await getTokenizer(grammars, isDark.value)
          if (cancelled)
            return
          tokenizer.value = t
        }
        catch (e) {
          if (cancelled)
            return
          tokenizer.value = () => String(e)
        }
      })()
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
    grammarUriToPanel.delete(grammarUri)
    scope?.stop()
  })
}
