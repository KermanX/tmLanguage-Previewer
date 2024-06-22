import Vscode from '@tomjs/vite-plugin-vscode'
import Vue from '@vitejs/plugin-vue'
import Unocss from 'unocss/vite'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [
    Vue({
      template: {
        compilerOptions: {
          isCustomElement: (tag: string) => tag.startsWith('vscode-'),
        },
      },
    }),
    Unocss(),
    Vscode({
      extension: {
        noExternal: [
          'reactive-vscode',
          'shiki',
          '@shikijs/core',
          '@tomjs/vite-plugin-vscode',
        ],
      },
    }),
  ],
})
