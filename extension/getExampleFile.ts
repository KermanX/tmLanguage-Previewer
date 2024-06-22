import { basename } from 'node:path'
import { RelativePattern, Uri, workspace } from 'vscode'

export async function getExampleFile(grammarUri: Uri): Promise<Uri | undefined> {
  const maybeExamples = await workspace.findFiles(new RelativePattern(
    Uri.joinPath(grammarUri, '..'),
    basename(grammarUri.fsPath).replace(/(\.tmLanguage)?\.json$/i, '.example.*'),
  ))

  return maybeExamples[0]
}
