import { basename } from 'node:path'
import { RelativePattern, Uri, workspace } from 'vscode'
import { exampleSuffixes } from './configs'

export async function findExampleFile(grammarUri: Uri, grammarExt: string): Promise<Uri[]> {
  const grammarDirectory = Uri.joinPath(grammarUri, '..')
  const grammarBasename = basename(grammarUri.fsPath, grammarExt)
  const exampleUris: Uri[] = []
  for (const suffix of exampleSuffixes.value) {
    exampleUris.push(...await workspace.findFiles(
      new RelativePattern(grammarDirectory, grammarBasename + suffix),
      new RelativePattern(grammarDirectory, grammarBasename),
    ))
  }
  return exampleUris
}
