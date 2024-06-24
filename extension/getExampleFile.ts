import { basename } from 'node:path'
import { RelativePattern, Uri, workspace } from 'vscode'

export async function getExampleFile(grammarUri: Uri): Promise<Uri | undefined> {
  const grammarDirectory = Uri.joinPath(grammarUri, '..')
  const grammarBasename = basename(grammarUri.fsPath)
  const exmapleFilenames = [
    grammarBasename.replace(/(\.tmLanguage)?\.json$/i, '.example'),
    grammarBasename.replace(/(\.tmLanguage)?\.json$/i, '.example.*'),
    grammarBasename.replace(/(\.tmLanguage)?\.json$/i, '.*'),
  ]
  for (const filename of exmapleFilenames) {
    const exampleUri = (await workspace.findFiles(
      new RelativePattern(grammarDirectory, filename),
      new RelativePattern(grammarDirectory, grammarBasename),
    ))[0]
    if (exampleUri)
      return exampleUri
  }
}
