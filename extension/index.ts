import { defineExtension, useCommand } from 'reactive-vscode'
import { window } from 'vscode'
import { useAutoStart } from './useAutoStart'
import { usePreviewer } from './usePreviewer'
import { logger } from './utils'

// eslint-disable-next-line no-restricted-syntax
export = defineExtension(() => {
  logger.info('Extension Activated')

  useCommand('tmlanguage-previewer.open', () => {
    const editor = window.activeTextEditor
    if (!editor) {
      window.showErrorMessage('No active text editor')
      return
    }
    logger.info('Opening Previewer')
    usePreviewer(editor)
  })

  useAutoStart()
})
