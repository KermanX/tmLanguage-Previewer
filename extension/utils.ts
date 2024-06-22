/* eslint-disable node/prefer-global/process */
/// <reference types="@tomjs/vite-plugin-vscode/env" />
import { extensionContext, useLogger } from 'reactive-vscode'
import type { Webview } from 'vscode'

export function loadIndexHtml(webview: Webview) {
  webview.html = process.env.VITE_DEV_SERVER_URL
    ? __getWebviewHtml__(process.env.VITE_DEV_SERVER_URL)
    : __getWebviewHtml__(webview, extensionContext.value!)
}

export const logger = useLogger('tmLanguage Previewer')
